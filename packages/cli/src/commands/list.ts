/**
 * `novaui list` — catalogue des composants disponibles.
 */

import { registry } from "../registry";
import { readConfig } from "../config";
import { exists } from "../config";
import { join } from "node:path";
import { log, style } from "../ui";

export async function list(cwd: string): Promise<void> {
  const index = await registry.index();
  const config = await readConfig(cwd);

  log.info("");
  log.info(
    `  ${style.bold("Nova")} ${style.dim(`· ${index.items.length} composants · ${index.framework}`)}`,
  );
  log.info("");

  const width = Math.max(...index.items.map((item) => item.name.length));

  for (const item of index.items) {
    // Marque ce qui est déjà installé : la question « je l'ai déjà, celui-là ? »
    // est celle qu'on se pose le plus souvent devant un catalogue.
    let installed = false;
    if (config) {
      installed = await exists(join(cwd, config.components, `${item.name}.tsx`));
    }

    const marker = installed ? style.green("✓") : " ";
    log.info(
      `  ${marker} ${style.cyan(item.name.padEnd(width))}  ${style.dim(item.description)}`,
    );
  }

  log.info("");
  log.info(`  ${style.dim("Ajouter :")} ${style.cyan("npx novaui add <nom>")}`);
  log.info("");
}
