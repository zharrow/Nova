import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts"],
  format: ["esm"],
  clean: true,
  sourcemap: false,
  target: "node20",
  // Zéro dépendance : `npx novaui` ne télécharge que ce fichier et le registry
  // embarqué. Rien à installer, rien à résoudre.
  banner: { js: "#!/usr/bin/env node" },
});
