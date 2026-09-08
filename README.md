# Nova

Librairie de composants animés en TypeScript. Le moteur est sans framework ;
les composants React se copient dans votre projet, façon shadcn.

[![Licence MIT](https://img.shields.io/badge/licence-MIT-black)](LICENSE)
[![CI](https://github.com/zharrow/Nova/actions/workflows/ci.yml/badge.svg)](https://github.com/zharrow/Nova/actions/workflows/ci.yml)

```bash
npx novaui init
npx novaui add reveal scramble-text marquee
```

## Pourquoi celle-ci

Vingt et une **familles**, récoltées dans des projets en production plutôt
qu'écrites d'une page blanche. Cinquante-sept formes en tout : une entrée du
catalogue n'est pas une pièce unique. Voir [VARIANTES.md](VARIANTES.md).

Trois familles n'existaient dans aucun projet : elles n'apparaissent qu'en
mettant les pièces côte à côte. `Loader` réunit trois rideaux d'ouverture
écrits séparément ; `Cursor` deux curseurs ; `Flight` deux usages du même
geste. Chacun a été réécrit sur un socle commun, sans GSAP ni framer-motion.

Trois choix structurent tout le reste :

**L'état par défaut est visible.** Aucun moteur ne pose d'`opacity: 0` qu'il ne
saurait pas retirer. Sans JavaScript, en `prefers-reduced-motion`, ou si un bloc
est déjà à l'écran au montage, le contenu s'affiche tel quel. C'est la règle qui
empêche le défaut le plus courant de ce genre de librairie : une section restée
invisible parce qu'un observer n'a jamais tiré.

**Une seule boucle.** Tous les moteurs partagent un unique
`requestAnimationFrame` et un pool d'`IntersectionObserver`. Dix compteurs sur
une page, c'est une boucle, pas dix. Elle s'arrête dès qu'elle n'a plus d'abonné.

**La logique ne connaît pas React.** Chaque moteur est une fabrique
`createX(element, options)` qui renvoie `{ update, destroy }`. Le paquet React
ne fait que brancher ce contrat sur son cycle de vie.

## Architecture

```
packages/
  core/     @nova-ui/core   — moteurs TypeScript, 116 tests
  react/    @nova-ui/react  — composants React, 15 tests
  cli/      novaui          — CLI de copie et d'installation
registry/                   — manifeste + sources réécrites pour la copie
apps/
  docs/                     — site vitrine (Next.js)
VARIANTES.md                — pourquoi une entrée du catalogue est une famille
DEPENDANCES.md              — quand prendre une librairie, et laquelle
```

### Familles, pas pièces

Le même composant existe souvent en plusieurs exemplaires, et ces exemplaires
ne sont pas des doublons : `ScrambleText` s'utilise au survol *ou* en boucle,
et ces deux usages ne disent pas la même chose. Trois voies servent à décliner
une famille — une **option**, un **usage**, un **frère** — et le choix de la
voie est une décision d'architecture. [VARIANTES.md](VARIANTES.md) donne la
règle et l'état de chaque famille.

### Le cœur

`packages/core` ne dépend de rien et ne connaît aucun framework. Un moteur pilote
un `HTMLElement` : il pose des attributs `data-*` et des variables CSS, la
feuille de style fait le reste. C'est ce qui rend l'apparence surchargeable
projet par projet sans toucher au moteur.

| Moteur | Ce qu'il fait |
|---|---|
| `createReveal` / `createRevealGroup` | Apparition au défilement, sans jamais rien laisser masqué |
| `createScramble` | Le texte se brouille, puis se décode lettre par lettre |
| `createCounter` | Un nombre qui compte jusqu'à sa valeur, sans rien bousculer |
| `createTextEffect` | Dix-sept traitements de texte animé, sur un seul primitif |
| `createMarquee` | Un bandeau qui défile sans fin, à vitesse constante |
| `createScrollMarquee` | Un bandeau que la molette entraîne |
| `createRollText` | Un label qui pivote sur lui-même au survol |
| `createSpotlight` | Un halo de repérage qui suit le curseur dans un panneau |
| `createCursor` | Un curseur additif, qui augmente le curseur système sans le remplacer |
| `createBlinds` | Le contenu apparaît derrière des lames qui se retirent une à une |
| `createBrushUnderline` | Un trait de marqueur derrière un mot |
| `createLoader` | Le rideau d'ouverture, en trois formes |
| `flight` | Un fantôme qui vole d'un élément vers un autre |
| `createHalftone` | Une trame d'imprimeur : la taille du module dit la valeur |
| `createGraph` | Un graphe dont le visuel n'est qu'une couche de présentation |
| `createScrollScene` | Une scène dont le défilement fournit le temps |
| `createTextHighlight` | Surligne un passage dans du contenu déjà rendu |
| `createExpand` | Une ligne qui devient un panneau, sans que la substitution se voie |
| `createBloom` | Une visionneuse qui jaillit du point cliqué |
| `createSmoothScroll` | Le défilement lissé, branché sur la boucle de Nova |
| `confetti` | Une salve de particules, qui se nettoie derrière elle |

### L'adaptateur React

Une seule pièce d'adaptation réelle : `useNovaEngine`, qui règle deux problèmes
une fois pour toutes.

Les callbacks changent d'identité à chaque rendu — les comparer naïvement
relancerait le moteur en boucle. Ils sont donc remplacés par des relais stables
adossés à une ref : le moteur garde la même fonction pour toute sa vie, mais
elle appelle toujours la version la plus récente.

Les options sont un objet littéral, neuf à chaque rendu. C'est leur contenu qui
est comparé, pas leur référence, et `update()` n'est appelé que lorsqu'une
valeur a réellement bougé.

### Le registry

`registry/registry.json` déclare ce qui s'installe.
`scripts/build-registry.ts` lit les sources du monorepo, **réécrit leurs
imports** pour un projet consommateur — `@nova-ui/core` devient des chemins
directs vers les fichiers réellement copiés — et produit `registry/dist`.

Le registry construit est embarqué dans le paquet CLI : `npx novaui add`
fonctionne hors ligne, sans hébergement. `NOVA_REGISTRY_URL` bascule vers un
registry distant le jour où il y en aura un.

## Développer

```bash
pnpm install
pnpm build              # core, react, docs
pnpm test               # 131 tests
pnpm typecheck
pnpm registry:build     # régénère registry/dist
pnpm --filter novaui build
pnpm --filter @nova-ui/docs dev
```

Après toute modification d'un moteur ou d'un composant, régénérer le registry
puis reconstruire la CLI — sinon `novaui add` distribue l'ancienne version.

## Et Angular ?

Rien n'est à réécrire des animations : elles vivent déjà hors de React. Un
adaptateur Angular est une directive qui appelle la même fabrique dans
`ngOnInit`, applique `update()` dans `ngOnChanges`, et `destroy()` dans
`ngOnDestroy`. C'est le travail restant, et il est mécanique.

## Contribuer

[CONTRIBUTING.md](CONTRIBUTING.md) donne la marche à suivre : mise en route,
les deux questions à se poser avant d'ajouter un composant, et les commandes de
vérification à passer avant d'ouvrir une pull request. Les échanges sur le dépôt
suivent le [code de conduite](CODE_OF_CONDUCT.md).

Une faille de sécurité se signale en privé — voir [SECURITY.md](SECURITY.md).

## Licence

[MIT](LICENSE).
