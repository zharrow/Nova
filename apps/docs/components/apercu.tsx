"use client";

import { useEffect, useRef, useState } from "react";
import { Demo } from "./demos";
import { Telemetrie } from "./telemetrie";
import { reglagesDe } from "@/lib/catalogue";
import { Reglages } from "./reglages";
import { useSceneFiche } from "./scene-fiche";
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
 * Aperçu d'une fiche : la scène, sa télémétrie, et le sélecteur de formes.
 *
 * La scène est le PREMIER et le plus grand élément de la page — voir
 * DESIGN.md. L'ordre précédent plaçait quatre éléments de texte avant elle, et
 * lui laissait 208 px de haut, moins que son propre tableau d'options. Sur une
 * vitrine dont le point fixe est « le mouvement est l'objet », la composition
 * disait exactement l'inverse de la thèse.
 *
 * Le sélecteur n'est pas une commodité de démonstration. C'est la seule façon
 * de montrer qu'une entrée du catalogue est une FAMILLE et non une pièce
 * unique — voir VARIANTES.md. Il porte donc aussi le nom de la voie et ce
 * qu'elle implique.
 *
 * L'état — forme choisie, valeurs des réglages — vit dans `SceneFiche` et non
 * ici : le bloc d'usage, tout en bas de la page, doit lire les mêmes valeurs
 * pour afficher le code de ce qu'on regarde.
 */
export function Apercu() {
  const {
    fiche,
    formeActive,
    choisirForme,
    valeurs,
    reglerValeur,
    reinitialiser,
    themeScene,
  } = useSceneFiche();
  const { nom, titre, voie, formes } = fiche;

  /**
   * La scène est tenue dans un ÉTAT, pas dans une ref : la télémétrie doit se
   * rebrancher quand le nœud arrive, et une `useRef` ne provoque aucun rendu.
   * Même mécanique que le portail de Radix dans `lightbox.tsx`.
   */
  const [scene, setScene] = useState<HTMLDivElement | null>(null);
  const reglages = reglagesDe(nom);

  /**
   * Rejeu après réglage.
   *
   * Les moteurs qui tournent en continu — marquee, curseur, halftone —
   * appliquent une nouvelle option à chaud par leur `update()`. Ceux qui
   * jouent UNE FOIS au montage, comme TextHighlight ou Blinds, ne montreraient
   * rien : la durée changée ne servirait qu'au prochain rejeu manuel.
   *
   * On remonte donc la scène, mais 220 ms APRÈS le dernier mouvement. Un
   * curseur glissé tire des dizaines d'événements par seconde, et remonter à
   * chaque tick ferait broncher le canevas du halftone. Pendant le glissement
   * les props passent en direct ; au relâchement, l'effet se rejoue.
   */
  const [tour, setTour] = useState(0);
  const premierRendu = useRef(true);
  useEffect(() => {
    if (premierRendu.current) {
      premierRendu.current = false;
      return;
    }
    const minuteur = setTimeout(() => setTour((n) => n + 1), 220);
    return () => clearTimeout(minuteur);
  }, [valeurs]);
  const courante = formes?.find((forme) => forme.id === formeActive);
  const entete = voie ? VOIES[voie] : undefined;

  return (
    <div>
      {/* Le thème local est posé ICI et non sur la scène elle-même : les
          jetons sont déclarés sur `[data-theme]`, et un conteneur qui les
          redéclare suffit à retourner tout ce qu'il contient — filet du
          plancher et légende comprises. Sans attribut, la scène hérite de la
          page, ce qui reste le cas normal. */}
      <div
        ref={setScene}
        className="relative"
        data-theme={themeScene ?? undefined}
      >
        <Demo
          key={tour}
          nom={nom}
          forme={formeActive}
          nomAffiche={titre}
          reglages={valeurs}
        />
        <Telemetrie cible={scene} />
      </div>

      <Reglages
        reglages={reglages}
        valeurs={valeurs}
        onChange={reglerValeur}
        onReinit={reinitialiser}
      />

      {formes && formes.length > 1 ? (
        <div className="mt-5">
          <div className="mb-3 flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <p className="cote">
              {entete?.titre ?? "Formes"} · {formes.length}
            </p>
            {entete ? (
              <p className="max-w-[62ch] text-[13px] leading-relaxed text-second">
                {entete.explication}
              </p>
            ) : null}
          </div>

          <div className="flex flex-wrap gap-1.5">
            {formes.map((forme) => (
              <button
                key={forme.id}
                type="button"
                onClick={() => choisirForme(forme.id)}
                aria-pressed={formeActive === forme.id}
                className={cn(
                  "valeur rounded-presse border px-3 py-1.5 text-[11px] transition-colors",
                  // Le jeton actif se marque au FILET et à l'encre pleine, pas
                  // au signal : celui-ci est rationné à deux occurrences par
                  // écran, et la scène en consomme déjà. Voir DESIGN.md.
                  formeActive === forme.id
                    ? "border-filet-vif text-encre"
                    : "border-filet text-second hover:border-filet-vif hover:text-encre",
                )}
              >
                {forme.nom}
              </button>
            ))}
          </div>

          {courante ? (
            <p className="mt-3 max-w-[62ch] text-[13px] leading-relaxed text-prose">
              <span className="valeur text-[12px] text-encre">{courante.id}</span>{" "}
              — {courante.note}
            </p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
