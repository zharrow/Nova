# Nova — conventions du dépôt

Librairie de composants animés, récoltée dans des projets en production plutôt
qu'écrite d'une page blanche. Monorepo pnpm + Turborepo.

Une entrée du catalogue est une **famille**, pas une pièce — voir
[VARIANTES.md](VARIANTES.md). Les comptes ne sont écrits nulle part : ils
changent à chaque récolte, et une phrase qui les cite se périme à la ligne
suivante. Ce qui est affiché est CALCULÉ depuis `lib/catalogue.ts`.

```
packages/
  core/     @nova-ui/core   — les moteurs, TypeScript, sans React
  react/    @nova-ui/react  — les composants et les crochets
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

**Couvert n'est pas vu.** Un rideau de page se déclare dans
`internal/curtain.ts`, et tant qu'il est posé, les moteurs d'entrée RETIENNENT
leur geste — `isAlreadyInView` renvoie faux, et le pool de `internal/in-view.ts`
diffère ses rappels. Sans cela, tout ce qui est dans la fenêtre au montage
renonce à son entrée pendant que le voile couvre, et le voile se lève sur une
page qui est simplement LÀ : le geste que le rideau promettait n'existe pas, et
on ne l'obtenait qu'en câblant un état à la main dans l'application. Corollaire :
ce qui déborde de sa propre boîte — le registre ET le drapeau `data-nova-loaded`
sur `<html>` — est conditionné à `covers: "page"`. Un rideau d'encadré, celui
d'une démonstration, ne retient rien et n'annonce rien.

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
Aujourd'hui — `gsap` pour `expand`, `lightbox` et `flip-list`, `lenis` pour
`smooth-scroll`, `radix-ui` pour `lightbox` et `date-picker`,
`react-day-picker` pour `date-picker`.

## Publier un composant

**Rien ne sort sans `valide: true`.** Une famille écrite, testée, dotée d'une
fiche et d'une entrée de registry n'est toujours PAS disponible : le drapeau
`valide` sur sa fiche, dans `apps/docs/lib/catalogue.ts`, est ce qui la publie.
Il est absent par défaut, et c'est le sens de la règle — on ne devient pas
disponible en accumulant des étapes, quelqu'un décide.

Ce drapeau porte les deux surfaces d'un coup :

- `catalogue` est `familles` filtré dessus. Toutes les surfaces publiques
  lisent `catalogue` — l'index, la barre, `/composants/<nom>`, la recherche,
  `llms.txt`, le markdown des agents. Une famille en attente n'y est pas, et sa
  page répond 404 : il n'y a pas d'adresse par laquelle elle sortirait quand
  même.
- `scripts/build-registry.ts` lit la MÊME liste et n'écrit dans `registry/dist`
  que les validées. `npx novaui add <nom>` répond « introuvable » pour le
  reste. Le script refuse aussi de construire si une famille validée n'a pas
  d'entrée dans `registry.json` — sinon la fiche serait en ligne avec une
  commande d'installation qui échoue.

Une seule liste, donc, et non deux à tenir en phase : la divergence se paierait
exactement là, entre une page publiée et une commande qui ne connaît pas son
composant.

Ce qui n'est pas validé reste sur `/banc`, marqué d'un trait discontinu et d'un
« en attente », au même titre qu'un brouillon. C'est là qu'on juge — valider
pour pouvoir regarder serait décider avant d'avoir vu.

## Après modification

Un changement dans `packages/core` ou `packages/react` ne suffit pas : le
registry distribue des copies figées.

```bash
pnpm build                    # registry, core, react, CLI, docs
pnpm test && pnpm typecheck   # `test` dépend du build du paquet lui-même,
                              # sinon le test du bundle lit un dist périmé
```

Exception déclarée dans `turbo.json` : `@nova-ui/docs#test` ne dépend PAS du build
de la vitrine. Ses tests sont du calcul pur — les invariants du catalogue — et ne
lisent aucun `dist` ; les faire attendre une compilation Next ferait payer trente
secondes à sept assertions instantanées.

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

### Outillage

- **Ne jamais lancer `pnpm build` pendant qu'un `next dev` tourne.** `tsup` VIDE
  `packages/core/dist` au début de chaque build. Si le serveur de développement
  compile pendant cette fenêtre, il ne trouve ni `dist/nova.css` ni les
  sous-chemins d'`exports`, et **Turbopack mémorise l'échec** : l'erreur
  survit à la reconstruction, à un rechargement et même à un redémarrage du
  serveur. Le symptôme est un `CssSyntaxError` sur `globals.css` disant
  « Package path ./styles.css is exported ... but no valid target file was
  found », alors que le fichier est bien là et que `require.resolve` le trouve.
  Seul `rm -rf apps/docs/.next` en sort. Arrêter le serveur avant de construire,
  ou construire d'abord et lancer le serveur ensuite.

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
- **`nova-icon-512.png` est un MASQUE, les favicons sont des images.** Le
  premier est noir sur transparent parce que `Marque` ne lit que son alpha et
  prend la couleur de `currentColor` : le recolorer ne servirait à rien et
  casserait le thème sombre. Les seconds sont regardés tels quels — livrés
  noirs sur transparent, ils étaient invisibles sur une barre d'onglets
  sombre. Ne pas confondre les deux familles de fichiers en les « harmonisant ».
- **Même cause, autre symptôme : une classe CONSTRUITE n'existe pas.** Tailwind
  ne génère que ce qu'il trouve littéralement dans la source. Un
  `` `-left-[${MARGE}]` `` produit à l'exécution un nom de classe correct qui
  ne correspond à aucune règle — rien ne bouge, rien ne prévient. Écrire la
  valeur en clair et mettre la constante dans le commentaire, jamais l'inverse.
- **Un pourcentage dans un `clamp()` de hauteur ne résout rien sous un parent
  en hauteur automatique.** `h-[clamp(28px,32%,64px)]` sur `Repere` donnait un
  élément de 0 × 0 dans `.nova-loader__content`, qui se dimensionne sur son
  contenu : le pourcentage n'a pas de référent, la déclaration tombe, et le
  repère de la démonstration du Loader était invisible sans que rien ne le
  signale. Le même composant marche partout ailleurs parce qu'il y vit dans une
  boîte en `inset: 0`. Même famille de piège que `dial` ci-dessous.
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
- **Une option facultative peut ÉTEINDRE un calcul du moteur.** `halftone` ne
  déduit les lignes du rapport du canevas — et ne les redéduit à chaque
  redimensionnement, depuis son propre `ResizeObserver` — que si `rows` n'est
  pas fourni. `Supernova` le fournissait avec la formule identique, ce qui
  n'ajoutait rien et figeait la grille du premier rendu. Tant que la boîte
  gardait un rapport constant cela ne se voyait pas ; le jour où l'affiche a
  plafonné sa hauteur, le disque est sorti ovale. Avant de passer une option,
  vérifier ce que le moteur en fait quand elle est absente.
- **Une valeur mesurée au montage se périme au redimensionnement.** Même cas,
  côté composant : `Supernova` lit le rapport du canevas pour corriger
  l'anisotropie de sa fonction de couverture. Un `ResizeObserver` le relit —
  et non l'image d'animation, qui forcerait soixante calculs de mise en page
  par seconde pour une valeur immobile. En mouvement réduit il n'y a aucune
  image d'animation, donc c'est l'observateur lui-même qui repousse la
  couverture.

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

Deux pièges des faux minuteurs, chacun payé une fois :

- **`vi.useFakeTimers()` simule les IMAGES, pas leur horodatage.** Les
  `requestAnimationFrame` se déclenchent bien quand on avance l'horloge, mais
  l'argument reçu par le callback reste sur l'horloge réelle : mille
  millisecondes avancées n'en font passer que trois. Un moteur qui divise cet
  horodatage par un budget tenu en `setTimeout` mélange deux horloges — il
  affichait 0,2 % d'avancement là où il en fallait 70. Mesurer une fraction de
  budget sur l'horloge du budget, donc `Date.now()`.
- **Un moteur qui survit à son test bloque le ticker pour tous les suivants.**
  Le ticker est un module global : si le dernier abonné n'est jamais retiré, il
  garde `frame` non nul avec un handle qui appartient à l'horloge que
  `useRealTimers()` vient de jeter. Plus aucun abonné n'est appelé ensuite, dans
  aucun test, sans le moindre message. Enregistrer les instances créées et les
  démonter en `afterEach` — voir `test/loader.test.ts`.

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
  pour toute la page — un écouteur par case partirait
  ensemble — et la cible est choisie à la frappe : le focus d'abord, le
  pointeur ensuite, et à défaut la scène unique de la page. Voir
  `components/raccourci-rejeu.ts`. Deux gardes non négociables : rien ne se
  déclenche depuis un champ de saisie (taper « effet » dans la recherche
  relançait une animation par `f`), ni avec une touche morte comme `⌘F`.

## Banc de test

`/banc` — hors vitrine, liée depuis aucune navigation, `noindex`, et
**joignable partout, production comprise**.

Elle ne l'était pas. La garde tenait sur `process.env.NODE_ENV`, ce qui revenait
à dire « le banc n'existe que sur la machine qui compile » — or c'est
exactement le cas où l'on en a besoin : regarder un geste depuis un autre
appareil, où la seule adresse qui existe est celle du déploiement. Un outil
qu'on ne peut pas ouvrir là où l'on regarde n'est pas un outil.

**L'interrupteur est `NOVA_BANC`.** Lu dans `next.config.ts`, republié en
constante par `env`, ouvert par défaut ; `NOVA_BANC=0` dans les variables
d'environnement du déploiement referme la route sans toucher au code. Ce qu'il
faut préserver en le modifiant : le drapeau doit rester **inliné au build**,
parce que c'est ce qui rend la branche fermée morte à la compilation et fait
partir avec elle l'import dynamique du banc — donc le code des brouillons. Un
import en tête de fichier laissait la page en 404 mais expédiait quand même
l'établi. `noindex`, lui, ne ferme rien : il demande aux moteurs de ne pas
indexer, il n'empêche personne d'ouvrir l'adresse.

Trois usages qu'une fiche ne couvre pas : régler un composant **au-delà** des
options curées de sa fiche (éditeur de props JSON), **comparer ses formes**
— une par une aux flèches `←` `→`, ou toutes à la fois sur la planche — et
essayer un **brouillon**.

La planche monte le VRAI composant, une vignette par forme, sous une clé de
remontage commune : « remonter » ou `F` les relance ensemble. C'est ce que
faisait le brouillon `lames` avec ses dix chorégraphies, rendu à toutes les
familles et sans dupliquer une ligne de moteur. Ce qui est hors écran s'arme
quand on arrive dessus — un rideau joué pendant qu'on regarde ailleurs est un
rideau dépensé.

**Le banc ne cadre plus la scène.** Il faisait varier le plan, la hauteur, la
largeur et l'alignement : seize jetons en travers du chemin entre le sujet et
ses réglages, pour une question qu'on ne se pose pas ici. La scène garde les
valeurs qui servaient — plan surélevé, hauteur de champ, pleine largeur,
centrée. Ne pas les remettre sans une raison qui ait manqué.

C'est aussi le seul endroit où l'on voit une famille **en attente** — écrite,
mais pas encore publiée. Le banc rend `familles` là où le site rend
`catalogue` ; sans ça, il faudrait publier pour regarder. Voir « Publier un
composant ».

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
- **Le bleu marque ce qui agit ou ce qui identifie, jamais ce qui décore** — boutons,
  liens, anneau de focus, page courante, marque. Avec une exception : les liens de
  NAVIGATION restent neutres, sinon le bleu peint le chrome au lieu de le signaler. Le
  rationnement à deux occurrences par écran a été levé le 2026-09-09 ; il produisait une
  page grise où la marque n'apparaissait nulle part.
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
