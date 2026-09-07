/**
 * SplitText — titre au masque, mot par mot ou lettre par lettre.
 *
 * Chaque unité est enfermée dans une fenêtre en `overflow: hidden` et monte
 * dedans, avec un décalage régulier. Porté de `SplitTitle` (Bât-et-Verre 3D),
 * qui gérait déjà correctement le débord des jambages (`pb`/`-mb` compensés).
 *
 * Accessibilité : le texte d'origine est conservé dans `aria-label` et les
 * fragments sont masqués aux lecteurs d'écran — sans quoi un titre découpé se
 * fait épeler mot par mot.
 */

import { isBrowser, prefersReducedMotion } from "../internal/env";
import { observeInView, isAlreadyInView } from "../internal/in-view";
import { mergeOptions } from "../internal/options";
import type { NovaInstance, Trigger } from "../internal/types";

export interface SplitTextOptions {
  /** Texte à découper. Défaut : le `textContent` de l'élément. */
  text?: string;
  /** Granularité du découpage. Défaut : `word`. */
  by?: "word" | "char";
  /** Durée d'une unité, en ms. Défaut : 800. */
  duration?: number;
  /** Retard avant la première unité, en ms. Défaut : 0. */
  delay?: number;
  /** Décalage entre deux unités, en ms. Défaut : 60. */
  stagger?: number;
  /** Timing CSS. Défaut : la courbe expo de Nova. */
  easing?: string;
  /** Quand jouer. Défaut : `view`. */
  trigger?: Trigger;
  rootMargin?: string;
  threshold?: number;
  onComplete?: () => void;
}

const defaults = {
  by: "word" as const,
  duration: 800,
  delay: 0,
  stagger: 60,
  trigger: "view" as Trigger,
};

export function createSplitText(
  element: HTMLElement,
  options: SplitTextOptions = {},
): NovaInstance<SplitTextOptions> & { play(): void } {
  let config = mergeOptions(defaults, options);
  let text = config.text ?? element.textContent ?? "";
  let units: HTMLElement[] = [];
  let detach: (() => void) | null = null;
  let completionTimer: ReturnType<typeof setTimeout> | null = null;

  function build(): void {
    element.textContent = "";
    element.dataset.novaSplit = config.by;
    element.setAttribute("aria-label", text);
    units = [];

    // On découpe en gardant les espaces : `split(/(\s+)/)` conserve les
    // séparateurs, sans quoi les mots se recolleraient.
    const pieces =
      config.by === "word" ? text.split(/(\s+)/) : Array.from(text);

    for (const piece of pieces) {
      if (piece === "") continue;

      // Un blanc reste un vrai nœud texte : il ne doit ni s'animer, ni être
      // enfermé dans une fenêtre (sinon la césure se casse).
      if (/^\s+$/.test(piece)) {
        element.appendChild(document.createTextNode(piece));
        continue;
      }

      const window_ = document.createElement("span");
      window_.className = "nova-split__window";
      window_.setAttribute("aria-hidden", "true");

      const inner = document.createElement("span");
      inner.className = "nova-split__unit";
      inner.textContent = piece;

      window_.appendChild(inner);
      element.appendChild(window_);
      units.push(inner);
    }

    applyTiming();
  }

  function applyTiming(): void {
    element.style.setProperty("--nova-split-duration", `${config.duration}ms`);
    if (config.easing) {
      element.style.setProperty("--nova-split-easing", config.easing);
    }
    units.forEach((unit, index) => {
      unit.style.setProperty(
        "--nova-split-delay",
        `${config.delay + index * config.stagger}ms`,
      );
    });
  }

  function play(): void {
    element.dataset.novaSplitState = "shown";
    if (completionTimer) clearTimeout(completionTimer);
    if (config.onComplete) {
      const total =
        config.delay +
        Math.max(0, units.length - 1) * config.stagger +
        config.duration;
      completionTimer = setTimeout(() => config.onComplete?.(), total);
    }
  }

  function arm(): void {
    detach?.();
    detach = null;
    if (!isBrowser) return;
    if (prefersReducedMotion()) return;
    if (config.trigger === "manual") return;
    if (config.trigger === "mount") {
      element.dataset.novaSplitState = "hidden";
      // Une frame pour que l'état caché soit peint avant la transition.
      requestAnimationFrame(() => requestAnimationFrame(play));
      return;
    }
    // `view` : même garde-fou que Reveal — rien n'est caché si c'est déjà lu.
    if (isAlreadyInView(element)) return;

    element.dataset.novaSplitState = "hidden";
    detach = observeInView(element, (visible) => visible && play(), {
      rootMargin: config.rootMargin,
      threshold: config.threshold,
      once: true,
    });
  }

  build();
  arm();

  return {
    element,
    play,
    update(next) {
      const textChanged = next.text !== undefined && next.text !== text;
      const byChanged = next.by !== undefined && next.by !== config.by;
      config = mergeOptions(config, next);
      if (textChanged || byChanged) {
        text = config.text ?? text;
        build();
        arm();
      } else {
        applyTiming();
      }
    },
    destroy() {
      detach?.();
      detach = null;
      if (completionTimer) clearTimeout(completionTimer);
      element.textContent = text;
      element.removeAttribute("aria-label");
      delete element.dataset.novaSplit;
      delete element.dataset.novaSplitState;
      element.style.removeProperty("--nova-split-duration");
      element.style.removeProperty("--nova-split-easing");
    },
  };
}
