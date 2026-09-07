import { vi, beforeEach } from "vitest";

class MockIntersectionObserver {
  static instances: MockIntersectionObserver[] = [];
  observed = new Set<Element>();
  constructor(private callback: IntersectionObserverCallback) {
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
  takeRecords() {
    return [];
  }
  static fire(target: Element, isIntersecting = true) {
    for (const instance of MockIntersectionObserver.instances) {
      if (instance.observed.has(target)) {
        instance.callback(
          [{ target, isIntersecting } as IntersectionObserverEntry],
          instance as unknown as IntersectionObserver,
        );
      }
    }
  }
}

class MockResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}

export { MockIntersectionObserver };

vi.stubGlobal("IntersectionObserver", MockIntersectionObserver);
vi.stubGlobal("ResizeObserver", MockResizeObserver);
vi.stubGlobal("matchMedia", (query: string) => ({
  matches: query.includes("pointer: fine"),
  media: query,
  addEventListener: () => {},
  removeEventListener: () => {},
}));

beforeEach(() => {
  document.body.innerHTML = "";
});
