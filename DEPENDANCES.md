# Quand prendre une librairie

Note de conception. À lire avant d'ajouter une dépendance à un composant.

## Le renversement

Nova a d'abord été écrite sans aucune dépendance. C'était une contrainte
défendable — jusqu'à ce qu'elle coûte des composants. Deux pièces des projets
d'origine n'ont pas pu être récoltées à cause d'elle : la substitution de deux
arbres DOM sous un voile (GSAP Flip), et le défilement lissé qui revient dans
quatre projets sur huit (Lenis).

La règle est donc levée. **Une dépendance est permise quand elle achète
quelque chose qu'on ne sait pas écrire aussi bien.** Elle reste interdite
quand elle ne fait qu'éviter d'écrire trente lignes.

## La règle

```
Est-ce déjà résolu par shadcn / Radix ?
├── oui  →  ON S'Y BRANCHE. Radix la sémantique, Nova le geste.
└── non
    └── Le CSS suffit-il ?
        ├── oui  →  AUCUNE LIBRAIRIE
        └── non
            └── Le mécanisme est-il exprimable sur un HTMLElement ?
                ├── oui  →  GSAP, dans packages/core
                └── non, il faut la réconciliation de React
                          →  motion, dans packages/react — et le composant
                             est déclaré React-only
```

La mise en forme, elle, passe **toujours** par Tailwind et `cn()`. Il n'y a
pas de cas où l'on écrit une feuille de style maison pour l'apparence : le CSS
de Nova ne décrit que du mouvement.

### Aucune librairie — le cas le plus fréquent

`Reveal` et ses sept variantes, les dix-sept effets de `TextEffect`, `Marquee`,
`Blinds`, `BrushUnderline` : tout cela est du CSS conditionné par un attribut.
Les réécrire avec GSAP ajouterait cinquante kilo-octets pour un résultat
identique, et retirerait au passage leur meilleure propriété — un projet peut
surcharger l'apparence sans forker le moteur.

**Une transition qui n'a besoin ni de séquencement dynamique, ni de mesure,
ni de physique, n'a pas besoin de librairie.**

### GSAP — le défaut dès qu'il faut plus que du CSS

GSAP ne connaît aucun framework : il anime des `HTMLElement`. Il tient donc
dans `packages/core` sans rien casser du contrat des moteurs, et l'adaptateur
Angular reste mécanique.

Ce qu'il achète, et qu'on ne réécrira pas :

- **Flip** — mesurer une disposition, en laisser React remplacer une autre,
  et raccorder les deux. Écrit à la main, c'est plusieurs centaines de lignes
  et une longue liste de cas limites ;
- **les timelines** — un geste à dix pièces dont chacune part au passage d'un
  bord. Une timeline se joue à l'envers ; dix `setTimeout` ne se rembobinent
  pas ;
- **ScrollTrigger** — la vélocité de défilement, mesurée correctement.

### shadcn et Radix — pour tout ce qui est déjà résolu

Un panneau qui se déplie a besoin d'ARIA, de gestion du clavier, d'un état
contrôlé et d'un ordre de tabulation correct. Tout cela existe, c'est écrit
mieux que ce qu'on écrirait, et c'est maintenu.

**La division est nette : Radix apporte la sémantique, Nova apporte le geste.**
Un composant Nova ne réimplémente jamais un `Dialog`, un `Accordion`, un
`Popover` ou un `Tooltip` — il s'y branche.

Même chose pour Tailwind et `cn()` : la mise en forme passe par des classes
utilitaires fusionnées avec `tailwind-merge`, pas par une feuille de style
maison. Une classe passée par l'appelant doit remplacer celle du composant, pas
cohabiter avec elle en laissant l'ordre du fichier CSS trancher.

Radix étant React-only, ces composants vivent dans `packages/react` et sont
déclarés comme tels. Une entrée du registry qui en dépend le déclare, et la CLI
propose la commande `shadcn add` correspondante.

Ce qui reste à Nova, et qui n'existe nulle part ailleurs : le mouvement. Le
CSS de `nova.css` ne décrit que des gestes — ce qui monte, ce qui se retire, ce
qui se découvre — jamais l'apparence d'un bouton.

### motion (ex-framer-motion) — uniquement pour ce que React seul peut faire

Une seule chose justifie de sortir de GSAP : **animer un démontage**. Un
composant qui doit finir son geste après que React l'a retiré de l'arbre a
besoin d'`AnimatePresence`, et il n'y a pas d'équivalent hors React.

Un composant qui en dépend est **React-only**, et sa fiche le dit. Il ne
descendra jamais dans `packages/core`.

## Ce que ça change pour l'utilisateur

Une entrée du registry déclare ses dépendances. `novaui add` les installe —
et ne réinstalle pas ce qui est déjà là :

```
npx novaui add expand
  › Expand — la substitution de deux arbres sous un voile
  + src/lib/nova/engines/expand.ts
  + src/components/nova/expand.tsx
  › gsap manquant — installation avec pnpm
```

`--no-install` se contente d'afficher la commande, pour les projets qui
gèrent leurs dépendances autrement.

**Aucune dépendance n'est ajoutée à un projet qui ne prend pas le composant
qui en a besoin.** C'est tout l'intérêt du modèle « copier-coller » : la
facture est par composant, pas par librairie.

## Ce qui reste vrai

Le reste de la doctrine ne bouge pas, et une librairie ne dispense de rien :

- **l'état par défaut est visible.** GSAP anime en JavaScript, donc la règle
  CSS `prefers-reduced-motion` ne peut rien pour lui : le réglage se lit à la
  main, dans le moteur, à chaque geste ;
- **tout moteur se démonte proprement.** Une timeline GSAP se tue dans
  `destroy()`, comme un écouteur se retire ;
- **le JavaScript pose des attributs, le CSS anime** — partout où le CSS
  suffit encore.
