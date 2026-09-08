"use client";

import { useEffect } from "react";

type Inscrit = { noeud: HTMLElement; rejouer: () => void };

/**
 * Les scènes qui acceptent le raccourci, à l'échelle du module.
 *
 * Un écouteur par scène ferait vingt-et-un écouteurs sur la page catalogue,
 * qui se déclencheraient tous ensemble. On garde donc un seul écouteur pour
 * tout le monde, et on choisit la cible au moment de la frappe — même logique
 * que le ticker et le pool d'observers du cœur : on mutualise, et on se
 * débranche dès qu'il n'y a plus d'abonné.
 */
const inscrits = new Set<Inscrit>();
let pointeur = { x: -1, y: -1 };
let branche = false;

/**
 * Une frappe dans un champ n'est pas un raccourci.
 *
 * Sans cette garde, taper « effet » dans la recherche du catalogue relancerait
 * une animation à chaque `f`, et écrire du JSON sur le banc deviendrait
 * impraticable. C'est le cas limite qui rend la fonctionnalité utilisable ou
 * pas — pas un détail d'implémentation.
 */
function saisieEnCours(cible: EventTarget | null): boolean {
  if (!(cible instanceof HTMLElement)) return false;
  if (cible.isContentEditable) return true;
  return ["INPUT", "TEXTAREA", "SELECT"].includes(cible.tagName);
}

/**
 * Quelle scène relancer.
 *
 * Trois règles, dans cet ordre. Le focus d'abord — un utilisateur au clavier a
 * désigné explicitement où il est. Le pointeur ensuite, pour la page catalogue
 * où vingt-et-une scènes coexistent. Et si une seule scène est inscrite, c'est
 * forcément celle-là : sur une fiche ou sur le banc, le raccourci marche donc
 * sans rien viser.
 */
function cibler(): Inscrit | null {
  const actif = document.activeElement;
  if (actif instanceof HTMLElement) {
    for (const inscrit of inscrits) {
      if (inscrit.noeud.contains(actif)) return inscrit;
    }
  }
  if (pointeur.x >= 0) {
    for (const inscrit of inscrits) {
      const r = inscrit.noeud.getBoundingClientRect();
      if (
        pointeur.x >= r.left &&
        pointeur.x <= r.right &&
        pointeur.y >= r.top &&
        pointeur.y <= r.bottom
      ) {
        return inscrit;
      }
    }
  }
  if (inscrits.size === 1) return inscrits.values().next().value ?? null;
  return null;
}

function surPointeur(event: PointerEvent) {
  pointeur = { x: event.clientX, y: event.clientY };
}

function surTouche(event: KeyboardEvent) {
  if (event.key !== "f" && event.key !== "F") return;
  // Les combinaisons appartiennent au navigateur et au système : `⌘F` cherche
  // dans la page, on ne le vole pas.
  if (event.metaKey || event.ctrlKey || event.altKey) return;
  if (saisieEnCours(event.target)) return;
  const cible = cibler();
  if (!cible) return;
  event.preventDefault();
  cible.rejouer();
}

function brancher() {
  if (branche) return;
  branche = true;
  window.addEventListener("pointermove", surPointeur, { passive: true });
  window.addEventListener("keydown", surTouche);
}

function debrancher() {
  if (!branche) return;
  branche = false;
  window.removeEventListener("pointermove", surPointeur);
  window.removeEventListener("keydown", surTouche);
}

/**
 * Inscrit une scène au raccourci `F`.
 *
 * `rejouer` peut être absent — une scène sans rejeu (RollText, Spotlight,
 * Cursor) ne s'inscrit pas, et la touche ne fait rien plutôt que de jouer une
 * commande morte.
 */
export function useRaccourciRejeu(
  noeud: HTMLElement | null,
  rejouer: (() => void) | undefined,
): void {
  useEffect(() => {
    if (!noeud || !rejouer) return;
    const inscrit: Inscrit = { noeud, rejouer };
    inscrits.add(inscrit);
    brancher();
    return () => {
      inscrits.delete(inscrit);
      if (inscrits.size === 0) debrancher();
    };
  }, [noeud, rejouer]);
}
