# TP2 — Premier use case en architecture hexagonale

## Objectif

Réécrire le cas d'utilisation **« réserver des places »** de CinéResa en **ports & adapters** : le cœur (domaine + use case) ne dépend plus d'aucune technologie, et se teste en quelques millisecondes sans serveur, sans fichier et sans hasard.

## Résultat attendu

- `POST /screenings/:id/bookings` fonctionne comme avant (mêmes règles, mêmes codes HTTP).
- La persistance est **en mémoire** pour ce TP (le fichier JSON reviendra au TP3).
- Une suite de tests Vitest couvre toutes les règles de réservation **sans démarrer Express**.
- Un **test d'architecture** échoue si le domaine ou l'application importent un adapter.

## Point de départ

Votre dépôt à l'issue du TP1.

## Fichiers fournis

| Fichier | Rôle |
|---|---|
| `fournis/test/architecture.test.ts` | test d'architecture prêt à l'emploi : il doit passer à la fin du TP |
| `fournis/test/BookSeatsService.test.ts` | squelette des tests du use case (`it.todo`) à compléter |

Copiez le dossier `fournis/test` dans votre dépôt. Arborescence **imposée** (le test d'architecture s'appuie dessus) :

```
src/
├── domain/                  règles métier pures (aucun import technique)
├── application/
│   ├── ports/in/            ports entrants (ce que l'appli sait faire)
│   ├── ports/out/           ports sortants (ce dont l'appli a besoin)
│   └── usecases/            implémentations des ports entrants
├── adapters/
│   ├── in/http/             routes Express
│   └── out/                 persistance, notification, paiement, système
└── main.ts                  composition root
test/
```

## Consignes

Le TP se fait en deux parties : la **partie A** après le cours sur l'architecture hexagonale, la **partie B** après le cours sur les tests.

### Partie A — Réserver des places en ports & adapters

1. Dans `src/domain`, créez les types `Screening` et `Booking` (avec de vraies `Date`), une classe d'erreur métier `DomainError` portant un code (`NOT_FOUND`, `INVALID`, `CONFLICT`, `PAYMENT_REFUSED`), et des **fonctions pures** pour chaque règle : email valide, nombre de places, séance réservable (pas commencée, capacité suffisante), calcul du prix.
2. Dans `src/application/ports/in`, définissez le port entrant `BookSeats` : une méthode `execute(command)` qui prend une `BookSeatsCommand` et renvoie une `Promise<Booking>`.
3. Dans `src/application/ports/out`, définissez les ports sortants **du point de vue du cœur** : `ScreeningRepository`, `BookingRepository`, `PaymentGateway`, `Notifier`, `Clock`, `IdGenerator`. Toutes les méthodes d'accès externe sont asynchrones.
4. Implémentez `BookSeatsService` (il implémente `BookSeats`) : il reçoit **tous** ses ports par son constructeur et n'importe **aucun** adapter.
5. Écrivez les adapters sortants : `InMemoryScreeningRepository`, `InMemoryBookingRepository`, `ConsoleNotifier`, `FakePaymentGateway` (dont on peut forcer la réponse), `SystemClock`, `UuidGenerator`.
6. Écrivez l'adapter entrant HTTP : une fonction qui reçoit le port `BookSeats` et renvoie un `Router` Express, plus un gestionnaire d'erreurs qui traduit les codes de `DomainError` en statuts HTTP.
7. Dans `src/main.ts` (composition root), instanciez les adapters, injectez-les dans le use case, montez les routes. C'est le **seul** fichier qui connaît les classes concrètes. Les 3 autres routes du TP1 (lister, annuler, mes réservations) restent branchées telles quelles : elles seront migrées au TP3.

À la fin de la partie A, `POST /screenings/:id/bookings` doit répondre comme le legacy.

### Partie B — Tester le cœur et l'architecture

8. Complétez `test/BookSeatsService.test.ts` : transformez chaque `it.todo` en test, avec des adapters de test (horloge figée, paiement forcé, notifier « espion »).
9. Lancez le **test d'architecture** fourni : il doit passer. Ajoutez volontairement un import d'adapter dans le use case pour vérifier qu'il échoue, puis retirez-le.

## Points de vigilance

- Un port est défini par **ce dont le cœur a besoin**, pas par ce que sait faire la base de données.
- Pas de type Express (`Request`, `Response`) au-delà de `adapters/in/http`.
- `new Date()` et `Math.random()` ne doivent plus apparaître dans le domaine ni dans les use cases.
- Ne cherchez pas encore à faire des classes riches dans le domaine : ce sera le TP4.

## Critères de réussite

- [ ] L'arborescence `domain / application / adapters` est en place
- [ ] `BookSeatsService` ne contient aucun `new` d'une classe technique et aucun import d'adapter
- [ ] `main.ts` est le seul endroit où les adapters sont instanciés
- [ ] Les 7 tests du squelette sont écrits et passent sans démarrer de serveur ni toucher au disque
- [ ] Le test d'architecture passe… et échoue si on ajoute volontairement un import interdit
- [ ] `POST /screenings/s1/bookings` renvoie 201, 400, 404, 409 ou 402 dans les mêmes cas que le legacy
- [ ] `npm test` et `npm run typecheck` passent

## Rendu

En binôme, dans votre dépôt CinéResa : **le même dépôt du TP1 au TP5** (lien déposé une seule fois sur Moodle).
