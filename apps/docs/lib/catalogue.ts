/**
 * Catalogue du site — métadonnées de présentation.
 *
 * Le registry (`registry/registry.json`) reste la source de vérité de ce qui
 * s'installe ; ce fichier ne porte que ce qui se raconte : l'accroche, les
 * options, l'exemple d'usage.
 *
 * Une exception, et une seule : le drapeau `valide`. Il dit si une famille
 * SORT — sur le site comme par la CLI. Il vit ici parce qu'une famille se
 * valide sur ce qu'on en montre, et que `scripts/build-registry.ts` vient le
 * lire pour n'embarquer que les validées dans le registry distribué.
 */

export interface OptionRow {
  nom: string;
  type: string;
  defaut: string;
  role: string;
}

/**
 * Familles du catalogue. L'ordre déclaré ici est celui de la barre latérale.
 *
 * La `description` sert l'index : chaque section y porte une phrase qui dit ce
 * qu'elle rassemble. Sans elle, six titres se succèdent sans qu'on sache
 * lequel contient ce qu'on cherche — « Effets » et « Rendu » ne se distinguent
 * pas d'eux-mêmes.
 */
export const CATEGORIES = [
  {
    id: "texte",
    label: "Animations de texte",
    description:
      "Ce qui arrive à un mot, à une ligne, à un paragraphe : décodage, découpe, surlignage, soulignement. Le texte reste lisible avant, pendant et après.",
  },
  {
    id: "defilement",
    label: "Défilement",
    description:
      "Ce que la molette entraîne, et ce qui paraît quand un bloc entre dans l'écran. Rien ne se masque qui ne saurait pas se démasquer.",
  },
  {
    id: "pointeur",
    label: "Pointeur",
    description:
      "Ce qui répond au curseur, et rien d'autre. Ces composants ne jouent pas tout seuls : leur effet EST le geste du visiteur.",
  },
  {
    id: "donnees",
    label: "Données",
    description:
      "Des chiffres, des dates et des relations mis en mouvement sans cesser d'être justes : la valeur finale est écrite dès le premier rendu.",
  },
  {
    id: "rendu",
    label: "Rendu",
    description:
      "Ce qui se calcule pixel par pixel, sur un canevas plutôt que dans le DOM. Aucune ressource à charger : la matière est calculée.",
  },
  {
    id: "effets",
    label: "Effets",
    description:
      "Le reste, et le plus ambitieux : rideaux d'ouverture, panneaux qui se substituent, vols d'un point à un autre, célébrations.",
  },
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
  /**
   * Les props qui produisent cette forme, quand `formeProp` ne suffit pas.
   *
   * Le cas courant est une famille qui bascule sur UNE prop dont l'`id` de la
   * forme est la valeur — `variant="mask"`, `effect="blur"` : `formeProp` le
   * dit une fois pour toute la famille. Les voies `usage`, elles, ne
   * basculent pas sur une prop : « à intervalle » est `trigger` ET `interval`,
   * et une forme de `DatePicker` est `granularity` ET `startWith`. Ces
   * familles écrivent donc leurs props ici, forme par forme.
   */
  props?: Record<string, string | number | boolean>;
}

export interface Fiche {
  nom: string;
  titre: string;
  categorie: CategorieId;
  accroche: string;
  /** Ce que la version Nova corrige par rapport aux implémentations d'origine. */
  apport: string;
  options: OptionRow[];
  usage: string;
  /** Par quelle voie la famille se décline. */
  voie?: "option" | "usage" | "frere";
  /** Les formes de la famille. Absent quand il n'y en a qu'une. */
  formes?: Forme[];
  /**
   * La prop que le sélecteur de formes pilote, quand il n'y en a qu'une.
   *
   * L'`id` de la forme en est alors la valeur : `formeProp: "variant"` sur
   * Reveal signifie que la forme `mask` s'écrit `variant="mask"`. C'est ce qui
   * permet au bloc d'usage de suivre la scène — voir `lib/code-vivant.ts`.
   * Absent sur les voies `usage`, où la forme n'est pas une prop : ces
   * familles écrivent leurs props sur chaque forme.
   */
  formeProp?: string;
  /**
   * La famille est validée : Nova la distribue.
   *
   * ABSENT PAR DÉFAUT, et c'est tout l'intérêt. Une famille récoltée mais pas
   * encore relue n'existe ni sur la vitrine ni pour la CLI : elle n'a pas de
   * fiche, pas d'entrée dans la barre, pas de ligne dans `llms.txt`, et
   * `npx novaui add <nom>` ne la trouve pas. Poser ce drapeau est un geste,
   * pris en relecture de différence, pas un état qu'on atteint par accumulation.
   *
   * Le drapeau porte les deux surfaces à la fois — `catalogue` filtre là-dessus
   * et `scripts/build-registry.ts` lit la même liste — parce que deux listes
   * finissent toujours par diverger, et que la divergence se solde ici par une
   * fiche dont la commande d'installation échoue.
   *
   * Ce qui n'est pas validé reste sur `/banc`, qui rend `familles` : c'est là
   * qu'on juge un candidat, et le banc est absent de la production.
   */
  valide?: boolean;
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
    }
  | {
      /**
       * Un texte libre, écrit par le visiteur.
       *
       * Sur une famille dont la matière EST le texte, une phrase imposée ne
       * dit qu'une chose : ce que l'effet fait sur CETTE phrase. Le visiteur
       * veut y voir la sienne — son titre, son nom de produit, sa langue —
       * parce que c'est la seule façon de savoir si l'effet tient sur un mot
       * de vingt lettres ou sur une ligne de trois mots.
       */
      type: "texte";
      nom: string;
      libelle: string;
      defaut: string;
      /** Longueur maximale. Une scène de démonstration n'est pas un éditeur. */
      max?: number;
    }
  | {
      /**
       * Une courbe d'accélération, choisie sur sa VIGNETTE.
       *
       * Elle a son type à elle, et non `choix`, parce qu'elle est la seule
       * option qu'on ne peut pas comprendre en lisant son nom : « ease-in » et
       * « ease-out » se retiennent à l'envers une fois sur deux, et
       * `cubic-bezier(0.34, 1.56, 0.64, 1)` ne dit rien à personne. Le panneau
       * en trace donc le dessin à côté du nom.
       */
      type: "courbe";
      nom: string;
      libelle: string;
      /**
       * Le vocabulaire que le moteur comprend, et les deux ne se recouvrent
       * pas. `css` pour les moteurs qui laissent la feuille de style animer et
       * prennent une chaîne ; `js` pour ceux qui interpolent eux-mêmes et
       * prennent le nom d'une courbe de `internal/easing.ts` — une chaîne CSS
       * ne s'évalue pas dans une boucle. Voir `lib/courbes.ts`.
       */
      vocabulaire: "css" | "js";
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

/** Un champ de texte libre. */
const T = (
  nom: string,
  libelle: string,
  defaut: string,
  max = 80,
): Reglage => ({ type: "texte", nom, libelle, defaut, max });

/** Un sélecteur de courbe. `EXPO` est la signature de Nova, donc le défaut. */
const EXPO = "cubic-bezier(0.16, 1, 0.3, 1)";
const C = (
  vocabulaire: "css" | "js",
  defaut: string,
  nom = "easing",
  libelle = "Courbe",
): Reglage => ({ type: "courbe", nom, libelle, vocabulaire, defaut });

/** Les réglages par famille. Le nom de la clé est le NOM DE LA PROP réelle. */
export const REGLAGES: Record<string, Reglage[]> = {
  reveal: [
    N("duration", "Durée", 100, 2000, 50, 700, "ms"),
    N("stagger", "Décalage", 0, 400, 10, 80, "ms"),
    C("css", EXPO),
  ],
  "scramble-text": [
    T("text", "Votre texte", "INCANDESCENCE", 40),
    N("stepMs", "Durée d'un pas", 10, 200, 2, 52, "ms"),
    N("scrambleSteps", "Pas brouillés", 1, 20, 1, 6),
    N("interval", "Rejeu auto", 0, 10000, 500, 5000, "ms"),
  ],
  counter: [
    N("duration", "Durée", 200, 5000, 100, 1500, "ms"),
    N("decimals", "Décimales", 0, 3, 1, 0),
    /* Vocabulaire JS : le compteur interpole lui-même dans le ticker, il ne
       peut rien faire d'une chaîne CSS. */
    C("js", "expoOut"),
  ],
  "text-effect": [
    T("text", "Votre texte", "Le texte reste lisible, puis il s'anime"),
    N("duration", "Durée", 200, 3000, 50, 900, "ms"),
    C("css", EXPO),
  ],
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
    C("css", EXPO),
  ],
  "brush-underline": [
    N("duration", "Durée", 200, 3000, 50, 1100, "ms"),
    N("delay", "Retard", 0, 1500, 50, 180, "ms"),
    N("weight", "Épaisseur", 0.1, 2, 0.05, 0.5),
  ],
  /* Les défauts sont ceux de la DÉMONSTRATION, pas ceux de la librairie
     (1100 / 700 / 200) : sur une vraie page on traverse un rideau, sur une
     fiche on le regarde. Ils doivent rester alignés sur les valeurs codées
     dans `DemoLoader` — ce sont ces réglages-ci qui gagnent sur la fiche, et
     celles-là qui servent en grille. */
  /* `blades` a pris la place de `stepMs` le jour où dix chorégraphies de lames
     sont arrivées : il pilote désormais dix formes sur treize, contre une
     seule pour la cadence des mots. Trois curseurs restent le plafond du
     catalogue — un panneau qui déborde ne se règle plus, il se subit. */
  /* `value` en curseur : c'est LA démonstration de cette famille — on scrube
     la jauge à la main et on voit ce que chaque forme fait d'une valeur. Un
     bouton « rejouer » ne montrerait qu'une course, toujours la même. */
  progress: [
    N("value", "Valeur", 0, 1, 0.01, 0.62),
    N("steps", "Pièces", 4, 48, 1, 28),
    N("duration", "Rattrapage", 0, 1200, 20, 320, "ms"),
  ],
  loader: [
    N("holdMs", "Maintien", 400, 4000, 100, 1800, "ms"),
    N("exitMs", "Sortie", 300, 2500, 50, 1000, "ms"),
    N("blades", "Lames", 2, 16, 1, 6),
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
  "date-picker": [
    N("dialDuration", "Durée d'une course", 100, 1200, 20, 420, "ms"),
    N("dialFalloff", "Profondeur du cadran", 1, 6, 0.1, 2.6, "items"),
  ],
  /* En SECONDES, comme les autres moteurs GSAP du dépôt — et pas en ms comme
     les moteurs CSS. La valeur du réglage part telle quelle dans la prop : une
     unité affichée qui ne serait pas celle du moteur ferait mentir le panneau
     ET le bloc de code qu il alimente. */
  "flip-list": [
    N("duration", "Durée", 0.1, 1.5, 0.05, 0.45, "s"),
    N("stagger", "Décalage", 0, 0.12, 0.005, 0.02, "s"),
  ],
};

/** Les réglages d'une famille, ou rien si elle n'en expose pas. */
export function reglagesDe(nom: string): Reglage[] {
  return REGLAGES[nom] ?? [];
}

/**
 * Ce que la CLI installe EN PLUS, par famille. Voir DEPENDANCES.md.
 *
 * Cette table vivait dans la page de fiche, où seule la fiche pouvait la lire.
 * Elle est ici parce que trois surfaces en ont besoin — la fiche, le markdown
 * servi aux agents, et l'index `llms.txt` — et qu'une liste de dépendances
 * recopiée à trois endroits finit par mentir à deux.
 */
export const DEPENDANCES: Record<string, string[]> = {
  expand: ["gsap"],
  lightbox: ["gsap", "radix-ui"],
  "smooth-scroll": ["lenis"],
  "date-picker": ["radix-ui", "react-day-picker"],
  progress: ["radix-ui"],
};

/** Les dépendances d'une famille. Vide quand le moteur suffit. */
export function dependancesDe(nom: string): string[] {
  return DEPENDANCES[nom] ?? [];
}

/**
 * Toutes les familles déclarées, validées ou non.
 *
 * C'est la liste de travail : elle contient ce que le dépôt sait faire. Ce
 * n'est PAS ce que le site montre ni ce que la CLI installe — voir `catalogue`
 * juste après. Le banc rend celle-ci, parce qu'on ne peut pas juger ce qu'on
 * ne voit pas.
 */
export const familles: Fiche[] = [
  {
    nom: "reveal",
    valide: true,
    geometrie: "bloc",
    categorie: "defilement",
    titre: "Reveal",
    accroche: "Apparition au scroll, sans jamais rien laisser masqué.",
    apport:
      "Le décalage d'un groupe se calcule depuis le DOM au lieu de cloner les enfants React : un enfant enveloppé dans un autre composant participe désormais au rythme.",
    options: [
      { nom: "variant", type: "fade · slide-up · slide-down · slide-left · slide-right · mask · scale", defaut: "slide-up", role: "Nature de l'apparition." },
      { nom: "duration", type: "number", defaut: "700", role: "Durée en ms (1100 pour mask)." },
      { nom: "delay", type: "number", defaut: "0", role: "Retard en ms." },
      { nom: "distance", type: "string", defaut: "1.5rem", role: "Amplitude du déplacement." },
      { nom: "repeat", type: "boolean", defaut: "false", role: "Rejouer à chaque entrée en vue." },
      { nom: "stagger", type: "number", defaut: "80", role: "RevealGroup — décalage entre enfants, en ms." },
      { nom: "easing", type: "string", defaut: "cubic-bezier(0.16, 1, 0.3, 1)", role: "Courbe d'accélération, en syntaxe CSS." },
    ],
    usage: `<Reveal variant="mask" duration={1100} easing="cubic-bezier(0.16, 1, 0.3, 1)">
  <img src="/atelier.jpg" alt="" />
</Reveal>

<RevealGroup stagger={80}>
  <article>Première</article>
  <article>Deuxième</article>
  <article>Troisième</article>
</RevealGroup>`,
    voie: "option",
    formeProp: "variant",
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
    valide: true,
    geometrie: "carre",
    categorie: "texte",
    titre: "Scramble Text",
    accroche: "Le texte se brouille, puis se décode lettre par lettre.",
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
<ScrambleText text="DÉCODER" trigger="hover" stepMs={52} scrambleSteps={6} />

/* À intervalle — le décodage est un signal de fond : */
<ScrambleText text="RÉFÉRENTIELS" trigger="view" interval={6000} />

/* Les caractères brouillés prennent --nova-accent : */
:root { --nova-accent: #ff5b1f; }`,
    voie: "usage",
    formes: [
      {
        id: "hover",
        nom: "Au survol",
        note: "Le décodage répond à un geste : le texte est stable, c'est le lecteur qui le provoque. C'est l'usage d'un lien ou d'un titre : on décode ce qu'on vise.",
        props: { trigger: "hover", interval: 0 },
      },
      {
        id: "interval",
        nom: "À intervalle",
        note: "Le décodage se rejoue seul tant que le texte est à l'écran. Il n'attend rien de personne : une étiquette qui se redéchiffre, un signal de fond. C'est l'usage d'un badge d'état ou d'un compteur qui vit tout seul.",
        props: { trigger: "view", interval: 5000 },
      },
    ],
  },
  {
    nom: "counter",
    valide: true,
    geometrie: "carre",
    categorie: "donnees",
    titre: "Counter",
    accroche: "Un nombre qui compte jusqu'à sa valeur, sans rien bousculer.",
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
      { nom: "easing", type: "nom de courbe · fonction", defaut: "expoOut", role: "Courbe d'accélération. Le compteur interpole en JavaScript : il prend un nom de courbe, pas une chaîne CSS." },
    ],
    usage: `<Counter to={12480} locale="fr-FR" suffix=" €" />
<Counter to={99.4} decimals={1} suffix=" %" duration={2000} easing="expoOut" />`,
    voie: "usage",
    formes: [
      {
        id: "brut",
        nom: "Brut",
        note: "Le nombre nu. Aucun séparateur, aucune locale — pour un identifiant ou un compte technique.",
        props: {},
      },
      {
        id: "localise",
        nom: "Localisé",
        note: "Séparateurs de milliers et décimales selon la locale. Pour tout chiffre qu'un lecteur doit pouvoir lire d'un coup.",
        props: { locale: "fr-FR" },
      },
      {
        id: "monetaire",
        nom: "Monétaire",
        note: "Devise, via les options Intl. La place est réservée dès le premier rendu, symbole compris.",
        props: { locale: "fr-FR", currency: "EUR" },
      },
    ],
  },
  {
    nom: "text-effect",
    valide: true,
    geometrie: "bande",
    categorie: "texte",
    nouveau: true,
    titre: "Text Effect",
    accroche: "Dix-sept traitements de texte animé, sur un seul primitif.",
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
    usage: `<TextEffect
  as="h1"
  text="Le texte reste lisible"
  effect="line"
  duration={900}
  easing="cubic-bezier(0.16, 1, 0.3, 1)"
/>
<TextEffect text="NOVA" effect="wave" />

/* Au défilement — aucune durée, c'est la molette qui donne le temps : */
<TextEffect as="p" text={manifeste} effect="reading" />`,
    voie: "option",
    formeProp: "effect",
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
    valide: true,
    geometrie: "bande",
    categorie: "defilement",
    titre: "Marquee",
    accroche: "Un bandeau qui défile sans fin, à vitesse constante. Horizontal ou vertical.",
    apport:
      "La vitesse est en pixels par seconde, pas en durée fixe : deux bandeaux réglés pareil défilent au même rythme, quelle que soit la longueur de leur contenu. Le contenu est répété jusqu'à dépasser le conteneur — sans quoi la boucle laisse un trou, le défaut le plus visible sur l'axe vertical. Et hors écran l'animation est SUSPENDUE, pas coupée : elle reprend où elle s'était arrêtée au lieu de repartir du début.",
    options: [
      { nom: "speed", type: "number", defaut: "60", role: "Vitesse en px/s." },
      { nom: "direction", type: "left · right · up · down", defaut: "left", role: "Sens. up et down basculent l'axe." },
      { nom: "pauseOnHover", type: "boolean", defaut: "false", role: "Suspendre au survol." },
      { nom: "pauseOffscreen", type: "boolean", defaut: "true", role: "Suspendre quand le bandeau sort de l'écran." },
      { nom: "gap", type: "string", defaut: "0px", role: "Écart entre deux copies." },
    ],
    usage: `<Marquee speed={80} gap="3rem" pauseOnHover>
  <span>MOUVEMENT</span>
  <span>MESURE</span>
</Marquee>

/* Colonne de texture, à la verticale : */
<Marquee direction="up" speed={42} className="h-80">
  {referentiels.map((r) => <span key={r}>{r}</span>)}
</Marquee>`,
    voie: "option",
    formeProp: "direction",
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
    valide: true,
    geometrie: "bande",
    categorie: "defilement",
    nouveau: true,
    titre: "Scroll Marquee",
    accroche: "Un bandeau que la molette entraîne.",
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
    usage: `<ScrollMarquee drift={44} skew={2.6} smoothing={0.1} gap="2rem">
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
    valide: true,
    geometrie: "carre",
    categorie: "texte",
    nouveau: true,
    titre: "Roll Text",
    accroche: "Un label qui pivote sur lui-même au survol.",
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
    valide: true,
    geometrie: "carre",
    categorie: "pointeur",
    nouveau: true,
    titre: "Spotlight",
    accroche: "Un halo de repérage qui suit le curseur dans un panneau.",
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
    valide: true,
    geometrie: "carre",
    categorie: "pointeur",
    titre: "Cursor",
    accroche: "Un curseur additif, qui augmente le curseur système sans le remplacer.",
    apport:
      "Deux formes récoltées dans deux projets, et le choix n'est pas cosmétique : le disque écrase ce qu'il survole, le point ne masque rien. Le suivi du pointeur est mutualisé — un seul écouteur pour toute la page, quel que soit le nombre d'effets qui s'en servent.",
    options: [
      { nom: "variant", type: "blob · dot-ring", defaut: "blob", role: "Forme du curseur." },
      { nom: "lerp", type: "number", defaut: "0.2", role: "Rattrapage par frame, entre 0 et 1." },
      { nom: "hoverScale", type: "number", defaut: "2.6", role: "Agrandissement au survol." },
      { nom: "hoverSelector", type: "string", defaut: "a, button, input…", role: "Ce qui déclenche l'agrandissement." },
    ],
    usage: `/* Une seule fois, dans le layout racine : */
<Cursor lerp={0.2} hoverScale={2.6} />

/* Le curseur système reste visible — Nova l'augmente. */`,
    voie: "option",
    formeProp: "variant",
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
    valide: true,
    geometrie: "carre",
    categorie: "effets",
    titre: "Confetti",
    accroche: "Une salve de particules, qui se nettoie derrière elle.",
    apport:
      "Les salves en cours sont interrompues au démontage : naviguer pendant la chute ne laisse plus de particules orphelines dans le body.",
    options: [
      { nom: "count", type: "number", defaut: "50", role: "Nombre de particules." },
      { nom: "colors", type: "string[]", defaut: "or / bronze", role: "Palette." },
      { nom: "origin", type: "{ x, y }", defaut: "haut de l'écran", role: "Point de départ de la salve." },
      { nom: "spread", type: "number", defaut: "200", role: "Dispersion horizontale en px." },
      { nom: "shape", type: "circle · square · mixed", defaut: "mixed", role: "Forme des particules." },
    ],
    usage: `const tirer = useConfetti({
  count: 50,
  spread: 200,
  colors: ["#ff5b1f", "#e9e7e2"],
});

<button onClick={() => tirer()}>Célébrer</button>`,
    voie: "option",
    formeProp: "shape",
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
    valide: true,
    geometrie: "carre",
    categorie: "rendu",
    nouveau: true,
    titre: "Halftone",
    accroche: "Une trame d'imprimeur : la taille du module dit la valeur.",
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
    usage: `<Halftone
  alt="Portrait"
  source="/photo.jpg"
  cols={64}
  steps={4}
  gamma={0.45}
  pointerBoost={0.4}
/>

/* Une forme calculée — un disque : */
<Halftone
  alt=""
  cols={32}
  source={(x, y) => (Math.hypot(x - 0.5, y - 0.5) < 0.4 ? 1 : 0)}
/>`,
    voie: "option",
    formeProp: "shape",
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
    valide: true,
    geometrie: "bloc",
    categorie: "donnees",
    nouveau: true,
    titre: "Graph",
    accroche: "Un graphe dont le visuel n'est qu'une couche de présentation.",
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
  settleVisible={90}
/>`,
  },
  {
    nom: "blinds",
    valide: true,
    geometrie: "bloc",
    titre: "Blinds",
    categorie: "defilement",
    nouveau: true,
    accroche: "Le contenu apparaît derrière des lames qui se retirent une à une.",
    apport:
      "C'est un frère de Reveal, pas une de ses formes : il faut injecter des lames, les mesurer, les décaler, et personne qui veut un simple fondu ne devrait embarquer ce code. Même règle d'or que partout — en mouvement réduit, sans JavaScript, ou pour un bloc déjà à l'écran, aucune lame n'est posée du tout.",
    voie: "option",
    formeProp: "orientation",
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
      { nom: "easing", type: "string", defaut: "cubic-bezier(0.16, 1, 0.3, 1)", role: "Courbe d'accélération, en syntaxe CSS." },
    ],
    usage: `<Blinds count={6} stagger={55} duration={650} easing="cubic-bezier(0.16, 1, 0.3, 1)" className="aspect-video">
  <img src="/verriere.jpg" alt="" />
</Blinds>`,
  },
  {
    nom: "brush-underline",
    valide: true,
    geometrie: "bande",
    titre: "Brush Underline",
    categorie: "texte",
    nouveau: true,
    accroche: "Un trait de marqueur derrière un mot.",
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
  Rendre lisible <BrushUnderline seed={3} duration={1100} delay={180} weight={0.5}>
    ce qui ne l'est pas
  </BrushUnderline>.
</h2>`,
  },
  {
    nom: "progress",
    geometrie: "bande",
    titre: "Progress",
    categorie: "donnees",
    nouveau: true,
    accroche: "La jauge d'avancement, en six formes.",
    apport:
      "Le compte rendu d'une attente, et il vit seul parce qu'on le veut seul : un téléversement, un envoi de formulaire, une vidéo en tampon n'ont pas de rideau. Radix apporte la sémantique — le rôle, les bornes, et le retrait d'aria-valuenow quand la valeur est inconnue — Nova apporte le geste. Cinq formes sur six sont dessinées ENTIÈREMENT par le CSS : le moteur ne pose que --nova-progress, une couche allumée est découpée sur une couche éteinte, et rien ne repasse en JavaScript quand la valeur bouge. Surtout : une valeur inconnue est marquée comme telle. value: null fait avancer la jauge — immobile, elle ressemblerait à une panne — mais hachure son bord d'attaque, ce qui dit que la suite est estimée et non comptée. C'est le seul traitement qui ne ment pas, et il coûte une règle.",
    voie: "option",
    formeProp: "form",
    formes: [
      { id: "bar", nom: "Filet", note: "La référence : un trait qui se remplit. Le plus discret, et celui qu'on met dans une marge sans y penser." },
      { id: "ticks", nom: "Règle graduée", note: "Une règle d'établi dont LE PAS SE RESSERRE vers la fin. Ce n'est pas un ornement : la fin de course est là où le regard s'attarde, donc là où une jauge doit avoir de la résolution. Une graduation à pas constant est un gabarit." },
      { id: "curve", nom: "Courbe", note: "La courbe d'accélération du geste, parcourue par un point. La seule forme qui ne pouvait venir que d'une librairie de mouvement : ce qu'on lit n'est pas une quantité abstraite, c'est la courbe qui fait bouger ce qu'on attend." },
      { id: "ring", nom: "Anneau", note: "Le cercle qui se referme. Pour un endroit où la largeur manque — un bouton, une vignette. Son état inconnu se dit par un tracé discontinu, faute de bord d'attaque." },
      { id: "blades", nom: "Lames", note: "Des lames qui s'allument au rythme de l'avancement. La forme qui rime avec le rideau de Loader : le voile cesse d'être ce qui cache pour devenir ce qui mesure." },
      { id: "count", nom: "Nombre", note: "Le pourcentage écrit. Elle RELÈVE, elle ne compte pas — un nombre qui monte une fois vers sa cible est Counter, un autre geste et un autre composant." },
    ],
    options: [
      { nom: "form", type: "bar · ticks · curve · ring · blades · count", defaut: "bar", role: "Forme de la jauge." },
      { nom: "value", type: "number · null", defaut: "0", role: "Avancement de 0 à 1. null signifie INCONNU : la jauge avance mais marque son bord comme estimé." },
      { nom: "steps", type: "number", defaut: "28 · 12", role: "Nombre de pièces — graduations pour ticks, lames pour blades." },
      { nom: "duration", type: "number", defaut: "320", role: "Rattrapage entre deux valeurs, en ms. Sans lui, une mesure qui saute d'un cran se lit comme un à-coup." },
      { nom: "curve", type: "[number, number, number, number]", defaut: "0.16, 1, 0.3, 1", role: "Les points de contrôle tracés par la forme curve." },
      { nom: "decimals", type: "number", defaut: "0", role: "Décimales du nombre, pour count." },
      { nom: "locale", type: "string", defaut: "—", role: "Locale de formatage, pour count. Sans locale, pas de séparateur." },
      { nom: "label", type: "string", defaut: "—", role: "Texte lu à la place du pourcentage. Pour dire « 3 images sur 7 »." },
    ],
    usage: `/* La jauge prend une valeur, d'où qu'elle vienne. */
<Progress
  form="ticks"
  value={0.62}
  steps={28}
  duration={320}
/>

/* Branchée sur l'attente, elle rend compte de ce qu'on guette vraiment : */
const { progress } = useReady({ until: ["fonts", "images"] });
<Progress form="curve" value={progress} />

/* Et quand on ne SAIT PAS compter, on le dit — la jauge avance, mais son
   bord d'attaque est hachuré : */
<Progress form="bar" value={null} label="Envoi en cours" />`,
  },
  {
    nom: "loader",
    valide: true,
    geometrie: "bloc",
    titre: "Loader",
    categorie: "effets",
    nouveau: true,
    accroche: "Le rideau d'ouverture, et ce qu'il attend.",
    apport:
      "Un rideau qui joue sur une durée devinée se trompe forcément : il fait patienter une page déjà prête, ou il se lève sur une page encore trouée. Celui-ci attend un SIGNAL — polices, images, une promesse de l'application — et la durée n'est plus qu'un plancher et un plafond autour de lui. Le plancher parce qu'un rideau qui passe en 80 ms n'est pas un rideau bref mais un clignotement ; le plafond parce qu'aucune attente ne doit être infinie, et qu'une promesse en suspens laisserait sinon le visiteur derrière le voile pour toujours. Une attente se règle d'ailleurs sur le SETTLE et non sur le resolve : un fetch qui échoue est une fin, pas une raison d'attendre. Dix des quatorze formes sont le même rideau à lames — une grille de pièces, un rang de départ et une origine par pièce — et tout ce qui les distingue est du CSS conditionné par un attribut, sous un budget de sortie commun où la dernière pièce finit sa course pile à l'heure. Et pendant qu'il couvre, les animations d'entrée du document RETIENNENT leur geste : sous un voile un élément est dans la fenêtre sans que personne le voie, et le jouer là le dépenserait à vide. C'est ce qui permet à la page d'entrer quand le voile se lève, au lieu d'être simplement là.",
    voie: "option",
    formeProp: "form",
    formes: [
      { id: "blades", nom: "Rideau", note: "La référence. Lames verticales, retrait vers le haut, de gauche à droite. Le décalage fait le calepinage — un rideau qui tombe d'un bloc n'a pas de matière." },
      { id: "alternate", nom: "Alterné", note: "Une lame sur deux part vers le bas. Le rideau ne se lève pas, il se déchire." },
      { id: "center", nom: "Depuis le centre", note: "Les lames du milieu cèdent d'abord, les bords ferment la marche. Le regard part du sujet, pas du coin." },
      { id: "accordion", nom: "Accordéon", note: "Les lames se replient latéralement vers le centre, par paires. Le voile se range au lieu de monter." },
      { id: "slats", nom: "Persienne", note: "Lames horizontales, retrait vers la gauche, de haut en bas. Le rideau devient store." },
      { id: "shutter", nom: "Volet", note: "Chaque lame pivote sur son bord, comme une jalousie qu'on ouvre. La seule forme en perspective — et la perspective va sur le conteneur : posée sur la lame, chacune aurait son propre point de fuite et l'ouverture partirait en éventail." },
      { id: "slide", nom: "Glissement", note: "Les lames ne se réduisent pas : elles sortent du cadre par le haut en gardant leur masse. La seule qui déplace de la matière au lieu d'en retirer." },
      { id: "diagonal", nom: "Diagonale", note: "Le voile devient grille et la vague part du coin. Le grain est plus fin que la lame." },
      { id: "checker", nom: "Damier", note: "La même grille en deux passes : une case sur deux, puis l'autre moitié. Le fond apparaît en négatif plutôt qu'en vague." },
      { id: "edge", nom: "Filet", note: "Un trait d'accent file sur le bord bas de chaque lame pendant qu'elle se replie. Sans lui la lame semble s'évaporer ; avec lui, on voit un bord se retirer." },
      { id: "greetings", nom: "Salutations", note: "Un mot d'accueil qui défile en vingt langues, puis s'efface. Il dit qu'on est arrivé quelque part, pas qu'on attend." },
      { id: "splash", nom: "Pastille", note: "Rien ne bouge, le voile s'efface. Le plus sobre — celui d'une application installée, où le rideau ne doit surtout pas se faire remarquer." },
      { id: "seam", nom: "Liseré", note: "Le panneau se lève d'un bloc en laissant filer un liseré. Le liseré est ce qui reste du bord : sans lui, le panneau semble disparaître au lieu de se retirer." },
      { id: "settle", nom: "Mise en place", note: "La marque rejoint sa place dans la page et EMPORTE le voile : un disque se referme sur elle et s'éteint sous elle au premier contact. La seule forme où il n'y a jamais deux écrans — le même objet s'est déplacé. Sa course est un ressort, pas une durée : elle part de l'immobilité, dépasse sa place et s'y range. Sans place à rejoindre, elle replie sur un simple effacement." },
    ],
    options: [
      { nom: "form", type: "14 formes", defaut: "blades", role: "Forme du rideau. Dix rideaux à lames, plus greetings, splash, seam et settle." },
      { nom: "until", type: "\"fonts\" · \"images\" · \"load\" · Promise · (() => Promise) · tableau", defaut: "—", role: "Ce qu'on attend avant de lever le voile. Absent, le rideau retombe sur holdMs." },
      { nom: "minMs", type: "number", defaut: "600", role: "Plancher. Sous ce seuil un rideau n'est pas bref, il clignote. Lu avec until." },
      { nom: "maxMs", type: "number", defaut: "8000", role: "Plafond. Le voile se lève même si le signal n'arrive jamais. Lu avec until." },
      { nom: "holdMs", type: "number", defaut: "1100", role: "Temps d'affichage quand il n'y a rien à attendre." },
      { nom: "exitMs", type: "number", defaut: "700", role: "Durée de la sortie. Toute la chorégraphie y tient, dernière pièce comprise." },
      { nom: "blades", type: "number", defaut: "6", role: "Nombre de lames — de colonnes, pour diagonal et checker." },
      { nom: "greetings", type: "string[]", defaut: "20 langues", role: "Les mots d'accueil, pour la forme greetings." },
      { nom: "stepMs", type: "number", defaut: "200", role: "Cadence du défilé des mots, pour la forme greetings." },
      { nom: "settleTo", type: "string · HTMLElement", defaut: "[data-nova-settle]", role: "Où la marque va se poser, pour la forme settle. La page déclare elle-même son emplacement. Introuvable ou de taille nulle, le rideau replie sur un effacement." },
      { nom: "settleArc", type: "number", defaut: "0.16", role: "Cambrure du vol, en fraction de la distance. 0 donne une ligne droite — qui se lit comme un calcul et non comme un geste." },
      { nom: "covers", type: "page · element", defaut: "page", role: "Ce que le rideau couvre. En page, il RETIENT les animations d'entrée du document jusqu'à sa sortie — c'est ce qui permet à la page d'entrer au lieu d'être déjà là. En element, il ne retient rien." },
      { nom: "skippable", type: "boolean", defaut: "true", role: "Une interaction termine le rideau." },
      { nom: "sessionKey", type: "string · null", defaut: "nova:loader", role: "Clé de session. null le fait rejouer à chaque montage." },
      { nom: "onProgress", type: "(part: number) => void", defaut: "—", role: "Avancement de 0 à 1. La même valeur est posée en --nova-loader-progress : la barre, c'est votre CSS qui la dessine." },
      { nom: "onReveal", type: "() => void", defaut: "—", role: "Appelé au DÉBUT de la sortie. L'entrée de la page doit chevaucher le retrait du voile, pas le suivre." },
      { nom: "onDone", type: "() => void", defaut: "—", role: "Appelé quand le voile a fini d'être retiré, ou tout de suite s'il ne joue pas." },
    ],
    usage: `/* Une seule fois, dans le layout racine. */
<Loader
  form="diagonal"
  blades={6}
  /* Ce qu'on attend vraiment — jamais moins de minMs, jamais plus de maxMs. */
  until={["fonts", "images"]}
  minMs={600}
  maxMs={8000}
  exitMs={700}
  /* Au DÉBUT de la sortie : la page entre PENDANT que le voile se retire. */
  onReveal={() => setPret(true)}
>
  <p>Votre logo</p>
</Loader>

/* Sans \`until\`, le rideau joue une durée devinée. C'est le comportement
   d'origine, et \`holdMs\` n'est lu que là : */
<Loader form="blades" holdMs={1100} />

/* La barre d'avancement est du CSS — le moteur ne pose que la variable : */
.ma-barre { transform: scaleX(var(--nova-loader-progress, 0)); }

/* Et l'attente se prend SANS rideau, avec le crochet livré au même endroit : */
const { ready, progress } = useReady({ until: ["fonts", "images"] });`,
  },
  {
    nom: "flight",
    valide: true,
    geometrie: "carre",
    titre: "Flight",
    categorie: "effets",
    nouveau: true,
    accroche: "Un fantôme qui vole d'un élément vers un autre.",
    apport:
      "Le geste qui relie deux endroits d'une page : la preuve qui part du texte et rejoint sa marge, l'article qui rejoint le panier. Deux principes tenus des originaux. Rien ne vole depuis une source hors écran — un vol qu'on ne voit pas n'a aucun sens spatial, et le résultat le signale pour qu'on replie sur autre chose. Et le fantôme est inerte : cloné sans identifiants, hors de l'ordre de tabulation, hors de l'arbre d'accessibilité, parce qu'un doublon annonçable ferait entendre deux fois la même chose.",
    options: [
      { nom: "duration", type: "number", defaut: "900", role: "Durée du vol, en ms." },
      { nom: "arc", type: "number", defaut: "0.18", role: "Cambrure, en fraction de la distance. 0 donne une ligne droite." },
      { nom: "scale", type: "number", defaut: "0.6", role: "Échelle à l'arrivée." },
      { nom: "ghost", type: "HTMLElement", defaut: "clone de la source", role: "Faire voler autre chose que ce qu'on montre." },
      { nom: "onArrive", type: "() => void", defaut: "—", role: "Appelé à l'arrivée, ou tout de suite si le vol n'a pas lieu." },
    ],
    usage: `const voler = useFlight({ duration: 700, arc: 0.18, scale: 0.6 });

const { flew } = await voler(source, marge);
if (!flew) afficherUneNotification(); /* la source était hors écran */`,
  },
  {
    nom: "expand",
    valide: true,
    geometrie: "bloc",
    titre: "Expand",
    categorie: "effets",
    nouveau: true,
    accroche: "Une ligne qui devient un panneau, sans que la substitution se voie.",
    apport:
      "React remplace un arbre par l'autre en une image : la ligne disparaît pendant que l'en-tête apparaît, et c'est cette substitution qu'on lit comme un à-coup. Le geste tient en deux temps — la boîte s'étire et les pièces communes glissent (GSAP Flip), puis un voile se retire et TOUT LE RESTE SE DÉDUIT DE SON BORD. Un fondu du clair vers le sombre passerait par le gris : à mi-chemin le fond et le texte se retrouvent à la même valeur, et le texte disparaît. Un bord ne mélange rien. C'est aussi ce qui donne son calendrier au geste : on ne règle pas dix retards à la main, on les lit sur une règle. Un seul geste est décrit, et le repli le rejoue à l'envers — tant que les deux divergeaient, le repli ramenait un à un les défauts retirés de l'ouverture.",
    options: [
      { nom: "minDuration", type: "number", defaut: "0.13", role: "Durée minimale, en s." },
      { nom: "maxDuration", type: "number", defaut: "0.18", role: "Durée maximale. Elle s'étire avec la distance parcourue." },
      { nom: "veilStart", type: "number", defaut: "0.2", role: "Où le voile part dans le geste, en fraction." },
      { nom: "veilDuration", type: "number", defaut: "0.1", role: "Durée de la descente du voile, en s." },
      { nom: "reverseSpeed", type: "number", defaut: "1.6", role: "Accélération du repli. Ce qui s'en va n'a pas à se faire attendre." },
    ],
    usage: `const { ref, capture, shown } = useExpand(ouvert, {
  maxDuration: 0.18,
  reverseSpeed: 1.6,
});

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
    valide: true,
    geometrie: "bande",
    titre: "Smooth Scroll",
    categorie: "defilement",
    nouveau: true,
    accroche: "Le défilement lissé, branché sur la boucle de Nova.",
    apport:
      "Trois différences avec un montage direct de Lenis. La boucle est celle de Nova : Lenis ouvre sa propre requestAnimationFrame par défaut, ici il partage le ticker de la librairie — une seule boucle pour le défilement, les compteurs, le curseur et les bandeaux. Le tactile reste natif : lisser un défilement au doigt lui retire l'inertie du système, celle que l'utilisateur connaît, pour la remplacer par une autre. Et rien n'est monté en mouvement réduit — pas « moins lissé », absent : le défilement natif est ce que le réglage demande.",
    options: [
      { nom: "lerp", type: "number", defaut: "0.1", role: "Rattrapage par image. Plus bas, plus glissant." },
      { nom: "wheelMultiplier", type: "number", defaut: "1", role: "Multiplicateur de la molette." },
      { nom: "smoothTouch", type: "boolean", defaut: "false", role: "Lisser aussi le tactile. L'inertie du système est meilleure." },
      { nom: "orientation", type: "vertical · horizontal", defaut: "vertical", role: "Sens du défilement." },
    ],
    usage: `/* Une seule fois, dans le layout racine : */
<SmoothScroll lerp={0.1} wheelMultiplier={1}>
  {children}
</SmoothScroll>`,
  },
  {
    nom: "scroll-scene",
    valide: true,
    geometrie: "bloc",
    titre: "Scroll Scene",
    categorie: "defilement",
    nouveau: true,
    accroche: "Une scène dont le défilement fournit le temps.",
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
    valide: true,
    geometrie: "bande",
    titre: "Text Highlight",
    categorie: "texte",
    nouveau: true,
    accroche: "Surligne un passage dans du contenu déjà rendu.",
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
  duration={350}
  stagger={30}
  onMiss={() => surlignerLeBlocEntier()}
>
  <p>{contenu}</p>
</TextHighlight>`,
  },
  {
    nom: "lightbox",
    valide: true,
    geometrie: "bloc",
    titre: "Lightbox",
    categorie: "effets",
    nouveau: true,
    accroche: "Une visionneuse qui jaillit du point cliqué.",
    apport:
      "La division est celle de la doctrine du dépôt : Radix apporte la sémantique — piège de focus, Échap, verrou du défilement, ARIA, portail, retour du focus à ce qui a ouvert — et Nova n'apporte que le geste. Rien de tout cela n'est réimplémenté. La bulle naît là où la main était, grossit en ondulant, se fige en rectangle centré, puis son contenu se résout du flou vers le net ; la fermeture rejoue le même geste à l'envers, une fois et demie plus vite. Les rayons de coin sont tirés au hasard à chaque ouverture : deux clics de suite ne donnent jamais la même déformation, et le geste garde l'air d'une matière plutôt que d'une interpolation. La voie WebGL de l'original — un shader de verre avec réfraction — n'est pas reprise : elle tenait à la matière d'un projet précis, pas au geste.",
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
  duration={0.8}
  closeSpeed={1.5}
  title="Verrière de l'atelier"
>
  <img data-nova-bloom-media src={src} alt="" />
  <figcaption data-nova-bloom-late>{legende}</figcaption>
</Lightbox>`,
  },
  {
    nom: "date-picker",
    valide: true,
    geometrie: "bloc",
    titre: "Date Picker",
    categorie: "donnees",
    nouveau: true,
    voie: "option",
    formes: [
      {
        id: "day",
        nom: "Jour",
        note: "La grille d'abord, et l'en-tête déplie les cadrans par-dessus. Le geste de qui connaît déjà son mois.",
        props: { granularity: "day", startWith: "day" },
      },
      {
        id: "month-first",
        nom: "Mois puis jour",
        note: "Les cadrans d'abord, « appliquer » mène à la grille. Le geste des dates lointaines : personne ne feuillette quatre cents mois pour arriver à 1995.",
        props: { granularity: "day", startWith: "month" },
      },
      {
        id: "month",
        nom: "Mois seul",
        note: "Les cadrans SONT le panneau. Pas de grille : un mois et une année, rien d'autre.",
        props: { granularity: "month", startWith: "month" },
      },
    ],
    accroche: "Deux colonnes qui roulent sous une ligne de sélection.",
    apport:
      "Rien de la sémantique n'est réimplémenté, et c'est la même division que pour Lightbox. Radix tient le popover — ancrage, portail, Échap, clic au-dehors, retour du focus au déclencheur. react-day-picker tient la grille des jours, c'est-à-dire ce sur quoi la Calendar de shadcn est elle-même bâtie : grille ARIA, clavier, locales, bornes. Nova n'apporte que le cadran. L'accroche est celle du navigateur — `scroll-snap` fait l'inertie et le tactile mieux qu'on ne l'écrirait — et le moteur ne la suspend que le temps de ses propres courses. Le fondu, lui, est calculé en CSS : le moteur n'écrit qu'UNE variable par image, sur le conteneur, et chaque item en déduit son écart au centre depuis son propre rang. Un cadran de cent vingt années coûte donc exactement ce que coûte un cadran de douze mois. Le gabarit affiché à vide vient de la locale et non d'une constante — MM/DD/YYYY en anglais, DD/MM/YYYY en français.",
    options: [
      { nom: "granularity", type: "day · month", defaut: "day", role: "On choisit un jour, ou on s'arrête au mois." },
      { nom: "startWith", type: "day · month", defaut: "day", role: "Par où le panneau commence. `month` ouvre sur les cadrans, et « appliquer » mène à la grille." },
      { nom: "value", type: "Date | null", defaut: "—", role: "Valeur contrôlée. `defaultValue` pour le mode libre." },
      { nom: "onValueChange", type: "(v: Date | null) => void", defaut: "—", role: "Appelé au clic sur un jour, ou sur « appliquer »." },
      { nom: "startYear", type: "number", defaut: "année − 100", role: "Première année du cadran." },
      { nom: "endYear", type: "number", defaut: "année + 10", role: "Dernière année du cadran." },
      { nom: "min", type: "Date", defaut: "—", role: "Borne basse. Les jours au-delà sont désactivés." },
      { nom: "max", type: "Date", defaut: "—", role: "Borne haute." },
      { nom: "locale", type: "Locale", defaut: "—", role: "Locale de react-day-picker. Elle décide aussi du format affiché." },
      { nom: "name", type: "string", defaut: "—", role: "Champ caché ISO, pour les formulaires qui lisent un FormData." },
      { nom: "container", type: "HTMLElement", defaut: "body", role: "Où le panneau est porté. Utile dans une boîte défilante." },
      { nom: "dialDuration", type: "number", defaut: "420", role: "Durée d'une course de cadran, en ms." },
      { nom: "dialFalloff", type: "number", defaut: "2.6", role: "Nombre d'items sur lequel le fondu s'épuise." },
    ],
    usage: `{/* Une date de naissance. startWith décide par où le panneau
    commence : les cadrans, ou la grille. */}
<DatePicker
  value={naissance}
  onValueChange={setNaissance}
  startWith="month"
  startYear={1940}
  endYear={2012}
  dialDuration={420}
  dialFalloff={2.6}
  locale={fr}
/>`,
  },
  {
    nom: "flip-list",
    valide: true,
    geometrie: "bloc",
    titre: "Flip List",
    categorie: "effets",
    nouveau: true,
    accroche: "Le reflux d’une liste, raccordé au lieu d’être subi.",
    apport:
      "C’est la primitive qui manquait. Nova animait des apparitions, des textes, des défilements et des rideaux, mais aucune REMISE EN PAGE — or c’est le mouvement le plus fréquent d’une interface réelle : on filtre une grille, on trie un tableau, on retire une étiquette, et vingt pièces sautent d’une position à l’autre en une image. L’œil perd ce qu’il regardait, et le rendu se lit comme un rechargement plutôt que comme un tri. Le geste tient à un point que GSAP Flip achète et qu’on ne réécrira pas : les pièces qui partent quittent le flux, pour que les autres se referment sur leur place tout en les laissant visibles là où elles étaient. Oublier la capture ne casse rien — sans état relevé la liste se réorganise instantanément, ce qui est son comportement natif.",
    options: [
      { nom: "items", type: "string", defaut: ":scope > *", role: "Ce qui se déplace, en sélecteur relatif au conteneur. Le défaut ne demande aucun attribut." },
      { nom: "duration", type: "number", defaut: "0.45", role: "Durée du raccordement, en secondes." },
      { nom: "stagger", type: "number", defaut: "0.02", role: "Décalage entre deux pièces, en secondes. Minuscule à dessein : lisible sur cinq pièces, c’est une attente sur cinquante." },
      { nom: "ease", type: "string", defaut: "expo.out", role: "Courbe du déplacement, en vocabulaire GSAP — le moteur interpole en JavaScript, il ne peut rien faire d’une chaîne CSS." },
      { nom: "enter", type: "fade · scale · none", defaut: "scale", role: "Comment une pièce nouvelle paraît." },
      { nom: "exit", type: "fade · scale · none", defaut: "fade", role: "Comment une pièce retirée s’en va." },
      { nom: "onSettled", type: "() => void", defaut: "—", role: "Appelé quand le raccordement est fini." },
    ],
    usage: `const { ref, capture } = useFlipList(filtre, {
  duration: 0.45,
  stagger: 0.02,
});

{/* capture() AVANT le setState : c’est le seul moment où l’ancienne
    disposition est encore à l’écran, donc mesurable. */}
<button onClick={() => { capture(); setFiltre("actifs"); }}>
  Actifs
</button>

{/* La clé passée au crochet décrit la disposition. Quand elle change,
    le raccordement se joue seul. */}
<ul ref={ref}>
  {visibles.map((p) => (
    <li key={p.id}>{p.nom}</li>
  ))}
</ul>`,
  },
];

/**
 * Ce que Nova distribue : les familles explicitement validées.
 *
 * Toutes les surfaces publiques lisent cette liste-ci — l'index, la barre, les
 * routes `/composants/<nom>`, la recherche, le markdown servi aux agents. Une
 * famille sans `valide: true` en est absente, et sa page répond 404 : il n'y a
 * pas d'adresse secrète par laquelle un candidat sortirait quand même.
 *
 * Le filtre est en UN SEUL endroit, ici, plutôt que répété par surface. Une
 * surface ajoutée demain hérite de la règle sans qu'on ait à y penser — et
 * c'est la seule façon dont une règle de ce genre survit à la sixième surface.
 */
export const catalogue: Fiche[] = familles.filter(
  (fiche) => fiche.valide === true,
);

/** Une famille distribuée. Rend `undefined` pour un candidat non validé. */
export function trouverFiche(nom: string): Fiche | undefined {
  return catalogue.find((fiche) => fiche.nom === nom);
}

/**
 * Une famille déclarée, validée ou non.
 *
 * Réservé au banc et aux tests : une surface publique qui appelle ceci passe
 * à côté du garde-fou. Voir `trouverFiche`.
 */
export function trouverFamille(nom: string): Fiche | undefined {
  return familles.find((fiche) => fiche.nom === nom);
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

/**
 * Total des formes du catalogue.
 *
 * PLUS AFFICHÉ NULLE PART, et volontairement : un compte global change à chaque
 * récolte, et toute phrase qui le cite se périme à la ligne suivante — on
 * passait plus de temps à le remettre à jour qu'il n'apprenait au lecteur. Ce
 * qui reste affiché est le compte de formes d'UNE famille, qui est une
 * propriété de cette famille, et le résultat d'une recherche, qui répond à ce
 * qu'on vient de taper.
 *
 * L'export survit parce qu'il est juste et gratuit : la prochaine surface qui
 * aura une vraie raison de compter le trouvera ici plutôt que de le recalculer.
 */
export const TOTAL_FORMES = catalogue.reduce(
  (total, fiche) => total + nombreDeFormes(fiche),
  0,
);
