/**
 * Magnet — l'attraction au pointeur, arbitrée.
 *
 * L'effet est connu : un élément penche vers le curseur qui l'approche, et
 * revient à sa place quand il s'éloigne. Ce qui suit n'est pas cette
 * implémentation-là.
 *
 * CE QUE TOUTES LES COPIES RATENT. Dans la version qu'on trouve partout, chaque
 * élément est une ÎLE : il pose son propre écouteur, mesure sa propre distance,
 * et tire dès que le pointeur entre dans son rayon. Sur une rangée de boutons
 * espacés de moins de deux rayons — c'est-à-dire une barre de navigation, le
 * cas le plus courant — le curseur posé entre deux d'entre eux est dans les
 * DEUX champs. Les deux penchent ensemble, et la rangée gondole. Ce n'est pas
 * du magnétisme, c'est de la gelée : un champ réel a un gagnant.
 *
 * L'ARBITRE. Tous les aimants de la page sont tenus dans un registre unique et
 * départagés à chaque image : le plus proche — parmi ceux dont le pointeur est
 * dans LEUR rayon — capture, et les autres lâchent. C'est ce qui demande une
 * librairie plutôt qu'un extrait recopié : il faut un endroit où les aimants se
 * connaissent, et `internal/pointer.ts` l'avait prévu avant que ce moteur
 * existe.
 *
 * UN SEUL RESSORT, DEUX RÉGIMES. Tenu, l'aimant est amorti critique : il suit
 * le pointeur sans osciller autour, sinon on lirait un tremblement et non une
 * prise. Lâché, il est sous-amorti : il DÉPASSE sa place avant de s'y ranger,
 * comme une chose qu'on tenait et qu'on relâche. C'est le même intégrateur avec
 * deux coefficients, pas deux animations à raccorder — un raccord se verrait à
 * l'image où l'on passe de l'un à l'autre.
 *
 * CE MOTEUR ANIME EN JAVASCRIPT, et il en paie le prix comme les moteurs GSAP :
 * il lit `prefers-reduced-motion` à la main, et se réarme si le réglage change
 * en cours de session. Aucune règle CSS ne peut annuler un ressort.
 *
 * Ce qu'il pose, en revanche, reste du CSS : deux variables et un attribut. La
 * feuille de style applique le déplacement par la propriété `translate`, pas
 * par `transform` — l'appelant garde donc son `transform` pour lui, et peut
 * composer un survol sans redéclarer la translation ni forker le moteur.
 */

import {
  isBrowser,
  isFinePointer,
  onReducedMotionChange,
  prefersReducedMotion,
} from "../internal/env";
import { acquirePointerTracking, pointerState } from "../internal/pointer";
import { subscribe } from "../internal/ticker";
import { mergeOptions } from "../internal/options";
import type { NovaInstance } from "../internal/types";

export interface MagnetOptions {
  /**
   * Part de la distance couverte par l'élément, entre 0 et 1. Défaut : 0.35.
   *
   * À 1 l'élément rejoint le pointeur, ce qui se lit comme une aimantation
   * totale et fait perdre la place de départ. La valeur basse est ce qui rend
   * le geste lisible : on doit voir l'élément PENCHER, pas déménager.
   */
  force?: number;
  /** Rayon de capture, en pixels. Défaut : 140. */
  radius?: number;
  /**
   * Raideur du ressort. Défaut : 0.18. Plus haut, l'élément colle au pointeur ;
   * plus bas, il traîne.
   */
  stiffness?: number;
  /**
   * Dépassement au retour, entre 0 et 1. Défaut : 0.35.
   *
   * À 0 l'élément rentre sans dépasser — ce qui se lit comme un calcul et non
   * comme un relâchement. C'est la même raison que la cambrure de `settle` :
   * un trajet exact n'a pas l'air d'un geste.
   */
  overshoot?: number;
}

const defaults = {
  force: 0.35,
  radius: 140,
  stiffness: 0.18,
  overshoot: 0.35,
};

type Config = typeof defaults;

interface Aimant {
  element: HTMLElement;
  config: Config;
  /** Décalage appliqué, en pixels. C'est LUI qu'on retire avant de mesurer. */
  x: number;
  y: number;
  /** Vitesse du ressort, en pixels par image de 60 Hz. */
  vx: number;
  vy: number;
  /** Cible du ressort pour l'image en cours, posée par l'arbitre. */
  cx: number;
  cy: number;
  tenu: boolean;
}

/* ────────────────────────────────────────────────────────────────────────
   L'arbitre — un registre, une boucle, un écouteur.

   Le registre est au niveau du MODULE et non de l'instance : c'est la seule
   façon pour deux aimants de se départager, et c'est aussi ce qui tient la
   règle « une seule boucle » du dépôt. Dix aimants sur une page, c'est un
   abonnement au ticker, pas dix.
   ──────────────────────────────────────────────────────────────────────── */

/**
 * Marge de relâchement, en fraction du rayon.
 *
 * 15 % : assez pour absorber le sous-pixel et le tremblement de la main, trop
 * peu pour qu'on perçoive une zone de capture plus large qu'annoncée.
 */
const HYSTERESIS = 0.15;

const aimants = new Set<Aimant>();
let desabonner: (() => void) | null = null;
let relacherPointeur: (() => void) | null = null;

function inscrire(aimant: Aimant): void {
  aimants.add(aimant);
  if (aimants.size === 1) {
    relacherPointeur = acquirePointerTracking();
    desabonner = subscribe(image);
  }
}

function retirer(aimant: Aimant): void {
  aimants.delete(aimant);
  if (aimants.size === 0) {
    desabonner?.();
    desabonner = null;
    relacherPointeur?.();
    relacherPointeur = null;
  }
}

/**
 * Le centre de l'élément À SA PLACE, et non là où le moteur l'a mis.
 *
 * NE JAMAIS MESURER PAR-DESSUS CE QU'ON A SOI-MÊME ÉCRIT — c'est le piège de
 * `dial.ts`, et il est ici aussi. Le rectangle rendu inclut le décalage déjà
 * appliqué : s'en servir tel quel ferait rétrécir `dx` à mesure que l'élément
 * approche, donc converger vers un point court de la cible, et pire, ferait
 * DÉRIVER le rayon de capture avec l'élément. On retranche le décalage, et la
 * mesure redevient idempotente.
 */
function centreAuRepos(aimant: Aimant): { x: number; y: number; vide: boolean } {
  const r = aimant.element.getBoundingClientRect();
  return {
    x: r.left + r.width / 2 - aimant.x,
    y: r.top + r.height / 2 - aimant.y,
    // Une mesure peut valoir zéro, et c'est un cas réel : conteneur en
    // `display: none`, panneau replié, appel avant la première mise en page.
    // Un élément sans boîte ne capture rien — sinon son centre serait (0,0),
    // c'est-à-dire le coin de l'écran, et il volerait la capture au voisin.
    vide: r.width === 0 && r.height === 0,
  };
}

/**
 * Une image : on départage, puis on intègre.
 *
 * La mesure se fait ICI et jamais dans un écouteur. `pointermove` tire des
 * dizaines d'événements par image, et chacun forcerait autant de calculs de
 * mise en page qu'il y a d'aimants.
 */
function image(_now: number, delta: number): void {
  /* Le pas, en images de 60 Hz, PLAFONNÉ. Un onglet qu'on revient voir livre un
     delta de plusieurs secondes : intégré tel quel, le ressort explose et
     l'élément part à l'autre bout de la page. Le plafond coûte une image de
     retard et supprime le cas. */
  const pas = Math.min(delta || 16.667, 32) / 16.667;

  /* ── Qui capture ? ────────────────────────────────────────────────────
     Le plus proche PARMI CEUX dont le pointeur est dans leur propre rayon.
     Comparer les distances brutes suffit : un aimant au grand rayon ne doit
     pas voler la capture à un voisin plus proche, et c'est exactement ce que
     dit ce critère. */
  let captif: Aimant | null = null;
  let meilleure = Infinity;
  const mesures = new Map<Aimant, { x: number; y: number }>();

  if (pointerState.active) {
    for (const aimant of aimants) {
      const centre = centreAuRepos(aimant);
      if (centre.vide) continue;
      mesures.set(aimant, centre);
      const dx = pointerState.x - centre.x;
      const dy = pointerState.y - centre.y;
      const distance = Math.hypot(dx, dy);

      /* DÉCOLLER DEMANDE PLUS QUE COLLER — et ce n'est pas une coquetterie
         physique, c'est ce qui supprime une classe entière de défauts. Sans
         hystérésis, un élément dont le pointeur est posé PILE sur son rayon
         entre et sort de la capture à chaque image : le sous-pixel du
         rectangle rendu suffit à faire basculer la comparaison. On l'a vu au
         test — l'élément s'immobilisait aux deux tiers de sa course, coincé
         entre une cible pleine et une cible nulle qui alternaient. Et un
         `data-nova-magnet-state` qui bascule soixante fois par seconde
         transforme la moindre transition CSS de l'appelant en stroboscope.

         L'hystérésis ne s'applique qu'au SEUIL : c'est toujours la distance
         brute qui départage, donc un voisin plus proche reprend la capture
         même si le tenant est encore dans sa marge. */
      const seuil =
        aimant.config.radius * (aimant.tenu ? 1 + HYSTERESIS : 1);
      if (distance <= seuil && distance < meilleure) {
        meilleure = distance;
        captif = aimant;
      }
    }
  }

  /* ── Le ressort ───────────────────────────────────────────────────────── */
  for (const aimant of aimants) {
    const tenu = aimant === captif;
    const centre = mesures.get(aimant);

    if (tenu && centre) {
      aimant.cx = (pointerState.x - centre.x) * aimant.config.force;
      aimant.cy = (pointerState.y - centre.y) * aimant.config.force;
    } else {
      aimant.cx = 0;
      aimant.cy = 0;
    }

    /* Amortissement critique tant qu'on tient — sinon l'élément oscillerait
       autour du pointeur et on lirait un tremblement, pas une prise. Au
       relâchement il descend sous le critique, et c'est CE dépassement qui
       fait la différence entre « ça revient » et « on l'a lâché ». */
    const k = aimant.config.stiffness;
    const zeta = tenu
      ? 1
      : 1 - 0.55 * Math.min(1, Math.max(0, aimant.config.overshoot));
    const d = 2 * Math.sqrt(k) * zeta;

    aimant.vx += ((aimant.cx - aimant.x) * k - aimant.vx * d) * pas;
    aimant.vy += ((aimant.cy - aimant.y) * k - aimant.vy * d) * pas;
    aimant.x += aimant.vx * pas;
    aimant.y += aimant.vy * pas;

    ecrire(aimant, tenu);
  }
}

/**
 * Ce que le moteur pose : deux variables, une part, un état.
 *
 * Rien d'autre. La feuille de style applique le déplacement, et l'appelant qui
 * veut faire réagir son bouton à la prise le fait sur `data-nova-magnet-state`
 * sans toucher au moteur.
 */
function ecrire(aimant: Aimant, tenu: boolean): void {
  const style = aimant.element.style;
  style.setProperty("--nova-magnet-x", `${aimant.x.toFixed(2)}px`);
  style.setProperty("--nova-magnet-y", `${aimant.y.toFixed(2)}px`);

  /* La part de la prise, de 0 à 1 : de quoi faire grossir une ombre ou lever
     un liseré en CSS pur. Le dénominateur est le déplacement MAXIMAL possible
     — le rayon fois la force — donc la valeur reste comparable d'un aimant à
     l'autre quels que soient leurs réglages. */
  const plein = aimant.config.radius * aimant.config.force;
  const part = plein > 0 ? Math.hypot(aimant.x, aimant.y) / plein : 0;
  style.setProperty("--nova-magnet-pull", Math.min(1, part).toFixed(3));

  if (tenu !== aimant.tenu) {
    aimant.tenu = tenu;
    aimant.element.dataset.novaMagnetState = tenu ? "held" : "idle";
  }
}

/** Rend l'élément à son état de départ. */
function nettoyer(element: HTMLElement): void {
  element.style.removeProperty("--nova-magnet-x");
  element.style.removeProperty("--nova-magnet-y");
  element.style.removeProperty("--nova-magnet-pull");
  delete element.dataset.novaMagnet;
  delete element.dataset.novaMagnetState;
}

export function createMagnet(
  element: HTMLElement,
  options: MagnetOptions = {},
): NovaInstance<MagnetOptions> {
  let config = mergeOptions(defaults, options);

  const aimant: Aimant = {
    element,
    config,
    x: 0,
    y: 0,
    vx: 0,
    vy: 0,
    cx: 0,
    cy: 0,
    tenu: false,
  };

  let arme = false;

  /**
   * Un aimant n'a de sens que sous un pointeur qui SURVOLE.
   *
   * Au doigt il n'y a pas d'approche : on touche, ou on ne touche pas. L'effet
   * ne se déclencherait qu'au contact, c'est-à-dire trop tard pour être vu, et
   * il déplacerait la cible sous le doigt au moment précis où l'on appuie.
   */
  function armer(): void {
    if (arme) return;
    if (!isBrowser || !isFinePointer() || prefersReducedMotion()) return;
    arme = true;
    element.dataset.novaMagnet = "";
    element.dataset.novaMagnetState = "idle";
    inscrire(aimant);
  }

  function desarmer(): void {
    if (!arme) return;
    arme = false;
    retirer(aimant);
    /* On rend la place, et sans transition : le réglage vient de changer, on
       n'a pas le droit d'animer le retour de ce qui doit cesser d'animer. */
    aimant.x = 0;
    aimant.y = 0;
    aimant.vx = 0;
    aimant.vy = 0;
    aimant.tenu = false;
    nettoyer(element);
  }

  armer();

  /* Le réglage système peut basculer en cours de session. Un moteur qui ne
     l'écoute pas reste armé alors que l'utilisateur vient de demander le
     contraire — et aucune règle CSS ne viendra l'arrêter à sa place. */
  const desabonnerReduit = onReducedMotionChange((reduit) => {
    if (reduit) desarmer();
    else armer();
  });

  return {
    element,
    update(next) {
      config = mergeOptions(config, next);
      aimant.config = config;
    },
    destroy() {
      desabonnerReduit();
      desarmer();
      /* Même si le moteur n'a jamais été armé — pointeur grossier, mouvement
         réduit : `destroy()` doit rendre un élément propre dans tous les cas,
         et non seulement dans celui où il avait quelque chose à défaire. */
      nettoyer(element);
    },
  };
}
