# Direction graphique — Nova

Ce document est la référence visuelle de `apps/docs`. Il est **révisable** : rien ici
n'est un dogme. Chaque règle porte sa raison ; si la raison ne tient plus, la règle
tombe. La marche à suivre pour changer quelque chose est en dernière section.

## Le point fixe

**Le mouvement est l'objet.** Tout s'efface pour la démonstration. La seule chose
vivante à l'écran doit être le composant qui bouge.

La règle qui rend ce principe vérifiable n'est pas une couleur, c'est un ÉCART : la
scène doit être le plan le plus contrasté de la page, et le chrome le moins. La toute
première version du site échouait à l'inverse — page `#ffffff`, scène `#f7f7f8`, soit
une démonstration à 1,03:1 contre son fond pendant qu'un titre tenait 18:1 juste à
côté. C'est cet écart-là qu'on tient, et il se tient dans les deux modes.

## Thèse

**Un banc d'essai posé sur un plan de travail clair : l'atelier est en ordre, éclairé,
et une seule pièce est sous la loupe à la fois.** Le site est l'établi, jamais le
spectacle.

Le clair est **canonique**, et c'est un renversement assumé de la première direction.
Celle-ci tenait un argument juste mais mal appliqué : sur fond sombre une animation peut
émettre, sur fond clair elle ne peut que s'assombrir. Vrai — pour les cinq familles qui
rayonnent (Halftone, Confetti, Spotlight, Cursor, Loader). Les dix-huit autres n'émettent
rien : elles déplacent, dévoilent, brouillent, défilent, réorganisent du CONTENU. Or un
contenu se lit, il n'irradie pas, et il se lit sur le fond qu'il aura chez celui qui
copie le composant.

C'est le vrai critère : la question que se pose un visiteur devant une scène n'est pas
« est-ce beau ici », c'est **« est-ce que ça tiendra chez moi »**. Une librairie qui se
copie doit se montrer sur le sol le plus fréquent, et ce sol est clair. Le sombre reste
un mode COMPLET — pas un repli — et la bascule par scène (voir « Mise en scène ») existe
pour que les cinq familles qui émettent puissent se montrer sur leur meilleur fond sans
qu'on quitte la page.

Humeur : atelier de jour, pas landing de startup. Énergie : immobile, sauf un point.

## Barre de qualité

**« Correct » est un échec.** Chaque composant, et chaque surface qui le présente, doit
pouvoir tenir seul devant un jury Awwwards. Ce n'est pas une figure de style : la
librairie vend de l'exécution visuelle, et une démonstration qui ressemble à un
placeholder d'agence détruit l'argument avant qu'on ait lu une ligne d'API.

Le reste de ce document dit ce qu'il est interdit de rater. Cette section dit ce qu'il
ne suffit pas de réussir. **La conformité n'est pas la barre** — une surface peut
respecter le budget de contraste, le rationnement du signal et toute la section
anti-slop, et rester banale. Le 8 septembre 2026, une mire de réglage techniquement
juste a été rejetée pour cette seule raison.

Trois tests, avant de proposer une surface. Une seule qui tombe, on reprend.

1. **Le test du trope.** Est-ce que je l'ai déjà vu ailleurs ? Une mire d'imprimeur, une
   grille de points, un terminal stylisé, un dégradé de bruit : ce sont des objets
   trouvés. Ils rassurent parce qu'ils sont familiers, et c'est exactement le problème.
2. **Le test de la nécessité.** Est-ce que cet objet ne pourrait venir que de CE projet ?
   S'il pourrait illustrer n'importe quelle librairie, il n'illustre pas la nôtre. La
   bonne réponse tire sa forme de la matière du dépôt — une courbe d'accélération, un
   relevé de moteur, un découpage de lames — pas d'un imaginaire d'atelier générique.
3. **Le test du détail gratuit.** Y a-t-il une chose que personne n'a demandée et que
   personne n'oubliera ? Une poignée de contrôle tracée là où un trait aurait suffi, une
   graduation dont le pas change à mi-course. Un seul par surface : deux font du bruit,
   zéro fait un gabarit.

Ce qui fait tomber une surface à tous les coups : le remplissage neutre, le faux contenu
(lorem, titre d'article, mot d'ordre), la symétrie parfaite sans accident, et l'accessoire
ajouté parce que la place était vide.

## Contexte

- **Ce que c'est** : la vitrine de documentation d'une librairie de composants animés
  en TypeScript. Modèle shadcn — la source se copie dans le
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

Deux modes réels. **Le clair est canonique** — c'est celui dans lequel la direction est
dessinée, et celui sur lequel un composant copié atterrira le plus souvent. Le sombre
est un mode complet, dessiné aussi, et c'est le meilleur fond des cinq familles qui
émettent.

Un jeton est un **rôle**, pas un hexadécimal. `--signal` ne vaut pas la même valeur dans
les deux modes, et c'est correct.

### Clair — canonique

```css
:root {
  --nuit:       #FCFCFB;  /* page. Un blanc cassé, jamais #ffffff */
  --plan:       #F4F4F1;  /* plan ENFONCÉ : code, tableaux */
  --banc:       #FFFFFF;  /* plan SURÉLEVÉ : scène. Le seul blanc pur */
  --banc-haut:  #F7F7F4;  /* surface interne à une scène */
  --filet:      #E6E6E1;
  --filet-vif:  #C9C9C1;  /* filet actif, bord de scène survolée */

  --encre:      #16161A;  /* 16,8:1 sur --nuit */
  --prose:      #3D3D45;  /* 10,1:1 */
  --second:     #5E5E68;  /*  6,1:1 */
  --sourdine:   #74747E;  /*  4,6:1 */

  --signal:     #1B4FD8;  /*  6,0:1 */
}
```

Le nom `--nuit` est resté celui de la page dans les deux modes. Il est devenu faux en
clair, et le renommer coûterait une passe sur chaque fichier pour un gain nul : ce qui
compte est qu'il désigne LE FOND DE PAGE, ce qu'il fait toujours. Noté ici pour que la
prochaine lecture ne le prenne pas pour un reste.

### Sombre — mode complet, pas un repli

```css
[data-theme="nuit"] {
  --nuit:       #0B0B0C;
  --plan:       #101013;
  --banc:       #1A1A20;  /* la scène MONTE, au lieu d'être le seul blanc */
  --banc-haut:  #24242B;
  --filet:      #26262C;
  --filet-vif:  #3C3C46;

  --encre:      #F2F2EF;  /* 17,0:1 */
  --prose:      #C3C3C9;  /* 11,1:1 */
  --second:     #9A9AA3;  /*  6,9:1 */
  --sourdine:   #7C7C86;  /*  4,7:1 */

  --signal:     #4DA3FF;  /*  7,3:1 sur --nuit · 6,6:1 sur --banc */
}
```

L'inversion est volontaire : en clair la scène est le seul **blanc pur**, en sombre elle
est le plan qui **monte**. Dans les deux cas elle est le point le plus haut de la page,
et c'est cet écart-là que le point fixe demande.

**Le sombre est adressable par attribut, pas seulement par la racine.** `[data-theme="nuit"]`
et `[data-theme="clair"]` fonctionnent tous deux sur un conteneur quelconque : c'est ce
qui permet à une scène de fiche d'être retournée seule, sur une page qui ne bouge pas.
Sans cette symétrie, la bascule ne marchait que dans un sens.

### Budget de contraste

La règle qui rend la thèse vérifiable en relecture de différence, au lieu de la laisser
en commentaire :

> **Aucun élément de chrome ne dépasse 7:1. Aucun contenu de scène ne descend sous 12:1.**

- Cotes, légendes, métadonnées, navigation : 4,6 à 7:1.
- Prose : 10 à 11:1.
- Titres : 17:1, mais courts.
- Intérieur de scène : 17:1.

**Exception, décidée à l'usage** : le panneau de télémétrie est du **contenu de scène**,
pas du chrome. À `--sourdine` il devenait illisible, ce qui vidait de son sens la seule
pièce qui prouve la doctrine. Libellés à `--second`, valeurs à `--encre`.

### Le bleu est la couleur primaire

**Décision renversée le 2026-09-09.** Le signal était rationné à deux occurrences par
écran — l'anneau de focus et l'intérieur d'une scène — et tout le reste passait en
sourdine. L'argument tenait : sur fond clair, une tache de couleur se lit comme un
bouton, et la plupart des vitrines claires finissent violettes pour l'avoir oublié.

Il tenait trop bien. Le résultat était une page grise où la marque n'apparaissait nulle
part, et où un bouton noir sur fond blanc n'appartenait à personne. Une nova est une
étoile bleu-blanc : ce bleu est l'IDENTITÉ, pas un accent qu'on économise.

`--signal` porte donc **tout ce qui agit**, et cela ne se négocie plus au cas par cas :

| Ce qui est bleu | Ce qui ne l'est pas |
|---|---|
| Boutons primaires (`--primary`) | Les titres, la prose, les cotes |
| Liens — le mot et le trait | **Les liens de navigation** : barre, pied, barre latérale |
| L'anneau de focus | L'intérieur d'une démonstration, sauf ce que le composant colore |
| La page courante dans la barre latérale | Les libellés d'une scène |
| Le symbole de la marque, les numéros de section, les losanges du bandeau | Le nom « Nova », qui reste en encre |

La ligne qui reste, et c'est la seule qui compte : **le bleu marque ce qui agit ou ce
qui identifie, jamais ce qui décore.** Trois liens bleus dans une barre de navigation ne
signalent plus une action, ils peignent le chrome — d'où l'exception des menus, où le
trait bleu au survol suffit.

Le budget de contraste continue de valoir, avec une exception nommée : la couleur
primaire n'est pas du chrome et n'est pas tenue au plafond de 7:1. Elle est à 6,5:1 en
clair et 7,5:1 en sombre.

### Les neutres sont froids

Une couleur de marque ne vit pas que dans ses accents, elle vit dans ses gris. Tous les
neutres portent donc la teinte du signal — 264° en OKLCH — à un chroma de 0,008 à 0,018.
Le résultat ne se lit jamais comme du bleu ; il se lit comme un papier qui n'est pas
gris. Les clartés sont inchangées et les contrastes documentés le restent à un dixième
près : refroidir n'a rien coûté à la lisibilité.

`--banc` reste le blanc pur en clair. La scène est la seule surface qui ne se teinte
pas : un fond de démonstration doit ressembler au fond que le composant aura chez celui
qui le copie, et sur une page légèrement froide ce blanc ressort au lieu de disparaître.

### Coloration syntaxique

Le bloc de code est le seul endroit où plusieurs teintes cohabitent, et il est sur le
plan **enfoncé**. Rampe chaude, aucun néon, aucun violet.

**Chaude parce que le signal est froid.** Si le code employait des bleus, un jeton bleu
dans le code se lirait comme une action. L'écart de température rend le bleu de la
marque non ambigu, et c'est ce qui permet à celui-ci d'être partout ailleurs.

**La ligne de commande est colorisée elle aussi.** `npx novaui add reveal` passait aux
règles du TSX, n'y déclenchait rien, et sortait en gris uniforme : la ligne qu'on vient
copier était la seule sans couleur de la page. Quatre rôles, dans l'ordre où on les
lit — le lanceur en sourdine (c'est de la tuyauterie), l'outil en mot-clé (c'est le nom
du produit), la sous-commande en type (ce qu'elle fait), les arguments en chaîne (les
seules valeurs qu'on remplace).

En clair : `#9A3412` · `#28607F` · `#2F6B45` · `#8A6423` · `#8A8A93` · `#6B6B75`.
En sombre : `#FF9E6B` · `#8FB6CF` · `#8FBF9F` · `#E2C48D` · `#6B6B74` · `#7C7C86`.

### Correspondance shadcn

Une seule palette. `--background → --nuit` · `--card → --plan` · `--popover →
--banc-haut` · `--muted → --plan` · `--muted-foreground → --second` ·
`--border`/`--input → --filet` · `--primary → --encre` avec `--primary-foreground →
--nuit` · `--ring → --signal`.

---

## Typographie

**Deux familles, et une seule règle de partage : les mots d'un côté, les nombres de
l'autre.**

C'est une simplification décidée après relevé. La direction précédente en tenait trois —
Bricolage Grotesque pour les titres, Instrument Sans pour la prose, Spline Sans Mono
pour la mesure — et la troisième voix ne payait pas son coût : sur un catalogue de
un catalogue entier de fiches, un grotesque expressif à quelques pixels d'une démonstration
concurrence exactement ce qu'il est censé annoncer. Le document le pressentait déjà, en
« point de vigilance ». Le point de vigilance est devenu la décision.

### Instrument Sans — tout ce qui est un mot

Axes `wdth 75–100`, `wght 400–700`. Titres, prose, navigation, libellés, boutons. Un
grotesque au dessin propre et discret, qui tient de 11 px à 60 px.

**Pourquoi pas Inter**, qui est la réponse évidente et celle du site qui a servi de
référence : c'est précisément parce qu'elle est la réponse évidente. Inter est la police
par défaut de la moitié des interfaces livrées depuis cinq ans ; la choisir ne se lit pas
comme un choix. Instrument Sans donne le même calme — c'est un grotesque neutre, à
l'oeil comparable — sans dire « réglage d'usine ». Le repos typographique était l'objectif,
pas Inter.

### Spline Sans Mono — tout ce qui est un nombre

`wght 300–700`. Cotes, code, valeurs, télémétrie, noms d'API, compteurs.

Elle survit à la simplification alors que Bricolage tombe, et pour une raison précise :
elle ne décore pas, elle DISTINGUE. Dans un catalogue technique, savoir d'un coup d'oeil
qu'un fragment est une valeur littérale et non de la prose vaut une famille entière. La
règle `font-variant-numeric: tabular-nums` s'applique partout où elle porte des chiffres,
sinon une colonne de valeurs danse sous un curseur.

### Échelle

Modérée, et c'est le second changement. Les titres descendent : un titre de fiche à
2,6 rem au-dessus d'une scène lui disputait l'écran.

L'affiche de l'accueil se cale sur `3.4vw` et non `5vw`, parce qu'elle vit dans **5
colonnes sur 12** : une taille indexée sur la fenêtre y produisait cinq lignes de titre
là où la colonne en supporte trois. Une échelle typographique se règle sur la mesure qui
la contient, pas sur celle de l'écran.

| Rôle | Police | Taille | Graisse | Interligne | Approche |
|---|---|---|---|---|---|
| Affiche (accueil) | Instrument | `clamp(2rem, 3.4vw, 3rem)` | 600 / wdth 92 | 1.04 | −0.025em |
| Titre de fiche | Instrument | `clamp(1.5rem, 2.4vw, 1.875rem)` | 600 | 1.15 | −0.02em |
| Titre de section | Instrument | `1.25rem` | 600 | 1.3 | −0.01em |
| Nom de famille sur scène | Instrument | `0.9375rem` | 600 | 1.2 | −0.01em |
| Accroche | Instrument | `1.0625rem` | 400 | 1.5 | 0 |
| Prose | Instrument | `1rem` | 400 | 1.6 | 0 |
| Interface, nav, boutons | Instrument | `0.875rem` | 500 | 1.4 | 0 |
| Cote (libellé technique) | Spline Mono | `0.6875rem` | 500, capitales | 1.2 | 0.09em |
| Code | Spline Mono | `0.8125rem` | 400 | 1.7 | 0 |
| Valeurs, télémétrie | Spline Mono | `0.75rem` | 400, tabular | 1.5 | 0.02em |

Une seule famille pour les mots supprime la règle « un titre est toujours en X » : il n'y
a plus rien à séparer. Ce qui distingue un titre est sa TAILLE et sa GRAISSE, pas sa
voix — c'est moins spectaculaire, et c'est ce qu'on cherche.

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

1. **Deux hauteurs : la case et le champ.** 224px dans la grille, `clamp(300px, 52vh,
   560px)` sur une fiche. La géométrie déclarée par chaque famille dans
   `lib/catalogue.ts` — `bande`, `bloc`, `carre` — survit et pilote la MISE EN PAGE
   INTERNE de la scène, plus sa hauteur : ce qui défile reste bas et large dans son
   cadre, ce qui rayonne reste centré.

   Elle pilotait la hauteur, et trois hauteurs différentes faisaient remonter les
   étiquettes d'une rangée à l'autre — la grille se lisait en dents de scie. Voir « Le
   catalogue ». L'ancienne `h-52` fixe de la toute première version reste écartée pour
   la raison inverse : elle imposait 208px à une scène de fiche, dont la géométrie *est*
   le contenu.
2. **Pas de centrage réflexe.** Défaut : aligné à gauche, centré verticalement. **On
   centre ce qui rayonne** (Halftone, Confetti, Loader, Lightbox), **on aligne à gauche
   ce qui se lit** (texte, marquee, compteur, highlight).
3. **La légende est dans la scène, sur le filet du bas.** À gauche l'invitation
   (« survolez le mot »), à droite le rejeu, ou rien.
4. **« Rejouer » n'est pas un bouton.** Un mot en mono, souligné d'un filet qui se
   dessine depuis la gauche au survol. Un bouton encadré dans le coin de chaque scène
   réintroduirait un objet de chrome identique par case.
5. **Le survol d'une scène ne fait qu'une chose** : les deux filets passent `--filet →
   --filet-vif` en 220ms. C'est le seul retour de survol du catalogue, donc il signifie
   « celle-ci est vivante ».
6. **Pas de remplissage muet.** Aucun rectangle gris, aucun lorem, aucun dégradé
   prétexte. Les mires sont **calculées** (rayures, trames de points) — aucune ressource
   à charger. Les six carrés gris de `DemoReveal` et les `from-neutral-800` de Lightbox
   et Blinds partent.

### Retourner la scène, sans retourner la page

Sur une fiche, un bouton du fil d'Ariane bascule le thème de la SEULE scène. La page ne
bouge pas.

C'est ce qui rend soutenable d'avoir un mode canonique : les cinq familles qui rayonnent
— Halftone, Confetti, Spotlight, Cursor, Loader — se montrent au mieux sur fond sombre,
et jusqu'ici la seule façon de les y voir était de basculer tout le site, donc de perdre
la scène de vue le temps que l'oeil se réhabitue. Comparer deux états demande de les voir
l'un après l'autre au même endroit.

Sur les FICHES uniquement, comme la télémétrie : le catalogue en porterait un par case, et
la section « Mise en scène » interdit d'y remettre une rangée d'objets de chrome
identiques. Une fiche n'a qu'une scène, donc un bouton — et il est dans le fil d'Ariane,
pas dans la scène, dont le plancher porte déjà le nom de la famille et le rejeu.

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

**Un index par SECTIONS, pas une grille unique.** Une grille d'un seul tenant forme un
mur qu'on parcourt sans repère : on ne sait ni où l'on est, ni ce qui reste. Rangées par
catégorie — chaque section avec son titre et une phrase qui dit ce qu'elle rassemble —
les mêmes cases deviennent six listes courtes, et chacune se lit d'un regard.

Le filtre par catégorie disparaît avec ce changement : les sections SONT les catégories,
et un menu qui refait ce que la page montre déjà est du chrome. Seule la recherche
textuelle reste, parce qu'elle traverse les sections. Une section vidée par la recherche
disparaît — un titre au-dessus de rien est pire qu'une section absente.


**Une case est un CADRE, et son étiquette est SOUS le cadre.**

C'est le changement le plus visible de la refonte, et il vient d'un relevé : la version
précédente posait l'étiquette DANS la case, sur un filet interne, pour qu'il n'y ait
« aucun chrome hors scène ». L'intention était juste, l'effet ne l'était pas — chaque
vignette devenait un objet composite qu'il faut décoder, et une pleine grille en fait
un mur. Sorti du cadre, le nom redevient une légende, le cadre redevient une image, et la
grille se lit d'un balayage.

Trois conséquences, dans cet ordre :

1. **Le cadre porte un fond neutre et une bordure, rien d'autre.** Il ne montre que la
   démonstration, à sa taille réelle, sans mise à l'échelle. Un composant réduit ment sur
   ce qu'il sera.
2. **L'étiquette est une ligne de nom + une ligne de compte**, en dessous, sur le fond de
   la page. Le compte est EXPLICITE — « 7 formes », « aucune dépendance » — parce que
   c'est l'information qui manque quand on choisit, et qu'elle ne coûte rien à afficher.
3. **La carte entière est le lien**, cadre compris. Une zone cliquable de la taille
   d'un mot au bas d'un objet de trois cents pixels est une cible qu'il faut viser ;
   la carte est celle qu'on vise déjà.

   Cela ne se décrète pas : une ancre qui enveloppe un bouton imbrique deux éléments
   interactifs, ce que HTML interdit et qui rendrait ces boutons inatteignables au
   clavier. Or les démonstrations portent leurs propres commandes — un « rejouer », un
   bouton qui tire des confettis. La contrepartie est donc le régime INERTE ci-dessous,
   et elle se paie : le catalogue présente les composants, il ne les manipule plus.

Grille de **3 colonnes**, `gap: 16px`, aperçus de **proportion 1,92** — un rectangle
paysage, jamais une hauteur en pixels : la carte donne la mesure, la scène la remplit.

Trois et non quatre, parce que la page porte une barre latérale de 248 px : à quatre
colonnes le cadre tombe à 215 px de large, et les démonstrations denses y débordent — le
nuage de mots de Spotlight se faisait couper en plein milieu d'un mot. Le nombre de
colonnes n'est pas une préférence, il est plafonné par la plus exigeante des scènes. La
quatrième colonne revient au-delà de 1536 px, où la place existe.

La proportion 1,92 impose une contrainte aux démonstrations, et c'est une bonne
contrainte : elle a fait tomber trois cartes au relevé — Reveal, Graph, Scroll Scene —
dont le contenu avait été dessiné pour un cadre presque carré. La réponse n'est pas de
détendre le cadre mais de retirer ce qui ne sert pas l'aperçu : Reveal montre un rang de
pastilles au lieu de deux, Scroll Scene renonce à son relevé de `t`. Une case n'a pas à
tout dire — la fiche est là pour ça. L'emprise
variable de la version précédente — bande sur six colonnes, bloc sur trois, carré sur
deux — composait un rythme de plan disséqué qui avait sa beauté, et qui échouait au test
de la lisibilité. Une grille régulière se parcourt ; une grille en pavage se contemple.

La hauteur uniforme est venue après coup, au relevé : on avait d'abord gardé une hauteur
de scène par famille, et une bande de 180 px à côté d'un bloc de 250 px fait remonter son
étiquette — la rangée se lit alors en dents de scie. Sur une grille qu'on parcourt,
l'alignement des légendes vaut plus que l'annonce de la géométrie par la forme du cadre.
La géométrie du mouvement survit donc à l'INTÉRIEUR du cadre, où une bande reste basse et
large et un carré reste centré ; elle ne déforme plus la grille qui l'entoure.

Sous 1280 px : deux colonnes. Sous 640 px : une.

### Le régime inerte du catalogue

**Une case présente le composant, elle ne le manipule plus.** La démonstration reste
MONTÉE — ce n'est pas une capture — et perd ses prises : plus de rejeu, plus de raccourci
`F`, plus de pointeur. Ce qui bouge tout seul continue de bouger ; ce qui répondait au
geste montre son état de repos, qui est exactement ce qu'il montrerait sans curseur
dessus.

Deux raisons, dans cet ordre.

1. **La carte entière doit être cliquable**, et cela exclut tout élément interactif à
   l'intérieur. C'est le point 3 ci-dessus.
2. **Une image figée coûterait plus et dirait moins.** Vingt-trois captures à produire et
   à regénérer à chaque retouche, contre une vitrine d'animation dont le catalogue serait
   immobile — le seul argument du produit, retiré de la page qui doit le porter.

Les légendes des scènes disparaissent avec l'interaction, et il le faut : la moitié sont
des invitations — « survolez pour suspendre », « promenez le curseur » — qui mentiraient
sur une case qui ne répond plus. Le cadre ne montre alors que le composant, ce qui est
aussi la bonne réponse visuelle : une légende sous chaque cadre
redoublerait l'étiquette posée juste en dessous.

La vraie démonstration — manipulable, réglable, avec son rejeu et sa télémétrie — est
sur la fiche. C'est ce qui donne au clic une raison d'exister.

### Aucun compte global n'est écrit

Ni dans l'interface, ni dans la prose, ni dans les commentaires. Le catalogue grossit à
chaque récolte : une phrase qui cite « vingt-trois familles » se périme à la ligne
suivante, et l'on passe plus de temps à la remettre à jour qu'elle n'apprend au lecteur.
Le relevé du 9 septembre 2026 en a trouvé trente-six occurrences dans le dépôt, dont
plusieurs déjà fausses.

Deux comptes survivent, et ils ont chacun leur raison :

- **le nombre de formes d'UNE famille**, sur sa carte et sa fiche : c'est une propriété
  de cette famille, pas du catalogue, et elle aide à choisir ;
- **le résultat d'une recherche** (« 4 sur 23 ») : il répond à ce qu'on vient de taper.

Tout le reste s'écrit sans nombre — « le catalogue », « toutes les formes », « une par
case ». `TOTAL_FORMES` reste exporté et juste, pour la prochaine surface qui aura une
vraie raison de compter.

### Densité

**Généreuse.** Les sections respirent à `96px` de haut et de bas sur les pages
d'affiche, `64px` dans la documentation ; la grille du catalogue passe de `gap: 10px` à
`gap: 20px`.

La densité serrée était cohérente avec un atelier sombre où l'on cherche à faire tenir
l'établi entier dans le champ. Elle ne l'est plus avec un plan de travail clair : sur
fond clair, le blanc entre deux objets EST une séparation, alors que sur fond sombre il
faut un filet pour la même chose. Serrer une grille claire produit du bruit là où serrer
une grille sombre produisait de la matière.

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
illustration — les seules images du site sont les composants eux-mêmes, des formes
calculées, et **la marque** ; `system-ui` en police d'affichage ou de texte ; Inter,
Geist, Space Grotesk.

L'interdiction d'Inter **survit au passage au clair**, et c'est là qu'elle compte le
plus. Le mode clair est la pente vers laquelle glisse toute vitrine de composants :
blanc, Inter, un violet d'accent, des cartes à ombre douce. Chacun de ces choix est
raisonnable isolément, et leur somme est un gabarit. Deux d'entre eux sont écartés ici
par une raison écrite — Inter par le paragraphe de typographie, le violet par le
rationnement du signal — et les ombres par la section « Formes ». Ce qui reste doit
gagner sa place autrement : par le cadrage, par la mesure affichée, par le mouvement.

Une trame de repérage en filigrane derrière chaque vignette — traits de coupe, croix
d'imprimeur — est un **trope** au sens de la barre de qualité, et elle est interdite
malgré son efficacité apparente. Elle donne à une grille l'air d'un plan technique sans
qu'aucune mesure ne soit faite : c'est de la crédibilité empruntée.

La marque est la seule ressource graphique du site, et elle est posée en **masque**,
jamais en `<img>` : le fichier livré est un raster noir sur transparent, seul son canal
alpha est lu, et la couleur vient de `currentColor`. Un fichier, les deux modes, et la
marque se comporte comme un glyphe. Son lettrage, lui, ne sert nulle part sur le site :
c'est un grotesque géométrique arrondi, et le poser à côté de Bricolage Grotesque
mettrait deux voix typographiques dans le même bandeau. Le nom s'écrit dans la police du
site, à côté du symbole.

Iconographie limitée à quatre icônes fonctionnelles — chevron, copier, valider, fermer —
à 16px, trait 1,5px, `currentColor`, jamais colorées, jamais dans un cercle.

---

## Le doigt

Le document n'avait rien sur le téléphone, et ça se voyait : la barre débordait de
36 px — la page entière défilait latéralement et la bascule de thème sortait du champ —
le tableau d'options coupait ses valeurs au milieu d'un mot en gardant sa colonne
« rôle » hors de l'écran, et cinq scènes demandaient un survol à un doigt qui n'en fait
pas. Ce sont les décisions prises pour y répondre.

**Le test est `pointer: coarse`, jamais une largeur.** Ce qui rend un survol impossible
est le doigt, pas la taille de la fenêtre. Une tablette avec souris garde ses badges de
touche ; un desktop réduit à 390 px les garde aussi, puisqu'il a un clavier. Deux
classes portent la règle, dans `globals.css` : `.sans-doigt` (ce qui suppose souris ou
clavier) et `.doigt-seul` (ce qui ne s'adresse qu'au doigt). Ce qui dépend de la
LARGEUR — le nombre de colonnes, la forme d'un tableau — reste aux points de rupture
Tailwind. Les deux axes sont distincts et ne se remplacent pas.

**Une scène qui suit le pointeur parle au doigt dans sa langue.** Chaque invitation
existe en deux versions, rendues toutes les deux, dont le CSS en cache une :
« survolez le mot » / « touchez le mot ». Quand la famille n'a pas d'équivalent tactile
— Spotlight refuse le pointeur grossier par décision du moteur, Cursor est un curseur —
la version tactile le DIT, au lieu de laisser une consigne impossible sous une scène
qui ne bouge pas. Une vitrine d'animation qui laisse croire à un composant cassé perd
son seul argument. Et lorsqu'un geste tactile équivaut vraiment au survol, c'est le
composant qui s'adapte, pas la légende : `RollText` pivote à la pression sous
`pointer: coarse`.

**Une cible d'icône fait 40 px au doigt** (`.cible-doigt`), contre 32 à la souris. Les
recommandations tactiles disent 44 ; la barre fait 56 px de haut, et au-delà de 40
l'icône flotte dans son cadre. Les liens de texte ne prennent pas la règle : leur
soulignement est posé sous la boîte du lien, et grandir la boîte décollerait le trait
du mot.

**Sous 640 px, la barre ne garde qu'un lien de texte** — « Composants », la page dont le
site est le sujet. « Installation » et « Source » descendent au pied de page, qui ne
portait qu'une devise et une licence. La recherche reste en tête : au doigt, c'est ELLE
la navigation entre familles, et elle fait mieux qu'un tiroir puisqu'elle cherche.

**Sous 640 px, la palette EST le menu.** La barre latérale n'existe pas là, et une
loupe seule ne remplace pas une navigation : elle annonce « cherchez », c'est-à-dire
« sachez d'abord ce que vous voulez », précisément ce qu'un visiteur qui découvre un
catalogue ne sait pas. Le déclencheur porte donc son nom — « Composants » — et un
chevron qui dit qu'il ouvre au lieu d'emmener. Derrière, la même palette, avec trois
changements qui la font passer d'outil de recherche à menu : la liste sans requête est
rangée PAR CATÉGORIE (la règle de l'index vaut ici, vingt-trois noms d'affilée forment
un mur), le clavier virtuel ne s'ouvre pas — le focus va sur le panneau, pas sur le
champ, sinon le clavier recouvre la liste qu'on vient ouvrir pour la parcourir — et le
panneau prend 70 vh au lieu de 46. La pastille de la rangée choisie disparaît au doigt :
elle marque la position des flèches et la famille que la scène joue, deux choses qui
n'existent pas là, et elle se lirait comme un choix que personne n'a fait.

**La référence se lit en blocs, la comparaison en tableau.** Sous 640 px, chaque option
devient un bloc — nom, type, `DÉFAUT` étiqueté, rôle en pleine largeur. Le tableau à
quatre colonnes revient au-dessus, où comparer une colonne d'un bout à l'autre est
justement ce qu'on vient y faire. Le défaut porte son étiquette et n'est pas séparé du
type par un point médian : le type d'une famille à formes EST une liste de valeurs
séparées par des points médians, et « scale · slide-up » se lisait comme une forme de
plus.

**Le souffle vertical tombe de 96 px à 64 px sous 640 px.** Quatre-vingt-seize pixels
sont la respiration d'une affiche regardée à un mètre ; sur 844 px de haut, deux fois 96
donnent un quart de l'écran au vide avant la première ligne.

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
| 2026-09-08 | **Clair canonique, sombre complet** — renversement de la première décision | La grande majorité des familles déplacent du CONTENU au lieu d'émettre de la lumière, et un contenu se lit sur le fond qu'il aura chez celui qui copie le composant. La question du visiteur n'est pas « est-ce beau ici » mais « est-ce que ça tiendra chez moi ». Le sombre reste dessiné, et la bascule par scène existe pour les cinq familles qui rayonnent. |
| 2026-09-08 | Deux familles typographiques au lieu de trois, Bricolage Grotesque retirée | Le « point de vigilance » du document se vérifiait : un grotesque expressif à quelques pixels d'une démonstration lui dispute l'écran, et un catalogue en aligne une par case. Ce qui distingue un titre redevient sa taille et sa graisse. |
| 2026-09-08 | Instrument Sans pour les mots, et non Inter | Inter donne le même calme et reste interdite : elle est la police par défaut de la moitié des interfaces livrées depuis cinq ans, donc la choisir ne se lit pas comme un choix. Le repos typographique était l'objectif, pas Inter. |
| 2026-09-08 | Titres redescendus (fiche : 2,6 rem → 1,875 rem) | Un titre de fiche au-dessus d'une scène lui disputait l'écran, ce que le point fixe interdit. |
| 2026-09-09 | Le catalogue devient un index PAR SECTIONS, une par catégorie | Une grille d'un seul tenant est un mur qu'on parcourt sans repère. Six listes courtes, chacune avec une phrase qui dit ce qu'elle rassemble, se lisent d'un regard. Le filtre par catégorie tombe avec : les sections sont les catégories. |
| 2026-09-09 | Aperçu de proportion 1,92, la carte donne la mesure | Une hauteur en pixels dans la scène entrait en conflit avec la carte qui la contient. La contrainte a fait tomber trois démonstrations dessinées pour un cadre presque carré — la réponse est de retirer ce qui ne sert pas l'aperçu, pas de détendre le cadre. |
| 2026-09-09 | Aucun compte global écrit nulle part | Trente-six occurrences relevées dans le dépôt, dont plusieurs déjà fausses. Le catalogue grossit à chaque récolte : la phrase se périme à la ligne suivante, et on passe plus de temps à la corriger qu'elle n'apprend. Seuls survivent le compte de formes d'une famille et le résultat d'une recherche. |
| 2026-09-09 | La carte entière devient le lien, et la démonstration du catalogue devient inerte | Une zone cliquable de la taille d'un mot sous un objet de trois cents pixels est une cible qu'il faut viser. La rendre entière exclut tout élément interactif dans le cadre — HTML interdit une ancre qui enveloppe un bouton. Le régime inerte est le prix, et il est préférable à une capture par famille : la démonstration reste montée, elle perd seulement ses prises. |
| 2026-09-09 | Légende de carte en sans, pas en mono capitale | La règle « un chiffre est toujours en mono » sert les valeurs qu'on compare. Une légende capitale et espacée sous chaque cadre fabriquait une rangée de plaques signalétiques là où on veut une légende qu'on lit une fois. |
| 2026-09-08 | Étiquette du catalogue SOUS le cadre, cases régulières, `gap` 10 → 20 px | Dans la case, l'étiquette faisait de chaque vignette un objet composite à décoder, et une pleine grille en fait un mur. L'emprise variable composait un pavage qui se contemple au lieu de se parcourir. Sur fond clair le blanc sépare déjà : serrer produit du bruit là où, sur fond sombre, cela produisait de la matière. |
| 2026-09-08 | Le sombre devient adressable par attribut, pas seulement par `:root` | Sans cette symétrie, une scène pouvait passer en clair sur une page sombre mais pas l'inverse : la bascule par scène ne marchait que dans un sens. |
| 2026-09-08 | Le bloc d'usage suit la scène (forme + réglages) | Le panneau de réglages affiche le nom réel de chaque prop pour apprendre quoi écrire ; il ne montrait pas quoi lui donner. On pouvait pousser une durée à 2000 ms, voir la scène ralentir, et lire `duration={700}` trois écrans plus bas. |
| 2026-09-08 | Fiches servies aussi en markdown, et `llms.txt` | Nova s'installe par copie, et la copie est de plus en plus faite par un agent : une page rendue est du bruit pour ce lecteur-là, et rien de ce qui compte n'y est structuré. |
| 2026-09-08 | Palette ⌘K, dont le résultat sélectionné JOUE | Une palette est un trope. Sa torsion est la seule liste du site où descendre d'un cran change ce qu'on regarde — ce qu'un catalogue d'animations devrait faire. |
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
| 2026-09-08 | « Rejouer » n'apparaît qu'au survol dans le catalogue | Posé en permanence, il chevauchait le contenu des bandes et remettait un objet de chrome par case dans une direction qui vise à les retirer. |
| 2026-09-08 | Panneau de réglages en direct sous la scène, la plupart des familles | Pendant de la télémétrie : elle montre ce que le moteur écrit, les réglages changent ce qu'on lui donne. Roll Text, Spotlight et Scroll Scene n'exposent aucune option numérique qui change visiblement le mouvement — leur panneau serait vide, il est donc absent. |
| 2026-09-08 | Rangées du catalogue composées par tri, `grid-auto-flow: dense` retiré | Dans une grille de 6, `3 + 2` fait 5 et laisse un trou. Le flux dense rebouchait au hasard : il cassait l'ordre de lecture SANS supprimer les trous. Le tri compose des rangées pleines et répartit les bandes au lieu de les empiler. |
| 2026-09-08 | Le filet de tête part du bord du banc, pas du bord de l'écran | Tiré sur toute la largeur, il barrait le titre comme un texte rayé. Le geste d'affiche ne vaut rien s'il abîme la ligne qu'il doit aligner. |
| 2026-09-08 | Rayons nommés par leur rôle (`presse` / `plan`), `rounded-nova` retiré du code applicatif | L'ancien nom valait 2 px et pointait désormais sur 8 px : il rendait, mais ne disait plus ce qu'il faisait. La pointe de l'infobulle garde un rayon propre de 2 px, sinon elle devient un disque. |
| 2026-09-08 | Aucun titre ne s'anime | Une librairie d'animation dont le chrome s'anime enseigne que le mouvement est décoratif. |
| 2026-09-08 | Barre de qualité inscrite en tête, avec ses trois tests | Le document disait ce qu'il est interdit de rater, jamais ce qu'il ne suffit pas de réussir. Une surface conforme et banale passait toutes les relectures. Les trois tests rendent le refus argumentable au lieu de le laisser au goût. |
| 2026-09-08 | Ce qu'une démonstration découvre porte la marque | Le tracé de la courbe passait les trois tests, mais répondait à la mauvaise question : un rideau d'ouverture ne se lève pas sur un diagramme, il se lève sur une marque — c'est le seul usage réel que le composant ait. Les réglettes graduées restent : sans elles la scène devient un écran de démarrage, et la vitrine est un banc d'essai. Le tracé de courbe part dans le sélecteur de courbe, où il fait un travail au lieu de décorer. |
| 2026-09-08 | La marque en masque CSS, son lettrage nulle part | Le kit livre un raster : en `<img>` il faudrait deux fichiers et une bascule au thème, en masque il en faut un et il hérite de `currentColor`. Le lettrage du kit est d'une autre famille que Bricolage Grotesque — deux voix dans un bandeau de 56 px. |
| 2026-09-08 | Ce qu'une démonstration découvre trace la courbe signature | Le faux titre d'article était du remplissage, et la mire de réglage qui l'a remplacé échouait au test du trope et à celui de la nécessité : elle aurait illustré n'importe quelle librairie. `cubic-bezier(0.16, 1, 0.3, 1)` est ce qui donne à chaque moteur sa sensation — c'est le seul fond qui ne pouvait venir que d'ici. |
| 2026-09-09 | Le doigt traité sur `pointer: coarse`, pas sur la largeur | La barre débordait de 36 px sur un écran de 390 : la page défilait latéralement et la bascule de thème était hors d'atteinte. En corrigeant, le vrai critère est apparu : ce qui casse au doigt n'est pas la place, c'est l'absence de survol. Un desktop réduit à 390 px garde donc ses badges de touche, une tablette tactile les perd. |
| 2026-09-09 | Chaque invitation de scène existe en deux versions | « Survolez le mot » sous une scène qui ne répondra jamais fait conclure que le composant est cassé — le contraire de ce qu'une vitrine prouve. Quand le tactile n'a pas d'équivalent, la version tactile le dit ; quand il en a un, c'est le composant qui s'adapte (`RollText` pivote à la pression). |
| 2026-09-09 | Les options en blocs sous 640 px, en tableau au-dessus | Dans 300 px, le tableau coupait `false` en `fals` et gardait la colonne « rôle » — la seule qui explique — hors du champ, sans rien signaler qu'on pouvait la chercher du doigt. Une référence qu'il faut deviner ne référence rien. |
| 2026-09-09 | La barre mobile garde un lien, le pied de page prend le reste | Trois liens, une marque et deux boutons ne tiennent pas dans 390 px. La recherche est la navigation tactile du site — elle cherche, là où un tiroir ne fait que déplier. |
| 2026-09-09 | Sous 640 px, la palette est le menu du site | Il n'y avait aucune navigation claire sur téléphone : la barre latérale disparaît, et il restait une loupe qui n'annonce pas qu'elle liste tout. Plutôt qu'un tiroir — le trope, et une seconde navigation à tenir — le déclencheur prend son nom et la palette prend des sections, de la hauteur, et cesse d'appeler le clavier. |
| 2026-09-09 | Le bleu devient la couleur primaire, le rationnement est levé | Le rationnement à deux occurrences par écran protégeait d'une page violette et produisait une page grise, où la marque n'apparaissait nulle part et où un bouton noir n'appartenait à personne. La règle qui le remplace tient en une ligne : le bleu marque ce qui agit ou ce qui identifie, jamais ce qui décore. |
| 2026-09-09 | Les liens de navigation restent neutres | Trois liens bleus dans une barre, vingt-trois dans une colonne, ne signalent plus une action : ils peignent le chrome, et le bleu perd ce qu'il vient de gagner ailleurs. Une navigation se lit à sa position. |
| 2026-09-09 | Les neutres portent la teinte du signal à chroma minuscule | Une couleur de marque vit dans les gris autant que dans les accents. Clartés inchangées, contrastes identiques à un dixième près. |
| 2026-09-09 | La ligne de commande est colorisée | Passée aux règles du TSX elle ne déclenchait rien : la ligne qu'on vient copier était la seule sans couleur de la page. |
