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

beforeEach(() => {
  // Les instances ne sont volontairement PAS remises à zéro : le pool
  // d'observers de `in-view.ts` est global au module et survit d'un test à
  // l'autre — c'est son fonctionnement normal en production. `fire()` balaie
  // toutes les instances et ignore celles qui n'observent plus rien.
  reducedMotion = false;
  finePointer = true;
  document.body.innerHTML = "";
});
