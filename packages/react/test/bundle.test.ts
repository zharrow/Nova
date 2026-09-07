import { describe, it, expect } from "vitest";
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

/**
 * Garde-fou sur le bundle publié.
 *
 * La directive `"use client"` est retirée par esbuild au bundling et reposée
 * par un script post-build. Cette étape peut être contournée sans bruit — un
 * `dist` restauré du cache Turbo, un `tsup` lancé à la main — et le défaut ne
 * se voit qu'au build de l'application consommatrice, avec une erreur qui
 * pointe vers React et non vers Nova.
 *
 * Ce test fait échouer la chaîne ici, là où le message est clair.
 */
describe("bundle publié", () => {
  const dist = join(import.meta.dirname, "../dist");

  for (const fichier of ["index.js", "index.cjs"]) {
    it(`${fichier} commence par "use client"`, () => {
      const chemin = join(dist, fichier);
      if (!existsSync(chemin)) {
        // Les tests peuvent tourner avant le premier build ; on ne fabrique
        // pas un faux succès, on dit ce qui manque.
        throw new Error(
          `${fichier} est absent — lancer \`pnpm build\` dans packages/react.`,
        );
      }
      const source = readFileSync(chemin, "utf8");
      expect(source.startsWith('"use client";')).toBe(true);
    });
  }
});
