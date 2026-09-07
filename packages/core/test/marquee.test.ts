import { describe, it, expect } from "vitest";
import { createMarquee } from "../src/engines/marquee";

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
