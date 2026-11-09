# TP4 — DDD tactique : un modèle riche pour CinéResa

## Objectif

Transformer le domaine **anémique** de CinéResa (des types + des fonctions) en un **modèle riche** : value objects, agrégat avec sa racine qui protège l'invariant de capacité, domain service, et **domain events** pour découpler l'envoi des e-mails.

## Résultat attendu

- L'API se comporte toujours comme le legacy (contrat HTTP inchangé).
- Il est **impossible** de créer un email invalide, un nombre de places hors limites ou un montant négatif.
- Il est **impossible** de dépasser la capacité d'une séance sans passer par la racine d'agrégat.
- L'envoi d'e-mails n'est plus appelé par les use cases : il **réagit** à des événements.

## Point de départ

Votre dépôt à l'issue du TP3. Pour ce TP, seule la persistance **en mémoire** est demandée ; l'adapter JSON est un bonus.

## Fichiers fournis

| Fichier | Rôle |
|---|---|
| `fournis/test/valueObjects.test.ts` | spécification des value objects `Money`, `Email`, `SeatCount` |
| `fournis/test/Screening.test.ts` | spécification de l'agrégat `Screening` (réserver, capacité, annuler, 2h, snapshot) |
| `fournis/src/domain/shared/DomainEvent.ts` | interface commune des domain events |
| `fournis/src/application/ports/out/ScreeningRepository.ts` | le port du repository de l'agrégat |
| `fournis/src/application/ports/out/EventPublisher.ts` | le port de publication des événements |
| `fournis/src/adapters/out/events/InMemoryEventBus.ts` | bus d'événements en mémoire (abonnement par type) |
| `fournis/src/adapters/out/persistence/InMemoryScreeningRepository.ts` | repository en mémoire qui stocke des snapshots |

Les tests fournis sont votre **spécification** : votre code doit les faire passer sans les modifier. Arborescence imposée pour le domaine :

```
src/domain/
├── shared/      DomainError, DomainEvent, Money, Email
└── booking/     Screening (racine), Booking (entité), SeatCount, Tariff, PricingPolicy, events
```

## Consignes

### Value objects

1. Créez `Money` (montant en centimes, immuable, jamais négatif, opérations `times`, `discount`, `equals`, `toString`).
2. Créez `Email` (normalisé en minuscules et sans espaces, validé à la construction).
3. Créez `SeatCount` (entier de 1 à 6, méthode `isGroup()`).
4. Faites passer `test/valueObjects.test.ts`.

### Domain service

5. Déplacez le calcul du prix dans un domain service `PricingPolicy` qui manipule des `Money` et des `SeatCount`.

### Agrégat

6. Faites de `Booking` une **entité** : identité, statut, méthode d'annulation qui refuse une double annulation.
7. Faites de `Screening` la **racine d'agrégat** : elle contient ses `Booking`, expose `remainingSeats()`, `book(...)` et `cancel(...)`, et protège les règles (séance commencée, capacité, limite des 2h). Son constructeur est privé : prévoyez une factory `Screening.schedule(...)` pour la création et `toSnapshot()` / `fromSnapshot()` pour la persistance.
8. Remplacez les deux repositories par **le** `ScreeningRepository` fourni (un repository par agrégat) et son adapter en mémoire, qui stocke des **copies** : lisez-le pour comprendre pourquoi.
9. Faites passer `test/Screening.test.ts` : aucun port, aucun adapter, uniquement des objets du domaine.

### Domain events

10. Faites émettre `BookingConfirmed` et `BookingCancelled` par l'agrégat (liste d'événements interne, méthode `pullEvents()`).
11. Branchez le port `EventPublisher` et l'adapter `InMemoryEventBus` fournis.
12. Dans les use cases : charger l'agrégat → appeler la méthode métier → payer → **sauvegarder** → **publier** les événements. Les use cases n'appellent plus le notifier.
13. Créez un handler applicatif `NotifyCustomer` qui envoie les e-mails en réaction aux événements, et abonnez-le dans la composition root.
14. Les use cases renvoient des **DTO** : les objets du domaine ne sortent pas de l'hexagone.
15. Testez : une réservation publie `BookingConfirmed` et déclenche un mail ; un paiement refusé ne persiste rien et ne publie rien ; une annulation déclenche le mail de remboursement.

## Points de vigilance

- Les règles vivent **dans** les objets : si un use case contient un `if` métier, il est probablement mal placé.
- Pas de setter public sur les entités ; l'état ne change que par des méthodes qui ont un nom métier.
- Les événements sont publiés **après** la sauvegarde.
- Le test d'architecture doit toujours passer.
- En supprimant `BookingRepository`, la suite de contrat et les adapters JSON du TP3 ne compilent plus : retirez-les (les réécrire pour `ScreeningRepository` est un bonus). Adaptez le test HTTP du TP3 pour qu'il construise l'application avec les nouveaux adapters : il doit toujours passer.

## Critères de réussite

- [ ] `Money`, `Email`, `SeatCount` sont immuables, auto-validés, et les tests fournis passent
- [ ] `Screening` est la seule porte d'entrée pour réserver et annuler ; `test/Screening.test.ts` passe sans modification
- [ ] Un seul repository, pour l'agrégat `Screening`
- [ ] `BookingConfirmed` et `BookingCancelled` sont émis par l'agrégat et publiés après la sauvegarde
- [ ] Les use cases n'appellent plus directement le notifier
- [ ] Un paiement refusé ne modifie ni le stockage ni les événements publiés
- [ ] L'API HTTP répond comme avant
- [ ] `npm test` et `npm run typecheck` passent

## Rendu

En binôme, dans votre dépôt CinéResa : **le même dépôt du TP1 au TP5** (lien déposé une seule fois sur Moodle).
