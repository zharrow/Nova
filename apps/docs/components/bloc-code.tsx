"use client";

import { useState } from "react";

/**
 * Bloc de code avec bouton de copie.
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
    <div className="group relative overflow-hidden rounded-nova border border-filet bg-surface">
      <div className="flex items-center justify-between border-b border-filet px-4 py-2">
        <span className="cote">{langue}</span>
        <button
          type="button"
          onClick={copier}
          className="cote transition-colors hover:text-encre"
        >
          {etat === "copie" ? "copié" : etat === "echec" ? "échec" : "copier"}
        </button>
      </div>
      <pre className="overflow-x-auto p-4 text-[13px] leading-relaxed">
        <code className="font-mono text-encre/90">{code}</code>
      </pre>
    </div>
  );
}
