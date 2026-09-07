/**
 * @nova-ui/core — moteurs d'animation framework-agnostiques.
 *
 * Chaque moteur est une fabrique `createX(element, options)` qui renvoie une
 * instance `{ update, destroy }`. Aucune dépendance, aucun framework : c'est
 * ce socle que les paquets `@nova-ui/react` — et demain `@nova-ui/angular` —
 * se contentent d'habiller.
 *
 * La feuille de style se charge à part, une fois par application :
 *   import "@nova-ui/core/styles.css";
 */

/* Contrat commun */
export type { NovaInstance, NovaPlayable, Trigger } from "./internal/types";

/* Utilitaires d'environnement — utiles aux adaptateurs et aux applications */
export {
  isBrowser,
  prefersReducedMotion,
  isFinePointer,
  onReducedMotionChange,
} from "./internal/env";
export { subscribe as onTick, tickerSize } from "./internal/ticker";
export { observeInView, isAlreadyInView } from "./internal/in-view";
export type { InViewOptions } from "./internal/in-view";
export { easings, resolveEasing, EXPO_OUT_CSS } from "./internal/easing";
export type { Easing, EasingFunction } from "./internal/easing";
export { pointerState, acquirePointerTracking } from "./internal/pointer";

/* Moteurs */
export { createScramble, SCRAMBLE_CHARS } from "./engines/scramble";
export type { ScrambleOptions } from "./engines/scramble";

export { createCounter } from "./engines/counter";
export type { CounterOptions } from "./engines/counter";

export { createReveal, createRevealGroup } from "./engines/reveal";
export type {
  RevealOptions,
  RevealGroupOptions,
  RevealVariant,
} from "./engines/reveal";

export { createSplitText } from "./engines/split-text";
export type { SplitTextOptions } from "./engines/split-text";

export { createMarquee } from "./engines/marquee";
export type { MarqueeOptions } from "./engines/marquee";

export { createCursor } from "./engines/cursor";
export type { CursorOptions } from "./engines/cursor";

export { confetti } from "./engines/confetti";
export type { ConfettiOptions } from "./engines/confetti";
