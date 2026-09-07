import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts"],
  format: ["esm", "cjs"],
  dts: true,
  clean: true,
  treeshake: true,
  sourcemap: true,
  // La feuille de style est copiée telle quelle : elle est importée par les
  // consommateurs via "@nova-ui/core/styles.css", jamais bundlée dans le JS.
  publicDir: "src/styles",
});
