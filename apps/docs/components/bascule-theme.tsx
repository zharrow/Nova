"use client";

import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";

type Theme = "nuit" | "clair";

/**
 * Bascule sombre / clair.
 *
 * Le clair est le mode CANONIQUE : c'est celui dans lequel la direction est
 * dessinée, et celui sur lequel un composant copié atterrira le plus souvent.
 * Le sombre est un mode complet, pas un repli — c'est le meilleur fond des
 * cinq familles qui rayonnent. Voir DESIGN.md.
 *
 * L'état initial est posé par le script inline du `layout` AVANT la première
 * peinture — sans lui, une page rendue en sombre clignoterait en clair le
 * temps de l'hydratation. Ce composant se contente de relire l'attribut déjà
 * présent : il ne décide rien au montage.
 */
export function BasculeTheme() {
  const [theme, setTheme] = useState<Theme | null>(null);

  useEffect(() => {
    const pose = document.documentElement.getAttribute("data-theme");
    setTheme(pose === "nuit" ? "nuit" : "clair");
  }, []);

  function basculer() {
    const suivant: Theme = theme === "clair" ? "nuit" : "clair";
    setTheme(suivant);
    // `clair` est le défaut : on retire l'attribut au lieu de l'écrire, pour
    // qu'une racine sans attribut soit toujours le mode canonique.
    if (suivant === "nuit") {
      document.documentElement.setAttribute("data-theme", "nuit");
    } else {
      document.documentElement.removeAttribute("data-theme");
    }
    try {
      localStorage.setItem("nova-theme", suivant);
    } catch {
      // Navigation privée, stockage bloqué : la bascule marche quand même
      // pour la session en cours, elle ne se souvient simplement pas.
    }
  }

  return (
    <button
      type="button"
      onClick={basculer}
      aria-label={
        theme === "clair" ? "Passer en mode sombre" : "Passer en mode clair"
      }
      className="flex size-8 items-center justify-center rounded-presse border border-filet text-sourdine transition-colors hover:border-filet-vif hover:text-encre"
    >
      {/* Rendu neutre tant que le thème n'est pas lu : choisir une icône au
          hasard ferait un saut visible à l'hydratation. */}
      {theme === null ? (
        <span className="size-4" aria-hidden />
      ) : theme === "clair" ? (
        <Moon className="size-4" aria-hidden />
      ) : (
        <Sun className="size-4" aria-hidden />
      )}
    </button>
  );
}
