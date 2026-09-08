# Journal des modifications

Le format suit [Keep a Changelog](https://keepachangelog.com/fr/1.1.0/), et le
versionnage suit [SemVer](https://semver.org/lang/fr/).

Tant que Nova est en `0.x`, une version mineure peut casser l'API : la
protection de SemVer ne commence qu'à `1.0.0`.

## [Non publié]

### Ajouté

- Les documents d'usage d'un dépôt public : `LICENSE`, `CONTRIBUTING.md`,
  `CODE_OF_CONDUCT.md`, `SECURITY.md`, ce journal, les gabarits d'issue et de
  pull request, et un workflow d'intégration continue.

### Modifié

- La documentation ne nomme plus les projets privés d'où les composants ont été
  récoltés. La raison d'être de chaque moteur reste écrite dans son en-tête ;
  seule l'attribution a été retirée.
- Le champ `provenance` du catalogue de la vitrine a été supprimé. Il n'était
  rendu nulle part, et [DESIGN.md](DESIGN.md) proscrit ce discours dans
  l'interface.

### Corrigé

- Le lien « Source » de la vitrine pointait vers un dépôt qui n'existe pas.

## [0.1.0] — 2026-09-08

Première version. Vingt et une familles, cinquante-sept formes.

### Ajouté

- **`@nova-ui/core`** — vingt et un moteurs en TypeScript, sans framework.
  Chacun est une fabrique `createX(element, options)` qui renvoie
  `{ update, destroy }`. Un ticker partagé et un pool d'`IntersectionObserver`
  mutualisés : dix compteurs sur une page, c'est une boucle, pas dix.
- **`@nova-ui/react`** — dix-huit composants et quatre crochets, montés sur
  `useNovaEngine`, qui stabilise les callbacks et ne rejoue `update()` que
  lorsqu'une option a réellement changé.
- **`novaui`** — la CLI qui copie la source dans le projet, façon shadcn.
  `init` pose la configuration, `add` copie les composants demandés et
  n'installe que les dépendances qui manquent. Le registry est embarqué dans le
  paquet : la commande fonctionne hors ligne.
- **Le registry** — `registry/registry.json` déclare ce qui s'installe ;
  `scripts/build-registry.ts` réécrit les imports `@nova-ui/*` en chemins
  directs pour un projet consommateur, et échoue si l'un d'eux subsiste.
- **La vitrine** — catalogue Next.js à barre latérale, avec démonstrations
  vivantes : le vrai composant, les vraies options.
- **Garde-fous** — l'état par défaut est visible partout : en
  `prefers-reduced-motion`, en rendu serveur, et pour un élément déjà à l'écran
  au montage, aucune animation d'entrée ne s'arme. Chaque moteur a un test de
  `destroy()` qui vérifie le retour à l'état de départ.

[Non publié]: https://github.com/zharrow/Nova/compare/v0.1.0...HEAD
[0.1.0]: https://github.com/zharrow/Nova/releases/tag/v0.1.0
