/**
 * Configuration projet (`nova.json`) et détection automatique.
 *
 * La détection vise à ce que `novaui init` n'ait rien à demander dans le cas
 * courant — un projet Next.js avec `src/` et l'alias `@/*` — tout en restant
 * corrigeable à la main pour les autres.
 */

import { readFile, writeFile, access } from "node:fs/promises";
import { join } from "node:path";

export const CONFIG_FILE = "nova.json";

export interface NovaConfig {
  /** Framework cible. Seul `react` existe aujourd'hui. */
  framework: "react";
  /** Où atterrissent les moteurs et le socle. */
  lib: string;
  /** Où atterrissent les composants. */
  components: string;
  /** Préfixe d'import vers `lib`, tel qu'écrit dans le code copié. */
  alias: string;
  /** Feuille de style globale à laquelle rattacher `nova.css`. */
  css: string;
}

export async function exists(path: string): Promise<boolean> {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

async function firstExisting(
  cwd: string,
  candidates: string[],
): Promise<string | null> {
  for (const candidate of candidates) {
    if (await exists(join(cwd, candidate))) return candidate;
  }
  return null;
}

/** Propose une configuration déduite de l'arborescence du projet. */
export async function detectConfig(cwd: string): Promise<NovaConfig> {
  const hasSourceDirectory = await exists(join(cwd, "src"));
  const root = hasSourceDirectory ? "src" : ".";

  // L'alias est lu depuis tsconfig plutôt que supposé : un projet qui mappe
  // `~/*` au lieu de `@/*` recevrait sinon des imports non résolus.
  let aliasPrefix = "@";
  try {
    const raw = await readFile(join(cwd, "tsconfig.json"), "utf8");
    const parsed = JSON.parse(raw.replace(/^\s*\/\/.*$/gm, ""));
    const paths = parsed?.compilerOptions?.paths ?? {};
    const entry = Object.keys(paths).find((key) => key.endsWith("/*"));
    if (entry) aliasPrefix = entry.slice(0, -2);
  } catch {
    // Pas de tsconfig lisible : on garde `@`, le plus répandu.
  }

  const css =
    (await firstExisting(cwd, [
      `${root}/app/globals.css`,
      `${root}/styles/globals.css`,
      `${root}/app/global.css`,
      "app/globals.css",
      "styles/globals.css",
    ])) ?? `${root}/app/globals.css`;

  const libDirectory = root === "." ? "lib/nova" : `${root}/lib/nova`;
  const componentsDirectory =
    root === "." ? "components/nova" : `${root}/components/nova`;

  return {
    framework: "react",
    lib: libDirectory,
    components: componentsDirectory,
    // `src/lib/nova` s'importe `@/lib/nova` : le préfixe de source disparaît
    // de l'alias, c'est la convention de Next.js.
    alias: `${aliasPrefix}/${libDirectory.replace(/^src\//, "")}`,
    css,
  };
}

export async function readConfig(cwd: string): Promise<NovaConfig | null> {
  try {
    return JSON.parse(await readFile(join(cwd, CONFIG_FILE), "utf8"));
  } catch {
    return null;
  }
}

export async function writeConfig(
  cwd: string,
  config: NovaConfig,
): Promise<void> {
  await writeFile(join(cwd, CONFIG_FILE), JSON.stringify(config, null, 2) + "\n");
}
