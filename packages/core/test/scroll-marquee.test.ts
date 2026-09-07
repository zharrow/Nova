import { describe, it, expect, afterEach } from "vitest";
import { createScrollMarquee } from "../src/engines/scroll-marquee";
import { tickerSize } from "../src/internal/ticker";
import { MockIntersectionObserver } from "./setup";

/**
 * jsdom ne fait aucune mise en page : `offsetLeft` y vaut toujours 0. On
 * installe donc une géométrie fictive au niveau du prototype, pour que la
 * mesure faite pendant la construction la lise.
 */
const LARGEUR_COPIE = 200;
let offsetLeftOriginal: PropertyDescriptor | undefined;

function poserGeometrie(): void {
  offsetLeftOriginal = Object.getOwnPropertyDescriptor(
    HTMLElement.prototype,
    "offsetLeft",
  );
  Object.defineProperty(HTMLElement.prototype, "offsetLeft", {
    configurable: true,
    get(this: HTMLElement) {
      if (!this.classList.contains("nova-marquee__group")) return 0;
      const rang = Array.from(this.parentElement?.children ?? []).indexOf(this);
      return rang * LARGEUR_COPIE;
    },
  });
}

function retirerGeometrie(): void {
  if (offsetLeftOriginal) {
    Object.defineProperty(HTMLElement.prototype, "offsetLeft", offsetLeftOriginal);
  }
}

function mount(largeur = 1000): HTMLElement {
  const element = document.createElement("div");
  element.innerHTML = "<span>NOVA</span>";
  document.body.appendChild(element);
  Object.defineProperty(element, "clientWidth", {
    value: largeur,
    configurable: true,
  });
  return element;
}

afterEach(retirerGeometrie);

describe("createScrollMarquee", () => {
  it("couvre la fenêtre après le saut de boucle", () => {
    // Une seule copie disparaît en bouclant : après le saut, ce sont les
    // autres qui doivent couvrir la fenêtre.
    poserGeometrie();
    const element = mount(1000);
    const instance = createScrollMarquee(element);

    // 1000 / 200 = 5, +2 de marge → 7 copies.
    expect(element.querySelectorAll(".nova-marquee__group")).toHaveLength(7);
    // Une seule est lisible : les autres sont des doublons visuels.
    expect(
      element.querySelectorAll('.nova-marquee__group[aria-hidden="true"]'),
    ).toHaveLength(6);
    instance.destroy();
  });

  it("ne boucle pas à l'infini quand la mesure est nulle", () => {
    // Conteneur caché, panneau replié, appel avant la première mise en page :
    // sans garde, `clientWidth / 0` vaut l'infini et la boucle de duplication
    // fige le navigateur. Le cas est réel, pas théorique.
    const element = mount(1000);
    const instance = createScrollMarquee(element);

    expect(element.querySelectorAll(".nova-marquee__group")).toHaveLength(3);
    instance.destroy();
  });

  it("libère le ticker hors écran et le reprend au retour", () => {
    // Le seul moteur de Nova qui écrit sa transform image par image : il ne
    // doit pas tourner pour un bandeau que personne ne regarde.
    poserGeometrie();
    const element = mount();
    const instance = createScrollMarquee(element);
    const enVue = tickerSize();
    expect(enVue).toBeGreaterThan(0);

    MockIntersectionObserver.fire(element, false);
    expect(tickerSize()).toBe(enVue - 1);

    MockIntersectionObserver.fire(element, true);
    expect(tickerSize()).toBe(enVue);
    instance.destroy();
  });

  it("rend le contenu d'origine et arrête tout après destroy", () => {
    poserGeometrie();
    const element = mount();
    const avant = tickerSize();
    createScrollMarquee(element).destroy();

    expect(element.innerHTML).toBe("<span>NOVA</span>");
    expect(element.dataset.novaScrollMarquee).toBeUndefined();
    expect(tickerSize()).toBe(avant);
  });
});
