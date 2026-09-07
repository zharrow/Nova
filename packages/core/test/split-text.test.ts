import { describe, it, expect } from "vitest";
import { createSplitText } from "../src/engines/split-text";

function mount(text: string, top = 5000): HTMLElement {
  const element = document.createElement("h1");
  element.textContent = text;
  document.body.appendChild(element);
  element.getBoundingClientRect = () => ({ top }) as DOMRect;
  return element;
}

describe("createSplitText", () => {
  it("découpe en mots sans coller les espaces", () => {
    const element = mount("Bâtir en verre");
    createSplitText(element);

    const units = element.querySelectorAll(".nova-split__unit");
    expect(Array.from(units).map((u) => u.textContent)).toEqual([
      "Bâtir",
      "en",
      "verre",
    ]);
    // Les blancs restent des nœuds texte : la césure naturelle est préservée.
    expect(element.textContent).toBe("Bâtir en verre");
  });

  it("découpe en lettres", () => {
    const element = mount("Nova");
    createSplitText(element, { by: "char" });
    expect(element.querySelectorAll(".nova-split__unit")).toHaveLength(4);
  });

  it("échelonne les retards", () => {
    const element = mount("un deux trois");
    createSplitText(element, { stagger: 50, delay: 200 });
    const delays = Array.from(
      element.querySelectorAll<HTMLElement>(".nova-split__unit"),
    ).map((u) => u.style.getPropertyValue("--nova-split-delay"));
    expect(delays).toEqual(["200ms", "250ms", "300ms"]);
  });

  it("garde le titre lisible d'une seule traite pour un lecteur d'écran", () => {
    const element = mount("Bâtir en verre");
    createSplitText(element);
    expect(element.getAttribute("aria-label")).toBe("Bâtir en verre");
    expect(
      Array.from(element.querySelectorAll(".nova-split__window")).every(
        (w) => w.getAttribute("aria-hidden") === "true",
      ),
    ).toBe(true);
  });

  it("restaure le texte brut après destroy", () => {
    const element = mount("Bâtir en verre");
    createSplitText(element).destroy();
    expect(element.querySelectorAll("span")).toHaveLength(0);
    expect(element.textContent).toBe("Bâtir en verre");
  });
});

describe("régression : options à undefined", () => {
  it("traite une option absente comme non fournie, pas comme nulle", () => {
    // Les adaptateurs de framework construisent leurs options depuis les props :
    // toute prop non renseignée arrive à `undefined`. Un spread naïf écrasait
    // alors la valeur par défaut — `by` passait de "word" à undefined, et le
    // titre se découpait lettre par lettre.
    const element = mount("Bâtir en verre");
    createSplitText(element, { by: undefined, stagger: undefined });

    expect(element.querySelectorAll(".nova-split__unit")).toHaveLength(3);
    const delays = Array.from(
      element.querySelectorAll<HTMLElement>(".nova-split__unit"),
    ).map((u) => u.style.getPropertyValue("--nova-split-delay"));
    expect(delays).toEqual(["0ms", "60ms", "120ms"]);
  });
});
