/**
 * Courbes d'accélération.
 *
 * `expoOut` — cubic-bezier(0.16, 1, 0.3, 1) — est la signature partagée par
 * tous les projets d'origine : elle démarre vite et se pose longuement. Elle
 * reste la valeur par défaut de Nova.
 */

export type EasingFunction = (t: number) => number;

/** Nom d'une courbe intégrée, ou une fonction sur mesure. */
export type Easing = keyof typeof easings | EasingFunction;

export const easings = {
  linear: (t: number) => t,
  quadOut: (t: number) => 1 - (1 - t) * (1 - t),
  cubicOut: (t: number) => 1 - Math.pow(1 - t, 3),
  quartOut: (t: number) => 1 - Math.pow(1 - t, 4),
  expoOut: (t: number) => (t >= 1 ? 1 : 1 - Math.pow(2, -10 * t)),
  expoInOut: (t: number) =>
    t === 0 || t === 1
      ? t
      : t < 0.5
        ? Math.pow(2, 20 * t - 10) / 2
        : (2 - Math.pow(2, -20 * t + 10)) / 2,
  backOut: (t: number) => {
    const c = 1.70158;
    return 1 + (c + 1) * Math.pow(t - 1, 3) + c * Math.pow(t - 1, 2);
  },
} satisfies Record<string, EasingFunction>;

/** Équivalent CSS de `expoOut` — pour les transitions pilotées par feuille de style. */
export const EXPO_OUT_CSS = "cubic-bezier(0.16, 1, 0.3, 1)";

export function resolveEasing(easing: Easing | undefined): EasingFunction {
  if (typeof easing === "function") return easing;
  if (easing && easing in easings) return easings[easing];
  return easings.expoOut;
}
