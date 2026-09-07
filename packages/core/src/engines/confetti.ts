/**
 * Confetti — salve de particules.
 *
 * Porté du portfolio, avec quatre corrections :
 *  - un seul conteneur en position fixe, au lieu de 50 nœuds injectés
 *    directement dans `<body>` ;
 *  - l'origine de la salve est paramétrable (par défaut le haut de l'écran,
 *    mais on peut tirer depuis un bouton) ;
 *  - `prefers-reduced-motion` annule la salve ;
 *  - `destroy()` interrompt les animations en cours, ce qui manquait : une
 *    navigation pendant la chute laissait des nœuds orphelins.
 */

import { isBrowser, prefersReducedMotion } from "../internal/env";

export interface ConfettiOptions {
  /** Nombre de particules. Défaut : 50. */
  count?: number;
  /** Palette. Défaut : la palette or/bronze du portfolio. */
  colors?: string[];
  /** Origine de la salve, en coordonnées viewport. Défaut : haut, aléatoire en x. */
  origin?: { x: number; y: number };
  /** Dispersion horizontale en px. Défaut : 200. */
  spread?: number;
  /** Durée de chute en ms (une part d'aléatoire s'y ajoute). Défaut : 3000. */
  duration?: number;
  /** Taille d'une particule en px. Défaut : 10. */
  size?: number;
  /** Forme des particules. Défaut : `mixed`. */
  shape?: "circle" | "square" | "mixed";
}

const DEFAULT_COLORS = ["#D4AF37", "#B87333", "#8A9A5B", "#FFD700", "#FFA500"];

let container: HTMLElement | null = null;
const running = new Set<Animation>();

function ensureContainer(): HTMLElement {
  if (container?.isConnected) return container;
  container = document.createElement("div");
  container.dataset.novaConfetti = "";
  container.setAttribute("aria-hidden", "true");
  document.body.appendChild(container);
  return container;
}

/**
 * Tire une salve. Renvoie une promesse résolue quand toutes les particules
 * ont fini de tomber — pratique pour enchaîner (fermer une modale, par ex.).
 */
export function confetti(options: ConfettiOptions = {}): Promise<void> {
  if (!isBrowser || prefersReducedMotion()) return Promise.resolve();

  const {
    count = 50,
    colors = DEFAULT_COLORS,
    origin,
    spread = 200,
    duration = 3000,
    size = 10,
    shape = "mixed",
  } = options;

  const host = ensureContainer();
  const animations: Promise<unknown>[] = [];

  for (let index = 0; index < count; index++) {
    const particle = document.createElement("i");
    const round =
      shape === "circle" || (shape === "mixed" && Math.random() > 0.5);

    particle.style.cssText = [
      "position:absolute",
      `width:${size}px`,
      `height:${size}px`,
      `background:${colors[index % colors.length]}`,
      `border-radius:${round ? "50%" : "2px"}`,
      `left:${origin ? origin.x : Math.random() * window.innerWidth}px`,
      `top:${origin ? origin.y : -size}px`,
      "will-change:transform,opacity",
    ].join(";");

    host.appendChild(particle);

    const fall = duration + Math.random() * 2000;
    const drift = (Math.random() - 0.5) * spread;
    const spin = 360 * Math.random() * 5;
    const distance = window.innerHeight - (origin?.y ?? 0) + size * 2;

    const animation = particle.animate(
      [
        { transform: "translate(0, 0) rotate(0deg)", opacity: 1 },
        {
          transform: `translate(${drift}px, ${distance}px) rotate(${spin}deg)`,
          opacity: 0,
        },
      ],
      { duration: fall, easing: "cubic-bezier(0.25, 0.46, 0.45, 0.94)" },
    );

    running.add(animation);
    animations.push(
      animation.finished
        .catch(() => {}) // une annulation ne doit pas remonter comme une erreur
        .finally(() => {
          running.delete(animation);
          particle.remove();
        }),
    );
  }

  return Promise.all(animations).then(() => {
    if (container && container.childElementCount === 0) {
      container.remove();
      container = null;
    }
  });
}

/** Interrompt toutes les salves en cours et retire le conteneur. */
confetti.stop = function stop(): void {
  for (const animation of running) animation.cancel();
  running.clear();
  container?.remove();
  container = null;
};
