/**
 * Scramble — effet « decode ».
 *
 * Le texte se brouille en caractères aléatoires puis se reforme lettre par
 * lettre. Les caractères encore brouillés portent `data-nova-scrambled="true"`,
 * ce qui permet de les colorer en CSS (accent corail dans l'implémentation
 * d'origine) sans que le moteur ne connaisse la palette.
 *
 * ── Deux usages, et ils ne disent pas la même chose ────────────────────────
 *
 * AU SURVOL — le décodage répond à un geste. Le texte est stable, c'est le
 * lecteur qui le provoque. `trigger: "hover"`, sans `interval`.
 *
 * À INTERVALLE — le décodage se rejoue seul tant que le texte est à l'écran.
 * Il n'attend rien de personne : c'est une étiquette qui se redéchiffre, un
 * signal de fond. `trigger: "view"` avec un `interval`.
 *
 * Les deux se combinent — une étiquette qui pulse et que le survol relance —
 * mais ils sont demandés séparément, jamais déduits l'un de l'autre.
 *
 * Porté de `ScrambleText` (portfolio pour le survol, KaopyX pour la boucle),
 * avec trois différences :
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
  /** Ce qui arme le décodage. Défaut : `hover`. */
  trigger?: Trigger;
  /**
   * Période de rejeu automatique, en ms. `0` — le défaut — désactive la
   * boucle et laisse un décodage unique.
   *
   * Le minuteur ne tourne QUE tant que l'élément est à l'écran : un décodage
   * qu'on ne voit pas ne coûterait que du processeur.
   */
  interval?: number;
  /**
   * Autoriser le survol à relancer le décodage, même lorsque `trigger` n'est
   * pas `hover`. Défaut : vrai si `trigger` vaut `hover`, faux sinon.
   */
  replayOnHover?: boolean;
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
  interval: 0,
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
  let detachHover: (() => void) | null = null;
  let loopTimer: ReturnType<typeof setInterval> | null = null;

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

  /** Le survol relance-t-il ? Vrai par défaut si c'est le mode d'armement. */
  function hoverEnabled(): boolean {
    return config.replayOnHover ?? config.trigger === "hover";
  }

  function startLoop(): void {
    if (loopTimer !== null || config.interval <= 0) return;
    loopTimer = setInterval(play, config.interval);
  }

  function stopLoop(): void {
    if (loopTimer === null) return;
    clearInterval(loopTimer);
    loopTimer = null;
  }

  function attachTrigger(): void {
    detachTrigger?.();
    detachTrigger = null;
    detachHover?.();
    detachHover = null;
    stopLoop();
    if (!isBrowser) return;

    if (hoverEnabled()) {
      const onEnter = () => play();
      element.addEventListener("mouseenter", onEnter);
      // Le clavier doit pouvoir déclencher ce que la souris déclenche.
      element.addEventListener("focus", onEnter);
      detachHover = () => {
        element.removeEventListener("mouseenter", onEnter);
        element.removeEventListener("focus", onEnter);
      };
    }

    // Une boucle doit s'arrêter hors écran, donc l'observation ne peut pas
    // être `once` : elle suit les entrées ET les sorties.
    const looping = config.interval > 0;

    if (config.trigger === "view" || looping) {
      detachTrigger = observeInView(
        element,
        (visible) => {
          if (visible) {
            play();
            startLoop();
          } else {
            stopLoop();
          }
        },
        {
          threshold: config.threshold,
          rootMargin: config.rootMargin,
          once: !looping,
        },
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
        (next.trigger !== undefined && next.trigger !== config.trigger) ||
        (next.interval !== undefined && next.interval !== config.interval) ||
        (next.replayOnHover !== undefined &&
          next.replayOnHover !== config.replayOnHover);

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
      stopLoop();
      detachTrigger?.();
      detachTrigger = null;
      detachHover?.();
      detachHover = null;
      // On rend l'élément à son état de départ : texte brut, sans nos spans.
      element.textContent = text;
      element.removeAttribute("aria-label");
      delete element.dataset.novaScramble;
    },
  };
}
