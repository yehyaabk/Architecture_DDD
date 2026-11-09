# ADR-001 : Booking dans l'agrégat Screening ou agrégat séparé ?
Statut : accepté — 09/11/2026

## Contexte
La règle métier la plus importante de CinéResa est la **capacité** : la somme des places des réservations confirmées d'une séance ne doit jamais dépasser la capacité de la salle. Deux autres règles portent sur le couple séance + réservation :
- on ne réserve pas une séance déjà commencée ;
- on n'annule pas à moins de 2h de la séance.

Dans le legacy, ces règles étaient vérifiées par le code de service. Celui-ci comptait les places en parcourant toutes les réservations, puis enregistrait la nouvelle réservation dans un second stockage. Rien n'empêchait d'écrire une réservation sans passer par ce contrôle. Le TP4 demande un modèle où il est **impossible** de dépasser la capacité sans passer par une racine d'agrégat.

Les forces en présence :
- **Invariant :** la règle de capacité porte sur *toutes* les réservations d'une séance. Elle ne peut être garantie que si ces réservations changent ensemble, dans une même frontière de cohérence.
- **Volume :** une séance compte au plus quelques centaines de places et chaque réservation en prend de 1 à 6. Une séance a donc au plus quelques centaines de réservations, ce qui reste petit à charger.
- **Accès :** on réserve et on annule toujours *dans le contexte d'une séance*. Seule la consultation « mes réservations » part du client.
- **Concurrence :** plusieurs clients peuvent réserver la même séance au même moment.

## Options envisagées
1. **Booking est une entité de l'agrégat Screening.** `Screening` est la racine. Elle contient ses `Booking` et seule elle expose `book()` et `cancel()`. Il y a un seul repository, `ScreeningRepository`, qui charge et sauvegarde la séance avec toutes ses réservations.
2. **Booking est un agrégat séparé.** Il référence la séance par `screeningId` et a son propre `BookingRepository`. La capacité est vérifiée par un use case ou un domain service qui compte les places confirmées avant d'enregistrer la nouvelle réservation : c'était l'organisation du TP3.
3. **Agrégat séparé + compteur dans Screening.** `Screening` ne garde qu'un compteur de places prises (`reserve(n)` / `release(n)`), et `Booking` est un agrégat à part. Les deux sont mis à jour dans la même transaction, ou bien de façon éventuelle par événements.

## Décision
**Option 1** : `Booking` est une entité de l'agrégat `Screening`. C'est ce qui est implémenté dans `src/domain/booking/Screening.ts` et `src/domain/booking/Booking.ts`, avec le repository unique `ScreeningRepository`.

L'option 2 ne protège pas l'invariant. Deux réservations peuvent lire le même nombre de places restantes puis s'enregistrer toutes les deux, et rien dans le domaine n'empêche d'écrire un `Booking` sans contrôle. L'option 3 protège la capacité. En revanche, elle demande soit une transaction sur deux agrégats, ce qui est contraire à la règle « un agrégat par transaction », soit une cohérence éventuelle avec compensation. C'est trop complexe pour le volume de CinéResa.

## Conséquences
\+ **Invariants regroupés :** la capacité, la séance commencée et la limite des 2h sont vérifiées à un seul endroit (`Screening.book()` et `Screening.cancel()`). On les teste sans port ni adapter (`test/Screening.test.ts`).

\+ **Un seul repository :** il n'y a qu'un repository et qu'une sauvegarde par cas d'usage. Un paiement refusé laisse le stockage intact, puisque l'agrégat modifié n'est simplement pas sauvegardé.

\+ **Événements produits par la racine :** l'agrégat émet `BookingConfirmed` et `BookingCancelled` au moment où la règle s'applique, ce qui découple l'envoi des mails (`NotifyCustomer`).

\- **Chargement complet :** chaque réservation ou annulation charge et réécrit toute la séance avec toutes ses réservations. C'est acceptable à quelques centaines de réservations, mais ce serait coûteux pour un très gros événement.

\- **Contention :** deux réservations simultanées sur la même séance modifient le même agrégat. Le repository actuel n'a ni version ni verrou. Dès que le paiement ou le stockage feront de vraies entrées-sorties, deux requêtes pourront s'entrelacer, et la dernière sauvegarde écrasera la première : on perdra une réservation déjà payée. Il faudra ajouter un numéro de version (verrouillage optimiste) avant une vraie base de données.

\- **Recherches sans séance :** chercher une réservation par son id (`findByBookingId`) ou par client (`findWithBookingsOf`) oblige à parcourir les séances. Une vraie base devra indexer les réservations.

\- **Réservations orphelines impossibles :** une réservation ne peut plus exister sans sa séance. Les réservations du `db.json` legacy qui pointent vers une séance inexistante sont ignorées au chargement. L'API ne les liste plus, et leur annulation répond 404 au lieu de 500 ou 409.

\- **Contournement possible :** TypeScript n'a pas de visibilité « package ». `Booking.cancel()` est donc public, et du code qui ferait `screening.findBooking(id).cancel(now)` contournerait la limite des 2h. La règle d'équipe est de ne passer que par `Screening.cancel()`.
