"use client";

import { useState } from "react";
import { Demo } from "./demos";
import type { Forme } from "@/lib/catalogue";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const VOIES: Record<string, { titre: string; explication: string }> = {
  option: {
    titre: "Formes",
    explication:
      "Une prop bascule d'une forme à l'autre. Un seul moteur, un seul fichier copié.",
  },
  usage: {
    titre: "Usages",
    explication:
      "Le même code, servi avec une autre intention. Rien à installer en plus — mais les deux se demandent explicitement, jamais l'une déduite de l'autre.",
  },
  frere: {
    titre: "Composants frères",
    explication:
      "Un mécanisme différent pour un effet parent. Deux composants distincts, parce qu'une option obligerait à embarquer du code inutile.",
  },
};

/**
 * Aperçu d'une fiche : la démonstration, et le sélecteur de formes.
 *
 * Le sélecteur n'est pas une commodité de démonstration. C'est la seule façon
 * de montrer qu'une entrée du catalogue est une FAMILLE et non une pièce
 * unique — voir VARIANTES.md. Il porte donc aussi le nom de la voie et ce
 * qu'elle implique.
 */
export function Apercu({
  nom,
  voie,
  formes,
}: {
  nom: string;
  voie?: "option" | "usage" | "frere";
  formes?: Forme[];
}) {
  const [active, setActive] = useState(formes?.[0]?.id);
  const courante = formes?.find((forme) => forme.id === active);
  const entete = voie ? VOIES[voie] : undefined;

  return (
    <div>
      <Demo nom={nom} forme={active} />

      {formes && formes.length > 1 ? (
        <div className="mt-5">
          <div className="mb-3 flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <p className="cote">
              {entete?.titre ?? "Formes"} · {formes.length}
            </p>
            {entete ? (
              <p className="text-[12.5px] leading-relaxed text-sourdine">
                {entete.explication}
              </p>
            ) : null}
          </div>

          <div className="flex flex-wrap gap-1.5">
            {formes.map((forme) => (
              <Button
                key={forme.id}
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setActive(forme.id)}
                aria-pressed={active === forme.id}
                className={cn(
                  "h-7 rounded-nova px-2.5 font-mono text-[11px] font-normal",
                  active === forme.id &&
                    "border-signal text-signal hover:text-signal",
                )}
              >
                {forme.nom}
              </Button>
            ))}
          </div>

          {courante ? (
            <p className="mt-3 text-[13px] leading-relaxed text-sourdine">
              <span className="font-mono text-[12px] text-encre">
                {courante.id}
              </span>{" "}
              — {courante.note}
            </p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
