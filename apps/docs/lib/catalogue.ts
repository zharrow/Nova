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
    nom: "text-effect",
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
  },
  {
    nom: "marquee",
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
  },
  {
    nom: "scroll-marquee",
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
