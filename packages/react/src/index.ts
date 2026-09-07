/**
 * @nova-ui/react — composants React de Nova.
 *
 * Tous s'appuient sur `@nova-ui/core` et n'ajoutent que le raccordement au
 * cycle de vie React. La feuille de style se charge une fois par application :
 *   import "@nova-ui/core/styles.css";
 */

export { useNovaEngine } from "./hooks/use-nova-engine";
export { useConfetti } from "./hooks/use-confetti";

export { Reveal, RevealGroup } from "./components/reveal";
export type { RevealProps, RevealGroupProps } from "./components/reveal";

export { ScrambleText } from "./components/scramble-text";
export type { ScrambleTextProps } from "./components/scramble-text";

export { Counter } from "./components/counter";
export type { CounterProps } from "./components/counter";

export { TextEffect } from "./components/text-effect";
export type { TextEffectProps } from "./components/text-effect";

export { Marquee } from "./components/marquee";
export type { MarqueeProps } from "./components/marquee";

export { ScrollMarquee } from "./components/scroll-marquee";
export type { ScrollMarqueeProps } from "./components/scroll-marquee";

export { RollText } from "./components/roll-text";
export type { RollTextProps } from "./components/roll-text";

export { Spotlight } from "./components/spotlight";
export type { SpotlightProps } from "./components/spotlight";

export { Halftone } from "./components/halftone";
export type { HalftoneProps } from "./components/halftone";

export { Graph } from "./components/graph";
export type { GraphProps } from "./components/graph";

export { Cursor } from "./components/cursor";
export type { CursorProps } from "./components/cursor";

/* Les types et utilitaires du cœur sont ré-exportés : un projet React n'a
   ainsi qu'une seule dépendance à déclarer. */
export type {
  NovaInstance,
  Trigger,
  RevealVariant,
  RevealOptions,
  ScrambleOptions,
  CounterOptions,
  TextEffectOptions,
  TextEffectName,
  TextGrain,
  MarqueeOptions,
  MarqueeDirection,
  ScrollMarqueeOptions,
  RollTextOptions,
  SpotlightOptions,
  HalftoneOptions,
  HalftoneSource,
  CoverageFn,
  GraphOptions,
  GraphNode,
  GraphEdge,
  CursorOptions,
  ConfettiOptions,
  Easing,
} from "@nova-ui/core";
export { confetti, prefersReducedMotion, easings } from "@nova-ui/core";
