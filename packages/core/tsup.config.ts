import { defineConfig } from "tsup";

export default defineConfig({
  /**
   * Trois entrées, et ce n'est pas cosmétique.
   *
   * `expand` dépend de GSAP, `smooth-scroll` de Lenis. Une entrée unique
   * mettrait ces imports en tête du bundle, et un projet qui ne prend que
   * `Reveal` tirerait quand même les deux librairies. Séparées, elles ne sont
   * chargées que par qui les importe — `@nova-ui/core/expand`.
   */
  entry: [
    "src/index.ts",
    "src/engines/expand.ts",
    "src/engines/smooth-scroll.ts",
  ],
  format: ["esm", "cjs"],
  dts: true,
  clean: true,
  treeshake: true,
  sourcemap: true,
  external: ["gsap", "lenis"],
  // La feuille de style est copiée telle quelle : elle est importée par les
  // consommateurs via "@nova-ui/core/styles.css", jamais bundlée dans le JS.
  publicDir: "src/styles",
});
