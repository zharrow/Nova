import { describe, it, expect, afterEach } from "vitest";
import { createProgress } from "../src/engines/progress";

const vivantes: Array<{ destroy(): void }> = [];
function monter(options: Parameters<typeof createProgress>[1] = {}) {
  const element = document.createElement("div");
  document.body.appendChild(element);
  const instance = createProgress(element, options);
  vivantes.push(instance);
  return { element, instance };
}

afterEach(() => {
  for (const instance of vivantes.splice(0)) instance.destroy();
});

const part = (el: HTMLElement) =>
  Number.parseFloat(el.style.getPropertyValue("--nova-progress"));

describe("createProgress", () => {
  it("pose l'avancement en variable, et rien d'autre à mettre à jour", () => {
    // Toute la mise à jour tient dans une variable : c'est ce qui permet de
    // brancher la jauge sur une valeur qui bouge soixante fois par seconde.
    const { element, instance } = monter({ form: "bar", value: 0.4 });
    expect(part(element)).toBeCloseTo(0.4);

    const avant = element.innerHTML;
    instance.update({ value: 0.75 });
    expect(part(element)).toBeCloseTo(0.75);
    // Les nœuds n'ont pas bougé : reconstruire ferait clignoter la couche.
    expect(element.innerHTML).toBe(avant);
  });

  it("borne les valeurs hors échelle au lieu de déborder", () => {
    const { element, instance } = monter({ value: 5 });
    expect(part(element)).toBe(1);
    instance.update({ value: -3 });
    expect(part(element)).toBe(0);
  });

  it("dit qu'une valeur inconnue est inconnue", () => {
    // `null` n'est pas zéro. La jauge le marque, et surtout elle RETIRE
    // `aria-valuenow` : c'est la façon normée de dire « en cours, valeur
    // inconnue ». Y laisser un nombre estimé ferait lire un chiffre faux.
    const { element, instance } = monter({ value: null });
    expect(element.dataset.novaProgressState).toBe("indeterminate");
    expect(element.hasAttribute("aria-valuenow")).toBe(false);
    expect(element.querySelector(".nova-progress__edge")).not.toBeNull();

    instance.update({ value: 0.5 });
    expect(element.dataset.novaProgressState).toBe("determinate");
    expect(element.getAttribute("aria-valuenow")).toBe("50");
  });

  it("resserre le pas de la règle vers la FIN", () => {
    // C'est là que le regard s'attarde, donc là qu'une règle doit avoir de la
    // résolution. Une graduation à pas constant est un gabarit.
    const { element } = monter({ form: "ticks", steps: 9 });
    const positions = Array.from(
      element.querySelectorAll<HTMLElement>(
        "[data-nova-on] > .nova-progress__ticks-piece",
      ),
      (piece) => Number.parseFloat(piece.style.left),
    );

    expect(positions).toHaveLength(9);
    expect(positions[0]).toBe(0);
    expect(positions[positions.length - 1]).toBeCloseTo(100);

    const premierPas = positions[1]! - positions[0]!;
    const dernierPas =
      positions[positions.length - 1]! - positions[positions.length - 2]!;
    expect(dernierPas).toBeLessThan(premierPas);
  });

  it("dessine chaque forme avec ses propres pièces", () => {
    const attendus: Array<[Parameters<typeof createProgress>[1], string]> = [
      [{ form: "bar" }, ".nova-progress__fill"],
      [{ form: "ticks" }, ".nova-progress__ticks-piece"],
      [{ form: "blades" }, ".nova-progress__blades-piece"],
      [{ form: "ring" }, ".nova-progress__ring-fill"],
      [{ form: "curve" }, ".nova-progress__curve-fill"],
      [{ form: "count" }, ".nova-progress__count"],
    ];
    for (const [options, selecteur] of attendus) {
      const { element } = monter(options);
      expect(element.querySelector(selecteur), `${options!.form}`).not.toBeNull();
    }
  });

  it("donne au CSS de quoi calculer l'anneau sans revenir en JS", () => {
    const anneau = monter({ form: "ring" }).element;
    expect(
      Number.parseFloat(anneau.style.getPropertyValue("--nova-progress-circ")),
    ).toBeGreaterThan(0);
  });

  it("empile la courbe en DEUX calques, comme les autres formes", () => {
    // Une seule mécanique pour toute la famille : un calque éteint, un calque
    // allumé, le second découpé. Tracer la course en longueur d'arc affichait
    // « 62 % » à côté d'un tracé au tiers — l'axe horizontal EST la course.
    const { element } = monter({ form: "curve", curve: [0.16, 1, 0.3, 1] });
    const calques = element.querySelectorAll(".nova-progress__curve");
    expect(calques).toHaveLength(2);
    expect(calques[0]!.hasAttribute("data-nova-on")).toBe(false);
    expect(calques[1]!.hasAttribute("data-nova-on")).toBe(true);

    // Les points de contrôle finissent dans le tracé, sans quoi la courbe
    // affichée ne serait pas celle qu'on a demandée.
    const trace = element.querySelector(".nova-progress__curve-fill")!;
    expect(trace.getAttribute("d")).toBe("M 0 100 C 16 0 30 0 100 0");
  });

  it("relève un nombre, et un tiret quand il n'y a rien à relever", () => {
    const { element, instance } = monter({ form: "count", value: 0.42 });
    const nombre = element.querySelector(".nova-progress__count")!;
    expect(nombre.textContent).toBe("42 %");

    instance.update({ value: null });
    expect(nombre.textContent).toBe("—");
  });

  it("ne réécrit pas une sémantique déjà posée", () => {
    // Enveloppé dans un `Progress` de Radix, l'élément porte déjà son rôle.
    // Deux sémantiques sur un même nœud en font une fausse.
    const element = document.createElement("div");
    element.setAttribute("role", "progressbar");
    document.body.appendChild(element);
    const instance = createProgress(element, { value: 0.5 });
    vivantes.push(instance);

    expect(element.hasAttribute("aria-valuemin")).toBe(false);
    expect(element.hasAttribute("aria-valuenow")).toBe(false);
    // Et il ne retire pas au démontage ce qu'il n'a pas posé.
    instance.destroy();
    expect(element.getAttribute("role")).toBe("progressbar");
  });

  it("reconstruit quand la STRUCTURE change, pas quand la valeur change", () => {
    const { element, instance } = monter({ form: "ticks", steps: 6 });
    expect(element.querySelectorAll(".nova-progress__ticks-piece")).toHaveLength(12);

    instance.update({ steps: 10 });
    expect(element.querySelectorAll(".nova-progress__ticks-piece")).toHaveLength(20);

    instance.update({ form: "ring" });
    expect(element.querySelector(".nova-progress__ring-fill")).not.toBeNull();
    expect(element.querySelector(".nova-progress__ticks-piece")).toBeNull();
  });

  it("rend l'élément à son état de départ", () => {
    const element = document.createElement("div");
    element.innerHTML = "<p>Avant</p>";
    document.body.appendChild(element);
    createProgress(element, { form: "ticks", value: 0.5 }).destroy();

    expect(element.innerHTML).toBe("<p>Avant</p>");
    expect(element.dataset.novaProgress).toBeUndefined();
    expect(element.hasAttribute("role")).toBe(false);
    expect(element.style.getPropertyValue("--nova-progress")).toBe("");
  });
});
