/**
 * novaui — CLI Nova.
 *
 * Trois commandes : `init` prépare le projet, `add` copie des composants,
 * `list` montre le catalogue. Aucune dépendance : `npx novaui` ne télécharge
 * que ce fichier et son registry embarqué.
 */

import { init } from "./commands/init";
import { add } from "./commands/add";
import { list } from "./commands/list";
import { log, style } from "./ui";

const VERSION = "0.1.0";

const HELP = `
  ${style.bold("Nova")} ${style.dim(`v${VERSION}`)}
  Composants animés, copiés dans votre projet.

  ${style.bold("Commandes")}
    ${style.cyan("init")}                 Installe le socle et écrit nova.json
    ${style.cyan("add")} <composants...>  Copie la source d'un ou plusieurs composants
    ${style.cyan("list")}                 Affiche le catalogue

  ${style.bold("Options")}
    --yes            init : accepte la configuration détectée sans rien demander
    --force          init : réinstalle le socle et réécrit nova.json
                            (c'est aussi la façon de mettre le socle à jour)
    --overwrite      add  : écrase sans demander les fichiers déjà présents
    --no-install     add  : n'installe rien, affiche seulement la commande
    --yes            add  : installe les dépendances sans demander
    --cwd <chemin>   Travaille dans un autre dossier que le dossier courant
    -h, --help       Affiche cette aide
    -v, --version    Affiche la version

  ${style.bold("Exemples")}
    ${style.dim("npx novaui init")}
    ${style.dim("npx novaui add reveal scramble-text marquee")}
`;

async function main(): Promise<void> {
  const argv = process.argv.slice(2);
  const flags = new Set(argv.filter((argument) => argument.startsWith("-")));

  // `--cwd <chemin>` est retiré des positionnels pour ne pas être pris pour un
  // nom de composant.
  const cwdIndex = argv.indexOf("--cwd");
  const cwd = cwdIndex !== -1 ? (argv[cwdIndex + 1] ?? process.cwd()) : process.cwd();

  const positional = argv.filter((argument, index) => {
    if (argument.startsWith("-")) return false;
    if (cwdIndex !== -1 && index === cwdIndex + 1) return false;
    return true;
  });

  if (flags.has("-v") || flags.has("--version")) {
    console.log(VERSION);
    return;
  }

  const [command, ...rest] = positional;

  if (!command || flags.has("-h") || flags.has("--help")) {
    console.log(HELP);
    return;
  }

  switch (command) {
    case "init":
      await init(cwd, flags);
      break;
    case "add":
      await add(cwd, rest, flags);
      break;
    case "list":
      await list(cwd);
      break;
    default:
      log.error(`Commande inconnue : ${command}`);
      console.log(HELP);
      process.exitCode = 1;
  }
}

main().catch((error) => {
  log.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
