# Un composant est une famille, pas une pièce

Note de conception. À lire avant d'ajouter quoi que ce soit au registry.

## Le constat

Nova est né en récoltant des composants dans des projets existants. Cette
récolte a fait apparaître une chose qu'on ne voit pas quand on part d'une page
blanche : **le même composant existe déjà en plusieurs exemplaires, et ces
exemplaires ne sont pas des doublons.**

Deux cas, tirés du dépôt tel qu'il est aujourd'hui :

- **`ScrambleText` s'utilise déjà de deux façons.** Dans le portfolio, il se
  déclenche au survol : le décodage répond à un geste, c'est le lecteur qui le
  provoque. Dans KaopyX, il se rejoue seul toutes les six secondes tant qu'il
  est à l'écran : c'est une étiquette qui se redéchiffre, un signal de fond.
  Même code, deux intentions. Les fondre en un seul réglage « par défaut »
  aurait effacé la différence.

- **Il y aura plusieurs marquees.** Il en existe déjà trois formes dans le
  dépôt — l'horizontal, le vertical, et celui que le défilement pousse — et
  d'autres dorment dans les projets qui n'ont pas encore été dépouillés.

La conséquence est simple : **une entrée du registry ne doit pas être pensée
comme un composant, mais comme une famille.** Un nom, plusieurs formes.

## Les trois voies

Il y a trois façons pour une famille d'avoir plusieurs formes. Elles ne se
valent pas, et le choix de la voie est une décision d'architecture, pas de
présentation.

### 1. Option — une prop choisit la forme

Un seul moteur, un seul fichier copié, une prop qui bascule.

```tsx
<Reveal variant="mask" />
<TextEffect effect="wave" />
<Marquee direction="up" />
```

**Quand.** Les formes partagent le même mécanisme et ne diffèrent que par des
valeurs. `TextEffect` en est le cas extrême : dix-sept formes, un seul primitif
de fragmentation, et tout le reste est du CSS conditionné par un attribut.

**Coût.** L'utilisateur copie le catalogue entier même s'il n'en veut qu'une
forme. Acceptable tant que le supplément est du CSS ; inacceptable si chaque
forme ajoute du JavaScript qui ne servira pas.

### 2. Usage — le même code, une autre intention

Aucun code en plus. Ce qui change est la combinaison d'options, et surtout ce
qu'elle veut dire.

```tsx
/* Le décodage répond à un geste. */
<ScrambleText text="DÉCODER" trigger="hover" />

/* Le décodage est un signal de fond. */
<ScrambleText text="RÉFÉRENTIELS" trigger="view" interval={6000} />
```

**Quand.** Deux façons de se servir de la même pièce produisent deux effets de
sens différents. C'est le cas le plus facile à rater : on est tenté d'en faire
un « mode » avec une valeur par défaut, ce qui revient à décider à la place de
l'utilisateur laquelle des deux intentions est la normale.

**Règle.** Les deux intentions se demandent **séparément et explicitement**.
Aucune n'est déduite de l'autre. `replayOnHover` existe précisément pour ça :
il permet de combiner les deux sans qu'aucune ne soit implicite.

**Coût.** Nul en code. Mais un usage qui n'est pas documenté n'existe pas :
c'est la fiche du site qui le porte, sinon personne ne le découvrira.

### 3. Frère — un mécanisme différent, un effet parent

Deux composants distincts, deux fichiers, un nom voisin.

```tsx
<Marquee speed={60} />        {/* animation CSS */}
<ScrollMarquee drift={44} />  {/* transform écrite image par image */}
```

**Quand.** L'effet est de la même famille mais le mécanisme est incompatible.
Le cas de `ScrollMarquee` est net : une `@keyframes` a une durée, pas une
vitesse, donc elle **ne peut pas** être poussée par la molette. En faire une
option de `Marquee` aurait obligé à embarquer une boucle JavaScript dans un
composant qui n'en a pas besoin.

**Règle.** On ne crée un frère que lorsqu'une option obligerait à embarquer du
code inutile pour ceux qui ne s'en servent pas. La question à se poser :
*« est-ce que quelqu'un qui veut la forme A paierait pour la forme B ? »* Si
oui, ce sont des frères. Sinon, c'est une option.

## Comment choisir

```
Les formes partagent-elles le mécanisme ?
├── non  →  FRÈRE          (deux composants, deux fichiers)
└── oui
    └── Y a-t-il du code en plus par forme ?
        ├── oui, lourd  →  FRÈRE
        ├── oui, léger (CSS)  →  OPTION
        └── non, seulement des valeurs
            └── Les combinaisons ont-elles des sens différents ?
                ├── oui  →  USAGE   (documenté, jamais déduit)
                └── non  →  OPTION
```

## État actuel des familles

| Famille | Voie | Formes |
|---|---|---|
| `text-effect` | option | 17 — `line` `word` `letter` `flip` `curtain` `blur` `focus` `center` `shear` `wave` `tracking` `weight` `roll` `typewriter` `reading` `reading-blur` `highlight` |
| `reveal` | option + frère | 7 variantes, plus `RevealGroup` pour le décalage de groupe |
| `blinds` | frère de `reveal` | 2 — colonnes, rangs |
| `marquee` | option | 4 sens — `left` `right` `up` `down` |
| `scroll-marquee` | frère de `marquee` | 1 |
| `loader` | option | 4 — `blades` `greetings` `splash` `seam` |
| `cursor` | option | 2 — `blob`, `dot-ring` |
| `scramble-text` | usage | 2 — au survol, à intervalle |
| `counter` | usage | 3 — brut, localisé, monétaire |
| `halftone` | option | 2 formes de module, 3 natures de source |
| `confetti` | option | 3 formes de particule |
| `brush-underline` | — | 1 |
| `roll-text` | — | 1 |
| `spotlight` | — | 1, mais le dessin est entièrement surchargeable en CSS |
| `flight` | — | 1 |
| `scroll-scene` | — | 1 |
| `text-highlight` | — | 1 |
| `graph` | — | 1 |

Trois familles sont nées de la récolte elle-même, en réunissant des pièces
écrites séparément dans des projets différents :

- **`loader`** — le rideau de lames de Bât-et-Verre, les salutations du
  portfolio, la pastille du générateur de CV. Trois rideaux qui ne se
  ressemblent pas, et qui partagent pourtant leurs quatre garde-fous.
- **`cursor`** — le disque du portfolio et le point-anneau de Bât-et-Verre 3D.
  Le choix n'est pas cosmétique : le disque écrase ce qu'il survole, le point
  ne masque rien.
- **`flight`** — la preuve qui vole vers sa marge (générateur de CV) et
  l'ouverture FLIP de la visionneuse (Bât-et-Verre). Deux usages du même geste.

Aucune des trois n'existait comme composant dans les projets d'origine. Elles
n'apparaissent qu'une fois les pièces mises côte à côte — c'est l'argument le
plus fort de la méthode.

## Ce qui reste à récolter

La récolte est faite pour l'essentiel. Ce qui a été laissé, et pourquoi :

**Écarté — non réutilisable.** Les huit tracés SVG de `anim.css` (KPX) sont
trop liés à leurs glyphes. `LaboCompare` (portfolio) n'est pas un comparateur,
c'est une mise en page à deux colonnes. Les icônes `animate-ui` (CRM Closer)
viennent d'une librairie tierce.

**Écarté — composition de site, pas composant.** `StatBoard`, `MissionCard`,
`Ticker`, les en-têtes et pieds de page, `AccentSwitch`, `SignalBand`,
`menu-capsule`, `planche-hero`, les diagrammes et les scènes Three.js de
Bât-et-Verre 3D.

**Déjà couvert par une famille existante.** `text-generate-effect` et
`assembling-title` sont la forme `blur` de `text-effect`. `AnimatedScore` est
un usage de `counter` — une valeur qui change se réanime toute seule.
`PageTransition` est un `reveal` monté à l'entrée. Les marquees de Bât-et-Verre
sont `scroll-marquee` avec une inclinaison.

**Pris depuis.** Les deux pièces qui attendaient sont entrées, avec la levée
de la règle du zéro dépendance : `useExpandTransition` est devenu `Expand`,
`phrase-highlight` est devenu `TextHighlight`.

**Écarté à la deuxième passe.** Formly n'a rien de récupérable — ses fichiers
animés sont des modales, des formulaires et des écrans. Le site Champlon est
très lié à sa marque : le monogramme en pixels et la carte d'Amérique latine ne
se généralisent pas. Mais deux de ses pièces ont donné des familles :
`DataStory` et `SessionFlow` calculaient la même progression scrollée, devenue
`ScrollScene` ; `SiteLoader` a donné la quatrième forme du `Loader`.

**Repéré, toujours pas pris.** Une pièce vaut encore le détour :

- `VisionneuseVerre` (Bât-et-Verre) — une visionneuse qui s'ouvre en fleur
  depuis le point cliqué, avec un FLIP de la vignette vers le cadre. Portable
  maintenant que GSAP est admis, mais elle doit se brancher sur le `Dialog` de
  Radix pour la sémantique et le piège de focus — voir
  [DEPENDANCES.md](DEPENDANCES.md). C'est le prochain gros morceau.

## Conséquences pratiques

### Sur le registry

`registry/registry.json` décrit des **familles**. Le champ `variantes` d'une
entrée est de la documentation, pas une unité d'installation : `novaui add
marquee` copie la famille entière, jamais une forme isolée. Le jour où une
famille deviendra assez lourde pour qu'on veuille en copier une part, ce sera
le signal qu'il fallait des frères.

### Sur le site

Une fiche présente la famille, puis ses formes. Le sélecteur de formes n'est
pas une commodité de démonstration : c'est la seule façon de montrer qu'une
entrée du catalogue n'est pas une pièce unique. Le compte de formes apparaît
donc sur la carte, dans la grille, avant même d'ouvrir la fiche.

### Sur le nommage

Un frère porte le nom de sa famille en préfixe ou en suffixe lisible —
`ScrollMarquee`, `RevealGroup` — jamais un nom sans rapport. Deux composants
dont les noms ne se ressemblent pas seront cherchés séparément, et la parenté
sera perdue.
