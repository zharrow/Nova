import { describe, it, expect, vi, afterEach } from "vitest";
import { createGraph } from "../src/engines/graph";
import type { GraphNode, GraphEdge } from "../src/engines/graph";
import {
  dimensionner,
  setReducedMotion,
  MockIntersectionObserver,
  type ContexteEnregistreur,
} from "./setup";

const NOEUDS: GraphNode[] = [
  { id: "a", label: "Alpha", group: "un" },
  { id: "b", label: "Bravo", group: "un" },
  { id: "c", label: "Charlie", group: "deux" },
  { id: "d", label: "Delta", group: "deux" },
];
const ARETES: GraphEdge[] = [
  ["a", "b"],
  ["b", "c"],
  ["c", "d"],
];

function monter(): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  document.body.appendChild(canvas);
  dimensionner(canvas, 800, 400);
  return canvas;
}

function contexte(canvas: HTMLCanvasElement): ContexteEnregistreur {
  return canvas.getContext("2d") as unknown as ContexteEnregistreur;
}

afterEach(() => setReducedMotion(false));

describe("createGraph", () => {
  it("expose les voisins d'un nœud", () => {
    // C'est ce que la liste HTML affiche comme degré : la donnée doit venir du
    // moteur, pas être recalculée à côté.
    const graphe = createGraph(monter(), { nodes: NOEUDS, edges: ARETES });
    expect(graphe.neighbours("b").sort()).toEqual(["a", "c"]);
    expect(graphe.neighbours("a")).toEqual(["b"]);
    expect(graphe.neighbours("inconnu")).toEqual([]);
    graphe.destroy();
  });

  it("place les nœuds de façon déterministe", () => {
    // Deux chargements doivent donner la même topologie : sinon la page se
    // réagence sous l'œil du lecteur qui revient.
    setReducedMotion(true);

    const premier = monter();
    createGraph(premier, { nodes: NOEUDS, edges: ARETES });
    const a = contexte(premier)
      .appels.filter((appel) => appel.type === "arc")
      .map((appel) => appel.args.map((n) => Math.round(n * 100)));

    const second = monter();
    createGraph(second, { nodes: NOEUDS, edges: ARETES });
    const b = contexte(second)
      .appels.filter((appel) => appel.type === "arc")
      .map((appel) => appel.args.map((n) => Math.round(n * 100)));

    expect(a).toHaveLength(4);
    expect(a).toEqual(b);
  });

  it("change de disposition quand la graine change", () => {
    setReducedMotion(true);
    const premier = monter();
    createGraph(premier, { nodes: NOEUDS, edges: ARETES, seed: 1 });
    const a = contexte(premier).appels.filter((x) => x.type === "arc");

    const second = monter();
    createGraph(second, { nodes: NOEUDS, edges: ARETES, seed: 2 });
    const b = contexte(second).appels.filter((x) => x.type === "arc");

    expect(a.map((x) => x.args)).not.toEqual(b.map((x) => x.args));
  });

  it("n'ouvre aucune boucle en mouvement réduit", () => {
    setReducedMotion(true);
    const canvas = monter();
    createGraph(canvas, { nodes: NOEUDS, edges: ARETES });
    // Tout est déroulé à froid et dessiné une fois : les arêtes sont là.
    expect(
      contexte(canvas).appels.filter((x) => x.type === "lineTo"),
    ).toHaveLength(3);
  });

  it("suspend le cycle automatique hors écran", () => {
    vi.useFakeTimers();
    setReducedMotion(false);
    const canvas = monter();
    const change = vi.fn();
    createGraph(canvas, {
      nodes: NOEUDS,
      edges: ARETES,
      autoCycle: 500,
      onAutoChange: change,
    });

    MockIntersectionObserver.fire(canvas, true);
    vi.advanceTimersByTime(1200);
    const pendantVue = change.mock.calls.length;
    expect(pendantVue).toBeGreaterThan(0);

    // Un défilé qu'on ne regarde pas ne coûterait que du processeur.
    MockIntersectionObserver.fire(canvas, false);
    vi.advanceTimersByTime(3000);
    expect(change.mock.calls.length).toBe(pendantVue);

    vi.useRealTimers();
  });

  it("le cycle s'efface quand quelqu'un désigne un nœud", () => {
    vi.useFakeTimers();
    const canvas = monter();
    const change = vi.fn();
    const graphe = createGraph(canvas, {
      nodes: NOEUDS,
      edges: ARETES,
      autoCycle: 400,
      onAutoChange: change,
    });

    MockIntersectionObserver.fire(canvas, true);
    vi.advanceTimersByTime(900);
    const avant = change.mock.calls.length;

    // La main de l'utilisateur reprend le dessus sans lutter contre le minuteur.
    graphe.setActive("c");
    vi.advanceTimersByTime(2000);
    expect(change.mock.calls.length).toBe(avant);

    // Relâchée, elle le rend.
    graphe.setActive(null);
    vi.advanceTimersByTime(900);
    expect(change.mock.calls.length).toBeGreaterThan(avant);

    vi.useRealTimers();
    graphe.destroy();
  });

  it("nettoie tout après destroy", () => {
    const canvas = monter();
    const graphe = createGraph(canvas, { nodes: NOEUDS, edges: ARETES });
    expect(canvas.dataset.novaGraph).toBe("");
    graphe.destroy();
    expect(canvas.dataset.novaGraph).toBeUndefined();
  });
});
