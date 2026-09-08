# Nova — conventions du dépôt

Librairie de composants animés, récoltée dans des projets en production plutôt
qu'écrite d'une page blanche. Monorepo pnpm + Turborepo.

**22 familles, 60 formes.** Une entrée du catalogue est une famille, pas une
pièce — voir [VARIANTES.md](VARIANTES.md).

```
packages/
  core/     @nova-ui/core   — 22 moteurs, TypeScript, sans React
  react/    @nova-ui/react  — 19 composants + 4 crochets
  cli/      novaui          — copie et installe, sans dépendance
registry/                   — manifeste + sources réécrites pour la copie
apps/docs/                  — vitrine Next.js sur shadcn
VARIANTES.md                — pourquoi une entrée est une famille
DEPENDANCES.md              — quand prendre une librairie, et laquelle
```

## Règles non négociables

**L'état par défaut est visible.** Aucun moteur ne pose d'`opacity: 0`, de
`transform` ou de `clip-path` masquant qu'il ne saurait pas retirer.
Concrètement : en `prefers-reduced-motion`, en SSR, et pour un élément déjà à
l'écran au montage (`isAlreadyInView`), aucune animation d'entrée ne s'arme.
Toute modification qui casse cette règle rend possible une section invisible en
production.

**Un moteur ne connaît aucun framework.** `packages/core` n'importe pas React.
GSAP et Lenis y ont leur place — ils travaillent sur des `HTMLElement` — mais
seulement par une **entrée séparée** (`./expand`, `./smooth-scroll`, `./bloom`),
pour qu'un projet qui ne prend pas le composant concerné ne les embarque pas.
Vérifié : `dist/index.js` ne contient ni l'un ni l'autre. Radix est React-only :
il vit dans `packages/react`, et les composants qui en dépendent sont déclarés
comme tels.

**On ne réinvente rien.** Radix apporte la sémantique — ARIA, clavier, focus,
portail — et Tailwind la mise en forme, via `cn()`. Nova n'apporte que le
mouvement. `Lightbox` est le modèle : Radix fait la modale, Nova fait la bulle.

**Fusionner les options avec `mergeOptions`, jamais avec un spread.**
`{ ...defaults, ...options }` écrase une valeur par défaut avec `undefined`
quand la clé est présente mais vide — le cas normal quand un adaptateur
construit ses options depuis des props. Voir `internal/options.ts`.

**Le JavaScript pose des attributs, le CSS anime** — partout où le CSS suffit.
Les moteurs écrivent `data-nova-*` et des variables `--nova-*` ; `nova.css`
porte les transitions. Cela garde l'apparence surchargeable sans forker le
moteur. Les moteurs GSAP échappent à cette règle par nature, et paient le prix
suivant : ils lisent `prefers-reduced-motion` **à la main, à chaque geste**,
puisque la règle CSS ne peut rien pour du JavaScript.

**Une seule boucle.** Tous les moteurs passent par `internal/ticker.ts`, qui
s'arrête dès qu'il n'a plus d'abonné. Un moteur qui ouvre son propre
`requestAnimationFrame` est au mauvais endroit. Même chose pour
`IntersectionObserver` : le pool de `internal/in-view.ts` mutualise par couple
(rootMargin, threshold).

**Tout moteur se démonte proprement.** `destroy()` rend l'élément à son état de
départ : listeners retirés, observers détachés, ticker désabonné, DOM injecté
retiré, attributs et variables CSS supprimés. Il existe un test par moteur.

## Ajouter un composant

Deux questions, dans cet ordre.

1. **De quelle famille est-ce une forme ?** Une option, un usage, ou un frère.
   [VARIANTES.md](VARIANTES.md) donne l'arbre de décision. Se tromper de voie
   fait embarquer du code inutile chez ceux qui ne s'en servent pas, ou efface
   une distinction de sens.
2. **Faut-il une librairie ?** [DEPENDANCES.md](DEPENDANCES.md) donne l'arbre.
   Résumé : ce qui est déjà résolu par shadcn ou Radix, on s'y branche ; le CSS
   quand il suffit ; GSAP dès qu'il faut du séquencement, de la mesure ou du
   FLIP ; `motion` uniquement pour animer un démontage.

Une entrée du registry qui dépend d'un paquet le déclare dans `dependencies` :
la CLI n'installe que ce qui manque, et seulement pour les composants demandés.
Aujourd'hui — `gsap` pour `expand` et `lightbox`, `lenis` pour `smooth-scroll`,
`radix-ui` pour `lightbox` et `date-picker`, `react-day-picker` pour
`date-picker`.

## Après modification

Un changement dans `packages/core` ou `packages/react` ne suffit pas : le
registry distribue des copies figées.

```bash
pnpm build                    # registry, core, react, CLI, docs
pnpm test && pnpm typecheck   # `test` dépend du build du paquet lui-même,
                              # sinon le test du bundle lit un dist périmé
```

`novaui#build` dépend de la tâche racine `registry:build` dans `turbo.json` :
`pnpm build` régénère le registry puis le ré-embarque dans la CLI. Avant cette
dépendance, l'ordre était à tenir à la main, et `pnpm build` échouait sur un
clone neuf — `registry/dist` est ignoré par git.

`scripts/build-registry.ts` échoue si un import vers `@nova-ui/*` subsiste après
réécriture — c'est voulu, ne pas contourner le garde-fou. Il réécrit aussi les
sous-chemins : `@nova-ui/core/expand` devient `<alias>/engines/expand`.

### Vérifier ce que la CLI produit

Le typecheck du monorepo **ne couvre pas** le code copié.

```bash
node packages/cli/dist/index.js init --yes --cwd <projet-test>
node packages/cli/dist/index.js add <composant> --cwd <projet-test>
cd <projet-test> && tsc --noEmit
```

C'est ce passage qui a révélé l'erreur de typage de `mergeOptions`, invisible
autrement.

## Pièges connus

Chacun a coûté un débogage. Ils sont ici pour ne pas le repayer.

### Bundling et frontière serveur

- **`"use client"` disparaît au bundling.** esbuild supprime le prologue de
  directive quand il fusionne des modules ; l'option `banner` de tsup n'y change
  rien. `packages/react/scripts/add-use-client.mjs` la repose, et
  `test/bundle.test.ts` le vérifie. Ce test existe parce que l'étape a déjà été
  contournée en silence par un `dist` restauré du cache Turbo, et que l'erreur
  ne se voyait qu'au build du site consommateur, avec un message pointant vers
  React.
  **Elle est reposée depuis `onSuccess` de `tsup.config.ts`, pas seulement
  depuis le script `build`.** Le script `dev` du paquet est un `tsup --watch` :
  il réécrit `dist` à chaque frappe sans jamais passer par le `&&` du script
  de build. Un `pnpm dev` à la racine — celui qu'on laisse tourner toute la
  journée — suffisait donc à produire un bundle sans directive, et le prochain
  chargement de la vitrine échouait. Le `&&` du script `build` reste en place :
  il garantit l'ordre avant que Turbo ne mette `dist/**` en cache. L'opération
  est idempotente, la faire deux fois ne coûte rien.
- **Un objet exporté d'un module `"use client"` ne traverse pas la frontière
  serveur.** Il arrive côté serveur en référence opaque, et l'indexer renvoie
  `undefined`. Voir `apps/docs/components/demos.tsx` : la table nom → composant
  reste dans le module client, exposée via `<Demo nom />`.

### React et Radix

- **Le portail de Radix ne rend son contenu qu'au commit suivant.** Il attend
  d'avoir un conteneur, qu'il pose lui-même dans un effet. À l'image où l'état
  passe à vrai, il n'y a encore aucun nœud : une `useRef` reste nulle, et
  l'effet ne se rejoue jamais puisque ses dépendances n'ont plus bougé. Tenir le
  nœud dans un **état** (`const [n, setN] = useState<T | null>(null)` passé en
  `ref`) provoque un rendu quand il arrive. Voir `components/lightbox.tsx`.
- **Ne jamais écrire à la main dans un attribut `style` que React possède.** Il
  le réapplique au premier re-rendu et efface tout ce qu'on y a ajouté. Les
  moteurs de Nova créent eux-mêmes les nœuds qu'ils animent, ce qui évite le
  problème par construction — c'est le bug documenté dans `engines/text-effect.ts`.

### GSAP

- **`border-radius` s'écrit en quatre propriétés longues.**
  `clearProps: "borderRadius"` ne les efface pas : un panneau rouvert repartait
  du `50 %` de la bulle précédente. Les nommer une par une. Voir
  `engines/bloom.ts`.
- **`gsap.set` sur une liste vide écrit un avertissement** dans la console du
  consommateur. Ne viser que ce qui existe.
- **Une timeline n'applique son premier `set` qu'à sa première image.** Elle est
  planifiée, pas exécutée à la construction. Conséquence pour les tests : lire
  les styles tout de suite ne montre rien.

### CSS

- **La vitrine ne scanne pas `packages/react`.** Tailwind ne détecte ses
  sources que sous la racine du projet, et `@nova-ui/react` est ailleurs. Un
  composant Nova qui porte des classes utilitaires arrive donc NU sur le site :
  le panneau de `DatePicker` s'étalait sur toute la hauteur de la page, faute
  de `h-60` généré. La ligne `@source "../../../packages/react/src";` dans
  `globals.css` le règle. Le cas ne s'était jamais présenté parce que les
  moteurs n'habillent rien — ils posent des attributs, et `nova.css` fait le
  reste. `DatePicker` est le premier à s'habiller lui-même.
- **La feuille de style de Nova est chargée APRÈS celle du projet.** À
  spécificité égale, elle gagne. Ne jamais y poser de dimension, de marge ou de
  couleur de fond sur un élément que l'appelant habille : `width: 100%` sur le
  canvas de la trame écrasait silencieusement les classes utilitaires. Le socle
  ne pose que du structurel — `display`, `overflow`, `position`.
- **Un état de repos sous `animation-timeline` doit être sous `@supports`.**
  `animation-timeline: view()` n'existe pas partout (Firefox notamment). Poser
  `opacity: 0.17` hors de la garde laisse le texte illisible sur ces
  navigateurs, puisque rien ne vient jamais lever l'état de repos.

### Mesure

- **Une mesure de mise en page peut valoir zéro, et c'est un cas réel.**
  Conteneur en `display: none`, panneau replié, appel avant la première mise en
  page. Toute boucle du type `while (copies < ceil(taille / mesure))` doit
  renoncer quand la mesure est nulle : sinon la division vaut l'infini et le
  navigateur se fige. Voir la garde dans `engines/scroll-marquee.ts`.
- **Mesurer dans l'image d'animation, jamais dans l'écouteur.** `scroll` et
  `pointermove` tirent des dizaines d'événements par image, et chacun forcerait
  un calcul de mise en page. Voir `engines/scroll-scene.ts` et
  `engines/spotlight.ts`.
- **Ne jamais mesurer par-dessus ce qu'on a soi-même écrit.** `clientHeight`
  compte le rembourrage. `engines/dial.ts` en pose un pour que le premier item
  puisse atteindre le centre — et le relisait ensuite dans sa propre mesure.
  Sur un élément dont la hauteur suit son contenu, la boucle diverge : mesure,
  rembourrage plus grand, mesure plus grande. La colonne avait atteint deux
  mille cinq cents pixels sur la vitrine. Le moteur retire donc sa variable
  avant de mesurer, ce qui rend la mesure idempotente, et le composant donne à
  la colonne une hauteur DÉFINIE — un `height: 100%` sur un élément de grille
  se replie sur la taille du contenu quand la piste ne l'est pas.

## Tests

`packages/core/test/setup.ts` fournit les doublures que jsdom n'a pas :
`IntersectionObserver` (pilotable via `MockIntersectionObserver.fire`),
`ResizeObserver`, `matchMedia` (avec `setReducedMotion` / `setFinePointer`),
`Element.animate`, `scrollTo`, et un **contexte 2D enregistreur** mémorisé par
canvas — il enregistre les appels de dessin, ce qui permet de vérifier ce qui
est réellement peint plutôt que de constater que rien n'a planté.

Deux conventions :

- **le pool d'`IntersectionObserver` est global au module** et survit d'un test
  à l'autre. Les doublures ne remettent pas `instances` à zéro, c'est
  volontaire : c'est son fonctionnement en production.
- **jsdom ne recompose pas le raccourci `border-radius`** depuis ses propriétés
  longues. Lire `style.borderTopLeftRadius`.

Un test qui mesure une valeur en cours d'animation dépend de la charge de la
machine. Soit on porte la durée à une valeur qui rend la mesure déterministe,
soit on assume une tolérance et on l'écrit.

## Vitrine

`apps/docs` est un catalogue à barre latérale : filtre, navigation par
catégorie, page « Tout parcourir » avec recherche, fiches avec sélecteur de
formes. Les démonstrations sont **vivantes** — le vrai composant, les vraies
options.

- Elle est bâtie sur **shadcn**. Ses jetons (`--background`, `--primary`…) sont
  mappés sur la palette de Nova dans `globals.css` : il n'y a qu'une palette, et
  les composants shadcn s'y conforment.
- Le **curseur additif n'y est pas monté**. C'est un composant de la librairie,
  essayable sur sa fiche, pas une signature imposée à chaque page.
- Une démonstration porte un bouton « rejouer » dès qu'il y a quelque chose à
  rejouer. Le rejeu passe par un **remontage** : retirer puis reposer une classe
  ne suffit pas, React regroupe les deux mises à jour et l'animation ne repart
  jamais.
- Les composants dont l'effet EST le geste du visiteur — `RollText`,
  `Spotlight`, `Cursor`, `Halftone` — n'ont pas de bouton rejouer. Ce serait une
  commande morte.
- La touche **`F`** double chaque commande de rejeu, et le badge est écrit à
  côté : un raccourci qu'on ne peut pas deviner n'existe pas. Un seul écouteur
  pour toute la page — vingt-et-un écouteurs sur le catalogue partiraient
  ensemble — et la cible est choisie à la frappe : le focus d'abord, le
  pointeur ensuite, et à défaut la scène unique de la page. Voir
  `components/raccourci-rejeu.ts`. Deux gardes non négociables : rien ne se
  déclenche depuis un champ de saisie (taper « effet » dans la recherche
  relançait une animation par `f`), ni avec une touche morte comme `⌘F`.

## Banc de test

`/banc` — hors vitrine, liée depuis aucune navigation, et **absente de la
production** : la route y répond 404 et le code des brouillons n'est même pas
livré. `noindex` ne suffisait pas — il demande aux moteurs de ne pas indexer,
il n'empêche personne d'ouvrir l'adresse. La garde tient à une branche morte à
la compilation : `process.env.NODE_ENV` devient une constante au build, et
l'import dynamique du banc part avec la branche. Un import en tête de fichier
laissait la page en 404 mais expédiait quand même l'établi.

Trois usages qu'une fiche ne couvre pas : régler un composant **au-delà** des options curées
de sa fiche (éditeur de props JSON), le voir changer de plan, de hauteur,
d'alignement et de largeur sans toucher au code, et essayer un **brouillon**.

Un brouillon est un candidat qui n'est pas encore dans `packages/core`. Il vit
dans `apps/docs/brouillons/`, apparaît sur le banc au même titre qu'une famille,
et sert à juger avant de lui écrire un moteur, une entrée de registry et une
fiche. Ajouter un brouillon : le composant, puis une ligne dans `BROUILLONS`.

Un brouillon n'est **pas** une exception aux règles du dépôt — c'est une étape
avant de les appliquer. Ce qu'il doit prouver avant de passer en `packages` :
état par défaut visible, mouvement réduit respecté, démontage propre, et une
seule boucle partagée plutôt qu'un `requestAnimationFrame` local.

## Direction graphique

**[DESIGN.md](DESIGN.md) fait référence pour toute décision visuelle** — palette,
typographie, espacement, formes, mise en scène. À lire avant de toucher au rendu de
`apps/docs`, et à ne pas contredire sans accord explicite.

Le point fixe : **le mouvement est l'objet**. Tout s'efface pour la démonstration.

La barre, elle, est en tête de DESIGN.md et vaut pour tout ce qui se voit :
**« correct » est un échec**. Une surface peut respecter le budget de contraste, le
rationnement du signal et toute la section anti-slop, et rester banale — la
conformité n'est pas la barre. Trois tests avant de proposer quoi que ce soit de
visuel : le trope (l'ai-je déjà vu ailleurs ?), la nécessité (cet objet ne
pourrait-il venir que d'ici ?), le détail gratuit (y a-t-il une chose que personne
n'a demandée et que personne n'oubliera ?). Une seule qui tombe, on reprend.

Trois règles s'y vérifient en relecture de différence, et ce sont celles dont le reste
dépend :

- **Budget de contraste** — aucun élément de chrome ne dépasse 7:1, aucun contenu de
  scène ne descend sous 12:1. Le décor ne peut jamais gagner contre ce qu'il accompagne.
- **Rationnement du signal** — `--signal` est autorisé à deux occurrences par écran, et
  à deux emplois seulement : l'anneau de focus et l'intérieur d'une scène.
- **Aucun titre ne s'anime.** Le seul mouvement hors scène est le bandeau `Marquee` et
  les filets au survol. Une librairie d'animation dont le chrome s'anime enseigne au
  visiteur que le mouvement est décoratif.

La section « Vitrine » ci-dessus décrit le fonctionnement actuel du site. Là où elle
décrit l'ancienne apparence — palette claire, jetons de `globals.css` — c'est DESIGN.md
qui prévaut : la refonte est décidée mais pas encore appliquée au code.

## Langue

Code, commentaires et documentation en français. Noms de symboles en anglais
pour l'API publique (`createReveal`, `RevealOptions`), en français pour la
vitrine (`catalogue`, `Fiche`, `trouverFiche`) et pour les variables internes
des moteurs.

Les commentaires disent **pourquoi**, pas quoi. Un commentaire qui paraphrase la
ligne suivante est du bruit ; un commentaire qui explique le cas limite qui a
imposé cette ligne vaut dix minutes à la prochaine lecture.
