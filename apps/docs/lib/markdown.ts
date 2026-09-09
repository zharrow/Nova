/**
 * Les fiches, en markdown.
 *
 * Nova s'installe par copie et se lit surtout à travers un agent : la ligne
 * `npx novaui add reveal` est tapée trois fois sur quatre par un outil qui a
 * d'abord lu la page. Or une page Next rendue est du bruit pour ce lecteur-là
 * — barre latérale, scènes animées, panneaux de réglages — et rien de ce qui
 * compte n'y est structuré : le tableau d'options devient une suite de
 * cellules, l'exemple d'usage se noie dans le balisage du coloriseur.
 *
 * Le même contenu, servi en markdown, tient en deux kilo-octets et se lit sans
 * rien deviner. Ce n'est pas un export : c'est la même source, `lib/catalogue`,
 * rendue pour l'autre lecteur.
 *
 * L'exemple d'usage passe par `codeVivant` avec la forme PAR DÉFAUT, plutôt
 * que d'être recopié tel quel : la fiche affiche l'exemple réglé sur sa scène,
 * et le markdown doit dire la même chose que la page qu'il double.
 */

import {
  catalogue,
  libelleCategorie,
  nombreDeFormes,
  reglagesDe,
  dependancesDe,
  type Fiche,
} from "./catalogue";
import { codeVivant } from "./code-vivant";

const VOIES: Record<string, string> = {
  option: "une prop bascule d'une forme à l'autre",
  usage: "le même code servi avec une autre intention",
  frere: "un composant distinct, parce que le mécanisme diffère",
};

/** Une ligne de tableau markdown, tuyaux échappés. */
function cellule(texte: string): string {
  return texte.replace(/\|/g, "\\|").replace(/\n/g, " ");
}

export function ficheEnMarkdown(fiche: Fiche, origine: string): string {
  const deps = dependancesDe(fiche.nom);
  const formes = nombreDeFormes(fiche);
  const reglages = reglagesDe(fiche.nom);
  const lignes: string[] = [];

  lignes.push(`# ${fiche.titre}`, "");
  lignes.push(`> ${fiche.accroche}`, "");
  lignes.push(
    `- Famille : ${libelleCategorie(fiche.categorie)}`,
    `- Formes : ${formes}${fiche.voie ? ` (${VOIES[fiche.voie] ?? fiche.voie})` : ""}`,
    `- Dépendances : ${deps.length ? deps.join(", ") : "aucune"}`,
    `- Fiche : ${origine}/composants/${fiche.nom}`,
    "",
  );

  lignes.push("## Installation", "");
  lignes.push("```bash", `npx novaui add ${fiche.nom}`, "```", "");
  lignes.push(
    "La commande copie la famille entière, jamais une forme isolée : la source atterrit dans votre projet et vous la modifiez.",
    "",
  );

  lignes.push("## Usage", "");
  lignes.push(
    "```tsx",
    codeVivant(fiche, fiche.formes?.[0], {}),
    "```",
    "",
  );

  lignes.push("## Options", "");
  lignes.push("| Option | Type | Défaut | Rôle |", "| --- | --- | --- | --- |");
  for (const option of fiche.options) {
    lignes.push(
      `| \`${cellule(option.nom)}\` | ${cellule(option.type)} | ${cellule(option.defaut)} | ${cellule(option.role)} |`,
    );
  }
  lignes.push("");

  if (fiche.formes && fiche.formes.length > 1) {
    lignes.push("## Formes", "");
    for (const forme of fiche.formes) {
      const props = fiche.formeProp
        ? `\`${fiche.formeProp}="${forme.id}"\``
        : Object.entries(forme.props ?? {})
            .map(([nom, valeur]) =>
              typeof valeur === "string" ? `\`${nom}="${valeur}"\`` : `\`${nom}={${valeur}}\``,
            )
            .join(" ");
      lignes.push(`- **${forme.nom}** — ${props ? `${props} · ` : ""}${forme.note}`);
    }
    lignes.push("");
  }

  if (reglages.length > 0) {
    lignes.push("## Ce qui change visiblement le mouvement", "");
    for (const reglage of reglages) {
      lignes.push(`- \`${reglage.nom}\` — ${reglage.libelle} (défaut : ${reglage.defaut})`);
    }
    lignes.push("");
  }

  lignes.push("## Pourquoi cette version", "");
  lignes.push(fiche.apport, "");

  return lignes.join("\n");
}

/**
 * L'index que les agents lisent en premier.
 *
 * Le format `llms.txt` est une convention, pas une norme : un titre, un
 * paragraphe, puis des liens annotés. On y met ce qu'il faut pour choisir un
 * composant sans ouvrir toutes les pages — le nom, l'accroche, le nombre de
 * formes — et les règles du dépôt qui changent la façon d'écrire le code,
 * parce qu'un agent qui les ignore produit exactement ce que Nova cherche à
 * éviter : une section invisible en production.
 */
export function llmsTxt(origine: string): string {
  const lignes: string[] = [];

  lignes.push("# Nova", "");
  lignes.push(
    "> Librairie de composants animés en TypeScript. Modèle shadcn : la source se copie dans votre projet, vous la possédez. La liste ci-dessous fait foi — le catalogue grossit, aucun compte n'est écrit en dur.",
    "",
  );
  lignes.push(
    "Trois garanties qui valent pour tout le catalogue, et qui expliquent l'API :",
    "",
    "- **L'état par défaut est visible.** Aucun moteur ne pose une opacité, une transformation ou un masque qu'il ne saurait pas retirer. En mouvement réduit, en SSR, et pour un élément déjà à l'écran au montage, aucune animation d'entrée ne s'arme.",
    "- **Une seule boucle d'animation pour toute la page**, partagée par tous les moteurs, arrêtée dès qu'elle n'a plus d'abonné.",
    "- **`destroy()` rend l'élément exactement comme il était** : écouteurs retirés, observers détachés, DOM injecté retiré, attributs et variables CSS supprimés.",
    "",
  );
  lignes.push("## Composants", "");
  /* Un agent qui lit une section vide conclut que le fichier est cassé et
     invente le reste. Autant lui dire l'état réel : rien n'est publié. */
  if (catalogue.length === 0) {
    lignes.push(
      "Aucun composant publié pour l'instant : une famille n'est servie qu'une fois relue et validée.",
    );
  }
  for (const fiche of catalogue) {
    const deps = dependancesDe(fiche.nom);
    const notes = [
      `${nombreDeFormes(fiche)} forme${nombreDeFormes(fiche) > 1 ? "s" : ""}`,
      deps.length ? `dépend de ${deps.join(", ")}` : "aucune dépendance",
    ].join(", ");
    lignes.push(
      `- [${fiche.titre}](${origine}/composants/${fiche.nom}.md) : ${fiche.accroche} (${notes})`,
    );
  }
  lignes.push("");
  lignes.push("## Documentation", "");
  lignes.push(
    `- [Installation](${origine}/installation) : la CLI, et la copie manuelle.`,
    `- [Catalogue](${origine}/composants) : toutes les familles, par catégorie, avec recherche.`,
    "",
  );

  return lignes.join("\n");
}
