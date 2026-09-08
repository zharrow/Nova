# Direction graphique — Nova

Ce document est la référence visuelle de `apps/docs`. Il est **révisable** : rien ici
n'est un dogme. Chaque règle porte sa raison ; si la raison ne tient plus, la règle
tombe. La marche à suivre pour changer quelque chose est en dernière section.

## Le point fixe

**Le mouvement est l'objet.** Tout s'efface pour la démonstration. La seule chose
vivante et colorée à l'écran doit être le composant qui bouge.

C'est déjà ce que l'ancienne feuille de style prétendait faire sans y parvenir, et il
vaut la peine de comprendre pourquoi : la page était `#ffffff`, la scène `#f7f7f8`. La
démonstration était donc **plus sombre que son environnement**, à 1,03:1 contre son
fond, pendant qu'un titre tenait 18:1 juste à côté. L'œil va au contraste maximal.
Effacer le décor, ce n'est pas l'éclaircir, c'est le **baisser**.

## Thèse

**Un banc d'essai : un atelier éteint, mat, réglé au filet, sur lequel une seule pièce
est sous la lampe à la fois.** Le site est l'établi, jamais le spectacle.

On garde la filiation « instrument de mesure » de l'ancienne direction — elle était
juste — mais on en inverse la valeur. Un instrument ne se lit pas sur du papier blanc
éclairé au néon ; il se lit sur un plan sombre où l'aiguille est la seule chose
lumineuse.

Humeur : nuit d'atelier, pas nuit de startup. Énergie : immobile, sauf un point.

## Contexte

- **Ce que c'est** : la vitrine de documentation d'une librairie de composants animés
  en TypeScript. 21 familles, 57 formes. Modèle shadcn — la source se copie dans le
  projet de l'appelant.
- **Pour qui** : développeurs React francophones.
- **Type** : catalogue + documentation de référence.
- **Bâti sur** : Next.js, shadcn, Tailwind 4.

### Ce qu'on ne raconte pas

La vitrine **ne parle pas de la provenance des composants** : ni noms de projets, ni
« extrait de », ni compteur de projets d'origine. Aucune librairie ne tient ce
discours, et il n'aide pas celui qui cherche un composant. La documentation interne
(`README.md`, `CLAUDE.md`, `VARIANTES.md`) garde cette histoire ; l'interface publique
ne la porte pas.

---

## Couleur

Deux modes réels. **Le sombre est canonique** — c'est celui dans lequel la direction
est dessinée, et celui qui donne au mouvement une direction de contraste que le blanc
lui interdit : sur fond clair une animation ne peut que s'assombrir, sur fond sombre
elle peut émettre.

Un jeton est un **rôle**, pas un hexadécimal. `--signal` ne vaut pas la même valeur
dans les deux modes, et c'est correct.

### Sombre — canonique

```css
:root {
  --nuit:       #0B0B0C;  /* page */
  --plan:       #101013;  /* plan ENFONCÉ : code, tableaux */
  --banc:       #1A1A20;  /* plan SURÉLEVÉ : scène de démonstration */
  --banc-haut:  #24242B;  /* surface interne à une scène */
  --filet:      #26262C;
  --filet-vif:  #3C3C46;  /* filet actif, bord de scène survolée */

  --encre:      #F2F2EF;  /* 17,0:1 sur --nuit */
  --prose:      #C3C3C9;  /* 11,1:1 */
  --second:     #9A9AA3;  /*  6,9:1 */
  --sourdine:   #7C7C86;  /*  4,7:1 */

  --signal:     #4DA3FF;  /*  7,3:1 sur --nuit · 6,6:1 sur --banc */
}
```

### Clair — mode complet, pas un repli

```css
[data-theme="clair"] {
  --nuit:       #F4F4F0;  /* papier, jamais #ffffff */
  --plan:       #EBEBE4;
  --banc:       #FFFFFF;  /* le SEUL blanc pur du site : la scène */
  --banc-haut:  #F7F7F3;
  --filet:      #DCDCD4;
  --filet-vif:  #B4B4A9;

  --encre:      #121214;  /* 17,0:1 */
  --prose:      #3A3A42;  /* 10,3:1 */
  --second:     #5A5A64;  /*  6,2:1 */
  --sourdine:   #6B6B75;  /*  4,8:1 */

  --signal:     #1B4FD8;  /*  6,0:1 */
}
```

L'inversion est volontaire : en sombre la scène est le plan qui **monte**, en clair
elle est le seul **blanc pur**. Dans les deux cas elle est le point le plus haut de la
page.

### Budget de contraste

La règle qui rend la thèse vérifiable en relecture de différence, au lieu de la
laisser en commentaire :

> **Aucun élément de chrome ne dépasse 7:1. Aucun contenu de scène ne descend sous 12:1.**

- Cotes, légendes, métadonnées, navigation : 4,7 à 7:1.
- Prose : 10 à 11:1.
- Titres : 17:1, mais courts et jamais dans le même écran qu'une scène active.
- Intérieur de scène : 17:1.

**Exception, décidée à l'usage** : le panneau de télémétrie est du **contenu de scène**,
pas du chrome. À `--sourdine` il devenait illisible, ce qui vidait de son sens la seule
pièce qui prouve la doctrine. Libellés à `--second`, valeurs à `--encre`.

### Rationnement du signal

`--signal` est autorisé à **deux occurrences par écran**, et à deux emplois :

1. l'anneau de focus ;
2. l'intérieur d'une scène de démonstration.

Tout ce qui le portait hors scène passe à `--sourdine` ou disparaît : compte de formes,
flèches, losange du bandeau, jeton de forme actif (qui devient `--filet-vif` + encre
pleine).

### Coloration syntaxique

Le bloc de code est le seul endroit où plusieurs teintes cohabitent, et il est sur le
plan **enfoncé**. Rampe chaude, aucun néon, aucun violet.

**Chaude parce que le signal est froid.** Si le code employait des bleus, un jeton bleu
dans le code se lirait comme du signal, et le rationnement à deux occurrences par écran
n'aurait plus de sens. L'écart de température rend le signal non ambigu.

```css
--code-cle:    #FF9E6B;  /* mots-clés, balises JSX */
--code-type:   #8FB6CF;  /* types, noms de composants */
--code-chaine: #8FBF9F;
--code-nombre: #E2C48D;
--code-comm:   #6B6B74;
--code-ponct:  #7C7C86;
```

En clair : `#9A3412` · `#28607F` · `#2F6B45` · `#8A6423` · `#8A8A93` · `#6B6B75`.

### Correspondance shadcn

Une seule palette. `--background → --nuit` · `--card → --plan` · `--popover →
--banc-haut` · `--muted → --plan` · `--muted-foreground → --second` ·
`--border`/`--input → --filet` · `--primary → --encre` avec `--primary-foreground →
--nuit` · `--ring → --signal`.

---

## Typographie

Trois familles, trois registres qui ne se croisent jamais. Chargées par
`next/font/google`, variables, sous-ensemble `latin` + `latin-ext`, `display: swap`.

### Bricolage Grotesque — titres

Axes `opsz 12–96`, `wdth 75–100`, `wght 200–800`. Un grotesque au dessin reconnaissable,
qui n'est pas neutre. Rôle : titres de page, titres de fiche, titres de section, nom de
famille sur la scène.

### Instrument Sans — prose et interface

Axes `wdth 75–100`, `wght 400–700`. Rôle : toutes les phrases, la navigation, les
libellés, les boutons. Discret par construction, pour ne pas fatiguer sur 21 fiches.

### Spline Sans Mono — mesure

`wght 300–700`. Rôle : cotes, code, valeurs, télémétrie, noms d'API, compteurs.

### Règles de séparation

- Un titre est **toujours** en Bricolage Grotesque.
- Une phrase est **toujours** en Instrument Sans.
- Un chiffre est **toujours** en Spline Sans Mono, `font-variant-numeric: tabular-nums`.
- Bricolage Grotesque ne descend jamais sous 1,25rem. En petit, son dessin devient du
  bruit.

### Échelle

| Rôle | Police | Taille | Graisse / axes | Interligne | Approche |
|---|---|---|---|---|---|
| Affiche (accueil) | Bricolage | `clamp(3rem, 7vw, 6.5rem)` | 700 / opsz 96, wdth 88 | 0.96 | −0.03em |
| Titre de fiche | Bricolage | `clamp(1.9rem, 4vw, 2.6rem)` | 600 / opsz 96, wdth 92 | 1.03 | −0.022em |
| Titre de section | Bricolage | `1.5rem` | 600 / opsz 40 | 1.15 | −0.015em |
| Nom de famille sur scène | Bricolage | `1.05rem` | 600 | 1.2 | −0.02em |
| Accroche | Instrument Sans | `1.25rem` | 400 | 1.45 | 0 |
| Prose | Instrument Sans | `1rem` | 400 | 1.62 | 0 |
| Interface, nav, boutons | Instrument Sans | `0.875rem` | 500 | 1.4 | 0 |
| Cote (libellé technique) | Spline Mono | `0.6875rem` | 500, capitales | 1.2 | 0.09em |
| Code | Spline Mono | `0.8125rem` | 400 | 1.7 | 0 |
| Valeurs, télémétrie | Spline Mono | `0.75rem` | 400, tabular | 1.5 | 0.02em |

### Point de vigilance

Bricolage Grotesque est la plus expressive des options envisagées. Sur les grands
titres, loin de la scène, elle ne gêne pas. **À surveiller sur les étiquettes de
vignette du catalogue**, où le nom est à quelques pixels du mouvement : si le dessin des
titres se met à concurrencer la démonstration, la réponse est de descendre l'étiquette
en Instrument Sans, pas de changer de police.

---

## Formes

### Arrondis

| Niveau | Valeur | Ce qui le porte |
|---|---|---|
| Pressable | `8px` | boutons, jetons de forme, champs, badges |
| Plan contenu | `14px` | bloc de code, tableaux, cases du catalogue, panneaux |
| Bande | `0` | la scène pleine largeur, qui touche les deux bords |

### Filets et bordures

- **Une scène a un filet haut et un filet bas, jamais quatre bordures.** Les bords
  verticaux fabriquent une carte ; les retirer fabrique une bande.
- Les plans contenus (code, tableaux, cases) portent une bordure complète et leur
  arrondi de 14px.
- **Aucune ombre, aucun `backdrop-filter`.** L'élévation est portée par le remplissage
  et par le filet.

### Élévation

Trois niveaux, jamais plus. La scène **monte** (`--banc`), le code **descend**
(`--plan`), tout le reste est au niveau zéro (`--nuit`).

---

## Mise en scène d'une démonstration

Le cœur du sujet.

1. **Trois hauteurs, pas une.** L'ancienne `h-52` fixe imposait 208px à 21 mouvements
   dont la géométrie *est* le contenu. La hauteur devient une propriété de la famille,
   déclarée dans `lib/catalogue.ts` :
   - `bande` — 180 à 240px : ce qui défile (Marquee, ScrollMarquee, TextEffect,
     TextHighlight, BrushUnderline, SmoothScroll)
   - `bloc` / `carre` — 260 à 320px : Reveal, Blinds, Loader, Graph, ScrollScene,
     Expand, Lightbox, Halftone, Cursor, Spotlight, Confetti, Counter, ScrambleText,
     RollText, Flight
   - `champ` — `clamp(300px, 52vh, 560px)` : la scène d'une fiche
2. **Pas de centrage réflexe.** Défaut : aligné à gauche, centré verticalement. **On
   centre ce qui rayonne** (Halftone, Confetti, Loader, Lightbox), **on aligne à gauche
   ce qui se lit** (texte, marquee, compteur, highlight).
3. **La légende est dans la scène, sur le filet du bas.** À gauche l'invitation
   (« survolez le mot »), à droite le rejeu, ou rien.
4. **« Rejouer » n'est pas un bouton.** Un mot en mono, souligné d'un filet qui se
   dessine depuis la gauche au survol. Un bouton encadré dans le coin de chaque scène
   réintroduirait 21 objets de chrome identiques.
5. **Le survol d'une scène ne fait qu'une chose** : les deux filets passent `--filet →
   --filet-vif` en 220ms. C'est le seul retour de survol du catalogue, donc il signifie
   « celle-ci est vivante ».
6. **Pas de remplissage muet.** Aucun rectangle gris, aucun lorem, aucun dégradé
   prétexte. Les mires sont **calculées** (rayures, trames de points) — aucune ressource
   à charger. Les six carrés gris de `DemoReveal` et les `from-neutral-800` de Lightbox
   et Blinds partent.

### Télémétrie du moteur

Dans la scène d'une fiche, en haut à droite : les attributs `data-nova-*` et les
variables `--nova-*` que le moteur écrit réellement, lus en direct.

C'est ce qui remplit les 296px de gouttière aujourd'hui vides, ce qui rend visible la
doctrine « le JavaScript pose des attributs, le CSS anime », et ce qui transforme la
démonstration en objet mesuré plutôt qu'en gif. Pour un moteur sans valeur continue,
elle affiche l'état de repos.

Sur les fiches uniquement, jamais sur les vignettes du catalogue. Sous 1280px, elle
quitte le coin haut-droit et rejoint le filet du bas, à droite.

### Réglages en direct

Sous la scène, un panneau sur le plan **enfoncé** laisse changer les options qui
modifient visiblement le mouvement : curseur pour un nombre, bascule pour un booléen,
jetons pour un choix.

C'est le pendant de la télémétrie. Celle-ci montre ce que le moteur **écrit**, les
réglages laissent changer ce qu'on lui **donne** : ensemble, la fiche cesse d'être une
image animée et devient un objet qu'on mesure et qu'on règle. Les deux se répondent à
l'écran — un curseur `duration` en bas, un `--nova-*-duration` en haut.

Trois règles :

- **Le nom réel de la prop est affiché** à côté du libellé, en chasse fixe. Le visiteur
  qui bouge un curseur apprend du même geste quoi écrire dans son code. C'est ce qui
  distingue un panneau de réglages d'un jouet.
- **On ne déclare que ce qui change visiblement le mouvement.** Un `seed`, une
  `className` ou un rappel allongeraient la liste sans rien apprendre.
- **Rejeu 220 ms après le dernier mouvement.** Les moteurs qui tournent en continu
  appliquent l'option à chaud ; ceux qui jouent une fois au montage ne montreraient
  rien. Remonter à chaque tick de curseur ferait broncher les canevas.

Le curseur natif est le seul contrôle du site qu'on déshabille, et c'est justifié : sa
couleur d'accent système ferait une troisième occurrence de signal par écran.

---

## Composition

- Grille de 12 colonnes, `max-width: 1440px`, gouttière 24px.
- **Marge de numérotation de 96px** à gauche sur les pages d'affiche : filet vertical et
  numéro de section en mono (`00`, `01`…). Elle disparaît sous 768px, où le numéro
  remonte au-dessus du contenu. Elle n'existe QUE sur l'accueil : une page d'affiche est
  un imprimé, une page de documentation est un poste de travail, et leur donner la même
  marge effacerait la distinction.
- **Le filet de tête du banc tombe sur la première ligne de base du titre** et file
  jusqu'au bord de l'écran. Il part du bord GAUCHE DU BANC, pas de la colonne de texte :
  tiré sur toute la largeur il barrait le titre comme un texte rayé, et un geste
  d'affiche qui abîme la ligne qu'il aligne ne vaut rien. Le décalage est calculé en CSS
  — `calc(0.825rem + 1.5rem + 0.78 * clamp(...))` — et non mesuré en JavaScript : le
  `0.78em` est la distance du haut de la ligne à la ligne de base pour Bricolage
  Grotesque. Approximation assumée, vérifiée à 3 px près sur un titre de 58 px.
- **Rien n'est centré au niveau de la page.**
- **La prose ne dépasse jamais 62 caractères. Tout ce qui est mécanique — scène, code,
  tableau — prend 100% de la colonne.** Aucune largeur intermédiaire : la page alterne
  étroit et pleine largeur, et ne s'installe jamais dans la largeur moyenne uniforme qui
  était le défaut.

### Le catalogue

Grille de **6 colonnes**, `gap: 10px`, cases bordées au rayon de plan (14 px).
L'ensemble se lit comme un plan disséqué, pas comme 21 objets flottants. L'emprise vient
de la **géométrie du mouvement**, pas de l'importance : `bande` sur 6 colonnes, `bloc`
sur 3, `carre` sur 2.

**Flux dense obligatoire** (`grid-auto-flow: dense`). Sans lui, une bande de six colonnes
qui ne tient pas dans le reste d'une rangée laisse un trou au lieu de reculer, et l'ordre
du catalogue creuse la grille. Constaté à l'implémentation.

Le rythme n'est donc pas imposé à la main : il tombe de la géométrie déclarée par chaque
famille dans `lib/catalogue.ts`, et le flux dense s'occupe du reste.

La démonstration occupe 100% de la case. L'étiquette est **dans** la case, en bas, sur
un filet qui traverse toute sa largeur. Il n'y a donc aucun chrome hors scène.

Sous 900px : une colonne. Les `bande` survivent à pleine qualité et deviennent la
respiration. Rien ne devient une grille de trois.

### La fiche

Trois zones, dans cet ordre :

1. **La scène.** Premier élément de la page, sous un fil d'Ariane de 11px. Hauteur
   `champ`. C'est l'inversion centrale : aujourd'hui quatre éléments de texte passent
   avant elle.
2. **La prose.** Colonne gauche à 62ch : accroche, puis explication de la voie (option /
   usage / frère).
3. **La référence.** Pleine largeur sur le plan **enfoncé** : commande d'installation,
   code colorisé, tableau des options. Le rail droit de 200px porte le sommaire de page,
   les dépendances déclarées et le nombre de formes.

Un plan surélevé, puis du texte, puis un plan enfoncé. L'objet, son commentaire, sa
référence.

---

## Mouvement

- **Aucun titre du site ne s'anime.** Le seul mouvement hors scène est le bandeau
  `Marquee` (qui est un composant), et les filets au survol et au focus. Une librairie
  d'animation dont le chrome s'anime enseigne au visiteur que le mouvement est de la
  décoration. Conséquence directe : le `TextEffect` sort du héros de l'accueil.
- **Durées** : micro 50–100ms · court 150–250ms · moyen 250–400ms · long 400–700ms.
- **Courbes** : entrée `cubic-bezier(.16,1,.3,1)` · sortie `ease-in` · déplacement
  `ease-in-out`.
- **Mouvement réduit** : le site ne masque aucune démonstration. La scène affiche l'état
  de repos du composant et l'annonce sur son filet bas. Le premier principe de la
  librairie, rendu visible plutôt qu'écrit dans un paragraphe.

---

## Badges et recensement

Le badge « New » portait 15 fiches sur 21. Un badge sur plus d'un tiers des éléments
n'informe plus, il bruite.

**Règle générale : tout badge qui apparaîtrait sur plus d'un tiers des éléments devient
un traitement de filet.** Ici : un carré de 3px en `--signal` à l'extrémité du filet
d'étiquette, plafonné aux 4 entrées les plus récentes.

---

## Anti-slop

Jamais, sans discussion : dégradé violet ou dégradé visible de quelque sorte (les
dégradés ne sont autorisés qu'en `mask-image`, pour les fondus de bord de marquee) ;
grille de trois icônes dans des cercles colorés ; page centrée ; forme floue
décorative ; glassmorphism, toutes les surfaces sont opaques ; photographie ou
illustration — les seules images du site sont les composants eux-mêmes et des formes
calculées ; `system-ui` en police d'affichage ou de texte ; Inter, Geist, Space Grotesk.

Iconographie limitée à quatre icônes fonctionnelles — chevron, copier, valider, fermer —
à 16px, trait 1,5px, `currentColor`, jamais colorées, jamais dans un cercle.

---

## Espacement

Unité de base 4px. Densité : confortable sur les fiches, dense sur le catalogue.

`2xs 2 · xs 4 · sm 8 · md 16 · lg 24 · xl 32 · 2xl 48 · 3xl 64 · 4xl 96`

---

## Comment changer quelque chose ici

Ce document sert à éviter que chaque écran soit redécidé à la main, pas à figer le goût.

1. Change la valeur, et **écris la nouvelle raison** à côté. Une règle sans raison est
   la prochaine à sauter.
2. Si le changement casse le budget de contraste ou le rationnement du signal, dis-le
   explicitement dans le journal ci-dessous — ce sont les deux règles dont tout le reste
   dépend.
3. Ajoute une ligne au journal. C'est ce qui permet de savoir, dans six mois, si une
   valeur est un choix ou un reste.

## Journal des décisions

| Date | Décision | Raison |
|---|---|---|
| 2026-09-08 | Sombre canonique, clair complet | Le mouvement se lit comme une variation de luminance : sur blanc une animation ne peut que s'assombrir, sur sombre elle peut émettre. Relevé : les concurrents directs sont tous blancs, les deux sites dont le sujet est le mouvement sont tous les deux sombres. |
| 2026-09-08 | Budget de contraste chrome ≤ 7:1 / scène ≥ 12:1 | Rend la thèse vérifiable en relecture de différence au lieu de la laisser en commentaire. |
| 2026-09-08 | Télémétrie classée contenu de scène, pas chrome | À `--sourdine` elle était illisible, ce qui vidait de son sens la seule pièce qui prouve la doctrine du dépôt. |
| 2026-09-08 | Bricolage Grotesque + Instrument Sans + Spline Sans Mono | Le trio grotesque + serif + mono initialement proposé se lisait comme une sortie d'outil de design automatique. Choix retenu à l'œil sur quatre systèmes rendus côte à côte. |
| 2026-09-08 | Arrondis 8px / 14px | Le rayon zéro sur tous les plans rendait la direction trop sèche. La scène pleine largeur reste sans arrondi : c'est l'écart principal de la direction. |
| 2026-09-08 | Signal bleu (#4DA3FF sombre / #1B4FD8 clair) plutôt qu'orange | Une nova est une étoile, et le bleu-blanc est l'extrémité chaude du spectre stellaire. L'orange brûlé était un héritage de l'ancienne palette, pas une décision. La rampe du code reste chaude en conséquence : un bleu dans le code se lirait comme du signal. |
| 2026-09-08 | Aucune mention de provenance dans l'interface | Aucune librairie de composants ne tient ce discours, et il n'aide pas celui qui cherche un composant. L'histoire reste dans la documentation interne. |
| 2026-09-08 | Suppression du badge « New » | Porté par 15 fiches sur 21, il n'informait plus. Remplacé par un traitement de filet plafonné à 4 entrées. |
| 2026-09-08 | Catalogue en `gap: 10px` avec cases bordées, et non `gap: 1px` | Le `gap: 1px` sur fond filet suppose des cases sans arrondi. Les arrondis 8/14 ayant été retenus, les deux étaient incompatibles : c'est la version rendue et validée à l'œil qui fait foi. |
| 2026-09-08 | Flux dense sur la grille du catalogue | Constaté à l'implémentation : sans lui, une bande de six colonnes qui ne tient pas dans le reste d'une rangée laisse un trou au lieu de reculer. |
| 2026-09-08 | « Rejouer » n'apparaît qu'au survol dans le catalogue | Posé en permanence, il chevauchait le contenu des bandes et remettait vingt-et-un objets de chrome dans une direction qui vise à les retirer. |
| 2026-09-08 | Panneau de réglages en direct sous la scène, 18 familles sur 21 | Pendant de la télémétrie : elle montre ce que le moteur écrit, les réglages changent ce qu'on lui donne. Roll Text, Spotlight et Scroll Scene n'exposent aucune option numérique qui change visiblement le mouvement — leur panneau serait vide, il est donc absent. |
| 2026-09-08 | Rangées du catalogue composées par tri, `grid-auto-flow: dense` retiré | Dans une grille de 6, `3 + 2` fait 5 et laisse un trou. Le flux dense rebouchait au hasard : il cassait l'ordre de lecture SANS supprimer les trous. Le tri compose des rangées pleines et répartit les bandes au lieu de les empiler. |
| 2026-09-08 | Le filet de tête part du bord du banc, pas du bord de l'écran | Tiré sur toute la largeur, il barrait le titre comme un texte rayé. Le geste d'affiche ne vaut rien s'il abîme la ligne qu'il doit aligner. |
| 2026-09-08 | Rayons nommés par leur rôle (`presse` / `plan`), `rounded-nova` retiré du code applicatif | L'ancien nom valait 2 px et pointait désormais sur 8 px : il rendait, mais ne disait plus ce qu'il faisait. La pointe de l'infobulle garde un rayon propre de 2 px, sinon elle devient un disque. |
| 2026-09-08 | Aucun titre ne s'anime | Une librairie d'animation dont le chrome s'anime enseigne que le mouvement est décoratif. |
