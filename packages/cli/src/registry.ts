/**
 * Accès au registry.
 *
 * Par défaut, la CLI lit le registry embarqué dans son propre paquet : `npx
 * novaui add` fonctionne donc hors ligne, sans hébergement. `--registry <url>`
 * ou `NOVA_REGISTRY_URL` bascule vers un registry distant le jour où il y en
 * aura un, sans rien changer au reste.
 */

import { readFile } from "node:fs/promises";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

export interface RegistryFileEntry {
  target: string;
  kind: "lib" | "component";
  content: string;
}

export interface RegistryItem {
  name: string;
  title: string;
  description: string;
  exports: string[];
  /** Paquets npm exigés par ce composant. Voir DEPENDANCES.md. */
  dependencies: string[];
  files: RegistryFileEntry[];
}

export interface RegistryIndex {
  name: string;
  homepage: string;
  framework: string;
  generatedAt: string;
  items: Omit<RegistryItem, "files">[];
}

export interface RegistryBase {
  files: RegistryFileEntry[];
  css: string;
  /** Paquets exigés par le socle lui-même — la fusion de classes de shadcn. */
  dependencies?: string[];
}

const BUNDLED = join(dirname(fileURLToPath(import.meta.url)), "../registry");

function source(): string {
  return process.env.NOVA_REGISTRY_URL ?? BUNDLED;
}

async function fetchJson<T>(name: string): Promise<T> {
  const base = source();

  if (base.startsWith("http://") || base.startsWith("https://")) {
    const response = await fetch(`${base.replace(/\/$/, "")}/${name}.json`);
    if (!response.ok) {
      throw new Error(
        `Registry inaccessible : ${response.status} sur ${name}.json`,
      );
    }
    return (await response.json()) as T;
  }

  try {
    return JSON.parse(await readFile(join(base, `${name}.json`), "utf8")) as T;
  } catch {
    throw new Error(
      `Composant "${name}" introuvable dans le registry. ` +
        `Lancer \`novaui list\` pour voir ce qui existe.`,
    );
  }
}

export const registry = {
  index: () => fetchJson<RegistryIndex>("index"),
  base: () => fetchJson<RegistryBase>("base"),
  item: (name: string) => fetchJson<RegistryItem>(name),
};
