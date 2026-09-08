"use client";

import { useEffect, useRef, useState } from "react";
import { Lames } from "./lames";

/**
 * Les brouillons — l'antichambre de la librairie.
 *
 * Un composant qui n'est pas encore dans `packages/core` vit ici. Il apparaît
 * sur `/banc` au même titre qu'une famille du catalogue, ce qui permet de le
 * régler et de le juger AVANT de décider s'il mérite un moteur, une entrée de
 * registry et une fiche.
 *
 * Ajouter un brouillon = écrire le composant dans ce fichier (ou à côté), puis
 * une ligne dans `BROUILLONS`. Rien d'autre.
 *
 * Quand il est jugé bon, il part vers `packages/core/src/engines` en suivant
 * les deux questions de CLAUDE.md — de quelle famille est-ce une forme, et
 * faut-il une librairie. Un brouillon n'est PAS une exception aux règles du
 * dépôt, c'est une étape avant de les appliquer.
 */

export interface Brouillon {
  nom: string;
  titre: string;
  /** Ce qu'on cherche à valider. Le brouillon existe pour répondre à ça. */
  note: string;
  Composant: React.ComponentType<Record<string, unknown>>;
  /** Valeurs de départ, et surface d'options à essayer sur le banc. */
  defauts: Record<string, unknown>;
}

/* ────────────────────────────────────────────────────────────────────────
   Aimant — candidat.

   Un élément attiré par le pointeur, qui revient à sa place quand il
   s'éloigne. Sert d'exemple vivant du format d'un brouillon : il montre les
   trois choses qu'un candidat doit prouver avant d'entrer dans la librairie.

   1. L'état par défaut est visible — au repos, l'élément est à sa place, sans
      transform posée qu'on ne saurait pas retirer.
   2. Le mouvement réduit est respecté à la main, parce que le déplacement est
      écrit en JavaScript et qu'aucune règle CSS ne peut l'annuler.
   3. Le démontage rend l'élément à son état de départ.

   Ce qui reste à trancher, et c'est pour ça qu'il est ici : faut-il une seule
   boucle partagée (le ticker de Nova) plutôt qu'un rAF local ? En l'état il
   ouvre le sien, ce qui est exactement ce que CLAUDE.md interdit à un moteur.
   C'est la dette assumée d'un brouillon.
   ──────────────────────────────────────────────────────────────────────── */
function Aimant({
  force = 0.35,
  rayon = 140,
  lissage = 0.15,
  libelle = "Aimant",
}: {
  force?: number;
  rayon?: number;
  lissage?: number;
  libelle?: string;
}) {
  const cible = useRef<HTMLButtonElement>(null);
  const [reduit, setReduit] = useState(false);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const lire = () => setReduit(media.matches);
    lire();
    media.addEventListener("change", lire);
    return () => media.removeEventListener("change", lire);
  }, []);

  useEffect(() => {
    const noeud = cible.current;
    if (!noeud || reduit) return;

    let vise = { x: 0, y: 0 };
    let pose = { x: 0, y: 0 };
    let image = 0;

    function surPointeur(event: PointerEvent) {
      if (!noeud) return;
      const r = noeud.getBoundingClientRect();
      const cx = r.left + r.width / 2;
      const cy = r.top + r.height / 2;
      const dx = event.clientX - cx;
      const dy = event.clientY - cy;
      const distance = Math.hypot(dx, dy);
      // Hors du rayon, la cible reprend sa place : l'attraction est locale,
      // sinon l'élément suivrait le pointeur à travers toute la page.
      if (distance > rayon) {
        vise = { x: 0, y: 0 };
        return;
      }
      vise = { x: dx * force, y: dy * force };
    }

    function boucle() {
      if (!noeud) return;
      pose.x += (vise.x - pose.x) * lissage;
      pose.y += (vise.y - pose.y) * lissage;
      noeud.style.transform = `translate3d(${pose.x.toFixed(2)}px, ${pose.y.toFixed(2)}px, 0)`;
      image = requestAnimationFrame(boucle);
    }

    window.addEventListener("pointermove", surPointeur);
    image = requestAnimationFrame(boucle);
    return () => {
      window.removeEventListener("pointermove", surPointeur);
      cancelAnimationFrame(image);
      // Démontage propre : on rend l'élément à son état de départ.
      noeud.style.transform = "";
    };
  }, [force, rayon, lissage, reduit]);

  return (
    <button
      ref={cible}
      type="button"
      className="rounded-presse border border-filet bg-banc-haut px-6 py-3 text-sm font-semibold text-encre"
    >
      {libelle}
      {reduit ? (
        <span className="cote ml-3">mouvement réduit — inerte</span>
      ) : null}
    </button>
  );
}

export const BROUILLONS: Brouillon[] = [
  {
    nom: "lames",
    titre: "Lames — dix variations",
    note: "Dix chorégraphies pour le rideau `blades` de Loader, sous une horloge unique et un budget de sortie commun. À trancher : lesquelles méritent d'être des formes, et laquelle remplace la référence. Cliquez une vignette pour l'isoler.",
    Composant: Lames as React.ComponentType<Record<string, unknown>>,
    defauts: {
      lames: 6,
      holdMs: 700,
      exitMs: 1000,
      pauseMs: 900,
      boucle: true,
      solo: "",
    },
  },
  {
    nom: "aimant",
    titre: "Aimant",
    note: "Attraction locale au pointeur. À trancher : passer par le ticker partagé plutôt qu'un rAF local.",
    Composant: Aimant as React.ComponentType<Record<string, unknown>>,
    defauts: { force: 0.35, rayon: 140, lissage: 0.15, libelle: "Aimant" },
  },
];
