import { describe, it, expect, afterEach } from "vitest";
import { createScrollScene } from "../src/engines/scroll-scene";
import { setReducedMotion } from "./setup";

/** jsdom ne défile pas : on pose le rectangle de la scène à la main. */
function monter(top: number, height = 3000): HTMLElement {
  const element = document.createElement("section");
  document.body.appendChild(element);
  element.getBoundingClientRect = () => ({ top, height }) as DOMRect;
  return element;
}

const lire = (element: HTMLElement, nom: string) =>
  Number(element.style.getPropertyValue(nom));

afterEach(() => setReducedMotion(false));

describe("createScrollScene", () => {
  it("calcule la progression sur la course utile", () => {
    // La course est la hauteur de la scène MOINS un écran : c'est pendant ce
    // trajet que l'enfant collant reste en place. jsdom : innerHeight = 768.
    // 3000 - 768 = 2232 ; à top = -1116, on est à la moitié.
    const element = monter(-1116, 3000);
    createScrollScene(element);
    expect(lire(element, "--nova-t")).toBeCloseTo(0.5, 2);
  });

  it("borne la progression à ses extrémités", () => {
    const avant = monter(500, 3000);
    createScrollScene(avant);
    expect(lire(avant, "--nova-t")).toBe(0);

    const apres = monter(-9000, 3000);
    createScrollScene(apres);
    expect(lire(apres, "--nova-t")).toBe(1);
  });

  it("publie un temps nommé par plage", () => {
    // Un récit scrollé n'a jamais une seule progression : il en a dix, chacune
    // sur sa portion. Les écrire à la main donne dix clamp() illisibles.
    const element = monter(-1116, 3000); // t = 0,5
    createScrollScene(element, {
      beats: { tot: [0, 0.4], pile: [0.25, 0.75], tard: [0.8, 1] },
    });

    // Déjà finie, à la moitié de sa plage, pas encore commencée.
    expect(lire(element, "--nova-tot")).toBe(1);
    expect(lire(element, "--nova-pile")).toBeCloseTo(0.5, 2);
    expect(lire(element, "--nova-tard")).toBe(0);
  });

  it("publie une pulsation qui monte puis redescend", () => {
    const sommet = monter(-1116, 3000); // t = 0,5
    createScrollScene(sommet, { pulses: { paquet: [0.2, 0.5, 0.8] } });
    expect(lire(sommet, "--nova-paquet")).toBeCloseTo(1, 2);

    const apres = monter(-1562, 3000); // t = 0,7
    createScrollScene(apres, { pulses: { paquet: [0.2, 0.5, 0.8] } });
    expect(lire(apres, "--nova-paquet")).toBeCloseTo(0.333, 2);
  });

  it("se pose à l'état d'arrivée en mouvement réduit", () => {
    // Une scène figée à 0 serait une page vide : le repos est l'arrivée.
    setReducedMotion(true);
    const element = monter(500, 3000);
    createScrollScene(element, { beats: { tot: [0, 0.4] } });

    expect(lire(element, "--nova-t")).toBe(1);
    expect(lire(element, "--nova-tot")).toBe(1);
  });

  it("nettoie ses variables après destroy", () => {
    const element = monter(-500);
    const scene = createScrollScene(element, { beats: { tot: [0, 0.4] } });
    scene.destroy();
    expect(element.style.getPropertyValue("--nova-t")).toBe("");
    expect(element.style.getPropertyValue("--nova-tot")).toBe("");
    expect(element.dataset.novaScrollScene).toBeUndefined();
  });
});
