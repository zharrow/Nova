import { describe, it, expect, vi } from "vitest";
import { createCounter } from "../src/engines/counter";
import { MockIntersectionObserver } from "./setup";

describe("createCounter", () => {
  it("réserve la place en affichant la valeur finale dès le montage", () => {
    // Sans cela, le bloc s'élargit pendant le comptage et pousse ses voisins.
    const element = document.createElement("span");
    document.body.appendChild(element);
    createCounter(element, { to: 1234 });
    expect(element.textContent).toBe("1234");
  });

  it("formate selon la locale, le préfixe et le suffixe", () => {
    const element = document.createElement("span");
    document.body.appendChild(element);
    createCounter(element, {
      to: 1234.5,
      decimals: 1,
      locale: "fr-FR",
      suffix: " %",
    });
    // L'espace de groupement français est insécable étroit — on ne teste que
    // la présence des chiffres et du suffixe pour rester robuste selon l'ICU.
    expect(element.textContent).toMatch(/1.?234,5 %/);
  });

  it("compte jusqu'à la valeur cible à l'entrée en vue", async () => {
    const element = document.createElement("span");
    document.body.appendChild(element);
    const onComplete = vi.fn();
    createCounter(element, { to: 100, duration: 30, trigger: "view", onComplete });

    MockIntersectionObserver.fire(element);
    await new Promise((resolve) => setTimeout(resolve, 200));

    expect(onComplete).toHaveBeenCalled();
    expect(element.textContent).toBe("100");
  });
});
