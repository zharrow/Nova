/**
 * Embarque le registry construit dans le paquet CLI.
 *
 * La CLI lit ses composants depuis son propre dossier : `npx novaui add` marche
 * donc hors ligne, sans hébergement à mettre en place. `--registry <url>`
 * permettra plus tard de pointer vers un registry distant sans rien changer.
 */
import { cp, rm, access } from "node:fs/promises";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const source = join(here, "../../../registry/dist");
const destination = join(here, "../registry");

try {
  await access(source);
} catch {
  console.error(
    "registry/dist est absent — lancer `pnpm registry:build` à la racine d'abord.",
  );
  process.exit(1);
}

await rm(destination, { recursive: true, force: true });
await cp(source, destination, { recursive: true });
console.log("  registry embarqué dans packages/cli/registry");
