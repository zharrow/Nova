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
  /**
   * Emprise de la case dans le catalogue, et hauteur de sa scène.
   *
   * Elle vient de la GÉOMÉTRIE DU MOUVEMENT, pas de l'importance de la
   * famille : ce qui défile est une bande, ce qui rayonne est un carré. La
   * forme de la case annonce ainsi la nature de l'effet avant qu'on lise
   * l'étiquette. Défaut : `carre`. Voir DESIGN.md.
   */
  geometrie?: "bande" | "bloc" | "carre";
}

/**
 * Un réglage manipulable en direct sous la démonstration.
 *
 * C'est le prolongement de la télémétrie : celle-ci montre ce que le moteur
 * ÉCRIT, les réglages laissent changer ce qu'on lui DONNE. Ensemble, la fiche
 * cesse d'être une image animée et devient un objet qu'on mesure et qu'on
 * règle. Voir DESIGN.md.
 *
 * On ne déclare ici que ce qui change VISIBLEMENT le mouvement. Un `seed`, une
 * `className` ou un rappel n'ont rien à faire dans un panneau de réglages :
 * ils allongeraient la liste sans rien apprendre.
 */
export type Reglage =
  | {
      type: "nombre";
      nom: string;
      libelle: string;
      min: number;
      max: number;
      pas: number;
      defaut: number;
      unite?: string;
    }
  | { type: "bool"; nom: string; libelle: string; defaut: boolean }
  | {
      type: "choix";
      nom: string;
      libelle: string;
      choix: string[];
      defaut: string;
    };

const N = (
  nom: string,
  libelle: string,
  min: number,
  max: number,
  pas: number,
  defaut: number,
  unite?: string,
): Reglage => ({ type: "nombre", nom, libelle, min, max, pas, defaut, unite });

/** Les réglages par famille. Le nom de la clé est le NOM DE LA PROP réelle. */
export const REGLAGES: Record<string, Reglage[]> = {
  reveal: [
    N("duration", "Durée", 100, 2000, 50, 700, "ms"),
    N("stagger", "Décalage", 0, 400, 10, 80, "ms"),
  ],
  "scramble-text": [
    N("stepMs", "Durée d'un pas", 10, 200, 2, 52, "ms"),
    N("scrambleSteps", "Pas brouillés", 1, 20, 1, 6),
    N("interval", "Rejeu auto", 0, 10000, 500, 5000, "ms"),
  ],
  counter: [
    N("duration", "Durée", 200, 5000, 100, 1500, "ms"),
    N("decimals", "Décimales", 0, 3, 1, 0),
  ],
  "text-effect": [N("duration", "Durée", 200, 3000, 50, 900, "ms")],
  marquee: [
    N("speed", "Vitesse", 10, 300, 5, 60, "px/s"),
    { type: "bool", nom: "pauseOnHover", libelle: "Pause au survol", defaut: true },
  ],
  "scroll-marquee": [
    N("drift", "Dérive", 0, 200, 2, 44, "px/s"),
    N("skew", "Cisaillement", 0, 10, 0.2, 2.6, "°"),
    N("smoothing", "Lissage", 0.02, 0.5, 0.01, 0.1),
  ],
  cursor: [
    N("lerp", "Suivi", 0.05, 1, 0.01, 0.2),
    N("hoverScale", "Grossissement", 1, 6, 0.1, 2.6, "×"),
  ],
  confetti: [
    N("count", "Nombre", 10, 300, 10, 50),
    N("spread", "Étalement", 50, 500, 10, 200, "px"),
  ],
  halftone: [
    N("cols", "Colonnes", 8, 120, 4, 48),
    N("steps", "Paliers", 2, 12, 1, 4),
    N("gamma", "Gamma", 0.1, 2, 0.05, 0.45),
  ],
  graph: [
    N("autoCycle", "Cycle auto", 0, 5000, 100, 1900, "ms"),
    N("settleVisible", "Stabilisation", 10, 300, 10, 90),
  ],
  blinds: [
    N("count", "Lames", 2, 20, 1, 6),
    N("stagger", "Décalage", 0, 300, 5, 55, "ms"),
    N("duration", "Durée", 100, 2000, 50, 650, "ms"),
  ],
  "brush-underline": [
    N("duration", "Durée", 200, 3000, 50, 1100, "ms"),
    N("delay", "Retard", 0, 1500, 50, 180, "ms"),
    N("weight", "Épaisseur", 0.1, 2, 0.05, 0.5),
  ],
  loader: [
    N("holdMs", "Maintien", 200, 3000, 100, 1100, "ms"),
    N("exitMs", "Sortie", 200, 2000, 50, 700, "ms"),
  ],
  flight: [
    N("duration", "Durée", 200, 2500, 50, 900, "ms"),
    N("arc", "Arc", 0, 1, 0.02, 0.18),
    N("scale", "Échelle d'arrivée", 0.1, 1.5, 0.05, 0.6),
  ],
  expand: [
    N("maxDuration", "Durée max", 0.05, 1, 0.01, 0.18, "s"),
    N("reverseSpeed", "Vitesse retour", 0.5, 3, 0.1, 1.6, "×"),
  ],
  "smooth-scroll": [
    N("lerp", "Lissage", 0.01, 0.5, 0.01, 0.1),
    N("wheelMultiplier", "Molette", 0.2, 3, 0.1, 1, "×"),
  ],
  "text-highlight": [
    N("duration", "Durée d'une bande", 50, 2000, 25, 350, "ms"),
    N("stagger", "Décalage entre lignes", 0, 300, 5, 30, "ms"),
  ],
  lightbox: [
    N("duration", "Durée d'ouverture", 0.2, 2, 0.05, 0.8, "s"),
    N("closeSpeed", "Vitesse de fermeture", 0.5, 3, 0.1, 1.5, "×"),
  ],
};

/** Les réglages d'une famille, ou rien si elle n'en expose pas. */
export function reglagesDe(nom: string): Reglage[] {
  return REGLAGES[nom] ?? [];
}

export const catalogue: Fiche[] = [
  {
    nom: "reveal",
    geometrie: "bloc",
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
    geometrie: "carre",
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
    geometrie: "carre",
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
    geometrie: "bande",
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
    geometrie: "bande",
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
    geometrie: "bande",
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
    geometrie: "carre",
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
    geometrie: "carre",
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
    geometrie: "carre",
    categorie: "pointeur",
    titre: "Cursor",
    accroche: "Un curseur additif, qui augmente le curseur système sans le remplacer.",
    provenance: "Cursor — portfolio · Curseur — Bât-et-Verre 3D",
    apport:
      "Deux formes récoltées dans deux projets, et le choix n'est pas cosmétique : le disque écrase ce qu'il survole, le point ne masque rien. Le suivi du pointeur est mutualisé — un seul écouteur pour toute la page, quel que soit le nombre d'effets qui s'en servent.",
    options: [
      { nom: "variant", type: "blob · dot-ring", defaut: "blob", role: "Forme du curseur." },
      { nom: "lerp", type: "number", defaut: "0.2", role: "Rattrapage par frame, entre 0 et 1." },
      { nom: "hoverScale", type: "number", defaut: "2.6", role: "Agrandissement au survol." },
      { nom: "hoverSelector", type: "string", defaut: "a, button, input…", role: "Ce qui déclenche l'agrandissement." },
    ],
    usage: `/* Une seule fois, dans le layout racine : */
<Cursor />

/* Le curseur système reste visible — Nova l'augmente. */`,
    voie: "option",
    formes: [
      {
        id: "blob",
        nom: "Disque",
        note: "Un disque unique qui suit en retard et grossit sur ce qui se clique. Il écrase ce qu'il survole — à réserver aux pages aérées.",
      },
      {
        id: "dot-ring",
        nom: "Point et anneau",
        note: "Un point posé exactement sur le pointeur, et un anneau qui traîne derrière. Le point dit où l'on est, l'anneau d'où l'on vient. Sur une interface dense, c'est la seule forme lisible : le point ne masque rien.",
      },
    ],
  },
  {
    nom: "confetti",
    geometrie: "carre",
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
    geometrie: "carre",
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
    geometrie: "bloc",
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
  {
    nom: "blinds",
    geometrie: "bloc",
    titre: "Blinds",
    categorie: "defilement",
    nouveau: true,
    accroche: "Le contenu apparaît derrière des lames qui se retirent une à une.",
    provenance: "Claustra — Bât-et-Verre",
    apport:
      "C'est un frère de Reveal, pas une de ses formes : il faut injecter des lames, les mesurer, les décaler, et personne qui veut un simple fondu ne devrait embarquer ce code. Même règle d'or que partout — en mouvement réduit, sans JavaScript, ou pour un bloc déjà à l'écran, aucune lame n'est posée du tout.",
    voie: "option",
    formes: [
      { id: "vertical", nom: "Colonnes", note: "Des lames verticales, comme un calepinage qu'on démonte. Le motif d'origine." },
      { id: "horizontal", nom: "Rangs", note: "Des lames horizontales, qui se retirent latéralement. Convient aux blocs larges et bas." },
    ],
    options: [
      { nom: "count", type: "number", defaut: "6", role: "Nombre de lames." },
      { nom: "orientation", type: "vertical · horizontal", defaut: "vertical", role: "Sens des lames." },
      { nom: "retract", type: "up · down · left · right", defaut: "déduit", role: "Vers où la lame se retire." },
      { nom: "stagger", type: "number", defaut: "55", role: "Décalage entre deux lames, en ms." },
      { nom: "duration", type: "number", defaut: "650", role: "Durée du retrait d'une lame." },
      { nom: "color", type: "string", defaut: "fond hérité", role: "Couleur des lames." },
    ],
    usage: `<Blinds count={6} className="aspect-video">
  <img src="/verriere.jpg" alt="" />
</Blinds>`,
  },
  {
    nom: "brush-underline",
    geometrie: "bande",
    titre: "Brush Underline",
    categorie: "texte",
    nouveau: true,
    accroche: "Un trait de marqueur derrière un mot.",
    provenance: "BrushUnderline — générateur de CV",
    apport:
      "Le trait n'est pas une forme CSS : c'est un chemin SVG passé dans un feTurbulence et un feDisplacementMap, qui rongent ses bords au bruit fractal. Une seconde turbulence, plus fine, mange des trous dans la masse — le remplissage devient une brosse sèche, pas un aplat. Deux ajouts sur l'original : le rognage est posé sur l'enveloppe et jamais sur les chemins, sans quoi le filtre se recalcule à chaque image et les bords grésillent ; et la graine du bruit est un réglage, parce que deux traits identiques au pixel se lisent comme un tampon.",
    options: [
      { nom: "color", type: "string", defaut: "--nova-brush-color", role: "Couleur du trait. Un surligneur, pas l'accent : le texte se lit par-dessus." },
      { nom: "seed", type: "number", defaut: "9", role: "Graine du bruit. À varier d'une occurrence à l'autre." },
      { nom: "weight", type: "number", defaut: "0.5", role: "Épaisseur relative, entre 0 et 1." },
      { nom: "duration", type: "number", defaut: "1100", role: "Durée du tracé, en ms." },
      { nom: "delay", type: "number", defaut: "180", role: "Retard avant le tracé." },
      { nom: "trigger", type: "view · mount · manual", defaut: "view", role: "Quand tracer." },
    ],
    usage: `<h2>
  Rendre lisible <BrushUnderline seed={3}>ce qui ne l'est pas</BrushUnderline>.
</h2>`,
  },
  {
    nom: "loader",
    geometrie: "bloc",
    titre: "Loader",
    categorie: "effets",
    nouveau: true,
    accroche: "Le rideau d'ouverture, en trois formes.",
    provenance: "Loader — Bât-et-Verre · PageLoader — portfolio · AppSplash — générateur de CV · SiteLoader — Champlon",
    apport:
      "Trois rideaux récoltés dans trois projets, qui ne se ressemblent pas mais partagent tout ce qui compte. Quatre garde-fous, tous non négociables : il se saute à la première interaction, il ne rejoue pas dans la même session, il n'existe pas en mouvement réduit — pas « plus court », absent — et sans JavaScript il n'y a pas de rideau du tout, donc jamais de page bloquée derrière un voile qui ne se lèvera pas.",
    voie: "option",
    formes: [
      { id: "blades", nom: "Lames", note: "Un rideau de lames qui se retirent l'une après l'autre. Le décalage fait le calepinage — un rideau qui tombe d'un bloc n'a pas de matière." },
      { id: "greetings", nom: "Salutations", note: "Un mot d'accueil qui défile en vingt langues, puis s'efface. Il dit qu'on est arrivé quelque part, pas qu'on attend." },
      { id: "splash", nom: "Pastille", note: "Rien ne bouge, le voile s'efface. Le plus sobre — celui d'une application installée, où le rideau ne doit surtout pas se faire remarquer." },
      { id: "seam", nom: "Liseré", note: "Le panneau se lève d'un bloc en laissant filer un liseré. Le liseré est ce qui reste du bord : sans lui, le panneau semble disparaître au lieu de se retirer." },
    ],
    options: [
      { nom: "form", type: "blades · greetings · splash · seam", defaut: "blades", role: "Forme du rideau." },
      { nom: "holdMs", type: "number", defaut: "1100", role: "Temps d'affichage avant la sortie." },
      { nom: "exitMs", type: "number", defaut: "700", role: "Durée de la sortie." },
      { nom: "skippable", type: "boolean", defaut: "true", role: "Une interaction termine le rideau." },
      { nom: "sessionKey", type: "string · null", defaut: "nova:loader", role: "Clé de session. null le fait rejouer à chaque montage." },
      { nom: "onDone", type: "() => void", defaut: "—", role: "Appelé à la fin, ou tout de suite s'il ne joue pas." },
    ],
    usage: `/* Une seule fois, dans le layout racine : */
<Loader form="blades" onDone={() => setPret(true)}>
  <p>Bât &amp; Verre — Maison de lumière</p>
</Loader>`,
  },
  {
    nom: "flight",
    geometrie: "carre",
    titre: "Flight",
    categorie: "effets",
    nouveau: true,
    accroche: "Un fantôme qui vole d'un élément vers un autre.",
    provenance: "FindingFlightLayer — générateur de CV · VisionneuseVerre — Bât-et-Verre",
    apport:
      "Le geste qui relie deux endroits d'une page : la preuve qui part du texte et rejoint sa marge, l'article qui rejoint le panier. Deux principes tenus des originaux. Rien ne vole depuis une source hors écran — un vol qu'on ne voit pas n'a aucun sens spatial, et le résultat le signale pour qu'on replie sur autre chose. Et le fantôme est inerte : cloné sans identifiants, hors de l'ordre de tabulation, hors de l'arbre d'accessibilité, parce qu'un doublon annonçable ferait entendre deux fois la même chose.",
    options: [
      { nom: "duration", type: "number", defaut: "900", role: "Durée du vol, en ms." },
      { nom: "arc", type: "number", defaut: "0.18", role: "Cambrure, en fraction de la distance. 0 donne une ligne droite." },
      { nom: "scale", type: "number", defaut: "0.6", role: "Échelle à l'arrivée." },
      { nom: "ghost", type: "HTMLElement", defaut: "clone de la source", role: "Faire voler autre chose que ce qu'on montre." },
      { nom: "onArrive", type: "() => void", defaut: "—", role: "Appelé à l'arrivée, ou tout de suite si le vol n'a pas lieu." },
    ],
    usage: `const voler = useFlight({ duration: 700 });

const { flew } = await voler(source, marge);
if (!flew) afficherUneNotification(); /* la source était hors écran */`,
  },
  {
    nom: "expand",
    geometrie: "bloc",
    titre: "Expand",
    categorie: "effets",
    nouveau: true,
    accroche: "Une ligne qui devient un panneau, sans que la substitution se voie.",
    provenance: "useExpandTransition — CRM Closer",
    apport:
      "React remplace un arbre par l'autre en une image : la ligne disparaît pendant que l'en-tête apparaît, et c'est cette substitution qu'on lit comme un à-coup. Le geste tient en deux temps — la boîte s'étire et les pièces communes glissent (GSAP Flip), puis un voile se retire et TOUT LE RESTE SE DÉDUIT DE SON BORD. Un fondu du clair vers le sombre passerait par le gris : à mi-chemin le fond et le texte se retrouvent à la même valeur, et le texte disparaît. Un bord ne mélange rien. C'est aussi ce qui donne son calendrier au geste : on ne règle pas dix retards à la main, on les lit sur une règle. Un seul geste est décrit, et le repli le rejoue à l'envers — tant que les deux divergeaient, le repli ramenait un à un les défauts retirés de l'ouverture.",
    options: [
      { nom: "minDuration", type: "number", defaut: "0.13", role: "Durée minimale, en s." },
      { nom: "maxDuration", type: "number", defaut: "0.18", role: "Durée maximale. Elle s'étire avec la distance parcourue." },
      { nom: "veilStart", type: "number", defaut: "0.2", role: "Où le voile part dans le geste, en fraction." },
      { nom: "veilDuration", type: "number", defaut: "0.1", role: "Durée de la descente du voile, en s." },
      { nom: "reverseSpeed", type: "number", defaut: "1.6", role: "Accélération du repli. Ce qui s'en va n'a pas à se faire attendre." },
    ],
    usage: `const { ref, capture, shown } = useExpand(ouvert);

<div ref={ref}>
  <header onClick={() => { capture(); setOuvert((v) => !v); }}>
    {shown ? <span data-nova-veil /> : null}
    <span data-nova-flip-id="titre">{titre}</span>
    {shown ? <p data-nova-reveal>{detail}</p> : null}
    <span data-nova-spin><Chevron /></span>
  </header>
</div>`,
  },
  {
    nom: "smooth-scroll",
    geometrie: "bande",
    titre: "Smooth Scroll",
    categorie: "defilement",
    nouveau: true,
    accroche: "Le défilement lissé, branché sur la boucle de Nova.",
    provenance: "SmoothScroll — quatre projets sur huit, toujours avec Lenis",
    apport:
      "Trois différences avec un montage direct de Lenis. La boucle est celle de Nova : Lenis ouvre sa propre requestAnimationFrame par défaut, ici il partage le ticker de la librairie — une seule boucle pour le défilement, les compteurs, le curseur et les bandeaux. Le tactile reste natif : lisser un défilement au doigt lui retire l'inertie du système, celle que l'utilisateur connaît, pour la remplacer par une autre. Et rien n'est monté en mouvement réduit — pas « moins lissé », absent : le défilement natif est ce que le réglage demande.",
    options: [
      { nom: "lerp", type: "number", defaut: "0.1", role: "Rattrapage par image. Plus bas, plus glissant." },
      { nom: "wheelMultiplier", type: "number", defaut: "1", role: "Multiplicateur de la molette." },
      { nom: "smoothTouch", type: "boolean", defaut: "false", role: "Lisser aussi le tactile. L'inertie du système est meilleure." },
      { nom: "orientation", type: "vertical · horizontal", defaut: "vertical", role: "Sens du défilement." },
    ],
    usage: `/* Une seule fois, dans le layout racine : */
<SmoothScroll lerp={0.1}>
  {children}
</SmoothScroll>`,
  },
  {
    nom: "scroll-scene",
    geometrie: "bloc",
    titre: "Scroll Scene",
    categorie: "defilement",
    nouveau: true,
    accroche: "Une scène dont le défilement fournit le temps.",
    provenance: "DataStory et SessionFlow — site Champlon",
    apport:
      "Les deux originaux calculaient la même progression, à la ligne près. Ce que le moteur ajoute, ce sont les TEMPS : un récit scrollé n'a jamais une seule progression, il en a dix, chacune sur sa portion de la traversée. Les écrire à la main donne dix clamp() en CSS, illisibles et impossibles à ajuster ; ici chaque temps est nommé et publié comme sa propre variable. Trois garde-fous : la mesure se fait dans l'image d'animation et jamais dans un écouteur de défilement, la boucle ne tourne que tant que la scène est à l'écran, et en mouvement réduit la progression est posée une fois à l'état d'arrivée — une scène figée à zéro serait une page vide.",
    options: [
      { nom: "beats", type: "Record<string, [number, number]>", defaut: "—", role: "Temps nommés : début et fin sur la traversée, publiés de 0 à 1." },
      { nom: "pulses", type: "Record<string, [number, number, number]>", defaut: "—", role: "Pulsations : début, sommet, fin. Pour ce qui monte puis redescend." },
      { nom: "easing", type: "Easing", defaut: "smootherstep", role: "Courbe de --nova-t-eased." },
      { nom: "restingProgress", type: "number", defaut: "1", role: "Valeur en mouvement réduit. L'état d'arrivée." },
      { nom: "onProgress", type: "(t: number) => void", defaut: "—", role: "Pour ce que le CSS ne sait pas faire." },
    ],
    usage: `<ScrollScene
  className="h-[300vh]"
  beats={{ arrivee: [0.1, 0.4], stockage: [0.45, 0.8] }}
  pulses={{ paquet: [0.2, 0.5, 0.8] }}
>
  <div style={{ opacity: "var(--nova-arrivee)" }}>Le premier temps.</div>
  <div style={{ transform: "scale(var(--nova-paquet))" }}>Le paquet.</div>
</ScrollScene>`,
  },
  {
    nom: "text-highlight",
    geometrie: "bande",
    titre: "Text Highlight",
    categorie: "texte",
    nouveau: true,
    accroche: "Surligne un passage dans du contenu déjà rendu.",
    provenance: "PhraseHighlight — générateur de CV",
    apport:
      "Une bande PAR LIGNE VISUELLE, pas un rectangle autour du bloc : les bandes épousent le texte, y compris quand il se casse sur trois lignes ou traverse plusieurs balises. Le passage n'a pas besoin d'être balisé — il est retrouvé dans le DOM. Deux difficultés traitées : le texte rendu n'est pas le texte source, donc on aplatit le sous-arbre en une chaîne normalisée avec une table qui ramène chaque caractère à son nœud ; et la mise en page bouge après le montage, ce que l'original relevait toutes les 800 ms — ici on écoute ce qui bouge réellement, le redimensionnement, l'arrivée des polices, et les mutations du sous-arbre.",
    options: [
      { nom: "text", type: "string", defaut: "—", role: "Le passage à retrouver. Casse et blancs ignorés." },
      { nom: "className", type: "string", defaut: "—", role: "Classes posées sur les BANDES. C'est là que vit la couleur." },
      { nom: "stagger", type: "number", defaut: "30", role: "Décalage entre deux lignes, en ms." },
      { nom: "duration", type: "number", defaut: "350", role: "Durée d'apparition d'une bande, en ms." },
      { nom: "padding", type: "[number, number]", defaut: "[2, 1]", role: "Débord horizontal et vertical de la bande." },
      { nom: "onMiss", type: "() => void", defaut: "—", role: "Passage introuvable. À vous de replier — le moteur ne devine pas." },
    ],
    usage: `<TextHighlight
  text="nous le pratiquons d'abord sur nous-mêmes"
  onMiss={() => surlignerLeBlocEntier()}
>
  <p>{contenu}</p>
</TextHighlight>`,
  },
  {
    nom: "lightbox",
    geometrie: "bloc",
    titre: "Lightbox",
    categorie: "effets",
    nouveau: true,
    accroche: "Une visionneuse qui jaillit du point cliqué.",
    provenance: "VisionneuseVerre — Bât-et-Verre",
    apport:
      "La division est celle de la doctrine du dépôt : Radix apporte la sémantique — piège de focus, Échap, verrou du défilement, ARIA, portail, retour du focus à ce qui a ouvert — et Nova n'apporte que le geste. Rien de tout cela n'est réimplémenté. La bulle naît là où la main était, grossit en ondulant, se fige en rectangle centré, puis son contenu se résout du flou vers le net ; la fermeture rejoue le même geste à l'envers, une fois et demie plus vite. Les rayons de coin sont tirés au hasard à chaque ouverture : deux clics de suite ne donnent jamais la même déformation, et le geste garde l'air d'une matière plutôt que d'une interpolation. La voie WebGL de l'original — un shader de verre avec réfraction — n'est pas reprise : elle appartient à cette maison-là.",
    options: [
      { nom: "origin", type: "{ x, y }", defaut: "—", role: "Point d'où la bulle jaillit. Relevé au clic sur la vignette." },
      { nom: "aspect", type: "number", defaut: "3 / 2", role: "Rapport du panneau final." },
      { nom: "maxHeight", type: "number", defaut: "0.82", role: "Fraction de la hauteur de fenêtre occupée au plus." },
      { nom: "seed", type: "number", defaut: "46", role: "Diamètre de la bulle de départ, en px." },
      { nom: "duration", type: "number", defaut: "0.8", role: "Durée de l'ouverture, en s." },
      { nom: "closeSpeed", type: "number", defaut: "1.5", role: "Accélération de la fermeture." },
    ],
    usage: `<Lightbox
  open={ouvert}
  onOpenChange={setOuvert}
  origin={point}
  aspect={16 / 9}
  title="Verrière de l'atelier"
>
  <img data-nova-bloom-media src={src} alt="" />
  <figcaption data-nova-bloom-late>{legende}</figcaption>
</Lightbox>`,
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
