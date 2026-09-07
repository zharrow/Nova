import { describe, it, expect, vi } from "vitest";
import { createTextHighlight } from "../src/engines/text-highlight";

function monter(html: string): HTMLElement {
  const container = document.createElement("article");
  container.innerHTML = html;
  document.body.appendChild(container);
  container.getBoundingClientRect = () =>
    ({ left: 0, top: 0, width: 600, height: 200 }) as DOMRect;
  return container;
}

/**
 * jsdom ne fait aucune mise en page : `Range.getClientRects` renvoie une liste
 * vide. On la remplace par des rectangles simulés — un par ligne visuelle,
 * puisque c'est exactement ce que la vraie API produit.
 */
function feindreLignes(nombre: number): void {
  Range.prototype.getClientRects = function () {
    const rects = Array.from({ length: nombre }, (_, index) => ({
      left: 10,
      top: index * 24,
      width: 200,
      height: 20,
    }));
    return Object.assign(rects, { item: (i: number) => rects[i] }) as never;
  };
}

describe("createTextHighlight", () => {
  it("pose une bande par ligne visuelle", () => {
    // Un rectangle englobant couvrirait aussi les blancs de fin de ligne :
    // c'est pour ça qu'on passe par getClientRects et pas par le bounding box.
    feindreLignes(3);
    const container = monter("<p>Le conseil que nous vendons.</p>");
    createTextHighlight(container, { text: "que nous vendons" });

    expect(container.querySelectorAll(".nova-highlight__band")).toHaveLength(3);
  });

  it("retrouve un passage à travers plusieurs balises", () => {
    // Le texte rendu n'est pas le texte source : le passage peut traverser un
    // <strong>, et l'indentation du JSX devient des blancs.
    feindreLignes(1);
    const container = monter(
      "<p>Le conseil que\n  nous <strong>vendons</strong>, nous le pratiquons.</p>",
    );
    const manque = vi.fn();
    createTextHighlight(container, {
      text: "que nous vendons",
      onMiss: manque,
    });

    expect(manque).not.toHaveBeenCalled();
    expect(container.querySelectorAll(".nova-highlight__band")).toHaveLength(1);
  });

  it("ignore la casse et les blancs multiples", () => {
    feindreLignes(1);
    const container = monter("<p>Rendre   LISIBLE ce qui ne l'est pas.</p>");
    createTextHighlight(container, { text: "rendre lisible" });
    expect(container.querySelectorAll(".nova-highlight__band")).toHaveLength(1);
  });

  it("prévient quand le passage est introuvable, sans rien poser", () => {
    // Le moteur ne devine pas à la place de l'appelant : c'est à lui de
    // replier sur autre chose.
    feindreLignes(1);
    const container = monter("<p>Un texte quelconque.</p>");
    const manque = vi.fn();
    createTextHighlight(container, { text: "absent du document", onMiss: manque });

    expect(manque).toHaveBeenCalledTimes(1);
    expect(container.querySelectorAll(".nova-highlight__band")).toHaveLength(0);
  });

  it("échelonne les bandes", () => {
    feindreLignes(3);
    const container = monter("<p>Le conseil que nous vendons.</p>");
    createTextHighlight(container, { text: "conseil que nous", stagger: 40 });

    const retards = Array.from(
      container.querySelectorAll<HTMLElement>(".nova-highlight__band"),
    ).map((b) => b.style.getPropertyValue("--nova-highlight-delay"));
    expect(retards).toEqual(["0ms", "40ms", "80ms"]);
  });

  it("nettoie tout après destroy", () => {
    feindreLignes(2);
    const container = monter("<p>Le conseil que nous vendons.</p>");
    createTextHighlight(container, { text: "conseil" }).destroy();

    expect(container.querySelector(".nova-highlight")).toBeNull();
    expect(container.dataset.novaHighlight).toBeUndefined();
  });
});
