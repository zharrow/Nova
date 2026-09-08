import { describe, it, expect } from "vitest";
import { createMarquee } from "../src/engines/marquee";
import { MockIntersectionObserver } from "./setup";

function mount(): HTMLElement {
  const element = document.createElement("div");
  element.innerHTML = "<span>NOVA</span>";
  document.body.appendChild(element);
  // jsdom ne fait aucune mise en page : on simule les largeurs.
  element.getBoundingClientRect = () => ({ width: 1000 }) as DOMRect;
  return element;
}

describe("createMarquee", () => {
  it("duplique le contenu assez pour couvrir le conteneur", () => {
    const element = mount();
    const instance = createMarquee(element, { speed: 100 });

    const track = element.querySelector(".nova-marquee__track")!;
    const group = track.firstElementChild as HTMLElement;
    group.getBoundingClientRect = () => ({ width: 200 }) as DOMRect;
    instance.update({});

    // 1000 / 200 = 5, +1 de marge → 6 copies, pas de trou.
    expect(track.children.length).toBe(6);
    expect(element.style.getPropertyValue("--nova-marquee-shift")).toBe(
      `${-100 / 6}%`,
    );
  });

  it("déduit la durée de la vitesse, pas l'inverse", () => {
    const element = mount();
    const instance = createMarquee(element, { speed: 50 });
    const group = element.querySelector(".nova-marquee__group") as HTMLElement;
    group.getBoundingClientRect = () => ({ width: 500 }) as DOMRect;
    instance.update({});
    // 500 px à 50 px/s = 10 s pour une copie.
    expect(element.style.getPropertyValue("--nova-marquee-duration")).toBe("10s");
  });

  it("rend le contenu d'origine après destroy", () => {
    const element = mount();
    createMarquee(element).destroy();
    expect(element.innerHTML).toBe("<span>NOVA</span>");
    expect(element.dataset.novaMarquee).toBeUndefined();
  });
});

describe("marquee vertical", () => {
  function mountVertical(): HTMLElement {
    const element = document.createElement("div");
    element.innerHTML = "<span>NOVA</span>";
    document.body.appendChild(element);
    element.getBoundingClientRect = () =>
      ({ width: 240, height: 330 }) as DOMRect;
    return element;
  }

  it("bascule d'axe et répète assez pour dépasser la fenêtre", () => {
    // Le défaut se voyait sur l'axe vertical : six lignes dans un cadre de
    // 330 px laissaient du vide, et la liste réapparaissait en bloc au lieu de
    // couler ligne à ligne.
    const element = mountVertical();
    const instance = createMarquee(element, { direction: "up", speed: 42 });
    expect(element.dataset.novaMarqueeAxis).toBe("y");

    const group = element.querySelector(".nova-marquee__group") as HTMLElement;
    group.getBoundingClientRect = () => ({ width: 240, height: 70 }) as DOMRect;
    instance.update({});

    // 330 / 70 = 5 (arrondi sup.), +1 de marge → 6 copies, aucun trou.
    expect(element.querySelectorAll(".nova-marquee__group")).toHaveLength(6);
    // La durée se déduit de la HAUTEUR d'une copie, pas de sa largeur.
    expect(element.style.getPropertyValue("--nova-marquee-duration")).toBe(
      `${70 / 42}s`,
    );
  });

  it("suspend hors écran plutôt que de couper", () => {
    // `animation: none` ferait repartir la boucle du début à chaque retour.
    const element = mountVertical();
    createMarquee(element, { direction: "up" });
    expect(element.dataset.novaMarqueeState).toBe("running");

    MockIntersectionObserver.fire(element, false);
    expect(element.dataset.novaMarqueeState).toBe("paused");

    MockIntersectionObserver.fire(element, true);
    expect(element.dataset.novaMarqueeState).toBe("running");
  });

  it("ne surveille rien si pauseOffscreen est faux", () => {
    const element = mountVertical();
    createMarquee(element, { pauseOffscreen: false });
    MockIntersectionObserver.fire(element, false);
    expect(element.dataset.novaMarqueeState).toBe("running");
  });
});
