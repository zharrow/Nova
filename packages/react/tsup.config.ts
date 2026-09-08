import { defineConfig } from "tsup";
// @ts-expect-error — script utilitaire en JS pur, sans déclaration de types.
import { reposerUseClient } from "./scripts/add-use-client.mjs";

export default defineConfig((options) => ({
  entry: ["src/index.ts"],
  format: ["esm", "cjs"],
  dts: true,
  /* Pas de purge en watch. `clean` efface `dist` avant CHAQUE reconstruction,
     et le `.d.ts` met une seconde à revenir : pendant cette fenêtre, un
     `pnpm typecheck` lancé en parallèle ne trouve plus les déclarations,
     retombe sur le bundle JS et invente des types où toutes les props sont
     requises. Vingt erreurs, aucune vraie. */
  clean: !options.watch,
  treeshake: true,
  sourcemap: true,
  external: ["react", "react-dom"],
  /**
   * La directive `"use client"` n'est pas posée par esbuild : il supprime tout
   * prologue de directive quand il fusionne des modules, et l'option `banner`
   * n'y change rien. Elle est reposée ici, après CHAQUE build.
   *
   * `onSuccess` et pas seulement le `&&` du script `build` : le script `dev`
   * est un `tsup --watch`, qui réécrit `dist` à chaque frappe sans jamais
   * passer par le script. Un `pnpm dev` à la racine suffisait donc à produire
   * un bundle sans directive, et la vitrine refusait ensuite de se construire
   * avec une erreur qui pointe vers React et non vers Nova.
   */
  onSuccess: async () => {
    await reposerUseClient();
  },
}));
