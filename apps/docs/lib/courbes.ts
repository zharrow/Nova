/**
 * Les courbes d'accélération proposées sous une démonstration.
 *
 * Une courbe est la seule option d'animation qu'on ne peut pas comprendre en
 * lisant son nom. « ease-in » et « ease-out » sont des mots qu'on retient à
 * l'envers une fois sur deux, et personne ne sait de tête ce que fait
 * `cubic-bezier(0.34, 1.56, 0.64, 1)`. C'est pourquoi chaque entrée porte ses
 * QUATRE POIGNÉES : la fiche en trace la vignette, et le visiteur choisit sur
 * le dessin plutôt que sur le nom.
 *
 * Deux vocabulaires cohabitent dans le dépôt, et ce n'est pas un accident :
 *
 *  - les moteurs qui laissent le CSS animer prennent une CHAÎNE CSS
 *    (`reveal`, `blinds`, `text-effect`, `flight`) ;
 *  - ceux qui interpolent eux-mêmes en JavaScript prennent le NOM d'une
 *    courbe de `internal/easing.ts` (`counter`, `dial`, `scroll-scene`),
 *    parce qu'une chaîne CSS ne s'évalue pas dans une boucle.
 *
 * Les deux listes vivent ici côte à côte pour qu'on voie qu'elles ne se
 * recouvrent pas — et pour qu'on n'aille pas proposer `ease-in-out` à un
 * moteur qui ne saurait pas quoi en faire.
 */

export interface Courbe {
  /** Ce qui part réellement dans la prop. */
  valeur: string;
  /** Nom court, sur le bouton. */
  etiquette: string;
  /** Ce que la courbe fait, en quelques mots. */
  note: string;
  /** Les quatre poignées, pour la vignette. `null` : échantillonnée en JS. */
  poignees: readonly [number, number, number, number] | null;
}

/**
 * Courbes CSS. Les cinq mots-clés du langage, puis les deux de Nova.
 *
 * Les mots-clés sont donnés avec leurs poignées réelles : `ease` n'est pas
 * une formule à part, c'est `cubic-bezier(0.25, 0.1, 0.25, 1)`, et le voir
 * écrit vaut mieux que de l'apprendre.
 */
export const COURBES_CSS: readonly Courbe[] = [
  {
    valeur: "linear",
    etiquette: "linear",
    note: "Vitesse constante. Mécanique — utile pour une rotation continue, faux pour un déplacement.",
    poignees: [0, 0, 1, 1],
  },
  {
    valeur: "ease",
    etiquette: "ease",
    note: "Le défaut du navigateur. Démarre doucement, finit doucement, penche vers la fin.",
    poignees: [0.25, 0.1, 0.25, 1],
  },
  {
    valeur: "ease-in",
    etiquette: "ease-in",
    note: "Part lentement et accélère. Pour ce qui S'EN VA : la sortie s'échappe.",
    poignees: [0.42, 0, 1, 1],
  },
  {
    valeur: "ease-out",
    etiquette: "ease-out",
    note: "Part vite et se pose. Pour ce qui ARRIVE : l'entrée se présente puis s'installe.",
    poignees: [0, 0, 0.58, 1],
  },
  {
    valeur: "ease-in-out",
    etiquette: "ease-in-out",
    note: "Les deux, symétriques. Pour un aller-retour, ou un déplacement d'un point à un autre.",
    poignees: [0.42, 0, 0.58, 1],
  },
  {
    valeur: "cubic-bezier(0.16, 1, 0.3, 1)",
    etiquette: "expo",
    note: "La signature de Nova. Démarre très vite et se pose très longuement — c'est ce qui donne la sensation d'une chose lourde et bien huilée.",
    poignees: [0.16, 1, 0.3, 1],
  },
  {
    valeur: "cubic-bezier(0.22, 1, 0.36, 1)",
    etiquette: "out",
    note: "La sœur plus sage de la signature. Même geste, moins appuyé.",
    poignees: [0.22, 1, 0.36, 1],
  },
  {
    valeur: "cubic-bezier(0.34, 1.56, 0.64, 1)",
    etiquette: "back",
    note: "Dépasse la cible et revient. Le seul rebond de la liste — à réserver à ce qui doit se faire remarquer.",
    poignees: [0.34, 1.56, 0.64, 1],
  },
];

/**
 * Courbes JavaScript, par leur nom dans `@nova-ui/core`.
 *
 * Elles n'ont pas de poignées : ce sont des fonctions, pas des Béziers. La
 * vignette les ÉCHANTILLONNE au lieu de les tracer — voir `components/courbe.tsx`.
 * C'est le seul aperçu honnête : une approximation en Bézier montrerait une
 * courbe qui n'est pas celle qui tournera.
 */
export const COURBES_JS: readonly Courbe[] = [
  {
    valeur: "linear",
    etiquette: "linear",
    note: "Vitesse constante.",
    poignees: null,
  },
  {
    valeur: "quadOut",
    etiquette: "quadOut",
    note: "Le freinage le plus doux de la liste. Presque linéaire.",
    poignees: null,
  },
  {
    valeur: "cubicOut",
    etiquette: "cubicOut",
    note: "Un cran plus marqué que quadOut.",
    poignees: null,
  },
  {
    valeur: "quartOut",
    etiquette: "quartOut",
    note: "Freinage franc. La valeur est presque arrivée à mi-parcours.",
    poignees: null,
  },
  {
    valeur: "expoOut",
    etiquette: "expoOut",
    note: "La signature de Nova, en JavaScript. Démarre très vite, se pose très longuement.",
    poignees: null,
  },
  {
    valeur: "expoInOut",
    etiquette: "expoInOut",
    note: "Symétrique : lent aux deux bouts, très rapide au milieu.",
    poignees: null,
  },
  {
    valeur: "backOut",
    etiquette: "backOut",
    note: "Dépasse la cible et revient. Sur un compteur, le chiffre monte trop haut puis redescend.",
    poignees: null,
  },
];

/** La liste correspondant au vocabulaire d'un réglage. */
export function courbesDe(vocabulaire: "css" | "js"): readonly Courbe[] {
  return vocabulaire === "css" ? COURBES_CSS : COURBES_JS;
}

/** L'entrée qui correspond à une valeur, si elle est dans la liste. */
export function trouverCourbe(
  vocabulaire: "css" | "js",
  valeur: unknown,
): Courbe | undefined {
  return courbesDe(vocabulaire).find((c) => c.valeur === valeur);
}
