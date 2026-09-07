import { describe, it, expect, afterEach } from "vitest";
import { createSpotlight } from "../src/engines/spotlight";
import { tickerSize } from "../src/internal/ticker";
import { setFinePointer, setReducedMotion } from "./setup";

function monter(): { panneau: HTMLElement; halo: HTMLElement } {
  const panneau = document.createElement("div");
  const halo = document.createElement("span");
  panneau.appendChild(halo);
  document.body.appendChild(panneau);
  panneau.getBoundingClientRect = () =>
    ({ left: 100, top: 50, width: 400, height: 200 }) as DOMRect;
  return { panneau, halo };
}

function bouger(panneau: HTMLElement, x: number, y: number): void {
  const evenement = new Event("pointermove") as PointerEvent;
  Object.defineProperty(evenement, "clientX", { value: x });
  Object.defineProperty(evenement, "clientY", { value: y });
  panneau.dispatchEvent(evenement);
}

afterEach(() => {
  setFinePointer(true);
  setReducedMotion(false);
});

describe("createSpotlight", () => {
  it("publie la position du curseur dans le repère du panneau", async () => {
    const { panneau, halo } = monter();
    createSpotlight(halo);

    bouger(panneau, 250, 150);
    // Le relevé du rectangle se fait dans l'image d'animation, pas dans
    // l'écouteur : il faut donc laisser passer une frame.
    await new Promise((r) => setTimeout(r, 50));

    expect(halo.style.getPropertyValue("--nova-spot-x")).toBe("150px");
    expect(halo.style.getPropertyValue("--nova-spot-y")).toBe("100px");
  });

  it("s'allume au premier déplacement, pas à l'entrée", () => {
    // Allumé à l'entrée, le halo apparaîtrait une image à sa position
    // précédente, souvent à l'autre bout du panneau.
    const { panneau, halo } = monter();
    createSpotlight(halo);
    expect(halo.dataset.novaSpotlightState).toBeUndefined();

    bouger(panneau, 200, 100);
    expect(halo.dataset.novaSpotlightState).toBe("on");
  });

  it("ne tient une boucle que pendant le survol", async () => {
    const { panneau, halo } = monter();
    const avant = tickerSize();
    createSpotlight(halo);
    // Rien ne tourne tant que le curseur n'est pas sur le panneau.
    expect(tickerSize()).toBe(avant);

    bouger(panneau, 200, 100);
    expect(tickerSize()).toBe(avant + 1);

    panneau.dispatchEvent(new Event("pointerleave"));
    expect(tickerSize()).toBe(avant);
  });

  it("ne monte rien au tactile", () => {
    setFinePointer(false);
    const { panneau, halo } = monter();
    createSpotlight(halo);
    expect(halo.dataset.novaSpotlightState).toBe("off");

    bouger(panneau, 200, 100);
    expect(halo.style.getPropertyValue("--nova-spot-x")).toBe("");
  });

  it("ne monte rien en mouvement réduit", () => {
    setReducedMotion(true);
    const { halo } = monter();
    createSpotlight(halo);
    expect(halo.dataset.novaSpotlightState).toBe("off");
  });
});
