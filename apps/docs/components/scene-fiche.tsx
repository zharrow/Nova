"use client";

import { createContext, useContext, useMemo, useState } from "react";
import { reglagesDe, type Fiche } from "@/lib/catalogue";
import { valeursParDefaut, type Valeurs } from "./reglages";

/**
 * L'état d'une fiche, partagé entre la scène et le bloc d'usage.
 *
 * Les deux sont séparés par toute la prose — la scène ouvre la page, la
 * référence la ferme — et pourtant ils décrivent la même chose : la forme
 * choisie et les options réglées. Tant que l'état vivait dans `Apercu`, le
 * code de la zone 3 ne pouvait pas le lire, et il affichait donc des valeurs
 * écrites à la main pendant que la scène en jouait d'autres.
 *
 * Un contexte plutôt qu'un état remonté dans la page : la page est un
 * composant serveur, et le devenir client pour tenir deux `useState` ferait
 * basculer la prose, le tableau d'options et le fil d'Ariane côté client sans
 * qu'aucun d'eux n'en ait besoin.
 */
interface EtatScene {
  fiche: Fiche;
  formeActive: string | undefined;
  choisirForme: (id: string) => void;
  valeurs: Valeurs;
  reglerValeur: (nom: string, valeur: number | boolean | string) => void;
  reinitialiser: () => void;
  /**
   * Le thème local de la scène, ou `null` quand elle suit la page.
   *
   * Voir `BasculeThemeScene` : une scène peut être retournée seule, sans que
   * la page change de mode.
   */
  themeScene: "nuit" | "clair" | null;
  basculerThemeScene: () => void;
}

const Contexte = createContext<EtatScene | null>(null);

export function SceneFiche({
  fiche,
  children,
}: {
  fiche: Fiche;
  children: React.ReactNode;
}) {
  const reglages = useMemo(() => reglagesDe(fiche.nom), [fiche.nom]);
  const [formeActive, setFormeActive] = useState(fiche.formes?.[0]?.id);
  const [valeurs, setValeurs] = useState<Valeurs>(() => valeursParDefaut(reglages));
  const [themeScene, setThemeScene] = useState<"nuit" | "clair" | null>(null);

  const valeur = useMemo<EtatScene>(
    () => ({
      fiche,
      formeActive,
      choisirForme: setFormeActive,
      valeurs,
      reglerValeur: (nom, v) =>
        setValeurs((precedent) => ({ ...precedent, [nom]: v })),
      reinitialiser: () => setValeurs(valeursParDefaut(reglages)),
      themeScene,
      basculerThemeScene: () =>
        setThemeScene((actuel) => {
          /* Au premier clic on part du thème de la PAGE, sinon la bascule ne
             ferait rien une fois sur deux : sur un site déjà en clair, poser
             « clair » comme premier état local ne change rien à l'écran et le
             bouton passe pour cassé. */
          if (actuel === null) {
            const page = document.documentElement.getAttribute("data-theme");
            return page === "nuit" ? "clair" : "nuit";
          }
          return actuel === "clair" ? "nuit" : "clair";
        }),
    }),
    [fiche, formeActive, valeurs, reglages, themeScene],
  );

  return <Contexte.Provider value={valeur}>{children}</Contexte.Provider>;
}

/**
 * L'état de la fiche courante.
 *
 * Lève plutôt que de renvoyer `null` : un `Apercu` ou un `UsageVivant` monté
 * hors de sa fiche est un bug de composition, pas un cas à gérer — il rendrait
 * une scène morte et un code figé, exactement les deux symptômes que ce
 * contexte existe pour supprimer.
 */
export function useSceneFiche(): EtatScene {
  const etat = useContext(Contexte);
  if (!etat) {
    throw new Error("useSceneFiche doit être appelé sous <SceneFiche>.");
  }
  return etat;
}
