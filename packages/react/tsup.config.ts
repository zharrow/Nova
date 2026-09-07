import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts"],
  format: ["esm", "cjs"],
  dts: true,
  clean: true,
  treeshake: true,
  sourcemap: true,
  external: ["react", "react-dom"],
  // La directive `"use client"` n'est PAS posée ici : esbuild supprime tout
  // prologue de directive quand il fusionne des modules. Elle est reposée
  // après le build par `scripts/add-use-client.mjs`.
});
