/**
 * Installation des dépendances d'un composant.
 *
 * Voir DEPENDANCES.md : une entrée du registry déclare ce dont elle a besoin,
 * et la facture est par composant — un projet qui ne prend pas `expand` ne
 * reçoit pas GSAP.
 *
 * Deux principes tenus ici :
 *  - **on n'installe que ce qui manque.** Un projet qui a déjà GSAP en
 *    dépendance directe ne doit pas voir sa version renégociée ;
 *  - **on n'installe jamais en silence.** Ajouter un paquet à un projet est
 *    une décision, pas un détail d'implémentation.
 */

import { readFile, access } from "node:fs/promises";
import { join } from "node:path";
import { spawn } from "node:child_process";
import { log, style, confirm } from "./ui";

export type Gestionnaire = "pnpm" | "yarn" | "bun" | "npm";

async function existe(chemin: string): Promise<boolean> {
  try {
    await access(chemin);
    return true;
  } catch {
    return false;
  }
}

/**
 * Devine le gestionnaire de paquets d'après le fichier de verrouillage.
 *
 * Le champ `packageManager` du package.json passe avant : c'est une
 * déclaration, un fichier de verrouillage n'est qu'une trace. Un dépôt qui a
 * migré de npm vers pnpm peut garder les deux un moment.
 */
export async function detecterGestionnaire(cwd: string): Promise<Gestionnaire> {
  try {
    const pkg = JSON.parse(await readFile(join(cwd, "package.json"), "utf8"));
    const declare = String(pkg.packageManager ?? "");
    if (declare.startsWith("pnpm")) return "pnpm";
    if (declare.startsWith("yarn")) return "yarn";
    if (declare.startsWith("bun")) return "bun";
    if (declare.startsWith("npm")) return "npm";
  } catch {
    /* Pas de package.json lisible : on regarde les verrous. */
  }

  if (await existe(join(cwd, "pnpm-lock.yaml"))) return "pnpm";
  if (await existe(join(cwd, "yarn.lock"))) return "yarn";
  if (
    (await existe(join(cwd, "bun.lockb"))) ||
    (await existe(join(cwd, "bun.lock")))
  ) {
    return "bun";
  }
  return "npm";
}

/** Les paquets déjà déclarés par le projet, quelle que soit la section. */
async function dejaInstallees(cwd: string): Promise<Set<string>> {
  try {
    const pkg = JSON.parse(await readFile(join(cwd, "package.json"), "utf8"));
    return new Set([
      ...Object.keys(pkg.dependencies ?? {}),
      ...Object.keys(pkg.devDependencies ?? {}),
      ...Object.keys(pkg.peerDependencies ?? {}),
    ]);
  } catch {
    return new Set();
  }
}

export function commandeInstall(
  gestionnaire: Gestionnaire,
  paquets: string[],
): string {
  const verbe = gestionnaire === "npm" ? "install" : "add";
  return `${gestionnaire} ${verbe} ${paquets.join(" ")}`;
}

function lancer(commande: string, cwd: string): Promise<number> {
  return new Promise((resolve) => {
    const [binaire, ...arguments_] = commande.split(" ");
    const processus = spawn(binaire!, arguments_, {
      cwd,
      stdio: "inherit",
      shell: process.platform === "win32",
    });
    processus.on("close", (code) => resolve(code ?? 1));
    processus.on("error", () => resolve(1));
  });
}

/**
 * Installe ce qui manque parmi `requises`. Renvoie les paquets réellement
 * ajoutés — vide si tout était déjà là, ou si l'utilisateur a refusé.
 */
export async function installerDependances(
  cwd: string,
  requises: string[],
  flags: Set<string>,
): Promise<string[]> {
  if (requises.length === 0) return [];

  const presentes = await dejaInstallees(cwd);
  const manquantes = [...new Set(requises)].filter((p) => !presentes.has(p));

  if (manquantes.length === 0) {
    log.skipped(
      `${requises.join(", ")} — déjà dans le projet`,
    );
    return [];
  }

  const gestionnaire = await detecterGestionnaire(cwd);
  const commande = commandeInstall(gestionnaire, manquantes);

  if (flags.has("--no-install")) {
    log.warn(`${manquantes.join(", ")} manquant. À installer :`);
    log.info(`      ${style.cyan(commande)}`);
    return [];
  }

  log.step(
    `${style.bold(manquantes.join(", "))} manquant — ` +
      `${style.dim(commande)}`,
  );

  if (!flags.has("--yes")) {
    const accord = await confirm("Installer maintenant ?");
    if (!accord) {
      log.warn(`À installer à la main : ${style.cyan(commande)}`);
      return [];
    }
  }

  const code = await lancer(commande, cwd);
  if (code !== 0) {
    log.error(
      `L'installation a échoué. Relancer à la main : ${style.cyan(commande)}`,
    );
    return [];
  }

  log.added(manquantes.join(", "));
  return manquantes;
}
