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

export { SplitText } from "./components/split-text";
export type { SplitTextProps } from "./components/split-text";

export { Marquee } from "./components/marquee";
export type { MarqueeProps } from "./components/marquee";

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
  SplitTextOptions,
  MarqueeOptions,
  CursorOptions,
  ConfettiOptions,
  Easing,
} from "@nova-ui/core";
export { confetti, prefersReducedMotion, easings } from "@nova-ui/core";
