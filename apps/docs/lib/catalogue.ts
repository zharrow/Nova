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

export interface Fiche {
  nom: string;
  titre: string;
  accroche: string;
  /** D'où vient le composant dans les projets d'origine. */
  provenance: string;
  /** Ce que la version Nova corrige par rapport à l'original. */
  apport: string;
  options: OptionRow[];
  usage: string;
}

export const catalogue: Fiche[] = [
  {
    nom: "reveal",
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
  },
  {
    nom: "scramble-text",
    titre: "Scramble Text",
    accroche: "Le texte se brouille, puis se décode lettre par lettre.",
    provenance: "ScrambleText — portfolio, section Labo",
    apport:
      "Les nœuds sont créés une fois et réutilisés : là où la version React reconstruisait quarante éléments tous les 52 ms, la boucle se contente d'écrire du texte.",
    options: [
      { nom: "text", type: "string", defaut: "—", role: "Texte final. Obligatoire." },
      { nom: "trigger", type: "hover · view · mount · manual", defaut: "hover", role: "Ce qui déclenche le décodage." },
      { nom: "stepMs", type: "number", defaut: "52", role: "Durée d'un pas. Plus haut = plus lent." },
      { nom: "scrambleSteps", type: "number", defaut: "6", role: "Pas pendant lesquels une lettre reste brouillée." },
      { nom: "chars", type: "string", defaut: "A-Z 0-9 #%&/<>*+=", role: "Jeu de caractères de brouillage." },
    ],
    usage: `<ScrambleText text="DÉCODER" trigger="view" />

/* Les caractères brouillés prennent --nova-accent : */
:root { --nova-accent: #ff5b1f; }`,
  },
  {
    nom: "counter",
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
  },
  {
    nom: "split-text",
    titre: "Split Text",
    accroche: "Un titre qui monte dans son masque, mot par mot.",
    provenance: "SplitTitle — Bât-et-Verre 3D",
    apport:
      "Le titre reste annoncé d'une seule traite aux lecteurs d'écran, et les blancs restent de vrais nœuds texte — la césure naturelle survit au découpage.",
    options: [
      { nom: "text", type: "string", defaut: "—", role: "Texte à découper. Obligatoire." },
      { nom: "by", type: "word · char", defaut: "word", role: "Granularité du découpage." },
      { nom: "stagger", type: "number", defaut: "60", role: "Décalage entre deux unités, en ms." },
      { nom: "duration", type: "number", defaut: "800", role: "Durée d'une unité, en ms." },
      { nom: "trigger", type: "view · mount · manual", defaut: "view", role: "Ce qui déclenche la montée." },
    ],
    usage: `<SplitText as="h1" text="Bâtir en verre" className="text-6xl" />
<SplitText text="NOVA" by="char" stagger={40} />`,
  },
  {
    nom: "marquee",
    titre: "Marquee",
    accroche: "Un bandeau qui défile sans fin, à vitesse constante.",
    provenance: "Marquee — portfolio et Bât-et-Verre",
    apport:
      "La vitesse est en pixels par seconde, pas en durée fixe. Deux bandeaux réglés pareil défilent au même rythme, quelle que soit la longueur de leur contenu — ce que la version d'origine ne garantissait pas.",
    options: [
      { nom: "speed", type: "number", defaut: "60", role: "Vitesse en px/s." },
      { nom: "direction", type: "left · right", defaut: "left", role: "Sens de défilement." },
      { nom: "pauseOnHover", type: "boolean", defaut: "false", role: "Suspendre au survol." },
      { nom: "gap", type: "string", defaut: "0px", role: "Écart entre deux copies." },
    ],
    usage: `<Marquee speed={80} gap="3rem" pauseOnHover>
  <span>ATELIER</span>
  <span>VERRE</span>
  <span>MÉTAL</span>
</Marquee>`,
  },
  {
    nom: "cursor",
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
  },
];

export function trouverFiche(nom: string): Fiche | undefined {
  return catalogue.find((fiche) => fiche.nom === nom);
}
