/**
 * Sortie terminal — sans dépendance.
 *
 * Les couleurs sont désactivées si la sortie n'est pas un terminal, ou si
 * `NO_COLOR` est défini : une CLI dont la sortie est redirigée dans un fichier
 * ne doit pas y écrire de codes d'échappement.
 */

const enabled =
  process.stdout.isTTY && !process.env.NO_COLOR && process.env.TERM !== "dumb";

// Échappement écrit en unicode plutôt qu'en octet brut : un caractère de
// contrôle dans une source se perd au copier-coller et devient invisible.
const ESC = "\u001B[";

function paint(code: string) {
  return (text: string) => (enabled ? `${ESC}${code}m${text}${ESC}0m` : text);
}

export const style = {
  bold: paint("1"),
  dim: paint("2"),
  red: paint("31"),
  green: paint("32"),
  yellow: paint("33"),
  blue: paint("34"),
  cyan: paint("36"),
};

export const log = {
  info: (message: string) => console.log(message),
  step: (message: string) => console.log(`  ${style.dim("›")} ${message}`),
  added: (message: string) => console.log(`  ${style.green("+")} ${message}`),
  skipped: (message: string) =>
    console.log(`  ${style.dim("=")} ${style.dim(message)}`),
  warn: (message: string) => console.log(`  ${style.yellow("!")} ${message}`),
  error: (message: string) => console.error(`${style.red("✗")} ${message}`),
  success: (message: string) => console.log(`${style.green("✓")} ${message}`),
};

/** Question fermée, avec réponse par défaut sur simple entrée. */
export async function confirm(
  question: string,
  fallback = true,
): Promise<boolean> {
  if (!process.stdin.isTTY) return fallback;
  const { createInterface } = await import("node:readline/promises");
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  const hint = fallback ? "O/n" : "o/N";
  const answer = (await rl.question(`  ${question} ${style.dim(`(${hint})`)} `))
    .trim()
    .toLowerCase();
  rl.close();
  if (answer === "") return fallback;
  return answer === "o" || answer === "oui" || answer === "y" || answer === "yes";
}

/** Question ouverte, avec valeur par défaut. */
export async function ask(question: string, fallback: string): Promise<string> {
  if (!process.stdin.isTTY) return fallback;
  const { createInterface } = await import("node:readline/promises");
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  const answer = (
    await rl.question(`  ${question} ${style.dim(`(${fallback})`)} `)
  ).trim();
  rl.close();
  return answer === "" ? fallback : answer;
}
