import { describe, it, expect, afterEach } from "vitest";
import { createHalftone } from "../src/engines/halftone";
import {
  dimensionner,
  setReducedMotion,
  setFinePointer,
  type ContexteEnregistreur,
} from "./setup";

function monter(): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  document.body.appendChild(canvas);
  dimensionner(canvas, 400, 400);
  return canvas;
}

/** Récupère le contexte enregistreur attaché à ce canvas. */
function contexte(canvas: HTMLCanvasElement): ContexteEnregistreur {
  return canvas.getContext("2d") as unknown as ContexteEnregistreur;
}

afterEach(() => {
  setReducedMotion(false);
  setFinePointer(true);
});

describe("createHalftone", () => {
  it("échantillonne une fonction de couverture sur toute la grille", () => {
    const canvas = monter();
    const vus: Array<[number, number]> = [];
    createHalftone(canvas, {
      source: (x, y) => {
        vus.push([x, y]);
        return 1;
      },
      cols: 8,
      rows: 8,
    });

    expect(vus).toHaveLength(64);
    // Échantillonné au CENTRE de chaque cellule, pas à son coin.
    expect(vus[0]).toEqual([0.5 / 8, 0.5 / 8]);
  });

  it("ne dessine rien sous le plancher de couverture", () => {
    // Une trame doit avoir du blanc : sans plancher, chaque cellule vide
    // produirait un module minuscule et le fond deviendrait gris.
    const canvas = monter();
    createHalftone(canvas, { source: () => 0, cols: 10, rows: 10 });
    const ctx = canvas.getContext("2d") as unknown as ContexteEnregistreur;
    expect(ctx.appels.filter((a) => a.type === "fillRect")).toHaveLength(0);
  });

  it("quantifie la valeur en paliers", () => {
    // Une trame d'imprimeur est discrète : deux couvertures voisines dans le
    // même palier doivent donner exactement le même module.
    const canvas = monter();

    const tailles = (couverture: number) => {
      const c = document.createElement("canvas");
      document.body.appendChild(c);
      dimensionner(c, 400, 400);
      createHalftone(c, {
        source: () => couverture,
        cols: 4,
        rows: 4,
        steps: 2,
        bleed: 0,
      });
      const ctx = c.getContext("2d") as unknown as ContexteEnregistreur;
      return ctx.appels.find((a) => a.type === "fillRect")!.args[2];
    };

    // 0,3 et 0,45 tombent tous deux dans le premier des deux paliers.
    expect(tailles(0.3)).toBe(tailles(0.45));
    // 0,8 est dans le second : il doit produire un module plus grand.
    expect(tailles(0.8)!).toBeGreaterThan(tailles(0.3)!);
    expect(canvas).toBeTruthy();
  });

  it("dessine des cercles quand on les demande", () => {
    const canvas = monter();
    createHalftone(canvas, {
      source: () => 1,
      cols: 4,
      rows: 4,
      shape: "circle",
    });
    const ctx = canvas.getContext("2d") as unknown as ContexteEnregistreur;
    expect(ctx.appels.every((a) => a.type === "arc")).toBe(true);
    expect(ctx.appels).toHaveLength(16);
  });

  it("n'écoute le pointeur que si on demande un agrandissement", () => {
    const canvas = monter();
    let ecoutes = 0;
    const ajout = canvas.addEventListener.bind(canvas);
    canvas.addEventListener = ((type: string, ...reste: unknown[]) => {
      if (type === "pointermove") ecoutes++;
      return ajout(type as never, ...(reste as [never]));
    }) as typeof canvas.addEventListener;

    createHalftone(canvas, { source: () => 1, cols: 4, pointerBoost: 0 });
    expect(ecoutes).toBe(0);

    createHalftone(canvas, { source: () => 1, cols: 4, pointerBoost: 0.4 });
    expect(ecoutes).toBe(1);
  });

  it("n'écoute pas le pointeur en mouvement réduit", () => {
    setReducedMotion(true);
    const canvas = monter();
    let ecoutes = 0;
    const ajout = canvas.addEventListener.bind(canvas);
    canvas.addEventListener = ((type: string, ...reste: unknown[]) => {
      if (type === "pointermove") ecoutes++;
      return ajout(type as never, ...(reste as [never]));
    }) as typeof canvas.addEventListener;

    createHalftone(canvas, { source: () => 1, cols: 4, pointerBoost: 0.4 });
    expect(ecoutes).toBe(0);
  });

  it("nettoie tout après destroy", () => {
    const canvas = monter();
    const instance = createHalftone(canvas, { source: () => 1, cols: 4 });
    expect(canvas.dataset.novaHalftone).toBe("");
    instance.destroy();
    expect(canvas.dataset.novaHalftone).toBeUndefined();
  });
});
