"use client";

import { Moon, Sun } from "lucide-react";
import { useSceneFiche } from "./scene-fiche";

/**
 * Retourner la scène, sans retourner la page.
 *
 * Le site a deux modes complets, et jusqu'ici la seule façon de voir un
 * composant dans l'autre était de basculer tout le site : on perdait la scène
 * de vue le temps que l'œil se réhabitue, ce qui est exactement ce qu'il ne
 * faut pas quand on compare deux états.
 *
 * Sur les FICHES uniquement, comme la télémétrie. Le catalogue en porterait
 * un par case, et DESIGN.md interdit précisément d'y remettre une rangée
 * d'objets de chrome identiques. Une fiche n'a qu'une scène, donc un bouton.
 *
 * Il est posé dans la ligne du fil d'Ariane, à côté du menu « emporter », et
 * non DANS la scène : le plancher porte déjà le nom de la famille à gauche et
 * le rejeu à droite, et un troisième objet y chevauchait le nom. Le chrome
 * d'une scène appartient à la page, pas à la scène.
 */
export function BasculeThemeScene() {
  const { themeScene, basculerThemeScene } = useSceneFiche();

  return (
    <button
      type="button"
      onClick={basculerThemeScene}
      title="Retourner la scène, sans changer la page"
      className="cote flex items-center gap-1.5 rounded-presse px-1.5 py-1 transition-colors hover:text-encre"
    >
      {/* L'icône dit où l'on VA, pas où l'on est — même convention que la
          bascule de l'en-tête. Tant qu'aucun thème local n'est posé, la scène
          suit la page et l'icône reste neutre : afficher un état local qui
          n'existe pas ferait mentir le bouton. */}
      {themeScene === "clair" ? (
        <Moon className="size-3" aria-hidden />
      ) : themeScene === "nuit" ? (
        <Sun className="size-3" aria-hidden />
      ) : (
        <Contraste className="size-3" />
      )}
      retourner la scène
    </button>
  );
}

/**
 * Le disque mi-plein des bascules de thème au repos.
 *
 * Tracé ici plutôt qu'importé : DESIGN.md limite l'iconographie du site à
 * quatre icônes fonctionnelles, et celle-ci n'en est pas une de plus — c'est
 * l'état neutre des deux qui existent déjà, dessiné avec leur trait.
 */
function Contraste({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 16 16" className={className} aria-hidden fill="none">
      <circle cx="8" cy="8" r="5.5" stroke="currentColor" strokeWidth="1.5" />
      <path d="M8 2.5a5.5 5.5 0 0 1 0 11z" fill="currentColor" />
    </svg>
  );
}
