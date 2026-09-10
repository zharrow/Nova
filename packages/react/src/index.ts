/**
 * @nova-ui/react — composants React de Nova.
 *
 * Tous s'appuient sur `@nova-ui/core` et n'ajoutent que le raccordement au
 * cycle de vie React. La feuille de style se charge une fois par application :
 *   import "@nova-ui/core/styles.css";
 */

/* La fusion de classes de shadcn, réexportée : les composants copiés s'en
   servent, et un projet qui a déjà `@/lib/utils` peut pointer dessus. */
export { cn } from "./cn";

export { useNovaEngine } from "./hooks/use-nova-engine";
export { useConfetti } from "./hooks/use-confetti";
export { useFlight } from "./hooks/use-flight";
/* Ces deux-là tirent une librairie — GSAP pour l'un, Lenis pour l'autre. Ils
   passent par les entrées séparées du cœur, pour qu'un projet qui ne les prend
   pas n'embarque rien. Voir DEPENDANCES.md. */
export { useExpand } from "./hooks/use-expand";
export type { UseExpandResult } from "./hooks/use-expand";
export { useFlipList } from "./hooks/use-flip-list";
export type { UseFlipListResult } from "./hooks/use-flip-list";

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

export { ScrollScene } from "./components/scroll-scene";
export type { ScrollSceneProps } from "./components/scroll-scene";

export { TextHighlight } from "./components/text-highlight";
export type { TextHighlightProps } from "./components/text-highlight";

export { Spotlight } from "./components/spotlight";
export type { SpotlightProps } from "./components/spotlight";

export { Halftone } from "./components/halftone";
export type { HalftoneProps } from "./components/halftone";

export { Graph } from "./components/graph";
export type { GraphProps } from "./components/graph";

export { Lightbox } from "./components/lightbox";
export type { LightboxProps } from "./components/lightbox";

/* La grille des jours vient de `react-day-picker` — ce sur quoi la `Calendar`
   de shadcn est elle-même bâtie. Nova n'y ajoute que le cadran. */
export { DatePicker } from "./components/date-picker";
export type {
  DatePickerProps,
  DatePickerGranularity,
  DatePickerLabels,
} from "./components/date-picker";

export { SmoothScroll } from "./components/smooth-scroll";
export type { SmoothScrollProps } from "./components/smooth-scroll";

export { Cursor } from "./components/cursor";
export type { CursorProps } from "./components/cursor";

export { Magnet } from "./components/magnet";
export type { MagnetProps } from "./components/magnet";

export { BrushUnderline } from "./components/brush-underline";
export type { BrushUnderlineProps } from "./components/brush-underline";

export { Blinds } from "./components/blinds";
export type { BlindsProps } from "./components/blinds";

export { Progress } from "./components/progress";
export type { ProgressProps } from "./components/progress";
export { useReady } from "./hooks/use-ready";
export type { ReadyState } from "./hooks/use-ready";
export { Loader } from "./components/loader";
export type { LoaderProps } from "./components/loader";

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
  DialOptions,
  DialInstance,
  SpotlightOptions,
  ScrollSceneOptions,
  TextHighlightOptions,
  HalftoneOptions,
  HalftoneSource,
  CoverageFn,
  GraphOptions,
  GraphNode,
  GraphEdge,
  CursorOptions,
  CursorVariant,
  MagnetOptions,
  BrushUnderlineOptions,
  BlindsOptions,
  LoaderOptions,
  LoaderForm,
  FlightOptions,
  FlightResult,
  ConfettiOptions,
  Easing,
} from "@nova-ui/core";
export { confetti, flight, prefersReducedMotion, easings } from "@nova-ui/core";
