"use client";

import type { Reglage } from "@/lib/catalogue";

export type Valeurs = Record<string, number | boolean | string>;

/** Les valeurs de départ d'un jeu de réglages. */
export function valeursParDefaut(reglages: Reglage[]): Valeurs {
  const sortie: Valeurs = {};
  for (const reglage of reglages) sortie[reglage.nom] = reglage.defaut;
  return sortie;
}

/**
 * Le panneau de réglages, sous la scène.
 *
 * Prolongement direct de la télémétrie : celle-ci montre ce que le moteur
 * ÉCRIT, les réglages laissent changer ce qu'on lui DONNE. Ensemble, la fiche
 * cesse d'être une image animée et devient un objet qu'on mesure et qu'on
 * règle — ce qui est exactement la thèse du site.
 *
 * Le nom de chaque réglage est le NOM RÉEL de la prop, affiché en chasse fixe
 * à côté du libellé : le visiteur qui bouge un curseur apprend du même geste
 * quoi écrire dans son code. C'est ce qui distingue un panneau de réglages
 * d'un jouet.
 */
export function Reglages({
  reglages,
  valeurs,
  onChange,
  onReinit,
}: {
  reglages: Reglage[];
  valeurs: Valeurs;
  onChange: (nom: string, valeur: number | boolean | string) => void;
  onReinit: () => void;
}) {
  if (reglages.length === 0) return null;

  const modifie = reglages.some((r) => valeurs[r.nom] !== r.defaut);

  return (
    <div className="mt-5 rounded-plan border border-filet bg-plan p-4 sm:p-5">
      <div className="mb-4 flex items-baseline justify-between gap-4">
        <p className="cote">Réglages · en direct</p>
        {/* Le retour aux défauts n'apparaît que s'il y a quelque chose à
            annuler : un bouton mort dans un coin est du chrome pur. */}
        {modifie ? (
          <button type="button" onClick={onReinit} className="lien cote hover:text-encre">
            réinitialiser
          </button>
        ) : null}
      </div>

      <div className="grid gap-x-8 gap-y-4 sm:grid-cols-2">
        {reglages.map((reglage) => (
          <div key={reglage.nom} className="min-w-0">
            <div className="mb-1.5 flex items-baseline justify-between gap-3">
              <label
                htmlFor={`reglage-${reglage.nom}`}
                className="min-w-0 truncate text-[13px] text-second"
              >
                {reglage.libelle}{" "}
                <span className="valeur text-[11px] text-sourdine">
                  {reglage.nom}
                </span>
              </label>
              {reglage.type === "nombre" ? (
                <span className="valeur shrink-0 text-[12px] text-encre">
                  {formate(Number(valeurs[reglage.nom]), reglage.pas)}
                  {reglage.unite ? (
                    <span className="text-sourdine"> {reglage.unite}</span>
                  ) : null}
                </span>
              ) : null}
            </div>

            {reglage.type === "nombre" ? (
              <input
                id={`reglage-${reglage.nom}`}
                type="range"
                min={reglage.min}
                max={reglage.max}
                step={reglage.pas}
                value={Number(valeurs[reglage.nom])}
                onChange={(e) => onChange(reglage.nom, Number(e.target.value))}
                className="nova-curseur w-full"
              />
            ) : reglage.type === "bool" ? (
              <button
                id={`reglage-${reglage.nom}`}
                type="button"
                role="switch"
                aria-checked={Boolean(valeurs[reglage.nom])}
                onClick={() => onChange(reglage.nom, !valeurs[reglage.nom])}
                className="valeur rounded-presse border border-filet px-3 py-1.5 text-[11px] text-second transition-colors hover:border-filet-vif hover:text-encre aria-checked:border-filet-vif aria-checked:text-encre"
              >
                {valeurs[reglage.nom] ? "activé" : "désactivé"}
              </button>
            ) : (
              <div className="flex flex-wrap gap-1.5">
                {reglage.choix.map((choix) => (
                  <button
                    key={choix}
                    type="button"
                    aria-pressed={valeurs[reglage.nom] === choix}
                    onClick={() => onChange(reglage.nom, choix)}
                    className={[
                      "valeur rounded-presse border px-2.5 py-1 text-[11px] transition-colors",
                      valeurs[reglage.nom] === choix
                        ? "border-filet-vif text-encre"
                        : "border-filet text-second hover:border-filet-vif hover:text-encre",
                    ].join(" ")}
                  >
                    {choix}
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Un pas décimal impose des décimales à l'affichage.
 *
 * Sans cela, `0.45` affiché à côté d'un curseur au pas de `0.05` saute de
 * `0.45` à `0.5` puis `0.55` : la colonne de chiffres danse, alors que la
 * police est justement tabulaire pour l'éviter.
 */
function formate(valeur: number, pas: number): string {
  if (Number.isInteger(pas)) return String(Math.round(valeur));
  const decimales = String(pas).split(".")[1]?.length ?? 2;
  return valeur.toFixed(decimales);
}
