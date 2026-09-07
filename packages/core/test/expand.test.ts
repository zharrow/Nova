import { describe, it, expect, afterEach } from "vitest";
import { createExpand } from "../src/engines/expand";
import { setReducedMotion } from "./setup";

/** Une ligne repliée : ce que le moteur doit mesurer avant la bascule. */
function ligne(): HTMLElement {
  const hote = document.createElement("div");
  hote.innerHTML = `
    <header>
      <span data-nova-flip-id="titre">Relancer Dupont</span>
      <span data-nova-spin>›</span>
    </header>`;
  document.body.appendChild(hote);
  return hote;
}

/** Le même hôte, une fois déplié : voile, pièces communes, lignes neuves. */
function deplier(hote: HTMLElement): void {
  hote.innerHTML = `
    <header>
      <span data-nova-veil></span>
      <span data-nova-flip-id="titre">Relancer Dupont</span>
      <p data-nova-reveal>Dernier échange il y a douze jours.</p>
      <span data-nova-spin>›</span>
    </header>
    <div data-nova-reveal>Le panneau.</div>`;
}

afterEach(() => setReducedMotion(false));

describe("createExpand", () => {
  it("relève l'aspect de la ligne pendant qu'elle est rendue", () => {
    // Une fois le panneau rendu, ni la hauteur ni les encres du replié ne sont
    // mesurables : c'est le seul moment où on peut les prendre.
    const hote = ligne();
    const moteur = createExpand(hote);

    moteur.syncCollapsed();
    moteur.capture();
    deplier(hote);

    // L'ouverture ne doit rien lever comme erreur avec un état relevé.
    expect(() => moteur.open()).not.toThrow();
    moteur.destroy();
  });

  it("ne joue rien en mouvement réduit", () => {
    // GSAP anime en JavaScript : la règle CSS ne peut rien pour lui, le
    // réglage se lit à la main.
    setReducedMotion(true);
    const hote = ligne();
    const moteur = createExpand(hote);

    moteur.capture();
    deplier(hote);
    moteur.open();

    // Aucun style en ligne posé : le moteur n'a pas touché à la boîte.
    expect(hote.style.height).toBe("");
    moteur.destroy();
  });

  it("ne joue pas un repli qu'il n'a jamais vu replié", () => {
    // Un panneau ouvert au montage, refermé sans avoir été rouvert : il n'y a
    // ni hauteur ni encres à viser, le repli ne se joue pas.
    const hote = ligne();
    deplier(hote);
    const moteur = createExpand(hote);

    return moteur.close().then(() => {
      expect(hote.style.pointerEvents).toBe("");
      moteur.destroy();
    });
  });

  it("rend la boîte à son état de départ après destroy", () => {
    const hote = ligne();
    const moteur = createExpand(hote);
    moteur.syncCollapsed();
    moteur.capture();
    deplier(hote);
    moteur.open();
    moteur.destroy();

    expect(hote.style.height).toBe("");
    expect(hote.style.overflow).toBe("");
    expect(hote.style.pointerEvents).toBe("");
  });
});
