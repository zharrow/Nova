/**
 * Counter — compteur qui s'anime jusqu'à sa valeur.
 *
 * Fusionne deux implémentations d'origine — l'une sur framer-motion, l'autre
 * sur un rAF nu — en une seule sans dépendance : easing explicite, formatage
 * `Intl` optionnel, déclenchement à l'entrée en vue.
 *
 * L'espace est réservé dès le montage — la valeur finale est écrite puis
 * remplacée par la valeur de départ — pour qu'aucun reflow ne survienne
 * pendant le comptage.
 */

import { isBrowser, prefersReducedMotion } from "../internal/env";
import { subscribe } from "../internal/ticker";
import { observeInView } from "../internal/in-view";
import { resolveEasing, type Easing } from "../internal/easing";
import { mergeOptions } from "../internal/options";
import type { NovaPlayable, Trigger } from "../internal/types";

export interface CounterOptions {
  /** Valeur d'arrivée. */
  to: number;
  /** Valeur de départ. Défaut : 0. */
  from?: number;
  /** Durée en ms. Défaut : 1500. */
  duration?: number;
  /** Courbe. Défaut : `expoOut`. */
  easing?: Easing;
  /** Nombre de décimales. Défaut : 0. */
  decimals?: number;
  /** Locale de formatage (ex. `fr-FR`). Sans locale, pas de séparateur. */
  locale?: string;
  /** Options `Intl.NumberFormat` (devise, pourcentage…). Implique `locale`. */
  format?: Intl.NumberFormatOptions;
  prefix?: string;
  suffix?: string;
  /** Quand jouer. Défaut : `view`. */
  trigger?: Trigger;
  rootMargin?: string;
  threshold?: number;
  onComplete?: () => void;
}

const defaults = {
  from: 0,
  duration: 1500,
  easing: "expoOut" as Easing,
  decimals: 0,
  prefix: "",
  suffix: "",
  trigger: "view" as Trigger,
};

export function createCounter(
  element: HTMLElement,
  options: CounterOptions,
): NovaPlayable<CounterOptions> {
  let config = mergeOptions(defaults, options);
  let unsubscribeTick: (() => void) | null = null;
  let detachTrigger: (() => void) | null = null;

  function formatValue(value: number): string {
    let body: string;
    if (config.locale || config.format) {
      body = new Intl.NumberFormat(config.locale, {
        minimumFractionDigits: config.decimals,
        maximumFractionDigits: config.decimals,
        ...config.format,
      }).format(value);
    } else {
      body = value.toFixed(config.decimals);
    }
    return `${config.prefix}${body}${config.suffix}`;
  }

  function write(value: number): void {
    element.textContent = formatValue(value);
  }

  function play(): void {
    if (!isBrowser) return;
    // Mouvement réduit : on affiche la valeur finale, sans comptage.
    if (prefersReducedMotion()) return write(config.to);

    const ease = resolveEasing(config.easing);
    const from = config.from;
    const distance = config.to - from;
    let elapsed = 0;

    unsubscribeTick?.();
    write(from);
    unsubscribeTick = subscribe((_now, delta) => {
      elapsed += delta;
      const progress = Math.min(elapsed / config.duration, 1);
      write(from + distance * ease(progress));
      if (progress >= 1) {
        unsubscribeTick?.();
        unsubscribeTick = null;
        config.onComplete?.();
      }
    });
  }

  function attachTrigger(): void {
    detachTrigger?.();
    detachTrigger = null;
    if (!isBrowser) return;

    if (config.trigger === "view") {
      detachTrigger = observeInView(element, (visible) => visible && play(), {
        threshold: config.threshold ?? 0,
        rootMargin: config.rootMargin,
        once: true,
      });
    } else if (config.trigger === "mount") {
      play();
    }
  }

  // La valeur finale est posée avant toute animation : la largeur du bloc est
  // celle de l'état d'arrivée, donc rien ne bouge autour pendant le comptage.
  element.dataset.novaCounter = "";
  write(config.to);
  attachTrigger();

  return {
    element,
    play,
    update(next) {
      const wasTo = config.to;
      config = mergeOptions(config, next);
      if (next.to !== undefined && next.to !== wasTo) {
        // Nouvelle cible : on repart de la valeur affichée, pas de `from`.
        config.from = wasTo;
        play();
      } else {
        write(config.to);
      }
    },
    destroy() {
      unsubscribeTick?.();
      unsubscribeTick = null;
      detachTrigger?.();
      detachTrigger = null;
      write(config.to);
      delete element.dataset.novaCounter;
    },
  };
}
