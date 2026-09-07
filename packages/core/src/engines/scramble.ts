/**
 * Scramble — effet « decode ».
 *
 * Le texte se brouille en caractères aléatoires puis se reforme lettre par
 * lettre. Les caractères encore brouillés portent `data-nova-scrambled="true"`,
 * ce qui permet de les colorer en CSS (accent corail dans l'implémentation
 * d'origine) sans que le moteur ne connaisse la palette.
 *
 * Porté de `ScrambleText` (portfolio), avec trois différences :
 *  - les `<span>` sont créés une fois et réutilisés à chaque frame, au lieu
 *    d'être reconstruits (là où React re-rendait 40 nœuds tous les 52 ms) ;
 *  - la boucle passe par le ticker partagé ;
 *  - le texte source reste lisible par les lecteurs d'écran via `aria-label`.
 */

import { isBrowser, prefersReducedMotion } from "../internal/env";
import { subscribe } from "../internal/ticker";
import { observeInView } from "../internal/in-view";
import { mergeOptions } from "../internal/options";
import type { NovaPlayable, Trigger } from "../internal/types";

export const SCRAMBLE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ0123456789#%&/<>*+=";

export interface ScrambleOptions {
  /** Texte final. Défaut : le `textContent` actuel de l'élément. */
  text?: string;
  /** Jeu de caractères de brouillage. */
  chars?: string;
  /** Durée d'un pas de brouillage, en ms. Plus haut = plus lent. Défaut : 52. */
  stepMs?: number;
  /** Nombre de pas pendant lesquels une lettre reste brouillée. Défaut : 6. */
  scrambleSteps?: number;
  /** Étalement aléatoire du départ de chaque lettre, en pas. Défaut : 6. */
  spread?: number;
  /** Quand jouer. Défaut : `hover`. */
  trigger?: Trigger;
  /** Réglages de l'observation quand `trigger: "view"`. */
  rootMargin?: string;
  threshold?: number;
  /** Appelé quand le texte est entièrement reformé. */
  onComplete?: () => void;
}

type Slot = { node: HTMLSpanElement; target: string; start: number; end: number };

const defaults = {
  chars: SCRAMBLE_CHARS,
  stepMs: 52,
  scrambleSteps: 6,
  spread: 6,
  trigger: "hover" as Trigger,
  threshold: 0.6,
};

export function createScramble(
  element: HTMLElement,
  options: ScrambleOptions = {},
): NovaPlayable<ScrambleOptions> {
  let config = mergeOptions(defaults, options);
  let text = config.text ?? element.textContent ?? "";

  let slots: Slot[] = [];
  let running = false;
  let unsubscribeTick: (() => void) | null = null;
  let detachTrigger: (() => void) | null = null;

  /** Reconstruit les `<span>` — une seule fois par texte, pas par frame. */
  function build(): void {
    element.textContent = "";
    element.setAttribute("aria-label", text);
    element.dataset.novaScramble = "";
    slots = Array.from(text).map((char) => {
      const node = document.createElement("span");
      node.textContent = char;
      node.setAttribute("aria-hidden", "true");
      element.appendChild(node);
      return { node, target: char, start: 0, end: 0 };
    });
  }

  function settle(): void {
    for (const slot of slots) {
      slot.node.textContent = slot.target;
      delete slot.node.dataset.novaScrambled;
    }
  }

  function play(): void {
    if (running || !isBrowser) return;
    // En mouvement réduit, le texte final est déjà en place : rien à jouer.
    if (prefersReducedMotion()) return settle();

    running = true;
    for (const slot of slots) {
      slot.start = Math.floor(Math.random() * config.spread);
      slot.end = slot.start + config.scrambleSteps;
    }

    let step = 0;
    let elapsed = 0;

    unsubscribeTick?.();
    unsubscribeTick = subscribe((_now, delta) => {
      elapsed += delta;
      if (elapsed < config.stepMs) return;
      elapsed = 0;

      let done = 0;
      for (const slot of slots) {
        // Les espaces ne se brouillent pas : ils tiennent la métrique du mot.
        if (slot.target === " " || step >= slot.end) {
          slot.node.textContent = slot.target;
          delete slot.node.dataset.novaScrambled;
          done++;
        } else if (step >= slot.start) {
          const pick = Math.floor(Math.random() * config.chars.length);
          slot.node.textContent = config.chars[pick] ?? slot.target;
          slot.node.dataset.novaScrambled = "true";
        }
      }

      step++;

      if (done === slots.length) {
        stop();
        config.onComplete?.();
      }
    });
  }

  function stop(): void {
    running = false;
    unsubscribeTick?.();
    unsubscribeTick = null;
    settle();
  }

  function attachTrigger(): void {
    detachTrigger?.();
    detachTrigger = null;
    if (!isBrowser) return;

    if (config.trigger === "hover") {
      const onEnter = () => play();
      element.addEventListener("mouseenter", onEnter);
      // Le clavier doit pouvoir déclencher ce que la souris déclenche.
      element.addEventListener("focus", onEnter);
      detachTrigger = () => {
        element.removeEventListener("mouseenter", onEnter);
        element.removeEventListener("focus", onEnter);
      };
    } else if (config.trigger === "view") {
      detachTrigger = observeInView(
        element,
        (visible) => visible && play(),
        { threshold: config.threshold, rootMargin: config.rootMargin, once: true },
      );
    } else if (config.trigger === "mount") {
      play();
    }
  }

  build();
  attachTrigger();

  return {
    element,
    play,
    update(next) {
      const textChanged = next.text !== undefined && next.text !== text;
      const triggerChanged =
        next.trigger !== undefined && next.trigger !== config.trigger;

      config = mergeOptions(config, next);
      if (textChanged) {
        stop();
        text = config.text ?? "";
        build();
      }
      if (triggerChanged || textChanged) attachTrigger();
    },
    destroy() {
      stop();
      detachTrigger?.();
      detachTrigger = null;
      // On rend l'élément à son état de départ : texte brut, sans nos spans.
      element.textContent = text;
      element.removeAttribute("aria-label");
      delete element.dataset.novaScramble;
    },
  };
}
