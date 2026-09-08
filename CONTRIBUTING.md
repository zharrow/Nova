# Contribuer à Nova

Merci de vous y intéresser. Ce document dit comment mettre le dépôt en route,
ce qu'on vérifie avant de fusionner, et les quelques règles qui ne se négocient
pas — elles ont chacune coûté un débogage, et elles sont la raison pour
laquelle la librairie tient.

## Avant d'écrire du code

**Ouvrez une issue d'abord**, sauf pour une correction évidente (typo, lien
mort, cas limite d'un test). Nova a une doctrine assez arrêtée : un composant
qui ne trouve pas sa place dans l'arbre de [VARIANTES.md](VARIANTES.md), ou une
dépendance que [DEPENDANCES.md](DEPENDANCES.md) écarte, sera refusé quelle que
soit la qualité du code. Autant en discuter avant d'y passer une soirée.

## Mise en route

Il faut Node ≥ 20 et pnpm (la version est épinglée par `packageManager` dans le
`package.json` racine — `corepack enable` suffit à l'obtenir).

```bash
git clone https://github.com/zharrow/Nova.git
cd Nova
pnpm install
pnpm build                      # core, react, docs
pnpm test                       # 131 tests
pnpm --filter @nova-ui/docs dev # la vitrine, sur localhost:3000
```

## Le dépôt

```
packages/core/    @nova-ui/core   — les moteurs. TypeScript, aucun framework.
packages/react/   @nova-ui/react  — les composants React et leurs crochets.
packages/cli/     novaui          — la CLI qui copie et installe.
registry/                         — manifeste + sources réécrites pour la copie.
apps/docs/                        — la vitrine Next.js.
```

Trois documents font autorité, chacun sur son sujet :

| Document | Ce qu'il tranche |
|---|---|
| [CLAUDE.md](CLAUDE.md) | Les conventions du dépôt, en entier. Les pièges connus. |
| [VARIANTES.md](VARIANTES.md) | Si un composant est une famille, une forme, ou rien. |
| [DEPENDANCES.md](DEPENDANCES.md) | S'il faut une librairie, et laquelle. |
| [DESIGN.md](DESIGN.md) | Toute décision visuelle sur la vitrine. |

## Les règles non négociables

Une pull request qui casse l'une de ces règles ne sera pas fusionnée, même si
les tests passent. Elles sont détaillées dans [CLAUDE.md](CLAUDE.md) ; les
voici en bref.

**L'état par défaut est visible.** Aucun moteur ne pose d'`opacity: 0`, de
`transform` ou de `clip-path` masquant qu'il ne saurait pas retirer. En
`prefers-reduced-motion`, en rendu serveur, et pour un élément déjà à l'écran au
montage, aucune animation d'entrée ne s'arme. C'est la règle qui empêche le
défaut le plus grave possible : une section restée invisible en production.

**Un moteur ne connaît aucun framework.** `packages/core` n'importe pas React.
GSAP et Lenis y ont leur place — ils travaillent sur des `HTMLElement` — mais
seulement par une entrée séparée, pour qu'un projet qui ne prend pas le
composant concerné ne les embarque pas. Radix est React-only et vit dans
`packages/react`.

**On ne réinvente rien.** Radix apporte la sémantique — ARIA, clavier, focus,
portail — et Tailwind la mise en forme. Nova n'apporte que le mouvement.

**Le JavaScript pose des attributs, le CSS anime**, partout où le CSS suffit.
Les moteurs écrivent `data-nova-*` et des variables `--nova-*` ; `nova.css`
porte les transitions. Cela garde l'apparence surchargeable sans forker le
moteur.

**Une seule boucle.** Tous les moteurs passent par `internal/ticker.ts`, qui
s'arrête dès qu'il n'a plus d'abonné. Même chose pour `IntersectionObserver`,
mutualisé par `internal/in-view.ts`. Un moteur qui ouvre son propre
`requestAnimationFrame` est au mauvais endroit.

**Tout moteur se démonte proprement.** `destroy()` rend l'élément à son état de
départ : listeners retirés, observers détachés, ticker désabonné, DOM injecté
retiré, attributs et variables CSS supprimés. Il existe un test par moteur, et
votre moteur en aura un aussi.

**Fusionner les options avec `mergeOptions`, jamais avec un spread.**
`{ ...defaults, ...options }` écrase une valeur par défaut avec `undefined`
quand la clé est présente mais vide — le cas normal quand un adaptateur
construit ses options depuis des props.

## Ajouter un composant

Deux questions, dans cet ordre.

1. **De quelle famille est-ce une forme ?** Une option, un usage, ou un frère.
   [VARIANTES.md](VARIANTES.md) donne l'arbre de décision. Se tromper de voie
   fait embarquer du code inutile chez ceux qui ne s'en servent pas, ou efface
   une distinction de sens.
2. **Faut-il une librairie ?** [DEPENDANCES.md](DEPENDANCES.md) donne l'arbre.
   En résumé : ce qui est déjà résolu par shadcn ou Radix, on s'y branche ; le
   CSS quand il suffit ; GSAP dès qu'il faut du séquencement, de la mesure ou
   du FLIP ; `motion` uniquement pour animer un démontage.

Une entrée du registry qui dépend d'un paquet le déclare dans `dependencies` :
la CLI n'installe que ce qui manque, et seulement pour les composants demandés.

Le chemin complet d'un nouveau composant :

1. le moteur dans `packages/core/src/engines/`, plus son entrée dans `index.ts` ;
2. ses styles dans `packages/core/src/styles/nova.css` ;
3. son test dans `packages/core/test/`, avec au minimum le cas `destroy()` et
   le cas `prefers-reduced-motion` ;
4. le composant React dans `packages/react/src/components/`, monté sur
   `useNovaEngine` ;
5. l'entrée du registry dans `registry/registry.json` ;
6. la fiche du catalogue dans `apps/docs/lib/catalogue.ts` et sa démonstration
   dans `apps/docs/components/demos.tsx`.

## Avant d'ouvrir la pull request

```bash
pnpm test && pnpm typecheck   # `test` dépend du build du paquet lui-même,
                              # sinon le test du bundle lit un dist périmé
pnpm registry:build           # régénère registry/dist depuis les sources
pnpm --filter novaui build    # ré-embarque le registry dans la CLI
```

Un changement dans `packages/core` ou `packages/react` ne suffit pas : **le
registry distribue des copies figées.** Sans ces deux dernières commandes,
`novaui add` continue de distribuer l'ancienne version.

`scripts/build-registry.ts` échoue si un import vers `@nova-ui/*` subsiste après
réécriture. C'est voulu : ne contournez pas le garde-fou, corrigez la source.

### Vérifier ce que la CLI produit

Le typecheck du monorepo **ne couvre pas** le code copié chez l'utilisateur.
Pour un changement qui touche la surface d'un moteur, faites le tour complet :

```bash
node packages/cli/dist/index.js init --yes --cwd <projet-test>
node packages/cli/dist/index.js add <composant> --cwd <projet-test>
cd <projet-test> && tsc --noEmit
```

C'est ce passage qui a révélé une erreur de typage invisible autrement.

## Écrire les tests

`packages/core/test/setup.ts` fournit les doublures que jsdom n'a pas :
`IntersectionObserver` (pilotable via `MockIntersectionObserver.fire`),
`ResizeObserver`, `matchMedia` (avec `setReducedMotion` / `setFinePointer`),
`Element.animate`, `scrollTo`, et un contexte 2D enregistreur — il mémorise les
appels de dessin, ce qui permet de vérifier ce qui est réellement peint plutôt
que de constater que rien n'a planté.

Deux conventions à connaître :

- **le pool d'`IntersectionObserver` est global au module** et survit d'un test
  à l'autre. Les doublures ne remettent pas `instances` à zéro : c'est
  volontaire, c'est son fonctionnement en production ;
- **jsdom ne recompose pas le raccourci `border-radius`** depuis ses propriétés
  longues. Lisez `style.borderTopLeftRadius`.

Un test qui mesure une valeur en cours d'animation dépend de la charge de la
machine. Soit on porte la durée à une valeur qui rend la mesure déterministe,
soit on assume une tolérance et on l'écrit dans le test.

## Style

**Code, commentaires et documentation en français.** Les noms de symboles sont
en anglais pour l'API publique (`createReveal`, `RevealOptions`), en français
pour la vitrine (`catalogue`, `Fiche`, `trouverFiche`) et pour les variables
internes des moteurs.

**Les commentaires disent pourquoi, pas quoi.** Un commentaire qui paraphrase la
ligne suivante est du bruit ; un commentaire qui explique le cas limite ayant
imposé cette ligne vaut dix minutes à la prochaine lecture.

Pas de linter imposé pour l'instant : suivez la mise en forme des fichiers
voisins.

## Commits et pull requests

Les messages de commit suivent [Conventional Commits](https://www.conventionalcommits.org/fr/) :

```
feat(core): ajoute le moteur Ripple
fix(react): useNovaEngine relançait le moteur à chaque rendu
docs: corrige le lien du registry
```

Portées usuelles : `core`, `react`, `cli`, `registry`, `docs`.

Dans la pull request, dites **ce que le changement corrige et pourquoi cette
voie** — pas seulement ce qu'il ajoute. Si c'est un nouveau composant, dites de
quelle famille il est une forme et par quelle voie, en renvoyant à
[VARIANTES.md](VARIANTES.md).

Une pull request par sujet. Un renommage global et un correctif de
comportement dans le même diff sont impossibles à relire.

## Signaler un bug

Les [gabarits d'issue](https://github.com/zharrow/Nova/issues/new/choose)
demandent ce qu'il faut. Le plus utile reste toujours un cas reproductible
minimal : le composant, ses options, le navigateur, et ce qui se passe au lieu
de ce qui devrait.

Une faille de sécurité ne se signale pas dans une issue publique — voir
[SECURITY.md](SECURITY.md).

## Code de conduite

Les échanges sur ce dépôt suivent le [code de conduite](CODE_OF_CONDUCT.md).

## Licence

En contribuant, vous acceptez que votre contribution soit publiée sous la
[licence MIT](LICENSE) du projet.
