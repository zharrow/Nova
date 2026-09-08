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
 *
 * Ce module est appelé de DEUX endroits, et les deux comptent :
 *
 *  - `tsup.config.ts` via `onSuccess`, donc après CHAQUE build — le
 *    `tsup --watch` du script `dev` compris. C'est le trou qui a coûté un
 *    débogage : `pnpm dev` réécrivait `dist` à chaque frappe et sautait
 *    l'étape, jusqu'à ce que la vitrine refuse de se construire avec une
 *    erreur qui pointe vers React et non vers Nova ;
 *  - le script `build` du paquet, qui garde le `&&` : il garantit l'ordre
 *    avant que Turbo ne mette `dist/**` en cache, sans dépendre de la
 *    sémantique d'`onSuccess`.
 *
 * L'opération est idempotente : la lancer deux fois ne pose rien de plus.
 */
import { readFile, writeFile } from "node:fs/promises";
import { realpathSync } from "node:fs";
import { fileURLToPath, pathToFileURL } from "node:url";
import { dirname, join } from "node:path";

const DIRECTIVE = '"use client";\n';
const RACINE = join(dirname(fileURLToPath(import.meta.url)), "..");
const CIBLES = ["dist/index.js", "dist/index.cjs"];

/** Repose la directive. Renvoie les fichiers réellement modifiés. */
export async function reposerUseClient({ silencieux = false } = {}) {
  const modifies = [];
  for (const cible of CIBLES) {
    const chemin = join(RACINE, cible);
    const source = await readFile(chemin, "utf8");
    if (source.startsWith('"use client"') || source.startsWith("'use client'")) {
      continue;
    }
    await writeFile(chemin, DIRECTIVE + source);
    modifies.push(cible);
    if (!silencieux) console.log(`  "use client" reposée dans ${cible}`);
  }
  return modifies;
}

// Lancé directement — `node scripts/add-use-client.mjs`.
if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(realpathSync(process.argv[1])).href
) {
  await reposerUseClient();
}
