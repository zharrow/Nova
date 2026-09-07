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

export { createTextEffect } from "./engines/text-effect";
export type {
  TextEffectOptions,
  TextEffectName,
  TextGrain,
} from "./engines/text-effect";

export { createMarquee } from "./engines/marquee";
export type { MarqueeOptions, MarqueeDirection } from "./engines/marquee";

export { createScrollMarquee } from "./engines/scroll-marquee";
export type { ScrollMarqueeOptions } from "./engines/scroll-marquee";

export { createRollText } from "./engines/roll-text";
export type { RollTextOptions } from "./engines/roll-text";

export { createScrollScene } from "./engines/scroll-scene";
export type { ScrollSceneOptions } from "./engines/scroll-scene";

export { createTextHighlight } from "./engines/text-highlight";
export type { TextHighlightOptions } from "./engines/text-highlight";

export { createSpotlight } from "./engines/spotlight";
export type { SpotlightOptions } from "./engines/spotlight";

export { createCursor } from "./engines/cursor";
export type { CursorOptions, CursorVariant } from "./engines/cursor";

export { createBrushUnderline } from "./engines/brush-underline";
export type { BrushUnderlineOptions } from "./engines/brush-underline";

export { createBlinds } from "./engines/blinds";
export type { BlindsOptions } from "./engines/blinds";

export { createLoader } from "./engines/loader";
export type { LoaderOptions, LoaderForm } from "./engines/loader";

export { flight } from "./engines/flight";
export type { FlightOptions, FlightResult } from "./engines/flight";

export { createHalftone } from "./engines/halftone";
export type {
  HalftoneOptions,
  HalftoneSource,
  CoverageFn,
} from "./engines/halftone";

export { createGraph } from "./engines/graph";
export type {
  GraphOptions,
  GraphNode,
  GraphEdge,
  GraphInstance,
} from "./engines/graph";

export { confetti } from "./engines/confetti";
export type { ConfettiOptions } from "./engines/confetti";
