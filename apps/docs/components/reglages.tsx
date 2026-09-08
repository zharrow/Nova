"use client";

import type { Reglage } from "@/lib/catalogue";
import { courbesDe, trouverCourbe } from "@/lib/courbes";
import { VignetteCourbe } from "./courbe";

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
          <div
            key={reglage.nom}
            className={
              // Huit vignettes de courbe ne tiennent pas dans une demi-colonne :
              // le sélecteur prend la largeur, les curseurs restent appariés.
              reglage.type === "courbe" || reglage.type === "texte"
                ? "min-w-0 sm:col-span-2"
                : "min-w-0"
            }
          >
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
              ) : reglage.type === "texte" ? (
                <span className="valeur shrink-0 text-[12px] text-sourdine">
                  {String(valeurs[reglage.nom]).length}
                  {reglage.max ? ` / ${reglage.max}` : ""}
                </span>
              ) : reglage.type === "courbe" ? (
                /* La valeur EXACTE, telle qu'on l'écrirait. C'est la moitié de
                   l'intérêt du sélecteur : on choisit sur le dessin, et on
                   repart avec la chaîne à coller. */
                <span className="valeur shrink-0 text-[12px] text-encre">
                  {String(valeurs[reglage.nom])}
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
            ) : reglage.type === "texte" ? (
              /* Le champ est la seule commande du panneau qui produise du
                 CONTENU et non un nombre. Il prend donc la largeur, et sa
                 taille de texte est celle d'une saisie, pas d'une étiquette —
                 on écrit ici ce qu'on lira là-bas. La scène se remonte 220 ms
                 après la dernière frappe, comme pour un curseur : remonter à
                 chaque lettre rejouerait l'effet sur un mot en cours
                 d'écriture. */
              <input
                id={`reglage-${reglage.nom}`}
                type="text"
                value={String(valeurs[reglage.nom])}
                maxLength={reglage.max}
                spellCheck={false}
                onChange={(e) => onChange(reglage.nom, e.target.value)}
                placeholder={reglage.defaut}
                className="w-full rounded-presse border border-filet bg-fond px-3 py-2 text-[14px] text-encre outline-none transition-colors placeholder:text-sourdine focus-visible:border-filet-vif"
              />
            ) : reglage.type === "courbe" ? (
              <SelecteurCourbe
                reglage={reglage}
                valeur={String(valeurs[reglage.nom])}
                onChange={(v) => onChange(reglage.nom, v)}
              />
            ) : reglage.type === "choix" ? (
              /* La branche est explicite et non un `else` : avec cinq types de
                 réglage, un `else` ne narrowerait plus rien et `choix` ne
                 serait plus garanti sur le réglage. */
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
            ) : null}
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Le sélecteur de courbe.
 *
 * Chaque bouton porte le TRACÉ de sa courbe à côté de son nom, et c'est tout
 * l'intérêt : on choisit sur le dessin. Personne ne retient de tête ce que
 * fait `cubic-bezier(0.34, 1.56, 0.64, 1)`, et « ease-in » se confond avec
 * « ease-out » une fois sur deux — mais une courbe qui dépasse le haut du
 * cadre avant de revenir se comprend sans légende.
 *
 * La note de la courbe choisie s'affiche dessous, et elle ne décrit pas la
 * forme (le dessin s'en charge) : elle dit À QUOI ÇA SERT. C'est la seule
 * chose que le tracé ne peut pas montrer.
 */
function SelecteurCourbe({
  reglage,
  valeur,
  onChange,
}: {
  reglage: Extract<Reglage, { type: "courbe" }>;
  valeur: string;
  onChange: (valeur: string) => void;
}) {
  const courbes = courbesDe(reglage.vocabulaire);
  const choisie = trouverCourbe(reglage.vocabulaire, valeur);

  return (
    <div>
      <div className="flex flex-wrap gap-1.5">
        {courbes.map((courbe) => {
          const actif = courbe.valeur === valeur;
          return (
            <button
              key={courbe.valeur}
              type="button"
              aria-pressed={actif}
              onClick={() => onChange(courbe.valeur)}
              title={courbe.note}
              className={[
                "flex items-center gap-2 rounded-presse border px-2 py-1.5 transition-colors",
                actif
                  ? "border-filet-vif text-encre"
                  : "border-filet text-second hover:border-filet-vif hover:text-encre",
              ].join(" ")}
            >
              <VignetteCourbe courbe={courbe} actif={actif} />
              <span className="valeur text-[11px]">{courbe.etiquette}</span>
            </button>
          );
        })}
      </div>
      {choisie ? (
        <p className="mt-2.5 max-w-[62ch] text-[12px] leading-relaxed text-second">
          {choisie.note}
        </p>
      ) : null}
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
