/**
 * Construit le registry Nova.
 *
 * Les sources du monorepo sont écrites pour le monorepo : elles s'importent
 * entre elles via `@nova-ui/core` et des chemins relatifs de paquet. Une fois
 * copiées dans le projet d'un utilisateur, ces imports ne résolvent plus rien.
 *
 * Ce script les réécrit. Il lit d'abord `packages/core/src/index.ts` pour
 * savoir quel symbole vient de quel module, puis remplace chaque import de
 * `@nova-ui/core` par des imports directs vers les fichiers réellement copiés.
 * Le résultat est du code qui se lit comme s'il avait été écrit à la main dans
 * le projet — ce qui est tout l'intérêt du modèle « copier-coller ».
 *
 * Le préfixe de chemin reste un jeton `%NOVA_LIB%` : c'est la CLI qui le
 * remplace par l'alias configuré dans `nova.json`.
 */

import { readFile, writeFile, mkdir, rm } from "node:fs/promises";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { catalogue } from "../apps/docs/lib/catalogue";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const LIB_TOKEN = "%NOVA_LIB%";

interface RegistryFile {
  path: string;
  target: string;
  kind?: "lib" | "component";
}

interface RegistryItem {
  name: string;
  title: string;
  description: string;
  exports: string[];
  files: RegistryFile[];
  /** Paquets npm exigés par ce composant. Voir DEPENDANCES.md. */
  dependencies?: string[];
}

interface Manifest {
  name: string;
  homepage: string;
  framework: string;
  base: { files: RegistryFile[]; css: string; dependencies?: string[] };
  items: RegistryItem[];
}

/** Symbole exporté par `@nova-ui/core` → module qui le définit réellement. */
interface SymbolOrigin {
  /** Chemin du module, relatif à la racine de la lib copiée. Ex. `engines/reveal`. */
  module: string;
  /** Nom local dans ce module, s'il diffère du nom exporté. */
  localName: string;
}

/**
 * Lit la barrique d'exports du cœur et en déduit l'origine de chaque symbole.
 * C'est ce qui permet de remplacer `from "@nova-ui/core"` par des chemins
 * précis, au lieu de forcer l'utilisateur à copier tout le paquet.
 */
async function readSymbolMap(): Promise<Map<string, SymbolOrigin>> {
  const source = await readFile(
    join(ROOT, "packages/core/src/index.ts"),
    "utf8",
  );
  const map = new Map<string, SymbolOrigin>();
  const statement = /export\s+(type\s+)?\{([^}]*)\}\s+from\s+"\.\/([^"]+)"/g;

  for (const match of source.matchAll(statement)) {
    const module = match[3]!;
    for (const raw of match[2]!.split(",")) {
      const specifier = raw.trim();
      if (!specifier) continue;
      const [localName, exportedName] = specifier.split(/\s+as\s+/);
      map.set((exportedName ?? localName)!.trim(), {
        module,
        localName: localName!.trim(),
      });
    }
  }
  return map;
}

/**
 * Réécrit un import de `@nova-ui/core` en un ou plusieurs imports directs,
 * regroupés par module d'origine.
 */
function rewriteCoreImport(
  specifiers: string,
  isTypeOnly: boolean,
  symbols: Map<string, SymbolOrigin>,
  context: string,
): string {
  const byModule = new Map<string, string[]>();

  for (const raw of specifiers.split(",")) {
    const name = raw.trim();
    if (!name) continue;

    const origin = symbols.get(name);
    if (!origin) {
      throw new Error(
        `Le symbole "${name}" importé par ${context} n'est pas exporté par ` +
          `packages/core/src/index.ts — le registry ne saurait pas où le trouver.`,
      );
    }

    const specifier =
      origin.localName === name ? name : `${origin.localName} as ${name}`;
    const list = byModule.get(origin.module) ?? [];
    list.push(specifier);
    byModule.set(origin.module, list);
  }

  return [...byModule.entries()]
    .map(
      ([module, names]) =>
        `import ${isTypeOnly ? "type " : ""}{ ${names.join(", ")} } from "${LIB_TOKEN}/${module}";`,
    )
    .join("\n");
}

/** Applique toutes les réécritures d'import à un fichier copié. */
function rewriteSource(
  source: string,
  file: RegistryFile,
  symbols: Map<string, SymbolOrigin>,
): string {
  let output = source;

  // 1. Imports du cœur, éclatés vers leurs modules réels.
  output = output.replace(
    /import\s+(type\s+)?\{([^}]*)\}\s+from\s+"@nova-ui\/core";/g,
    (_full, typeKeyword: string | undefined, specifiers: string) =>
      rewriteCoreImport(specifiers, Boolean(typeKeyword), symbols, file.path),
  );

  // 2. Sous-chemins du cœur — `@nova-ui/core/expand`. Ces entrées existent
  //    précisément pour que GSAP et Lenis n'entrent pas dans le graphe de
  //    modules d'un projet qui ne prend pas les composants qui en dépendent.
  //    Dans un projet consommateur, le fichier est simplement copié sous
  //    `engines/`, et l'import y pointe directement.
  output = output.replace(
    /from\s+"@nova-ui\/core\/([a-z0-9-]+)"/g,
    `from "${LIB_TOKEN}/engines/$1"`,
  );

  // 3. Chemins internes au paquet React → racine de la lib copiée.
  output = output.replace(
    /from\s+"\.\.\/hooks\/([^"]+)"/g,
    `from "${LIB_TOKEN}/$1"`,
  );
  output = output.replace(
    /from\s+"\.\.\/polymorphic"/g,
    `from "${LIB_TOKEN}/polymorphic"`,
  );
  output = output.replace(/from\s+"\.\.\/cn"/g, `from "${LIB_TOKEN}/cn"`);

  // Les fichiers du cœur gardent leurs chemins relatifs : l'arborescence
  // `internal/` et `engines/` est reproduite telle quelle chez l'utilisateur.

  // Garde-fou : plus aucun import ne doit pointer vers un paquet du monorepo.
  // On ne teste que les `from "..."`, pas le texte : les commentaires peuvent
  // légitimement citer @nova-ui/core pour expliquer d'où vient le fichier.
  const leftover = output.match(/from\s+"@nova-ui\/[^"]+"/);
  if (leftover) {
    throw new Error(
      `${file.path} : import non réécrit — ${leftover[0]}`,
    );
  }

  // Second garde-fou, et il a déjà servi : un composant part dans
  // `src/components/nova/`, la lib dans `src/lib/nova/`. Un chemin relatif
  // remontant qui survit à la réécriture ne résout donc plus rien chez
  // l'utilisateur — c'est exactement ce qui est arrivé au `../cn` du
  // sélecteur de date, invisible au typecheck du monorepo puisque là-bas il
  // était juste. Les fichiers du cœur, eux, gardent leur arborescence et
  // leurs chemins relatifs sont légitimes.
  if (file.kind === "component") {
    const relatif = output.match(/from\s+"\.\.?\/[^"]+"/);
    if (relatif) {
      throw new Error(
        `${file.path} : chemin relatif non réécrit — ${relatif[0]}. ` +
          `Un composant copié ne partage plus son dossier avec la lib.`,
      );
    }
  }
  return output;
}

async function main(): Promise<void> {
  const manifest: Manifest = JSON.parse(
    await readFile(join(ROOT, "registry/registry.json"), "utf8"),
  );
  const symbols = await readSymbolMap();

  /* Le registry ne distribue QUE les familles validées.

     La liste vient de `apps/docs/lib/catalogue.ts`, où le drapeau `valide` est
     posé à la main, famille par famille. Elle n'est pas recopiée ici : deux
     listes divergent, et la divergence se paierait au pire endroit — une fiche
     en ligne dont la commande d'installation répond « introuvable », ou un
     composant que la CLI sert alors que personne ne l'a relu.

     Le fichier importé ne dépend de rien : c'est de la donnée, tsx la lit
     directement, et le script reste exécutable sur un clone neuf sans build. */
  const validees = new Set(catalogue.map((fiche) => fiche.nom));
  const items = manifest.items.filter((item) => validees.has(item.name));

  /* Une famille validée sans entrée de registry n'est pas une omission
     bénigne : sa fiche est en ligne, elle affiche `npx novaui add <nom>`, et
     la commande échoue. On refuse de construire plutôt que de livrer ça. */
  const orphelines = [...validees].filter(
    (nom) => !manifest.items.some((item) => item.name === nom),
  );
  if (orphelines.length > 0) {
    throw new Error(
      `Validée(s) sans entrée dans registry.json : ${orphelines.join(", ")}. ` +
        `Soit on ajoute l'entrée, soit on retire \`valide\` de la fiche.`,
    );
  }

  const outputDirectory = join(ROOT, "registry/dist");
  await rm(outputDirectory, { recursive: true, force: true });
  await mkdir(outputDirectory, { recursive: true });

  async function resolveFiles(files: RegistryFile[]) {
    return Promise.all(
      files.map(async (file) => ({
        target: file.target,
        kind: file.kind ?? "lib",
        content: rewriteSource(
          await readFile(join(ROOT, file.path), "utf8"),
          file,
          symbols,
        ),
      })),
    );
  }

  // Socle — installé une fois par `novaui init`.
  const base = {
    files: await resolveFiles(manifest.base.files),
    css: await readFile(join(ROOT, manifest.base.css), "utf8"),
    dependencies: manifest.base.dependencies ?? [],
  };
  await writeFile(
    join(outputDirectory, "base.json"),
    JSON.stringify(base, null, 2),
  );

  // Un fichier par composant — ce que `novaui add` télécharge.
  for (const item of items) {
    const payload = {
      name: item.name,
      title: item.title,
      description: item.description,
      exports: item.exports,
      dependencies: item.dependencies ?? [],
      files: await resolveFiles(item.files),
    };
    await writeFile(
      join(outputDirectory, `${item.name}.json`),
      JSON.stringify(payload, null, 2),
    );
  }

  // Index — ce que `novaui list` affiche.
  const index = {
    name: manifest.name,
    homepage: manifest.homepage,
    framework: manifest.framework,
    generatedAt: new Date().toISOString(),
    items: items.map((item) => ({
      name: item.name,
      title: item.title,
      description: item.description,
      exports: item.exports,
      dependencies: item.dependencies ?? [],
    })),
  };
  await writeFile(
    join(outputDirectory, "index.json"),
    JSON.stringify(index, null, 2),
  );

  const retenues = manifest.items.length - items.length;
  console.log(
    `Registry construit : ${items.length} composants + socle (${base.files.length} fichiers).` +
      (retenues > 0
        ? ` ${retenues} famille(s) non validée(s), non distribuée(s).`
        : ""),
  );
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
