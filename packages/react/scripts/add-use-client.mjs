/**
 * Repose la directive `"use client"` en tête des bundles.
 *
 * tsup la retire au bundling (« Module level directives cause errors when
 * bundled ») : esbuild refuse de garder un prologue de directive quand il
 * fusionne plusieurs modules. On la remet donc après coup, ce qui est la
 * recette retenue par la plupart des librairies de composants.
 *
 * Sans elle, importer un composant Nova depuis un Server Component de l'App
 * Router fait échouer le build de l'application consommatrice.
 */
import { readFile, writeFile } from "node:fs/promises";

const DIRECTIVE = '"use client";\n';
const targets = ["dist/index.js", "dist/index.cjs"];

for (const target of targets) {
  const source = await readFile(target, "utf8");
  if (source.startsWith('"use client"') || source.startsWith("'use client'")) {
    continue;
  }
  await writeFile(target, DIRECTIVE + source);
  console.log(`  "use client" reposée dans ${target}`);
}
