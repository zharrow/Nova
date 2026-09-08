"use client";

import { useEffect, useState } from "react";

type Ligne = { cle: string; valeur: string };

/**
 * Ce que le moteur écrit réellement dans le DOM, lu en direct.
 *
 * C'est la pièce qui rend visible la doctrine du dépôt — « le JavaScript pose
 * des attributs, le CSS anime » — et qui transforme la démonstration en objet
 * mesuré plutôt qu'en image animée. Aucun concurrent ne montre cela.
 *
 * Elle n'échantillonne PAS à chaque image. Un `MutationObserver` suffit et
 * coûte moins : les moteurs écrivent leurs `data-nova-*` en attributs et leurs
 * `--nova-*` dans `style`, donc toute écriture déclenche une mutation. Lire à
 * 60 Hz forcerait en plus un calcul de style à chaque tour, pour afficher la
 * même valeur cent fois.
 *
 * Contraste : c'est du CONTENU DE SCÈNE, pas du chrome — à `--sourdine` le
 * panneau devenait illisible, ce qui vidait de son sens la seule pièce qui
 * prouve la doctrine. Libellés à `--second`, valeurs à `--encre`.
 */
export function Telemetrie({ cible }: { cible: HTMLElement | null }) {
  const [lignes, setLignes] = useState<Ligne[]>([]);

  useEffect(() => {
    if (!cible) return;

    function releve(): Ligne[] {
      if (!cible) return [];
      // Le moteur n'écrit pas forcément sur le conteneur : il écrit sur le
      // nœud qu'il anime, souvent créé par lui-même plus bas dans l'arbre.
      const porteur =
        (cible.querySelector<HTMLElement>("[class*='nova-'], [style*='--nova-']") ??
          null) ||
        cible;
      const noeuds = [cible, porteur, ...cible.querySelectorAll<HTMLElement>("*")];

      const vues = new Map<string, string>();
      for (const noeud of noeuds) {
        for (const attribut of Array.from(noeud.attributes)) {
          if (attribut.name.startsWith("data-nova-")) {
            // Un attribut sans valeur est un DRAPEAU : `data-nova-scramble`
            // dit « ce moteur est monté ici », pas « il vaut la chaîne vide ».
            vues.set(attribut.name, attribut.value === "" ? "posé" : attribut.value);
          }
        }
        const style = noeud.getAttribute("style");
        if (style) {
          for (const declaration of style.split(";")) {
            const [nom, valeur] = declaration.split(":");
            if (nom?.trim().startsWith("--nova-")) {
              vues.set(nom.trim(), valeur?.trim() ?? "");
            }
          }
        }
        // Six lignes suffisent : au-delà, le panneau concurrence la scène
        // qu'il est censé mesurer.
        if (vues.size >= 6) break;
      }
      return Array.from(vues, ([cle, valeur]) => ({ cle, valeur })).slice(0, 6);
    }

    setLignes(releve());
    const observateur = new MutationObserver(() => setLignes(releve()));
    observateur.observe(cible, {
      attributes: true,
      subtree: true,
      childList: true,
      attributeFilter: undefined,
    });
    return () => observateur.disconnect();
  }, [cible]);

  if (lignes.length === 0) return null;

  return (
    <div
      className="pointer-events-none absolute right-4 top-3 hidden text-right lg:block"
      aria-hidden
    >
      {lignes.map(({ cle, valeur }) => (
        <div key={cle} className="valeur text-[11px] leading-[1.8] text-second">
          {cle} <span className="text-encre">{tronque(valeur)}</span>
        </div>
      ))}
    </div>
  );
}

/** Une valeur longue casserait la colonne : le panneau mesure, il ne raconte pas. */
function tronque(valeur: string): string {
  return valeur.length > 18 ? `${valeur.slice(0, 17)}…` : valeur;
}
