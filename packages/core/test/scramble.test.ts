import { describe, it, expect, vi, afterEach } from "vitest";
import { createScramble } from "../src/engines/scramble";
import { setReducedMotion } from "./setup";

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
