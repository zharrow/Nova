import { describe, it, expect, afterEach } from "vitest";
import { createBlinds } from "../src/engines/blinds";
import { MockIntersectionObserver, setReducedMotion } from "./setup";

function monter(top = 5000): HTMLElement {
  const element = document.createElement("figure");
  element.innerHTML = "<img alt='' />";
  document.body.appendChild(element);
  element.getBoundingClientRect = () => ({ top }) as DOMRect;
  return element;
}

afterEach(() => setReducedMotion(false));

describe("createBlinds", () => {
  it("pose autant de lames que demandé, décalées régulièrement", () => {
    const element = monter();
    createBlinds(element, { count: 4, stagger: 60, delay: 100 });

    const lames = Array.from(element.querySelectorAll<HTMLElement>(".nova-blind"));
    expect(lames).toHaveLength(4);
    expect(lames.map((l) => l.style.getPropertyValue("--nova-blind-delay"))).toEqual([
      "100ms",
      "160ms",
      "220ms",
      "280ms",
    ]);
  });

  it("retire les lames à l'entrée en vue", () => {
    const element = monter();
    createBlinds(element);
    expect(element.dataset.novaBlindsState).toBe("hidden");

    MockIntersectionObserver.fire(element);
    expect(element.dataset.novaBlindsState).toBe("shown");
  });

  it("ne pose AUCUNE lame en mouvement réduit", () => {
    // La garantie la plus forte : sans lames, rien ne peut rester couvert.
    setReducedMotion(true);
    const element = monter();
    createBlinds(element);
    expect(element.querySelectorAll(".nova-blind")).toHaveLength(0);
    expect(element.dataset.novaBlinds).toBeUndefined();
  });

  it("ne pose aucune lame sur un bloc déjà à l'écran", () => {
    // Les poser pour les retirer aussitôt serait un clignotement, pas un
    // dévoilement.
    const element = monter(100);
    createBlinds(element);
    expect(element.querySelectorAll(".nova-blind")).toHaveLength(0);
  });

  it("déduit le sens de retrait de l'orientation", () => {
    const vertical = monter();
    createBlinds(vertical);
    expect(vertical.dataset.novaBlindsRetract).toBe("up");

    const horizontal = monter();
    createBlinds(horizontal, { orientation: "horizontal" });
    expect(horizontal.dataset.novaBlindsRetract).toBe("left");
  });

  it("rend le contenu intact après destroy", () => {
    const element = monter();
    createBlinds(element).destroy();
    expect(element.querySelector(".nova-blinds")).toBeNull();
    expect(element.innerHTML).toBe("<img alt=\"\">");
  });
});
