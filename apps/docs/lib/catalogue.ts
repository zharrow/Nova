/**
 * Catalogue du site — métadonnées de présentation.
 *
 * Le registry (`registry/registry.json`) reste la source de vérité de ce qui
 * s'installe ; ce fichier ne porte que ce qui se raconte : la provenance, les
 * options, l'exemple d'usage.
 */

export interface OptionRow {
  nom: string;
  type: string;
  defaut: string;
  role: string;
}

/**
 * Familles du catalogue. L'ordre déclaré ici est celui de la barre latérale.
 */
export const CATEGORIES = [
  { id: "texte", label: "Animations de texte" },
  { id: "defilement", label: "Défilement" },
  { id: "pointeur", label: "Pointeur" },
  { id: "donnees", label: "Données" },
  { id: "rendu", label: "Rendu" },
  { id: "effets", label: "Effets" },
] as const;

export type CategorieId = (typeof CATEGORIES)[number]["id"];

/**
 * Une forme d'un composant.
 *
 * Voir VARIANTES.md : une entrée du catalogue est une FAMILLE, pas une pièce.
 * La voie dit comment on obtient la forme —
 *   `option` une prop bascule,
 *   `usage`  le même code servi avec une autre intention,
 *   `frere`  un composant distinct, parce que le mécanisme diffère.
 */
export interface Forme {
  id: string;
  nom: string;
  note: string;
}

export interface Fiche {
  nom: string;
  titre: string;
  categorie: CategorieId;
  accroche: string;
  /** D'où vient le composant dans les projets d'origine. */
  provenance: string;
  /** Ce que la version Nova corrige par rapport à l'original. */
  apport: string;
  options: OptionRow[];
  usage: string;
  /** Par quelle voie la famille se décline. */
  voie?: "option" | "usage" | "frere";
  /** Les formes de la famille. Absent quand il n'y en a qu'une. */
  formes?: Forme[];
  /** Signalé comme récent dans la grille. */
  nouveau?: boolean;
}

export const catalogue: Fiche[] = [
  {
    nom: "reveal",
    categorie: "defilement",
    titre: "Reveal",
    accroche: "Apparition au scroll, sans jamais rien laisser masqué.",
    provenance: "useReveal — Bât-et-Verre 3D",
    apport:
      "Le décalage d'un groupe se calcule depuis le DOM au lieu de cloner les enfants React : un enfant enveloppé dans un autre composant participe désormais au rythme.",
    options: [
      { nom: "variant", type: "fade · slide-up · slide-down · slide-left · slide-right · mask · scale", defaut: "slide-up", role: "Nature de l'apparition." },
      { nom: "duration", type: "number", defaut: "700", role: "Durée en ms (1100 pour mask)." },
      { nom: "delay", type: "number", defaut: "0", role: "Retard en ms." },
      { nom: "distance", type: "string", defaut: "1.5rem", role: "Amplitude du déplacement." },
      { nom: "repeat", type: "boolean", defaut: "false", role: "Rejouer à chaque entrée en vue." },
      { nom: "stagger", type: "number", defaut: "80", role: "RevealGroup — décalage entre enfants, en ms." },
    ],
    usage: `<Reveal variant="mask" duration={1100}>
  <img src="/atelier.jpg" alt="" />
</Reveal>

<RevealGroup stagger={80}>
  <article>Première</article>
  <article>Deuxième</article>
  <article>Troisième</article>
</RevealGroup>`,
    voie: "option",
    formes: [
      {
        id: "slide-up",
        nom: "Montée",
        note: "Le contenu monte de sous sa place. Le plus discret, et le plus employé.",
      },
      {
        id: "slide-down",
        nom: "Descente",
        note: "L'inverse : le contenu descend. Utile pour ce qui vient d'en haut, un menu par exemple.",
      },
      {
        id: "slide-left",
        nom: "Depuis la droite",
        note: "Entrée latérale. À réserver aux blocs qui ne tiennent pas toute la largeur.",
      },
      {
        id: "slide-right",
        nom: "Depuis la gauche",
        note: "Le symétrique. Ne pas mélanger les deux sens dans une même colonne : la page se met à osciller.",
      },
      {
        id: "fade",
        nom: "Fondu",
        note: "Aucun déplacement. Le seul qui ne demande aucun espace autour du bloc.",
      },
      {
        id: "mask",
        nom: "Joint",
        note: "Un dévoilement par masque, sans fondu : l'image n'est jamais translucide, seulement partiellement révélée.",
      },
      {
        id: "scale",
        nom: "Échelle",
        note: "Le bloc arrive légèrement réduit. Au-delà de 0,94 on lit un zoom, pas une apparition.",
      },
    ],
  },
  {
    nom: "scramble-text",
    categorie: "texte",
    titre: "Scramble Text",
    accroche: "Le texte se brouille, puis se décode lettre par lettre.",
    provenance: "ScrambleText — portfolio (survol) · KaopyX (boucle)",
    apport:
      "Deux usages, et ils ne disent pas la même chose. Au survol, le décodage répond à un geste : c'est le lecteur qui le provoque. À intervalle, il se rejoue seul tant que le texte est à l'écran — une étiquette qui se redéchiffre, un signal de fond. Les deux se combinent, mais se demandent séparément. Côté rendu, les nœuds sont créés une fois et réutilisés, là où la version React reconstruisait quarante éléments tous les 52 ms.",
    options: [
      { nom: "text", type: "string", defaut: "—", role: "Texte final. Obligatoire." },
      { nom: "trigger", type: "hover · view · mount · manual", defaut: "hover", role: "Ce qui arme le décodage." },
      { nom: "interval", type: "number", defaut: "0", role: "Rejeu automatique en ms. 0 désactive la boucle. Le minuteur s'arrête hors écran." },
      { nom: "replayOnHover", type: "boolean", defaut: "trigger === hover", role: "Autoriser le survol à relancer, même en mode boucle." },
      { nom: "stepMs", type: "number", defaut: "52", role: "Durée d'un pas. Plus haut = plus lent." },
      { nom: "scrambleSteps", type: "number", defaut: "6", role: "Pas pendant lesquels une lettre reste brouillée." },
      { nom: "chars", type: "string", defaut: "A-Z 0-9 #%&/<>*+=", role: "Jeu de caractères de brouillage." },
    ],
    usage: `/* Au survol — le décodage répond à un geste : */
<ScrambleText text="DÉCODER" trigger="hover" />

/* À intervalle — le décodage est un signal de fond : */
<ScrambleText text="RÉFÉRENTIELS" trigger="view" interval={6000} />

/* Les caractères brouillés prennent --nova-accent : */
:root { --nova-accent: #ff5b1f; }`,
    voie: "usage",
    formes: [
      {
        id: "hover",
        nom: "Au survol",
        note: "Le décodage répond à un geste : le texte est stable, c'est le lecteur qui le provoque. C'est l'usage du portfolio.",
      },
      {
        id: "interval",
        nom: "À intervalle",
        note: "Le décodage se rejoue seul tant que le texte est à l'écran. Il n'attend rien de personne : une étiquette qui se redéchiffre, un signal de fond. C'est l'usage de KaopyX.",
      },
    ],
  },
  {
    nom: "counter",
    categorie: "donnees",
    titre: "Counter",
    accroche: "Un nombre qui compte jusqu'à sa valeur, sans rien bousculer.",
    provenance: "AnimatedCounter — portfolio et rent_app",
    apport:
      "Les deux versions d'origine fusionnées, sans framer-motion. La valeur finale est écrite dès le premier rendu : la largeur ne bouge pas pendant le comptage, et le chiffre reste juste sans JavaScript.",
    options: [
      { nom: "to", type: "number", defaut: "—", role: "Valeur d'arrivée. Obligatoire." },
      { nom: "from", type: "number", defaut: "0", role: "Valeur de départ." },
      { nom: "duration", type: "number", defaut: "1500", role: "Durée du comptage en ms." },
      { nom: "locale", type: "string", defaut: "—", role: "Formatage Intl (ex. fr-FR)." },
      { nom: "format", type: "Intl.NumberFormatOptions", defaut: "—", role: "Devise, pourcentage…" },
      { nom: "decimals", type: "number", defaut: "0", role: "Nombre de décimales." },
      { nom: "prefix / suffix", type: "string", defaut: "\"\"", role: "Texte encadrant la valeur." },
    ],
    usage: `<Counter to={12480} locale="fr-FR" suffix=" €" />
<Counter to={99.4} decimals={1} suffix=" %" duration={2000} />`,
    voie: "usage",
    formes: [
      {
        id: "brut",
        nom: "Brut",
        note: "Le nombre nu. Aucun séparateur, aucune locale — pour un identifiant ou un compte technique.",
      },
      {
        id: "localise",
        nom: "Localisé",
        note: "Séparateurs de milliers et décimales selon la locale. Pour tout chiffre qu'un lecteur doit pouvoir lire d'un coup.",
      },
      {
        id: "monetaire",
        nom: "Monétaire",
        note: "Devise, via les options Intl. La place est réservée dès le premier rendu, symbole compris.",
      },
    ],
  },
  {
    nom: "text-effect",
    categorie: "texte",
    nouveau: true,
    titre: "Text Effect",
    accroche: "Dix-sept traitements de texte animé, sur un seul primitif.",
    provenance: "Fragments + banc /lab/texte — KaopyX",
    apport:
      "Le primitif mesure les VRAIES lignes après mise en page, et re-mesure au redimensionnement comme à l'arrivée des polices. Il expose six variables — mot, lettre continue, avancement, ligne, rang dans la ligne, éloignement du centre — qui suffisent à écrire les dix-sept effets en CSS pur. Deux corrections sur l'original : les fragments sont créés par le moteur et non par React, donc plus personne n'écrase les variables mesurées ; et les trois effets de défilement passent sous @supports, sans quoi ils laissaient le texte à 17 % d'opacité sur les navigateurs sans animation-timeline.",
    options: [
      { nom: "text", type: "string", defaut: "—", role: "Texte à traiter. Obligatoire." },
      { nom: "effect", type: "17 valeurs — voir ci-dessous", defaut: "line", role: "Traitement appliqué." },
      { nom: "grain", type: "word · letter", defaut: "déduit de l'effet", role: "Force la granularité du découpage." },
      { nom: "trigger", type: "view · mount · manual", defaut: "view", role: "Sans objet pour les effets de défilement." },
      { nom: "duration", type: "number", defaut: "900", role: "Durée d'une unité, en ms." },
      { nom: "easing", type: "string", defaut: "courbe du catalogue", role: "Timing CSS." },
    ],
    usage: `<TextEffect as="h1" text="Bâtir en verre" effect="line" />
<TextEffect text="NOVA" effect="wave" />

/* Au défilement — aucune durée, c'est la molette qui donne le temps : */
<TextEffect as="p" text={manifeste} effect="reading" />`,
    voie: "option",
    formes: [
      {
        id: "line",
        nom: "Ligne",
        note: "Le geste fondateur, et de loin le plus utilisé : il ne déforme rien, ne floute rien, et marche à toutes les tailles. Si vous n'en gardez qu'un.",
      },
      {
        id: "word",
        nom: "Mot",
        note: "Le même, décalé mot à mot. Le décalage reste additif — ligne, puis rang dans la ligne — sinon la fin d'un texte long accélère sans raison.",
      },
      {
        id: "letter",
        nom: "Lettre",
        note: "Le grain le plus fin, à réserver aux titres courts. Sur un paragraphe, deux cents nœuds animés pour un effet que l'œil lit de toute façon comme une vague.",
      },
      {
        id: "flip",
        nom: "Bascule",
        note: "La ligne arrive couchée en arrière et se redresse depuis son pied. La perspective va sur le masque, pas sur la boîte qui tourne.",
      },
      {
        id: "curtain",
        nom: "Rideau",
        note: "Rien ne se déplace : le texte est à sa place et se découvre par le bas. Le plus léger en nœuds.",
      },
      {
        id: "blur",
        nom: "Flou",
        note: "Le texte se résout sur place. Il ne déplace rien, donc ne demande aucun espace autour du bloc.",
      },
      {
        id: "focus",
        nom: "Mise au point",
        note: "Le flou plus l'échelle, comme un objectif qui se règle. Au-delà de 1,1 d'agrandissement, on lit un zoom.",
      },
      {
        id: "center",
        nom: "Depuis le centre",
        note: "Le décalage suit la géométrie et non l'ordre de lecture : l'effet s'ouvre en anneau. Le seul qui exige une mesure après mise en page.",
      },
      {
        id: "shear",
        nom: "Cisaille",
        note: "Le mot monte penché et se redresse en arrivant : ce qui va vite se déforme.",
      },
      {
        id: "wave",
        nom: "Vague",
        note: "Une seule course par lettre, décalée dans le temps. L'onde naît du décalage, pas d'un calcul.",
      },
      {
        id: "tracking",
        nom: "Chasse",
        note: "L'approche s'ouvre. Le seul qui anime la typographie elle-même, et le plus coûteux — letter-spacing recalcule la mise en page à chaque image.",
      },
      {
        id: "weight",
        nom: "Graisse",
        note: "Du trait fin au trait plein. Exige une police variable, sinon le navigateur saute d'une graisse à l'autre.",
      },
      {
        id: "roll",
        nom: "Rouleau",
        note: "Le compteur kilométrique : deux exemplaires par lettre, qui montent d'exactement une hauteur.",
      },
      {
        id: "typewriter",
        nom: "Machine à écrire",
        note: "steps() et non une courbe : c'est la fonction de temps qui fait la machine. Exige une chasse fixe.",
      },
      {
        id: "reading",
        nom: "Lecture",
        note: "Au défilement. Les mots s'allument un à un : il impose un rythme de lecture au lieu de décorer.",
      },
      {
        id: "reading-blur",
        nom: "Lecture floue",
        note: "Au défilement. Le même échelonnement en netteté. Nettement plus cher — à réserver à un bloc court.",
      },
      {
        id: "highlight",
        nom: "Surlignage",
        note: "Au défilement. Un dégradé balaie le texte, découpé à la forme des lettres. Une seule couche, aucun coût par mot.",
      },
    ],
  },
  {
    nom: "marquee",
    categorie: "defilement",
    titre: "Marquee",
    accroche: "Un bandeau qui défile sans fin, à vitesse constante. Horizontal ou vertical.",
    provenance: "Marquee — portfolio · ScrollList — KaopyX",
    apport:
      "La vitesse est en pixels par seconde, pas en durée fixe : deux bandeaux réglés pareil défilent au même rythme, quelle que soit la longueur de leur contenu. Le contenu est répété jusqu'à dépasser le conteneur — sans quoi la boucle laisse un trou, le défaut que ScrollList documentait sur l'axe vertical. Et hors écran l'animation est SUSPENDUE, pas coupée : elle reprend où elle s'était arrêtée au lieu de repartir du début.",
    options: [
      { nom: "speed", type: "number", defaut: "60", role: "Vitesse en px/s." },
      { nom: "direction", type: "left · right · up · down", defaut: "left", role: "Sens. up et down basculent l'axe." },
      { nom: "pauseOnHover", type: "boolean", defaut: "false", role: "Suspendre au survol." },
      { nom: "pauseOffscreen", type: "boolean", defaut: "true", role: "Suspendre quand le bandeau sort de l'écran." },
      { nom: "gap", type: "string", defaut: "0px", role: "Écart entre deux copies." },
    ],
    usage: `<Marquee speed={80} gap="3rem" pauseOnHover>
  <span>ATELIER</span>
  <span>VERRE</span>
</Marquee>

/* Colonne de texture, à la verticale : */
<Marquee direction="up" speed={42} className="h-80">
  {referentiels.map((r) => <span key={r}>{r}</span>)}
</Marquee>`,
    voie: "option",
    formes: [
      {
        id: "left",
        nom: "Vers la gauche",
        note: "Le sens de lecture. Le défaut.",
      },
      {
        id: "right",
        nom: "Vers la droite",
        note: "La même course jouée à l'envers. Se lit comme un retour en arrière — à réserver au second bandeau d'une paire.",
      },
      {
        id: "up",
        nom: "Vers le haut",
        note: "Bascule l'axe. C'est la colonne de texture, celle des listes de référentiels.",
      },
      {
        id: "down",
        nom: "Vers le bas",
        note: "L'axe vertical, à l'envers.",
      },
    ],
  },
  {
    nom: "scroll-marquee",
    categorie: "defilement",
    nouveau: true,
    titre: "Scroll Marquee",
    accroche: "Un bandeau que la molette entraîne.",
    provenance: "TriadMarquee — KaopyX",
    apport:
      "Le bandeau n'a pas de vitesse propre : il a une dérive, et le défilement le pousse. Remonter le fait repartir en arrière. C'est ce qui le sort du bandeau décoratif — il ne tourne pas à côté de la page, il est entraîné par elle. Moteur distinct du Marquee parce qu'une @keyframes ne peut pas être poussée : elle a une durée, pas une vitesse.",
    options: [
      { nom: "drift", type: "number", defaut: "44", role: "Dérive au repos, en px/s." },
      { nom: "push", type: "number", defaut: "0.9", role: "Ce que vaut un pixel de défilement. Au-delà de 1, la main se sent démultipliée." },
      { nom: "maxSpeed", type: "number", defaut: "2400", role: "Plafond. Sans lui, un coup de molette fait une barre grise." },
      { nom: "smoothing", type: "number", defaut: "0.1", role: "Constante de lissage, en s. Sans elle, le bandeau tremble." },
      { nom: "skew", type: "number", defaut: "2.6", role: "Inclinaison en degrés par millier de px/s." },
      { nom: "hoverFactor", type: "number", defaut: "0.12", role: "Part de vitesse gardée au survol." },
    ],
    usage: `<ScrollMarquee drift={44} gap="2rem">
  {mots.map((m) => (
    <span key={m}>
      {m}
      {/* se retourne avec le sens de marche */}
      <i data-nova-marquee-arrow>→</i>
    </span>
  ))}
</ScrollMarquee>`,
  },
  {
    nom: "roll-text",
    categorie: "texte",
    nouveau: true,
    titre: "Roll Text",
    accroche: "Un label qui pivote sur lui-même au survol.",
    provenance: "RollText — portfolio, puis KaopyX",
    apport:
      "Le survol est lu sur l'ANCÊTRE, pas sur le mot : le label d'un bouton doit pivoter quand on survole le bouton, pas seulement les quelques pixels du texte. Ce n'est pas le même geste que l'effet roll de TextEffect, qui joue une fois à l'entrée en vue et lettre par lettre.",
    options: [
      { nom: "text", type: "string", defaut: "—", role: "Texte du label. Obligatoire." },
      { nom: "trigger", type: "string", defaut: "parent direct", role: "Sélecteur de l'ancêtre survolé. \"self\" pour n'écouter que le mot." },
    ],
    usage: `<button className="btn">
  <RollText text="Nous écrire" />
</button>

/* Déclenché par la carte entière plutôt que par le bouton : */
<RollText text="Voir le projet" trigger=".carte" />`,
  },
  {
    nom: "spotlight",
    categorie: "pointeur",
    nouveau: true,
    titre: "Spotlight",
    accroche: "Un halo de repérage qui suit le curseur dans un panneau.",
    provenance: "RegLight — KaopyX",
    apport:
      "Le moteur ne dessine rien : il publie les coordonnées du curseur en --nova-spot-x / y, et le dessin appartient au CSS du projet. Le relevé du rectangle se fait dans l'image d'animation et non dans l'écouteur — pointermove tire des dizaines d'événements par image, chacun forcerait un calcul de mise en page. Et le halo s'allume au premier DÉPLACEMENT, pas à l'entrée : allumé à l'entrée, il apparaîtrait une image à sa position précédente.",
    options: [
      { nom: "panel", type: "string", defaut: "parent direct", role: "Sélecteur du panneau suivi." },
      { nom: "radius", type: "string", defaut: "18rem", role: "Rayon, publié en --nova-spot-radius." },
    ],
    usage: `<article className="relative overflow-hidden">
  <Spotlight radius="14rem" />
  <h3>Panneau</h3>
</article>

/* Le dessin se surcharge entièrement : */
[data-nova-spotlight] { background: /* votre trame */; }`,
  },
  {
    nom: "cursor",
    categorie: "pointeur",
    titre: "Cursor",
    accroche: "Un disque qui suit le pointeur et grossit sur ce qui se clique.",
    provenance: "Cursor — portfolio",
    apport:
      "Le suivi du pointeur est mutualisé : un seul écouteur pour toute la page, quel que soit le nombre d'effets qui s'en servent.",
    options: [
      { nom: "lerp", type: "number", defaut: "0.2", role: "Rattrapage par frame, entre 0 et 1." },
      { nom: "hoverScale", type: "number", defaut: "2.6", role: "Agrandissement au survol." },
      { nom: "hoverSelector", type: "string", defaut: "a, button, input…", role: "Ce qui déclenche l'agrandissement." },
    ],
    usage: `/* Une seule fois, dans le layout racine : */
<Cursor />

/* Le curseur système reste visible — Nova l'augmente. */`,
  },
  {
    nom: "confetti",
    categorie: "effets",
    titre: "Confetti",
    accroche: "Une salve de particules, qui se nettoie derrière elle.",
    provenance: "triggerConfetti — portfolio",
    apport:
      "Les salves en cours sont interrompues au démontage : naviguer pendant la chute ne laisse plus de particules orphelines dans le body.",
    options: [
      { nom: "count", type: "number", defaut: "50", role: "Nombre de particules." },
      { nom: "colors", type: "string[]", defaut: "or / bronze", role: "Palette." },
      { nom: "origin", type: "{ x, y }", defaut: "haut de l'écran", role: "Point de départ de la salve." },
      { nom: "spread", type: "number", defaut: "200", role: "Dispersion horizontale en px." },
      { nom: "shape", type: "circle · square · mixed", defaut: "mixed", role: "Forme des particules." },
    ],
    usage: `const tirer = useConfetti({ colors: ["#ff5b1f", "#e9e7e2"] });

<button onClick={() => tirer()}>Célébrer</button>`,
    voie: "option",
    formes: [
      {
        id: "mixed",
        nom: "Mélangé",
        note: "Ronds et carrés en proportions égales. Le défaut.",
      },
      {
        id: "circle",
        nom: "Ronds",
        note: "Des pastilles. Plus festif, moins graphique.",
      },
      {
        id: "square",
        nom: "Carrés",
        note: "Des confettis de papier. Tient mieux avec une direction artistique anguleuse.",
      },
    ],
  },
  {
    nom: "halftone",
    categorie: "rendu",
    nouveau: true,
    titre: "Halftone",
    accroche: "Une trame d'imprimeur : la taille du module dit la valeur.",
    provenance: "EyeO et PixelClock — KaopyX",
    apport:
      "L'écran de trame des deux dessins d'origine, sorti de leur géométrie. La source peut être une image, un canvas déjà peint, ou une fonction de couverture — c'est ce dernier cas qui reproduit l'œil. Ce n'est pas un filtre de pixellisation : un pixel garde sa taille et change de couleur, un module de trame garde sa couleur et change de taille.",
    options: [
      { nom: "source", type: "string · HTMLImageElement · HTMLCanvasElement · (x,y) => number", defaut: "—", role: "Image, canvas, ou fonction de couverture. Obligatoire." },
      { nom: "cols", type: "number", defaut: "48", role: "Colonnes. Les lignes suivent le rapport du canvas." },
      { nom: "steps", type: "number", defaut: "4", role: "Paliers de valeur. Une trame est discrète, pas continue." },
      { nom: "bleed", type: "number", defaut: "1", role: "Filet de blanc entre modules. Sans lui, les pleins se referment en aplat." },
      { nom: "gamma", type: "number", defaut: "0.45", role: "Courbe taille/couverture. Garde les valeurs faibles visibles." },
      { nom: "shape", type: "square · circle", defaut: "square", role: "Forme d'un module." },
      { nom: "pointerBoost", type: "number", defaut: "0", role: "Agrandissement sous le curseur. 0 n'ouvre aucune boucle." },
      { nom: "channel", type: "alpha · luminance", defaut: "déduit", role: "Canal lu dans une image. Détouré : alpha. Photo : luminance." },
    ],
    usage: `<Halftone alt="Portrait" source="/photo.jpg" cols={64} pointerBoost={0.4} />

/* Une forme calculée — un disque : */
<Halftone
  alt=""
  cols={32}
  source={(x, y) => (Math.hypot(x - 0.5, y - 0.5) < 0.4 ? 1 : 0)}
/>`,
    voie: "option",
    formes: [
      {
        id: "square",
        nom: "Module carré",
        note: "La trame d'imprimeur classique. Les pleins se referment en damier.",
      },
      {
        id: "circle",
        nom: "Module rond",
        note: "Le point de trame. Plus doux, et plus lisible sur les valeurs faibles.",
      },
    ],
  },
  {
    nom: "graph",
    categorie: "donnees",
    nouveau: true,
    titre: "Graph",
    accroche: "Un graphe dont le visuel n'est qu'une couche de présentation.",
    provenance: "KnowledgeGraph — KaopyX",
    apport:
      "La règle centrale est conservée et fait partie du contrat : le canvas ne porte aucune information qui n'existe pas déjà en HTML. La liste rendue à côté est le contenu réel — indexable, navigable au clavier, lisible sans JavaScript — et c'est elle qui pilote le visuel. La disposition est déterministe, la simulation est déroulée à froid avant la première image, et la boucle se gare une fois la topologie posée.",
    options: [
      { nom: "nodes", type: "{ id, label, group? }[]", defaut: "—", role: "Les nœuds. Obligatoire." },
      { nom: "edges", type: "[string, string][]", defaut: "—", role: "Les arêtes, par identifiants. Obligatoire." },
      { nom: "colors", type: "Record<string, string>", defaut: "—", role: "Couleur par famille." },
      { nom: "seed", type: "number", defaut: "20260904", role: "Graine de la disposition. La garder, c'est garder la même image." },
      { nom: "autoCycle", type: "number", defaut: "0", role: "Cadence du défilé automatique en ms. 0 le désactive." },
      { nom: "settleCold", type: "number", defaut: "240", role: "Pas joués avant la première image." },
      { nom: "settleVisible", type: "number", defaut: "90", role: "Pas joués à l'écran, après quoi la boucle se gare." },
      { nom: "groupLabels", type: "Record<string, string>", defaut: "—", role: "Intertitres de la liste." },
    ],
    usage: `<Graph
  nodes={[{ id: "a", label: "Alpha", group: "cyber" }]}
  edges={[["a", "b"]]}
  colors={{ cyber: "#4FD1C5", ia: "#8C79FF" }}
  groupLabels={{ cyber: "Cybersécurité", ia: "Intelligence artificielle" }}
  autoCycle={1700}
/>`,
  },
];

export function trouverFiche(nom: string): Fiche | undefined {
  return catalogue.find((fiche) => fiche.nom === nom);
}

/** Libellé lisible d'une catégorie. */
export function libelleCategorie(id: CategorieId): string {
  return CATEGORIES.find((c) => c.id === id)?.label ?? id;
}

/** Le catalogue regroupé, dans l'ordre déclaré des catégories. */
export function parCategorie(): Array<{
  id: CategorieId;
  label: string;
  fiches: Fiche[];
}> {
  return CATEGORIES.map((categorie) => ({
    id: categorie.id,
    label: categorie.label,
    fiches: catalogue.filter((fiche) => fiche.categorie === categorie.id),
  })).filter((groupe) => groupe.fiches.length > 0);
}

/**
 * Nombre de formes d'une famille. Une famille sans formes déclarées en a une :
 * elle-même. Voir VARIANTES.md.
 */
export function nombreDeFormes(fiche: Fiche): number {
  return fiche.formes?.length ?? 1;
}

/** Total des formes du catalogue — ce que la vitrine annonce vraiment. */
export const TOTAL_FORMES = catalogue.reduce(
  (total, fiche) => total + nombreDeFormes(fiche),
  0,
);
