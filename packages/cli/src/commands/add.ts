/**
 * `novaui add <composants...>` — copie la source d'un ou plusieurs composants.
 *
 * Les fichiers `kind: "lib"` vont dans le dossier des moteurs, les
 * `kind: "component"` dans celui des composants. Le jeton `%NOVA_LIB%` des
 * imports est remplacé par l'alias du projet.
 */

import { mkdir, writeFile, readFile } from "node:fs/promises";
import { join, dirname } from "node:path";
import { registry } from "../registry";
import { readConfig, exists, CONFIG_FILE, type NovaConfig } from "../config";
import { log, style, confirm } from "../ui";
import { installerDependances } from "../deps";
import { applyAlias } from "./init";

export async function add(
  cwd: string,
  names: string[],
  flags: Set<string>,
): Promise<void> {
  const config = await readConfig(cwd);
  if (!config) {
    log.error(
      `${CONFIG_FILE} introuvable. Lancer ${style.bold("npx novaui init")} d'abord.`,
    );
    process.exitCode = 1;
    return;
  }

  if (names.length === 0) {
    const index = await registry.index();
    log.error(
      `Préciser au moins un composant. Disponibles : ` +
        index.items.map((item) => item.name).join(", "),
    );
    process.exitCode = 1;
    return;
  }

  log.info("");
  const dependances: string[] = [];
  for (const name of names) {
    const requises = await addOne(cwd, config, name, flags);
    dependances.push(...requises);
  }

  // Les dépendances sont installées EN UNE FOIS, après toutes les copies :
  // trois `add` successifs ne doivent pas relancer trois installations.
  const ajoutees = await installerDependances(cwd, dependances, flags);

  log.info("");
  log.success(
    (names.length === 1
      ? "Composant ajouté."
      : `${names.length} composants ajoutés.`) +
      (ajoutees.length ? ` ${ajoutees.length} dépendance(s) installée(s).` : ""),
  );
  log.info("");
}

/** Copie un composant. Renvoie les dépendances qu'il exige. */
async function addOne(
  cwd: string,
  config: NovaConfig,
  name: string,
  flags: Set<string>,
): Promise<string[]> {
  let item;
  try {
    item = await registry.item(name);
  } catch (error) {
    log.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
    return [];
  }

  log.step(`${style.bold(item.title)} — ${item.description}`);

  for (const file of item.files) {
    const root = file.kind === "component" ? config.components : config.lib;
    const destination = join(cwd, root, file.target);
    const shown = join(root, file.target);
    const content = applyAlias(file.content, config.alias);

    if (await exists(destination)) {
      // Un fichier déjà présent a pu être modifié par l'utilisateur : c'est
      // tout l'intérêt du modèle « copier-coller ». On ne l'écrase jamais
      // sans le dire.
      const current = await readFile(destination, "utf8");
      if (current === content) {
        log.skipped(`${shown} (identique)`);
        continue;
      }
      if (!flags.has("--overwrite")) {
        const replace = await confirm(
          `${shown} existe et diffère. L'écraser ?`,
          false,
        );
        if (!replace) {
          log.skipped(`${shown} conservé`);
          continue;
        }
      }
    }

    await mkdir(dirname(destination), { recursive: true });
    await writeFile(destination, content);
    log.added(shown);
  }

  const importPath = `${config.components.replace(/^src\//, "@/")}/${item.files.find((f) => f.kind === "component")?.target.replace(/\.tsx?$/, "")}`;
  log.info(
    `    ${style.dim(`import { ${item.exports.join(", ")} } from "${importPath}";`)}`,
  );

  return item.dependencies ?? [];
}
