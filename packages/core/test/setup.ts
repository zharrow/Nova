/**
 * jsdom n'implémente ni IntersectionObserver, ni ResizeObserver, ni
 * matchMedia, ni Element.animate. On les remplace par des doublures pilotables
 * depuis les tests, ce qui permet de vérifier le comportement réel des moteurs
 * (armement, désarmement, nettoyage) plutôt que de les contourner.
 */

import { vi, beforeEach } from "vitest";

class MockIntersectionObserver implements IntersectionObserver {
  static instances: MockIntersectionObserver[] = [];
  readonly root = null;
  readonly rootMargin: string;
  readonly thresholds: ReadonlyArray<number>;
  observed = new Set<Element>();

  constructor(
    private callback: IntersectionObserverCallback,
    options: IntersectionObserverInit = {},
  ) {
    this.rootMargin = options.rootMargin ?? "0px";
    this.thresholds = [
      typeof options.threshold === "number" ? options.threshold : 0,
    ];
    MockIntersectionObserver.instances.push(this);
  }

  observe(target: Element) {
    this.observed.add(target);
  }
  unobserve(target: Element) {
    this.observed.delete(target);
  }
  disconnect() {
    this.observed.clear();
  }
  takeRecords(): IntersectionObserverEntry[] {
    return [];
  }

  /** Déclenche l'entrée en vue depuis un test. */
  trigger(target: Element, isIntersecting = true) {
    this.callback(
      [{ target, isIntersecting } as IntersectionObserverEntry],
      this,
    );
  }

  /** Notifie tous les observers qui surveillent cet élément. */
  static fire(target: Element, isIntersecting = true) {
    for (const instance of MockIntersectionObserver.instances) {
      if (instance.observed.has(target)) instance.trigger(target, isIntersecting);
    }
  }
}

class MockResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}

let reducedMotion = false;
let finePointer = true;

export function setReducedMotion(value: boolean) {
  reducedMotion = value;
}
export function setFinePointer(value: boolean) {
  finePointer = value;
}
export { MockIntersectionObserver };

vi.stubGlobal("IntersectionObserver", MockIntersectionObserver);
vi.stubGlobal("ResizeObserver", MockResizeObserver);

vi.stubGlobal(
  "matchMedia",
  (query: string) =>
    ({
      matches: query.includes("reduced-motion")
        ? reducedMotion
        : query.includes("pointer: fine")
          ? finePointer
          : false,
      media: query,
      addEventListener: () => {},
      removeEventListener: () => {},
    }) as unknown as MediaQueryList,
);

if (!Element.prototype.animate) {
  Element.prototype.animate = function animate() {
    return {
      finished: Promise.resolve(),
      cancel: () => {},
      onfinish: null,
    } as unknown as Animation;
  };
}


/**
 * Contexte 2D enregistreur.
 *
 * jsdom n'implémente pas le canvas : `getContext` renvoie `null` et les
 * moteurs de trame et de graphe ne feraient rien du tout. Cette doublure
 * enregistre les appels de dessin, ce qui permet de vérifier ce qui est
 * réellement peint — combien de modules, à quelles coordonnées — plutôt que de
 * se contenter de constater que rien n'a planté.
 */
export interface AppelDessin {
  type: string;
  args: number[];
}

export class ContexteEnregistreur {
  appels: AppelDessin[] = [];
  fillStyle = "";
  strokeStyle = "";
  lineWidth = 1;
  globalAlpha = 1;
  font = "";
  textAlign = "";
  textBaseline = "";

  setTransform() {}
  clearRect() {
    this.appels.length = 0;
  }
  fillRect(x: number, y: number, w: number, h: number) {
    this.appels.push({ type: "fillRect", args: [x, y, w, h] });
  }
  beginPath() {}
  arc(x: number, y: number, r: number) {
    this.appels.push({ type: "arc", args: [x, y, r] });
  }
  moveTo(x: number, y: number) {
    this.appels.push({ type: "moveTo", args: [x, y] });
  }
  lineTo(x: number, y: number) {
    this.appels.push({ type: "lineTo", args: [x, y] });
  }
  fill() {}
  stroke() {}
  fillText(text: string, x: number, y: number) {
    this.appels.push({ type: "fillText", args: [x, y] });
  }
  drawImage() {}
  getImageData(_x: number, _y: number, w: number, h: number) {
    // Une image opaque et uniformément grise : le canal luminance vaut alors
    // la même chose partout, ce qui rend les assertions prévisibles.
    const data = new Uint8ClampedArray(w * h * 4).fill(128);
    for (let i = 3; i < data.length; i += 4) data[i] = 255;
    return { data, width: w, height: h } as unknown as ImageData;
  }
}

/**
 * Un contexte PAR canvas, mémorisé. C'est le comportement du navigateur, et
 * c'est indispensable ici : sans mémorisation, le test inspecterait un
 * contexte différent de celui que le moteur peint.
 */
const contextes = new WeakMap<HTMLCanvasElement, ContexteEnregistreur>();

HTMLCanvasElement.prototype.getContext = function (
  this: HTMLCanvasElement,
  type: string,
) {
  if (type !== "2d") return null;
  let contexte = contextes.get(this);
  if (!contexte) {
    contexte = new ContexteEnregistreur();
    contextes.set(this, contexte);
  }
  return contexte as unknown as CanvasRenderingContext2D;
} as typeof HTMLCanvasElement.prototype.getContext;

/** Donne une taille à un canvas — jsdom ne fait aucune mise en page. */
export function dimensionner(
  canvas: HTMLCanvasElement,
  largeur: number,
  hauteur: number,
): void {
  Object.defineProperty(canvas, "clientWidth", {
    value: largeur,
    configurable: true,
  });
  Object.defineProperty(canvas, "clientHeight", {
    value: hauteur,
    configurable: true,
  });
  canvas.getBoundingClientRect = () =>
    ({ left: 0, top: 0, width: largeur, height: hauteur }) as DOMRect;
}

beforeEach(() => {
  // Les instances ne sont volontairement PAS remises à zéro : le pool
  // d'observers de `in-view.ts` est global au module et survit d'un test à
  // l'autre — c'est son fonctionnement normal en production. `fire()` balaie
  // toutes les instances et ignore celles qui n'observent plus rien.
  reducedMotion = false;
  finePointer = true;
  document.body.innerHTML = "";
});
