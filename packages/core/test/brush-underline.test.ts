import { describe, it, expect, afterEach } from "vitest";
import { createBrushUnderline } from "../src/engines/brush-underline";
import { MockIntersectionObserver, setReducedMotion } from "./setup";

function monter(top = 5000): HTMLElement {
  const element = document.createElement("span");
  element.textContent = "lisible";
  document.body.appendChild(element);
  element.getBoundingClientRect = () => ({ top }) as DOMRect;
  return element;
}

afterEach(() => setReducedMotion(false));

describe("createBrushUnderline", () => {
  it("pose le trait derrière le texte, jamais devant", () => {
    const element = monter();
    createBrushUnderline(element);
    // La couche est insérée en PREMIER : après le texte, le pinceau passerait
    // par-dessus les mots.
    expect(element.firstElementChild?.classList.contains("nova-brush")).toBe(true);
    expect(element.textContent).toContain("lisible");
  });

  it("masque le trait aux lecteurs d'écran", () => {
    const element = monter();
    createBrushUnderline(element);
    expect(
      element.querySelector(".nova-brush")?.getAttribute("aria-hidden"),
    ).toBe("true");
  });

  it("donne un identifiant unique à chaque filtre", () => {
    // Un `<filter id>` est global au document : deux instances qui
    // partageraient un identifiant se voleraient leur filtre.
    const a = monter();
    const b = monter();
    createBrushUnderline(a);
    createBrushUnderline(b);

    const idA = a.querySelector("filter")?.getAttribute("id");
    const idB = b.querySelector("filter")?.getAttribute("id");
    expect(idA).toBeTruthy();
    expect(idA).not.toBe(idB);
  });

  it("varie le bruit avec la graine", () => {
    const a = monter();
    const b = monter();
    createBrushUnderline(a, { seed: 1 });
    createBrushUnderline(b, { seed: 42 });
    expect(a.querySelector("feTurbulence")?.getAttribute("seed")).toBe("1");
    expect(b.querySelector("feTurbulence")?.getAttribute("seed")).toBe("42");
  });

  it("se peint à l'entrée en vue, et pas avant", () => {
    const element = monter();
    createBrushUnderline(element);
    expect(element.dataset.novaBrushState).toBe("hidden");

    MockIntersectionObserver.fire(element);
    expect(element.dataset.novaBrushState).toBe("shown");
  });

  it("laisse le trait peint en mouvement réduit", () => {
    // Pas de tracé, mais le trait EST là : le retirer changerait le dessin de
    // la page pour qui a seulement demandé moins de mouvement.
    setReducedMotion(true);
    const element = monter();
    createBrushUnderline(element);
    expect(element.dataset.novaBrushState).toBe("shown");
  });

  it("nettoie tout après destroy", () => {
    const element = monter();
    createBrushUnderline(element).destroy();
    expect(element.querySelector(".nova-brush")).toBeNull();
    expect(element.dataset.novaBrush).toBeUndefined();
  });
});
