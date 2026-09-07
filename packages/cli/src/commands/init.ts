/**
 * `novaui init` — prépare un projet à recevoir des composants Nova.
 *
 * Installe le socle partagé (moteurs internes, pont React, feuille de style),
 * puis écrit `nova.json`. Sans cette étape, chaque `add` devrait recopier les
 * mêmes fichiers internes.
 */

import { mkdir, writeFile, readFile } from "node:fs/promises";
import { join, dirname } from "node:path";
import { registry } from "../registry";
import {
  detectConfig,
  readConfig,
  writeConfig,
  exists,
  CONFIG_FILE,
  type NovaConfig,
} from "../config";
import { log, style, ask, confirm } from "../ui";

const CSS_IMPORT_MARKER = "nova.css";

export async function init(cwd: string, flags: Set<string>): Promise<void> {
  const existing = await readConfig(cwd);
  if (existing && !flags.has("--force")) {
    log.warn(
      `${CONFIG_FILE} existe déjà. Relancer avec ${style.bold("--force")} pour le réécrire.`,
    );
    return;
  }

  const detected = await detectConfig(cwd);
  log.info("");
  log.info(style.bold("  Nova — installation du socle"));
  log.info("");

  let config: NovaConfig = detected;
  if (!flags.has("--yes")) {
    config = {
      framework: "react",
      lib: await ask("Où placer les moteurs ?", detected.lib),
      components: await ask("Où placer les composants ?", detected.components),
      alias: await ask("Alias d'import vers les moteurs ?", detected.alias),
      css: await ask("Feuille de style globale ?", detected.css),
    };
  }

  log.info("");
  const base = await registry.base();

  for (const file of base.files) {
    const destination = join(cwd, config.lib, file.target);
    await mkdir(dirname(destination), { recursive: true });
    await writeFile(destination, applyAlias(file.content, config.alias));
    log.added(join(config.lib, file.target));
  }

  // La feuille de style est copiée à côté des moteurs plutôt qu'injectée dans
  // la CSS globale : elle reste identifiable, et remplaçable à la mise à jour.
  const stylesheet = join(cwd, config.lib, "nova.css");
  await writeFile(stylesheet, base.css);
  log.added(join(config.lib, "nova.css"));

  await linkStylesheet(cwd, config);
  await writeConfig(cwd, config);
  log.added(CONFIG_FILE);

  log.info("");
  log.success("Socle installé.");
  log.info(
    `  Ajouter un composant : ${style.cyan("npx novaui add reveal")}` +
      `   ·   Tout voir : ${style.cyan("npx novaui list")}`,
  );
  log.info("");
}

/**
 * Ajoute l'import de `nova.css` en tête de la feuille globale, si le projet en
 * a une. On ne réécrit jamais un fichier qui importe déjà Nova.
 */
async function linkStylesheet(cwd: string, config: NovaConfig): Promise<void> {
  const globalCss = join(cwd, config.css);
  if (!(await exists(globalCss))) {
    log.warn(
      `${config.css} est introuvable — importer manuellement ` +
        `${style.bold(`${config.lib}/nova.css`)} dans la feuille globale.`,
    );
    return;
  }

  const current = await readFile(globalCss, "utf8");
  if (current.includes(CSS_IMPORT_MARKER)) {
    log.skipped(`${config.css} importe déjà nova.css`);
    return;
  }

  if (!(await confirm(`Ajouter l'import de nova.css dans ${config.css} ?`))) {
    log.warn(`Import à ajouter à la main dans ${config.css}.`);
    return;
  }

  // Le chemin est relatif à la feuille globale, pas à l'alias : les `@import`
  // CSS ne passent pas par la résolution TypeScript.
  const relative = relativeCssPath(config.css, `${config.lib}/nova.css`);
  await writeFile(globalCss, `@import "${relative}";\n${current}`);
  log.added(`import de nova.css dans ${config.css}`);
}

function relativeCssPath(from: string, to: string): string {
  const fromParts = dirname(from).split("/").filter((p) => p && p !== ".");
  const toParts = to.split("/").filter((p) => p && p !== ".");

  let shared = 0;
  while (
    shared < fromParts.length &&
    shared < toParts.length &&
    fromParts[shared] === toParts[shared]
  ) {
    shared++;
  }

  const up = fromParts.length - shared;
  const path = [...Array(up).fill(".."), ...toParts.slice(shared)].join("/");
  return up === 0 ? `./${path}` : path;
}

/** Remplace le jeton du registry par l'alias réel du projet. */
export function applyAlias(content: string, alias: string): string {
  return content.replaceAll("%NOVA_LIB%", alias);
}
