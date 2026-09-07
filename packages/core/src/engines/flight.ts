/**
 * Flight — un élément qui vole d'un point à un autre.
 *
 * Un fantôme est cloné depuis la source, posé en position fixe exactement
 * là où elle se trouve, puis animé jusqu'à la cible avant d'être retiré. Ni
 * la source ni la cible ne bougent : c'est le fantôme seul qui traverse.
 *
 * C'est le geste qui relie deux endroits d'une page — la preuve qui part du
 * texte et rejoint sa marge, l'article qui rejoint le panier, la vignette qui
 * s'ouvre en visionneuse. Généralisé depuis `FindingFlightLayer` (générateur
 * de CV) et l'ouverture FLIP de `VisionneuseVerre` (Bât-et-Verre).
 *
 * Deux principes tenus de l'original :
 *
 *  - **rien ne vole hors de l'écran.** Si la source n'est pas visible, le vol
 *    n'a aucun sens spatial : il n'apporte rien et coûte une animation. Le
 *    moteur renonce et le signale, à charge de l'appelant de replier sur autre
 *    chose — une notification, par exemple ;
 *  - **le fantôme est inerte.** Cloné sans identifiants, sans focus possible,
 *    hors du flux et hors de l'arbre d'accessibilité. Un doublon annonçable
 *    ferait entendre deux fois la même chose.
 */

import { isBrowser, prefersReducedMotion } from "../internal/env";

export interface FlightOptions {
  /** Durée du vol, en ms. Défaut : 900. */
  duration?: number;
  /** Timing CSS. Défaut : une courbe qui part vite et se pose. */
  easing?: string;
  /** Échelle à l'arrivée. Défaut : 0.6 — le fantôme se réduit en volant. */
  scale?: number;
  /** Opacité à l'arrivée. Défaut : 0. */
  opacity?: number;
  /**
   * Cambrure du vol, en fraction de la distance. `0` donne une ligne droite.
   * Défaut : 0.18 — un arc léger, qui se lit comme un geste et non comme une
   * interpolation.
   */
  arc?: number;
  /**
   * Nœud à faire voler. Par défaut, un clone de la source. Passer un nœud
   * permet de faire voler autre chose que ce qu'on montre — une pastille
   * plutôt qu'un paragraphe entier.
   */
  ghost?: HTMLElement;
  /** Appelé à l'arrivée, ou tout de suite si le vol n'a pas lieu. */
  onArrive?: () => void;
}

const defaults = {
  duration: 900,
  easing: "cubic-bezier(0.22, 1, 0.36, 1)",
  scale: 0.6,
  opacity: 0,
  arc: 0.18,
};

/** `true` si le rectangle croise le viewport. */
function estVisible(rect: DOMRect): boolean {
  return (
    rect.bottom > 0 &&
    rect.right > 0 &&
    rect.top < window.innerHeight &&
    rect.left < window.innerWidth
  );
}

let conteneur: HTMLElement | null = null;

function conteneurDeVol(): HTMLElement {
  if (conteneur?.isConnected) return conteneur;
  conteneur = document.createElement("div");
  conteneur.dataset.novaFlight = "";
  conteneur.setAttribute("aria-hidden", "true");
  document.body.appendChild(conteneur);
  return conteneur;
}

export interface FlightResult {
  /** `false` quand le vol n'a pas eu lieu — hors écran, ou mouvement réduit. */
  flew: boolean;
}

/**
 * Fait voler un fantôme de `source` vers `target`.
 *
 * Renvoie une promesse résolue à l'arrivée. `flew: false` signale que rien
 * n'a volé : la source était hors écran, ou le visiteur a demandé moins de
 * mouvement. Dans les deux cas `onArrive` est appelé quand même, pour que la
 * suite du scénario ne reste pas suspendue.
 */
export function flight(
  source: HTMLElement,
  target: HTMLElement | { x: number; y: number },
  options: FlightOptions = {},
): Promise<FlightResult> {
  const config = { ...defaults, ...options };

  if (!isBrowser) {
    config.onArrive?.();
    return Promise.resolve({ flew: false });
  }

  const depart = source.getBoundingClientRect();

  if (prefersReducedMotion() || !estVisible(depart)) {
    config.onArrive?.();
    return Promise.resolve({ flew: false });
  }

  const arrivee =
    target instanceof HTMLElement
      ? (() => {
          const rect = target.getBoundingClientRect();
          return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
        })()
      : target;

  const fantome =
    config.ghost ?? (source.cloneNode(true) as HTMLElement);

  // Un clone traîne les identifiants de son modèle : deux `id` identiques
  // dans le document, et tout `label for` ou `aria-labelledby` se met à
  // désigner le fantôme.
  fantome.removeAttribute("id");
  for (const noeud of fantome.querySelectorAll("[id]")) {
    noeud.removeAttribute("id");
  }
  // Rien de focusable ne doit rester : un fantôme qui capte la tabulation est
  // un piège clavier de neuf cents millisecondes.
  fantome.setAttribute("inert", "");
  fantome.setAttribute("aria-hidden", "true");
  fantome.classList.add("nova-flight__ghost");

  Object.assign(fantome.style, {
    position: "fixed",
    left: `${depart.left}px`,
    top: `${depart.top}px`,
    width: `${depart.width}px`,
    height: `${depart.height}px`,
    margin: "0",
  });

  conteneurDeVol().appendChild(fantome);

  const dx = arrivee.x - (depart.left + depart.width / 2);
  const dy = arrivee.y - (depart.top + depart.height / 2);

  // Le sommet de l'arc est perpendiculaire à la trajectoire : le vol se
  // courbe dans le sens du geste, pas systématiquement vers le haut.
  const distance = Math.hypot(dx, dy);
  const cambrure = distance * config.arc;
  const mx = dx / 2 - (dy / (distance || 1)) * cambrure;
  const my = dy / 2 + (dx / (distance || 1)) * cambrure;

  const animation = fantome.animate(
    [
      { transform: "translate(0, 0) scale(1)", opacity: 1, offset: 0 },
      {
        transform: `translate(${mx}px, ${my}px) scale(${(1 + config.scale) / 2})`,
        offset: 0.5,
      },
      {
        transform: `translate(${dx}px, ${dy}px) scale(${config.scale})`,
        opacity: config.opacity,
        offset: 1,
      },
    ],
    { duration: config.duration, easing: config.easing, fill: "forwards" },
  );

  return animation.finished
    .catch(() => {}) // une annulation ne doit pas remonter comme une erreur
    .then(() => {
      fantome.remove();
      if (conteneur && conteneur.childElementCount === 0) {
        conteneur.remove();
        conteneur = null;
      }
      config.onArrive?.();
      return { flew: true };
    });
}

/** Interrompt tous les vols en cours et retire le conteneur. */
flight.stop = function stop(): void {
  if (!conteneur) return;
  for (const fantome of conteneur.children) {
    for (const animation of fantome.getAnimations()) animation.cancel();
  }
  conteneur.remove();
  conteneur = null;
};
