"use client";

import { useMemo, useState } from "react";
import { Check, Copy, X } from "lucide-react";

/**
 * Segment coloré. Le découpage est volontairement minuscule : les extraits du
 * catalogue sont du TSX de cinq lignes, pas des fichiers. Embarquer Shiki ou
 * Prism pour cela contredirait la doctrine des dépendances — on ne prend une
 * librairie que pour ce que le langage ne fait pas.
 */
type Jeton = { texte: string; classe: string };

const REGLES: Array<{ motif: RegExp; classe: string }> = [
  // L'ordre compte : commentaires et chaînes en premier, sinon leurs contenus
  // se font colorer par les règles suivantes.
  { motif: /\/\*[\s\S]*?\*\/|\/\/[^\n]*/g, classe: "text-code-comm" },
  { motif: /"[^"\n]*"|'[^'\n]*'|`[^`]*`/g, classe: "text-code-chaine" },
  { motif: /<\/?([A-Z][\w.]*)/g, classe: "text-code-type" },
  { motif: /\b(import|from|export|const|let|function|return|await|async|new|type|interface)\b/g, classe: "text-code-cle" },
  { motif: /\b(\d+(?:\.\d+)?)\b/g, classe: "text-code-nombre" },
  { motif: /\b([a-zA-Z][\w]*)(?==)/g, classe: "text-code-cle" },
  { motif: /--[\w-]+/g, classe: "text-code-type" },
];

/**
 * Les règles du TERMINAL, qui n'ont rien à voir avec celles du TSX.
 *
 * Une commande passée aux règles du TSX ne déclenche rien : `npx novaui add
 * reveal` n'a ni chaîne, ni balise, ni mot-clé. Elle sortait donc entièrement
 * en ponctuation, c'est-à-dire en gris uniforme — la ligne la plus importante
 * du site, celle qu'on vient copier, était la seule sans couleur.
 *
 * Quatre rôles, dans l'ordre où on les lit :
 *
 *  - le LANCEUR (`npx`, `pnpm`) reste en sourdine : c'est de la tuyauterie,
 *    la même pour tout le monde, et ce n'est pas ce qu'on cherche des yeux ;
 *  - l'OUTIL (`novaui`) prend la couleur des mots-clés — c'est le nom du
 *    produit, et la seule chose que le visiteur doit retenir de la ligne ;
 *  - la SOUS-COMMANDE (`init`, `add`, `list`) prend celle des types : ce que
 *    la commande fait ;
 *  - les ARGUMENTS — noms de composants — prennent celle des chaînes, parce
 *    que c'en sont : les seules valeurs que l'utilisateur remplace.
 *
 * Les drapeaux gardent la règle `--` du TSX, en type.
 */
const REGLES_TERMINAL: Array<{ motif: RegExp; classe: string }> = [
  { motif: /#[^\n]*/g, classe: "text-code-comm" },
  { motif: /--[\w-]+/g, classe: "text-code-nombre" },
  { motif: /\b(npx|npm|pnpm|yarn|bun|cd|node)\b/g, classe: "text-code-ponct" },
  { motif: /\bnovaui\b/g, classe: "text-code-cle" },
  { motif: /\b(init|add|list|build|dev|test)\b/g, classe: "text-code-type" },
  // Le reste d'une ligne de commande est un argument : un nom de composant,
  // un chemin. En dernier, pour ne prendre que ce que personne n'a réclamé.
  { motif: /[a-zA-Z][\w./-]*/g, classe: "text-code-chaine" },
];

/**
 * Découpe en jetons sans jamais superposer deux règles.
 *
 * On marque d'abord toutes les plages trouvées, en refusant celles qui
 * chevauchent une plage déjà prise — c'est ce qui empêche un mot-clé à
 * l'intérieur d'un commentaire de ressortir en orange par-dessus le gris.
 */
function colorer(code: string, regles = REGLES): Jeton[] {
  const prises: Array<{ debut: number; fin: number; classe: string }> = [];

  for (const { motif, classe } of regles) {
    motif.lastIndex = 0;
    let trouve: RegExpExecArray | null;
    while ((trouve = motif.exec(code)) !== null) {
      const debut = trouve.index;
      const fin = debut + trouve[0].length;
      if (trouve[0].length === 0) {
        motif.lastIndex++;
        continue;
      }
      const chevauche = prises.some((p) => debut < p.fin && fin > p.debut);
      if (!chevauche) prises.push({ debut, fin, classe });
    }
  }

  prises.sort((a, b) => a.debut - b.debut);

  const jetons: Jeton[] = [];
  let curseur = 0;
  for (const prise of prises) {
    if (prise.debut > curseur) {
      jetons.push({ texte: code.slice(curseur, prise.debut), classe: "text-code-ponct" });
    }
    jetons.push({ texte: code.slice(prise.debut, prise.fin), classe: prise.classe });
    curseur = prise.fin;
  }
  if (curseur < code.length) {
    jetons.push({ texte: code.slice(curseur), classe: "text-code-ponct" });
  }
  return jetons;
}

/**
 * Bloc de code avec bouton de copie.
 *
 * La rampe est CHAUDE parce que le signal est froid : un bleu dans le code se
 * lirait comme du signal, et le rationnement à deux occurrences par écran
 * n'aurait plus de sens. Voir DESIGN.md.
 *
 * L'API presse-papiers échoue hors contexte sécurisé (http://, certains
 * navigateurs embarqués) : l'échec est signalé plutôt qu'avalé, pour ne pas
 * laisser croire que la copie a marché.
 */
export function BlocCode({
  code,
  langue = "tsx",
}: {
  code: string;
  langue?: string;
}) {
  const [etat, setEtat] = useState<"repos" | "copie" | "echec">("repos");
  const jetons = useMemo(
    () => colorer(code, langue === "terminal" ? REGLES_TERMINAL : REGLES),
    [code, langue],
  );

  async function copier() {
    try {
      await navigator.clipboard.writeText(code);
      setEtat("copie");
    } catch {
      setEtat("echec");
    }
    setTimeout(() => setEtat("repos"), 2000);
  }

  return (
    <div className="overflow-hidden rounded-plan border border-filet bg-fond">
      <div className="flex items-center justify-between border-b border-filet px-4 py-2">
        <span className="cote">{langue}</span>
        <button
          type="button"
          onClick={copier}
          className="cote flex items-center gap-1.5 transition-colors hover:text-encre"
        >
          {etat === "copie" ? (
            <Check className="size-3" aria-hidden />
          ) : etat === "echec" ? (
            <X className="size-3" aria-hidden />
          ) : (
            <Copy className="size-3" aria-hidden />
          )}
          {etat === "copie" ? "copié" : etat === "echec" ? "échec" : "copier"}
        </button>
      </div>
      <pre className="overflow-x-auto p-4 font-mono text-[13px] leading-[1.7]">
        <code>
          {jetons.map((jeton, index) => (
            <span key={index} className={jeton.classe}>
              {jeton.texte}
            </span>
          ))}
        </code>
      </pre>
    </div>
  );
}
