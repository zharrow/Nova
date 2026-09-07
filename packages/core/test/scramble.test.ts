import { describe, it, expect, vi, afterEach } from "vitest";
import { createScramble } from "../src/engines/scramble";
import { setReducedMotion, MockIntersectionObserver } from "./setup";

afterEach(() => {
  setReducedMotion(false);
  vi.restoreAllMocks();
});

describe("createScramble", () => {
  it("découpe le texte en spans et garde le texte lisible", () => {
    const element = document.createElement("span");
    element.textContent = "NOVA";
    document.body.appendChild(element);

    createScramble(element);

    expect(element.querySelectorAll("span")).toHaveLength(4);
    expect(element.getAttribute("aria-label")).toBe("NOVA");
    expect(element.textContent).toBe("NOVA");
    // Les fragments sont masqués : le lecteur d'écran lit `aria-label`, une fois.
    expect(
      Array.from(element.querySelectorAll("span")).every(
        (span) => span.getAttribute("aria-hidden") === "true",
      ),
    ).toBe(true);
  });

  it("ne brouille rien en mouvement réduit", () => {
    setReducedMotion(true);
    const element = document.createElement("span");
    element.textContent = "NOVA";
    document.body.appendChild(element);

    const instance = createScramble(element, { trigger: "manual" });
    instance.play();

    expect(element.textContent).toBe("NOVA");
  });

  it("brouille au survol puis se reforme", async () => {
    const element = document.createElement("span");
    element.textContent = "NOVA";
    document.body.appendChild(element);

    const onComplete = vi.fn();
    createScramble(element, { trigger: "hover", stepMs: 0, onComplete });

    element.dispatchEvent(new Event("mouseenter"));

    // On laisse tourner assez de frames pour que toutes les lettres se posent.
    await new Promise((resolve) => setTimeout(resolve, 400));

    expect(onComplete).toHaveBeenCalled();
    expect(element.textContent).toBe("NOVA");
  });

  it("restaure le texte brut après destroy", () => {
    const element = document.createElement("span");
    element.textContent = "NOVA";
    document.body.appendChild(element);

    createScramble(element).destroy();

    expect(element.querySelectorAll("span")).toHaveLength(0);
    expect(element.textContent).toBe("NOVA");
    expect(element.hasAttribute("aria-label")).toBe(false);
  });
});

describe("les deux modes du scramble", () => {
  // Les deux ne disent pas la même chose : le survol répond à un geste, la
  // boucle est un signal de fond. Ils sont demandés séparément, jamais déduits
  // l'un de l'autre.

  it("au survol : aucun minuteur, aucune observation", () => {
    const element = document.createElement("span");
    element.textContent = "SIGNAL";
    document.body.appendChild(element);

    const instance = createScramble(element, { trigger: "hover", stepMs: 0 });
    // Rien ne part tout seul.
    expect(element.textContent).toBe("SIGNAL");

    element.dispatchEvent(new Event("mouseenter"));
    instance.destroy();
  });

  it("à intervalle : rejoue tant que l'élément est visible", async () => {
    vi.useFakeTimers();
    const element = document.createElement("span");
    element.textContent = "SIGNAL";
    document.body.appendChild(element);

    let joues = 0;
    createScramble(element, {
      trigger: "view",
      interval: 1000,
      stepMs: 0,
      onComplete: () => joues++,
    });

    MockIntersectionObserver.fire(element, true);
    // Le premier passage part à l'entrée en vue.
    await vi.advanceTimersByTimeAsync(300);
    expect(joues).toBeGreaterThanOrEqual(1);

    const apresEntree = joues;
    await vi.advanceTimersByTimeAsync(1400);
    expect(joues).toBeGreaterThan(apresEntree);

    vi.useRealTimers();
  });

  it("à intervalle : le minuteur s'arrête hors écran", async () => {
    vi.useFakeTimers();
    const element = document.createElement("span");
    element.textContent = "SIGNAL";
    document.body.appendChild(element);

    let joues = 0;
    createScramble(element, {
      trigger: "view",
      interval: 500,
      stepMs: 0,
      onComplete: () => joues++,
    });

    MockIntersectionObserver.fire(element, true);
    await vi.advanceTimersByTimeAsync(1200);
    const pendantVue = joues;
    expect(pendantVue).toBeGreaterThan(0);

    // Sortie de l'écran : un décodage qu'on ne voit pas ne coûterait que du
    // processeur.
    MockIntersectionObserver.fire(element, false);
    await vi.advanceTimersByTimeAsync(3000);
    expect(joues).toBe(pendantVue);

    vi.useRealTimers();
  });

  it("le survol reste disponible en mode boucle si on le demande", () => {
    const element = document.createElement("span");
    element.textContent = "SIGNAL";
    document.body.appendChild(element);

    createScramble(element, {
      trigger: "view",
      interval: 4000,
      replayOnHover: true,
      stepMs: 0,
    });

    // Un écouteur de survol a bien été posé malgré `trigger: "view"`.
    const avant = element.textContent;
    element.dispatchEvent(new Event("mouseenter"));
    expect(avant).toBe("SIGNAL");
  });
});
