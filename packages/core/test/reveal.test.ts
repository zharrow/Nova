import { describe, it, expect, afterEach } from "vitest";
import { createReveal, createRevealGroup } from "../src/engines/reveal";
import { MockIntersectionObserver, setReducedMotion } from "./setup";

/**
 * Ces tests gardent la règle d'or de Nova : l'état par défaut est VISIBLE.
 * C'est le comportement le plus facile à casser en refactorant, et le plus
 * visible en production quand il casse (des blocs qui ne s'affichent jamais).
 */

function mount(top: number): HTMLElement {
  const element = document.createElement("div");
  document.body.appendChild(element);
  element.getBoundingClientRect = () => ({ top }) as DOMRect;
  return element;
}

afterEach(() => setReducedMotion(false));

describe("createReveal", () => {
  it("n'arme rien pour un élément déjà à l'écran", () => {
    // 100px du haut, viewport jsdom = 768px → largement au-dessus de la ligne.
    const element = mount(100);
    createReveal(element);
    expect(element.dataset.novaReveal).toBeUndefined();
  });

  it("masque puis révèle un élément sous la ligne de flottaison", () => {
    const element = mount(5000);
    createReveal(element);
    expect(element.dataset.novaReveal).toBe("hidden");

    MockIntersectionObserver.fire(element);
    expect(element.dataset.novaReveal).toBe("shown");
  });

  it("ne masque jamais rien en mouvement réduit", () => {
    setReducedMotion(true);
    const element = mount(5000);
    createReveal(element);
    expect(element.dataset.novaReveal).toBeUndefined();
  });

  it("expose la durée et la variante en CSS", () => {
    const element = mount(5000);
    createReveal(element, { variant: "mask", duration: 1200, delay: 100 });
    expect(element.dataset.novaRevealVariant).toBe("mask");
    expect(element.style.getPropertyValue("--nova-reveal-duration")).toBe("1200ms");
    expect(element.style.getPropertyValue("--nova-reveal-delay")).toBe("100ms");
  });

  it("rend l'élément intact après destroy", () => {
    const element = mount(5000);
    const instance = createReveal(element);
    instance.destroy();
    expect(element.dataset.novaReveal).toBeUndefined();
    expect(element.dataset.novaRevealVariant).toBeUndefined();
    expect(element.style.getPropertyValue("--nova-reveal-duration")).toBe("");
  });
});

describe("createRevealGroup", () => {
  it("décale les enfants d'un pas régulier", () => {
    const container = mount(5000);
    for (let i = 0; i < 3; i++) {
      const child = document.createElement("p");
      child.getBoundingClientRect = () => ({ top: 5000 }) as DOMRect;
      container.appendChild(child);
    }

    createRevealGroup(container, { stagger: 100 });
    const delays = Array.from(container.children).map((child) =>
      (child as HTMLElement).style.getPropertyValue("--nova-reveal-delay"),
    );
    expect(delays).toEqual(["0ms", "100ms", "200ms"]);
  });
});
