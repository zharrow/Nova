/**
 * Loader — le rideau d'ouverture, ET ce qu'il attend.
 *
 * Un rideau qui joue sur une durée devinée se trompe forcément dans un sens ou
 * dans l'autre : il fait patienter une page déjà prête, ou il se lève sur une
 * page encore trouée. Le moteur attend donc un SIGNAL — polices, images,
 * promesse de l'application — et la durée n'est plus qu'un plancher et un
 * plafond autour de lui. Voir `until`, `minMs`, `maxMs`.
 *
 * Quatorze formes. Dix sont des rideaux à lames : une seule mécanique — une
 * grille de pièces, un rang de départ et une origine par pièce — et tout le
 * reste est du CSS conditionné par un attribut. C'est la voie de `TextEffect`,
 * et c'est ce qui permet d'en ajouter une onzième sans toucher au moteur.
 *
 *   `blades`     lames verticales, retrait vers le haut, de gauche à droite
 *   `alternate`  une lame sur deux part vers le bas : le rideau se déchire
 *   `center`     les lames du milieu cèdent d'abord, les bords ferment
 *   `accordion`  les lames se replient latéralement vers le centre
 *   `slats`      lames horizontales, retrait vers la gauche, de haut en bas
 *   `shutter`    chaque lame pivote sur son bord, comme une jalousie
 *   `slide`      les lames sortent du cadre en gardant leur masse
 *   `diagonal`   le voile devient grille, et la vague part du coin
 *   `checker`    la même grille en deux passes, une case sur deux
 *   `edge`       un trait d'accent file sur le bord de chaque lame
 *
 * Les trois autres ont chacune leur mécanique :
 *
 *   `greetings`  un mot d'accueil qui défile en vingt langues
 *   `splash`     une pastille brève, réservée à l'application installée
 *   `seam`       le panneau se lève d'un bloc en laissant filer un liseré
 *   `settle`     la marque rejoint sa place dans la page, et EMPORTE le voile
 *
 * Quatre garde-fous, tous tirés des originaux et tous non négociables :
 *
 *  - **il se saute.** Molette, clic, touche, contact : la première interaction
 *    termine le rideau. Un visiteur qui veut lire ne doit jamais attendre une
 *    animation — ni, désormais, un réseau ;
 *  - **il ne rejoue pas.** Une clé de session suffit : revenir en arrière ne
 *    doit pas redonner le générique ;
 *  - **il n'existe pas en mouvement réduit.** Pas « il est plus court » :
 *    `onDone` part tout de suite et rien n'est monté ;
 *  - **la page est l'état par défaut.** Le rideau ne couvre qu'une fois le
 *    moteur monté. Sans JavaScript, il n'y a pas de rideau — donc jamais de
 *    page bloquée derrière un voile qui ne se lèvera pas.
 *
 * À quoi s'ajoute, depuis que le rideau attend vraiment quelque chose, un
 * cinquième qui vaut autant que les autres : **aucune attente n'est infinie.**
 * Une promesse qui ne résout jamais, un réseau qui pend, une image qui n'arrive
 * pas — `maxMs` lève le voile quand même. Et le compte à rebours est tenu par
 * des minuteries, jamais par la boucle d'animation : dans un onglet d'arrière-
 * plan, où `requestAnimationFrame` ne tourne pas, le rideau se lève à l'heure.
 */

import { coverPage } from "../internal/curtain";
import type { UncoverOrigin } from "../internal/curtain";
import { isBrowser, prefersReducedMotion } from "../internal/env";
import { mergeOptions } from "../internal/options";
import type { NovaInstance } from "../internal/types";
import { createReady } from "./ready";
import type { ReadyInstance, ReadySignal } from "./ready";

/** Les dix rideaux à lames, puis les trois mécaniques propres. */
export type LoaderForm =
  | "blades"
  | "alternate"
  | "center"
  | "accordion"
  | "slats"
  | "shutter"
  | "slide"
  | "diagonal"
  | "checker"
  | "edge"
  | "greetings"
  | "splash"
  | "seam"
  | "settle";

/**
 * Ce que le rideau attend — le type vit dans `ready`, qui porte l'attente.
 *
 * L'alias reste exporté sous son nom d'origine : il était public avant que
 * l'attente ne soit extraite, et le renommer casserait ceux qui l'importent
 * pour rien.
 */
export type LoaderSignal = ReadySignal;

export interface LoaderOptions {
  /** Forme du rideau. Défaut : `blades`. */
  form?: LoaderForm;
  /** Nombre de lames — de colonnes, pour `diagonal` et `checker`. Défaut : 6. */
  blades?: number;
  /** Les mots d'accueil, pour la forme `greetings`. */
  greetings?: readonly string[];
  /** Cadence du défilé des mots, en ms. Défaut : 200. */
  stepMs?: number;
  /**
   * Ce qu'il faut attendre avant de lever le voile.
   *
   * Absent, le rideau retombe sur `holdMs` : une durée fixe, et c'est le
   * comportement historique. Présent, `holdMs` n'est plus lu — le voile part
   * quand le signal est là, jamais avant `minMs`, jamais après `maxMs`.
   */
  until?: LoaderSignal | readonly LoaderSignal[];
  /**
   * Plancher, en ms. Un rideau qui passe en 80 ms n'est pas un rideau bref,
   * c'est un clignotement — strictement pire que pas de rideau du tout. Lu
   * seulement avec `until`. Défaut : 600.
   */
  minMs?: number;
  /**
   * Plafond, en ms. Passé ce délai le voile se lève, signal ou pas. C'est ce
   * qui rend `until` sûr à utiliser. Lu seulement avec `until`. Défaut : 8000.
   */
  maxMs?: number;
  /** Temps d'affichage quand il n'y a RIEN à attendre, en ms. Défaut : 1100. */
  holdMs?: number;
  /** Durée de la sortie, en ms. Défaut : 700. */
  exitMs?: number;
  /**
   * Où la marque va se poser, pour la forme `settle`. Sélecteur ou élément.
   * Défaut : `[data-nova-settle]` — la page déclare elle-même son emplacement.
   *
   * Introuvable, invisible ou de taille nulle, le rideau REPLIE sur un simple
   * effacement. Un vol vers une cible qui n'existe pas n'a aucun sens spatial ;
   * c'est le même principe que `Flight`, qui renonce quand sa source est hors
   * écran plutôt que d'animer dans le vide.
   */
  settleTo?: string | HTMLElement;
  /**
   * Cambrure du vol, en fraction de la distance parcourue. `0` donne une ligne
   * droite — qui se lit comme un calcul et non comme un geste. Défaut : 0.16.
   */
  settleArc?: number;
  /**
   * Ce que ce rideau couvre. Défaut : `page`.
   *
   * Un rideau de `page` retient les animations d'entrée du reste du document
   * jusqu'à sa sortie : sous un voile, un élément est dans la fenêtre sans que
   * personne le voie, et jouer son entrée là la dépenserait à vide. C'est ce
   * qui permet à la page d'ENTRER quand le voile se lève, au lieu d'être déjà
   * là.
   *
   * `element` pour un rideau qui ne couvre que sa propre boîte — une
   * démonstration dans un encadré, une vignette. Il ne retient rien : ce qui
   * l'entoure reste visible et doit continuer de vivre.
   */
  covers?: "page" | "element";
  /** Une interaction termine le rideau. Défaut : true. */
  skippable?: boolean;
  /**
   * Clé de session. Tant qu'elle est posée, le rideau ne rejoue pas.
   * `null` le fait rejouer à chaque montage — utile en démonstration.
   * Défaut : `nova:loader`.
   */
  sessionKey?: string | null;
  /**
   * Avancement, de 0 à 1. Le moteur pose la même valeur en
   * `--nova-loader-progress`, pour que la barre soit dessinée par le CSS.
   */
  onProgress?: (part: number) => void;
  /**
   * Appelé au DÉBUT de la sortie, pas à la fin.
   *
   * C'est le passage de relais : l'entrée de la page doit CHEVAUCHER le
   * retrait du voile, sinon on lit deux gestes à la suite au lieu d'un seul.
   * `onDone`, lui, part quand le voile a fini d'être retiré.
   */
  onReveal?: () => void;
  /** Appelé quand le rideau est fini, ou tout de suite s'il ne joue pas. */
  onDone?: () => void;
}

const SVG_NS = "http://www.w3.org/2000/svg";

/** Nombre de points de passage du vol. Voir `amerrir` : la courbe y est cuite. */
const ECHANTILLONS = 30;

/**
 * La course du vol — un ressort, pas une durée.
 *
 * `douceur` donne un départ et une arrivée à vitesse nulle ; le terme en
 * puissance trois par-dessus fait DÉPASSER la cible avant de s'y ranger. Les
 * deux composés valent exactement 0 en 0 et exactement 1 en 1, ce qui garantit
 * que la marque se pose au pixel — un ressort libre, lui, oscillerait encore à
 * la fin du budget.
 *
 * 0,7 d'amplitude : le dépassement culmine à quatre pour cent environ. Au-delà
 * on ne lit plus un atterrissage, on lit un rebond.
 */
const DEPASSEMENT = 0.7;

/** Rampe lissée : dérivée nulle aux deux bouts. */
function douceur(t: number): number {
  const b = Math.min(1, Math.max(0, t));
  return b * b * (3 - 2 * b);
}

function course(t: number): number {
  const s = douceur(t);
  const e = s - 1;
  return 1 + (DEPASSEMENT + 1) * e * e * e + DEPASSEMENT * e * e;
}

const SALUTATIONS = [
  "Bonjour", "Hello", "Hola", "Ciao", "Hallo", "Olá", "Привет",
  "こんにちは", "你好", "안녕하세요", "مرحبا", "नमस्ते", "Hej",
  "Salut", "Ahoj", "Γεια σου", "שלום", "Merhaba", "Sawubona", "Jambo",
] as const;

const defaults = {
  form: "blades" as LoaderForm,
  blades: 6,
  stepMs: 200,
  covers: "page" as "page" | "element",
  settleTo: "[data-nova-settle]" as string | HTMLElement,
  settleArc: 0.16,
  minMs: 600,
  maxMs: 8000,
  holdMs: 1100,
  exitMs: 700,
  skippable: true,
  sessionKey: "nova:loader" as string | null,
};

/* --------------------------------------------------------------------------
   Les dix chorégraphies de lames
   -------------------------------------------------------------------------- */

interface Choregraphie {
  /** Découpe du voile. Une lame verticale est une colonne sur un rang. */
  grille(lames: number): { colonnes: number; rangs: number };
  /** Ordre de départ d'une pièce. 0 part en premier ; l'échelle est libre. */
  rang(col: number, rang: number, colonnes: number, rangs: number): number;
  /** Origine de transformation, quand elle dépend de la pièce. */
  origine?(col: number, rang: number, colonnes: number, rangs: number): string;
}

/* Une grille reste lisible tant qu'elle garde peu de rangs : à six colonnes
   sur six rangs, on ne lit plus une vague, on lit du bruit. */
const rangsDeGrille = (lames: number) => Math.max(2, Math.round(lames / 2));

const colonnes1 = (n: number) => ({ colonnes: n, rangs: 1 });

const CHOREGRAPHIES: Partial<Record<LoaderForm, Choregraphie>> = {
  blades: { grille: colonnes1, rang: (col) => col },
  alternate: {
    grille: colonnes1,
    rang: (col) => col,
    origine: (col) => (col % 2 === 1 ? "50% 100%" : "50% 0%"),
  },
  center: {
    grille: colonnes1,
    rang: (col, _r, colonnes) => Math.abs(col - (colonnes - 1) / 2),
  },
  accordion: {
    grille: colonnes1,
    rang: (col, _r, colonnes) =>
      (colonnes - 1) / 2 - Math.abs(col - (colonnes - 1) / 2),
    origine: (col, _r, colonnes) => (col < colonnes / 2 ? "0% 50%" : "100% 50%"),
  },
  slats: {
    grille: (n) => ({ colonnes: 1, rangs: n }),
    rang: (_c, rang) => rang,
  },
  shutter: { grille: colonnes1, rang: (col) => col },
  slide: { grille: colonnes1, rang: (col) => col },
  diagonal: {
    grille: (n) => ({ colonnes: n, rangs: rangsDeGrille(n) }),
    rang: (col, rang) => col + rang,
  },
  checker: {
    grille: (n) => ({ colonnes: n, rangs: rangsDeGrille(n) }),
    /* Deux passes : une case sur deux part d'abord, l'autre moitié ensuite.
       Le décalage d'une grille entière entre les deux parités est ce qui fait
       apparaître le fond en négatif plutôt qu'en vague. */
    rang: (col, rang, colonnes, rangs) =>
      ((col + rang) % 2) * (colonnes + rangs) + (col + rang) / 2,
  },
  edge: { grille: colonnes1, rang: (col) => col },
};

/** `true` si la forme est un rideau à lames. */
function estLame(form: LoaderForm): boolean {
  return form in CHOREGRAPHIES;
}

/* --------------------------------------------------------------------------
   Le moteur
   -------------------------------------------------------------------------- */

export function createLoader(
  element: HTMLElement,
  options: LoaderOptions = {},
): NovaInstance<LoaderOptions> & { skip(): void } {
  let config = mergeOptions(defaults, options);

  const contenuOrigine = Array.from(element.childNodes);
  const minuteries: Array<ReturnType<typeof setTimeout>> = [];
  const detachements: Array<() => void> = [];
  let cycle: ReturnType<typeof setInterval> | null = null;
  let fini = false;

  /* L'attente — ce qu'on guette avant de lever le voile. Elle vit dans
     `engines/ready.ts` parce qu'elle se veut sans rideau : quelqu'un peut
     vouloir attendre ses polices et révéler son titre sans aucun voile. Le
     rideau en est un consommateur, pas le propriétaire. */
  let attente: ReadyInstance | null = null;

  /* Le retrait du rideau du registre de page. Tant qu'il est posé, les
     moteurs d'entrée du reste du document RETIENNENT leur geste : sous un
     voile, un élément est dans la fenêtre sans que personne le voie. Voir
     `internal/curtain.ts`. */
  let decouvrir: ((depuis?: UncoverOrigin) => void) | null = null;

  /** `true` si CE rideau a posé le drapeau de page, et doit donc le retirer. */
  let drapeauPose = false;

  /**
   * Ce rideau parle-t-il pour la page entière ?
   *
   * Tout ce qui déborde de sa propre boîte — le registre de rideau et le
   * drapeau sur `<html>` — est conditionné à ça. Une démonstration dans un
   * encadré qui annoncerait « la page est chargée » ferait exactement la même
   * erreur de portée que si elle gelait les entrées du reste du site.
   */
  function porteLaPage(): boolean {
    return config.covers === "page";
  }

  /** Pose le drapeau que le CSS de la page peut lire. */
  function poserDrapeau(): void {
    if (!isBrowser || !porteLaPage()) return;
    document.documentElement.dataset.novaLoaded = "";
    drapeauPose = true;
  }

  function deja(): boolean {
    if (!config.sessionKey) return false;
    try {
      return sessionStorage.getItem(config.sessionKey) === "1";
    } catch {
      // Navigation privée ou stockage bloqué : on joue le rideau. Mieux vaut
      // le rejouer une fois de trop que de le retenir sur une erreur.
      return false;
    }
  }

  function marquer(): void {
    if (!config.sessionKey) return;
    try {
      sessionStorage.setItem(config.sessionKey, "1");
    } catch {
      /* Sans persistance, le rideau vaut pour la session en cours. */
    }
  }

  /** Rend sa visibilité à la place. Le fantôme disparaît dans la même image. */
  function rendrePlace(): void {
    if (!place) return;
    place.style.visibility = visibiliteDePlace;
    place = null;
  }

  function terminer(): void {
    if (fini) return;
    fini = true;
    for (const minuterie of minuteries) clearTimeout(minuterie);
    minuteries.length = 0;
    if (cycle !== null) clearInterval(cycle);
    cycle = null;
    for (const detacher of detachements) detacher();
    detachements.length = 0;
    rendrePlace();
    element.dataset.novaLoaderState = "done";
    config.onDone?.();
  }

  /** Termine le rideau après sa sortie. */
  /** Le nœud qui porte ce que le rideau montre — la marque, pour `settle`. */
  let contenu: HTMLElement | null = null;
  /**
   * La surface peinte de la forme `settle`, et elle seule.
   *
   * Elle existe parce que le disque qui se referme découpe ce qu'il couvre :
   * poser ce découpage sur le rideau lui-même aurait rogné LA MARQUE, qui y
   * vit — on l'aurait vue se faire manger par une lucarne au lieu d'atterrir.
   * Le panneau est donc un frère du contenu, dessous, et c'est lui qu'on
   * rétracte pendant que la marque vole librement au-dessus.
   */
  let panneau: HTMLElement | null = null;
  /** Le trait d'un pixel qui voyage sur le bord du disque. */
  let liseré: SVGCircleElement | null = null;
  /** La place, et sa visibilité d'origine, le temps du vol. */
  let place: HTMLElement | null = null;
  let visibiliteDePlace = "";

  /** La cible du vol, mesurable et non dégénérée, ou `null`. */
  function cibleDuVol(): HTMLElement | null {
    if (!isBrowser) return null;
    const brut = config.settleTo;
    const noeud =
      typeof brut === "string"
        ? document.querySelector<HTMLElement>(brut)
        : (brut ?? null);
    if (!noeud) return null;
    const boite = noeud.getBoundingClientRect();
    // Une cible de taille nulle est une cible absente : `display: none`, pas
    // encore mise en page, ou repliée. Voler vers elle produirait une échelle
    // nulle et une marque qui disparaît dans un point.
    if (boite.width < 1 || boite.height < 1) return null;
    return noeud;
  }

  /**
   * LA MARQUE EMPORTE LE VOILE.
   *
   * Un seul geste : la marque rejoint sa place dans la page pendant que le
   * panneau se RÉTRACTE SUR ELLE — un disque qui se referme et s'éteint sous
   * elle au premier contact. Il n'y a jamais deux écrans, jamais un logo qui
   * bouge pendant qu'un voile s'efface à côté.
   *
   * QUATRE CHOSES FONT QUE C'EST UN GESTE ET NON UNE INTERPOLATION.
   *
   *  - **La course est un ressort, pas une durée.** Un objet lancé part de
   *    l'immobilité, dépasse sa cible et s'y range. C'est la définition
   *    physique d'un atterrissage, et c'est ce qui donne du poids à la marque.
   *  - **La courbe est CUITE dans l'échantillonnage.** Trente points de
   *    passage, et une interpolation LINÉAIRE entre eux. C'est une correction
   *    de fond : les Web Animations appliquent la courbe à CHAQUE intervalle,
   *    pas à l'ensemble. Avec quatre points de passage et une courbe en
   *    `cubic-bezier`, le geste accélérait puis ralentissait trois fois de
   *    suite — c'est exactement ce qu'on lisait comme des à-coups.
   *  - **L'arc.** Une translation en ligne droite se lit comme un calcul. Un
   *    objet lancé décrit une courbe, et c'est la même raison qui a donné sa
   *    cambrure à `Flight`.
   *  - **La couleur passe d'un fond à l'autre.** La marque quitte un voile
   *    pour une page : sa couleur suit. Sans cela, au contact, un logo clair
   *    se substituait d'un coup au logo sombre de l'en-tête — deux objets, et
   *    toute l'idée tombait sur la dernière image.
   *
   * Et le point qui décide de tout : LE DISQUE ET LA MARQUE PARTAGENT LEURS
   * POINTS DE PASSAGE. Ce ne sont pas deux animations qu'on synchronise, c'est
   * un seul chemin échantillonné deux fois.
   */
  function amerrir(): UncoverOrigin | null {
    const cible = cibleDuVol();
    if (!contenu || !panneau || !cible || typeof panneau.animate !== "function") {
      // Repli : le voile s'efface, sans origine. Le geste n'a pas eu lieu et
      // rien ne prétend le contraire.
      element.dataset.novaSettle = "fallback";
      return null;
    }

    const depart = contenu.getBoundingClientRect();
    const arrivee = cible.getBoundingClientRect();
    const x0 = depart.left + depart.width / 2;
    const y0 = depart.top + depart.height / 2;
    const x1 = arrivee.left + arrivee.width / 2;
    const y1 = arrivee.top + arrivee.height / 2;
    const echelle = depart.width > 0 ? arrivee.width / depart.width : 1;

    const distance = Math.hypot(x1 - x0, y1 - y0);
    // Perpendiculaire au trajet : c'est elle qui cambre. Sur une distance
    // nulle il n'y a pas de direction, donc pas d'arc — ni de division par
    // zéro.
    const px = distance > 0 ? -(y1 - y0) / distance : 0;
    const py = distance > 0 ? (x1 - x0) / distance : 0;
    const fleche = config.settleArc * distance;
    const cx = (x0 + x1) / 2 + px * fleche;
    const cy = (y0 + y1) / 2 + py * fleche;

    /** Le point du chemin à l'avancement `u`. Au-delà de 1, il extrapole — et
        c'est ce qui donne son dépassement au ressort. */
    const pointA = (u: number) => {
      const v = 1 - u;
      return {
        x: v * v * x0 + 2 * v * u * cx + u * u * x1,
        y: v * v * y0 + 2 * v * u * cy + u * u * y1,
      };
    };

    const rayon = Math.hypot(
      Math.max(x0, window.innerWidth - x0),
      Math.max(y0, window.innerHeight - y0),
    );

    const couleurArrivee = getComputedStyle(cible).color;
    const couleurDepart = getComputedStyle(contenu).color;

    /* LA PLACE SE CACHE LE TEMPS DU VOL, et c'est une correction de fond.
       Le disque est centré sur la marque QUI VOLE ; en se resserrant, il cesse
       de couvrir la destination quelques pixels plus loin avant que la marque
       n'y arrive. On voyait alors DEUX marques à la fois — le fantôme dans le
       disque et la vraie, déjà découverte à côté. C'est précisément le « deux
       écrans » que cette forme existe pour supprimer, et ça se produisait sur
       la seule image qui compte.

       Elle réapparaît à la toute fin, quand le fantôme est au repos exactement
       sur elle et de la même couleur : la substitution tient en une image et
       ne se voit pas. La révéler au premier contact ne suffirait pas — le
       dépassement du ressort écarterait ensuite le fantôme, et on relirait
       deux marques. */
    place = cible;
    visibiliteDePlace = cible.style.visibility;
    cible.style.visibility = "hidden";

    const disques: Keyframe[] = [];
    const vols: Keyframe[] = [];
    const bords: Keyframe[] = [];

    // Le premier contact : l'instant où la marque atteint sa place pour la
    // première fois, AVANT de dépasser. C'est là que le voile s'éteint — et
    // c'est ce qui permet de VOIR la marque se ranger, sur la page, une fois
    // le rideau parti.
    let contact = 1;
    for (let i = 0; i <= ECHANTILLONS; i++) {
      if (course(i / ECHANTILLONS) >= 1) {
        contact = Math.max(1 / ECHANTILLONS, i / ECHANTILLONS);
        break;
      }
    }

    for (let i = 0; i <= ECHANTILLONS; i++) {
      const t = i / ECHANTILLONS;
      const u = course(t);
      const point = pointA(u);

      // Le disque se referme d'ici au premier contact, et pas au-delà : sans
      // cette borne il repasserait par un rayon négatif — donc nul, puis à
      // nouveau positif — et le voile se ROUVRIRAIT pendant le dépassement.
      const fermeture = douceur(Math.min(1, t / contact));
      const r = Math.max(0, rayon * (1 - fermeture));

      disques.push({
        offset: t,
        clipPath: `circle(${r}px at ${point.x}px ${point.y}px)`,
        easing: "linear",
      });
      vols.push({
        offset: t,
        transform: `translate(${point.x - x0}px, ${point.y - y0}px) scale(${
          1 + (echelle - 1) * u
        })`,
        // La couleur a fini de basculer AU CONTACT : à l'instant où le voile
        // s'éteint, la marque a déjà la couleur de la page.
        color: fermeture >= 1 ? couleurArrivee : undefined,
        easing: "linear",
      });
      bords.push({
        offset: t,
        transform: `translate(${point.x}px, ${point.y}px) scale(${Math.max(0.001, r)})`,
        // Le liseré s'éteint avec le disque, pas après : un trait qui survit à
        // la matière qu'il borde est un accessoire.
        opacity: fermeture >= 1 ? 0 : 1,
        easing: "linear",
      });
    }

    /* La couleur TIENT, puis bascule tard.
       Étalée sur toute la course, elle traversait le milieu du dégradé pendant
       que la marque était encore au cœur du disque : un logo lavande sur un
       panneau sombre, qui perdait sa lisibilité au pire moment. Elle ne
       change donc que sur le dernier septième avant le contact — quand le
       disque ne la couvre déjà presque plus, et qu'elle est physiquement sur
       la page. */
    const bascule = Math.min(0.998, contact * 0.86);
    const couleurs: Keyframe[] = [
      { offset: 0, color: couleurDepart },
      { offset: bascule, color: couleurDepart },
      { offset: Math.min(0.999, contact), color: couleurArrivee },
      { offset: 1, color: couleurArrivee },
    ];

    const options = {
      duration: config.exitMs,
      // LINÉAIRE, et c'est volontaire : toute la courbe est déjà dans les
      // échantillons. Une courbe ici la réappliquerait à chacun des trente
      // intervalles.
      easing: "linear",
      fill: "forwards" as const,
    };

    panneau.animate(disques, options);
    contenu.animate(vols, options);
    contenu.animate(couleurs, options);
    if (liseré) liseré.animate(bords, options);

    element.dataset.novaSettle = "flying";
    return { x: x1, y: y1 };
  }

  function sortir(): void {
    if (fini) return;
    // Le défilé s'arrête AVANT la sortie. Un mot qui continue de changer
    // pendant que le contenu s'efface donne deux mouvements contradictoires,
    // et on ne lit ni l'un ni l'autre.
    if (cycle !== null) {
      clearInterval(cycle);
      cycle = null;
    }
    element.dataset.novaLoaderState = "leaving";

    // Le vol se mesure APRÈS le passage à `leaving` — le contenu ne bouge pas
    // encore, mais l'attribut est posé, donc une feuille qui déplacerait quoi
    // que ce soit l'a déjà fait. Mesurer avant donnerait des rectangles
    // périmés d'une image.
    const origine = config.form === "settle" ? amerrir() : null;

    // LE RELAIS PART MAINTENANT, pas à la fin. Trois choses d'un coup, et
    // elles doivent partir ensemble : la page cesse d'être couverte — donc les
    // révélations retenues s'arment et ENTRENT pendant que le voile se
    // retire —, le CSS de la page peut lire un drapeau, et l'appelant est
    // prévenu. Prévenir à la fin ferait lire deux gestes à la suite au lieu
    // d'un seul.
    //
    // L'ORIGINE VOYAGE AVEC. Quand la marque a emporté le voile, la page ne
    // s'ouvre pas partout à la fois : elle s'ouvre DEPUIS le point
    // d'atterrissage, en sillage. C'est ce qui fait de l'arrivée du logo la
    // cause du mouvement de la page, et non un geste qui finit pendant qu'un
    // autre commence.
    decouvrir?.(origine ?? undefined);
    decouvrir = null;
    poserDrapeau();
    config.onReveal?.();
    minuteries.push(setTimeout(terminer, config.exitMs));
  }

  function skip(): void {
    if (fini) return;
    // On abrège l'ATTENTE, pas la sortie : c'est elle qui rappelle `sortir`,
    // et elle seule sait poser l'avancement à 1 avant de rendre la main.
    if (attente && !attente.done()) {
      attente.skip();
      return;
    }
    sortir();
  }

  function armerSaut(): void {
    if (!config.skippable) return;
    const evenements = [
      "wheel",
      "pointerdown",
      "keydown",
      "touchstart",
    ] as const;
    const sauter = () => skip();
    for (const nom of evenements) {
      window.addEventListener(nom, sauter, { passive: true, once: true });
    }
    detachements.push(() => {
      for (const nom of evenements) window.removeEventListener(nom, sauter);
    });
  }

  /* ── Le montage ─────────────────────────────────────────────────────── */

  function build(): void {
    element.dataset.novaLoader = config.form;
    element.dataset.novaLoaderState = "showing";
    element.setAttribute("aria-hidden", "true");
    element.style.setProperty("--nova-loader-exit", `${config.exitMs}ms`);
    element.style.setProperty("--nova-loader-progress", "0");

    // Le contenu fourni par l'appelant est enveloppé : c'est lui qui monte,
    // se retire, ou porte le mot d'accueil.
    contenu = document.createElement("div");
    contenu.className = "nova-loader__content";
    for (const noeud of contenuOrigine) contenu.appendChild(noeud);

    if (estLame(config.form)) construireLames();

    if (config.form === "settle") {
      panneau = document.createElement("div");
      panneau.className = "nova-loader__panel";
      element.appendChild(panneau);

      const svg = document.createElementNS(SVG_NS, "svg");
      svg.setAttribute("class", "nova-loader__rim");
      svg.setAttribute("aria-hidden", "true");
      liseré = document.createElementNS(SVG_NS, "circle");
      // Rayon UN : toute la taille vient de l'échelle, ce qui permet au trait
      // de rester à un pixel via `non-scaling-stroke`.
      liseré.setAttribute("r", "1");
      liseré.setAttribute("vector-effect", "non-scaling-stroke");
      svg.appendChild(liseré);
      element.appendChild(svg);
    }

    element.appendChild(contenu);

    if (config.form === "greetings") {
      const mots = config.greetings ?? SALUTATIONS;
      // L'entrée d'un mot doit se terminer avant l'arrivée du suivant, sinon
      // on lit un fondu permanent au lieu d'une succession de mots.
      element.style.setProperty("--nova-loader-step", `${config.stepMs}ms`);

      const mot = document.createElement("span");
      mot.className = "nova-loader__greeting";
      mot.textContent = mots[0] ?? "";
      mot.dataset.novaParite = "0";
      contenu.appendChild(mot);

      let index = 0;
      let pas = 0;
      cycle = setInterval(() => {
        index = (index + 1) % mots.length;
        mot.textContent = mots[index] ?? "";
        // CHANGER UN ATTRIBUT NE REJOUE PAS UNE ANIMATION CSS. Changer son
        // `animation-name`, si : la parité fait alterner entre deux keyframes
        // identiques sous deux noms. Sans cela l'animation jouait une fois,
        // au montage, et les dix-neuf mots suivants se substituaient d'un
        // coup — c'est le clignotement qu'on prenait pour un rideau raté.
        // La parité compte les PAS, pas l'index : une liste de longueur
        // impaire reboucle sur la même parité et ne rejouerait rien.
        pas += 1;
        mot.dataset.novaParite = pas % 2 === 0 ? "0" : "1";
      }, config.stepMs);
    }
  }

  /**
   * Le rideau à lames — la grille, les rangs, les origines.
   *
   * TOUTE la chorégraphie tient dans `exitMs`, dernière pièce comprise. Le
   * rideau est retiré de la page à la fin de ce budget : une pièce encore en
   * course y était coupée net, et la sortie se terminait par un saut au lieu
   * d'un retrait. 55 % pour la course d'une pièce, 40 % pour l'étalement, 5 %
   * de marge — une transition démarre à l'image SUIVANTE, pas au poser de
   * l'attribut.
   */
  function construireLames(): void {
    const choregraphie = CHOREGRAPHIES[config.form]!;
    const { colonnes, rangs } = choregraphie.grille(Math.max(1, config.blades));

    // Le rang le plus tardif fixe l'échelle : chaque chorégraphie compte ses
    // pièces comme elle veut, et l'étalement se normalise ensuite. C'est ce
    // qui permet à une vague sur trente cases et à une vague sur six lames de
    // tenir dans le MÊME budget de sortie.
    let rangMax = 0;
    for (let col = 0; col < colonnes; col++) {
      for (let rang = 0; rang < rangs; rang++) {
        rangMax = Math.max(rangMax, choregraphie.rang(col, rang, colonnes, rangs));
      }
    }

    const course = config.exitMs * 0.55;
    const etalement = config.exitMs * 0.4;
    element.style.setProperty("--nova-loader-blade", `${course}ms`);

    const rideau = document.createElement("div");
    rideau.className = "nova-loader__blades";

    for (let rang = 0; rang < rangs; rang++) {
      for (let col = 0; col < colonnes; col++) {
        const position = choregraphie.rang(col, rang, colonnes, rangs);
        const retard = rangMax > 0 ? (position / rangMax) * etalement : 0;

        const piece = document.createElement("span");
        piece.className = "nova-loader__blade";
        piece.style.left = `${(col / colonnes) * 100}%`;
        piece.style.top = `${(rang / rangs) * 100}%`;
        // Un pixel de recouvrement : à largeur exacte, l'arrondi sous-pixel
        // laisse une raie du fond entre deux pièces, et on croit voir un
        // défaut de rendu là où il n'y a qu'un joint.
        piece.style.width = `calc(${100 / colonnes}% + 1px)`;
        piece.style.height = `calc(${100 / rangs}% + 1px)`;
        // Les pièces se retirent l'une après l'autre : c'est le décalage qui
        // fait le calepinage, pas un rideau qui tombe d'un bloc.
        piece.style.setProperty("--nova-blade-delay", `${retard}ms`);
        if (choregraphie.origine) {
          piece.style.setProperty(
            "--nova-blade-origin",
            choregraphie.origine(col, rang, colonnes, rangs),
          );
        }
        rideau.appendChild(piece);
      }
    }

    element.appendChild(rideau);
  }

  function start(): void {
    if (!isBrowser) return;

    // Mouvement réduit, ou rideau déjà vu : rien n'est monté du tout, et la
    // suite du scénario part immédiatement. Le relais part avec, sinon une
    // page qui attend `onReveal` pour entrer resterait invisible.
    if (prefersReducedMotion() || deja()) {
      element.dataset.novaLoaderState = "done";
      poserDrapeau();
      config.onReveal?.();
      config.onDone?.();
      fini = true;
      return;
    }

    marquer();
    build();
    armerSaut();

    // Le rideau se déclare AVANT que l'attente ne commence : les moteurs
    // d'entrée montés dans le même tour doivent trouver la page déjà couverte,
    // sinon ils s'arment et jouent derrière le voile.
    if (porteLaPage()) decouvrir = coverPage();

    attente = createReady({
      until: config.until,
      minMs: config.minMs,
      maxMs: config.maxMs,
      holdMs: config.holdMs,
      onProgress(part) {
        // Le moteur pose la variable, le CSS dessine la barre. C'est la même
        // division que partout ailleurs dans Nova, et c'est ce qui rend
        // l'apparence surchargeable sans forker le moteur.
        element.style.setProperty("--nova-loader-progress", `${part}`);
        config.onProgress?.(part);
      },
      onReady: sortir,
    });
  }

  start();

  return {
    element,
    skip,
    update(next) {
      // Un rideau ne se reconfigure pas en cours de route : il dure une
      // seconde. On accepte les réglages tant qu'il n'a pas commencé.
      config = mergeOptions(config, next);
    },
    destroy() {
      for (const minuterie of minuteries) clearTimeout(minuterie);
      minuteries.length = 0;
      if (cycle !== null) clearInterval(cycle);
      cycle = null;
      attente?.destroy();
      attente = null;
      // Sans ce retrait, un rideau démonté avant sa sortie laisserait la page
      // couverte POUR TOUJOURS : plus aucune entrée ne s'armerait nulle part,
      // et rien ne dirait pourquoi.
      decouvrir?.();
      decouvrir = null;
      rendrePlace();
      for (const detacher of detachements) detacher();
      detachements.length = 0;
      element.textContent = "";
      for (const noeud of contenuOrigine) element.appendChild(noeud);
      element.removeAttribute("aria-hidden");
      contenu = null;
      panneau = null;
      liseré = null;
      delete element.dataset.novaLoader;
      delete element.dataset.novaLoaderState;
      delete element.dataset.novaSettle;
      if (isBrowser && drapeauPose) {
        delete document.documentElement.dataset.novaLoaded;
        drapeauPose = false;
      }
      element.style.removeProperty("--nova-loader-exit");
      element.style.removeProperty("--nova-loader-blade");
      element.style.removeProperty("--nova-loader-step");
      element.style.removeProperty("--nova-loader-progress");
    },
  };
}
