import { describe, it, expect, afterEach } from "vitest";
import { createTextEffect } from "../src/engines/text-effect";
import { MockIntersectionObserver, setReducedMotion } from "./setup";

function mount(text: string, top = 5000): HTMLElement {
  const element = document.createElement("h1");
  element.textContent = text;
  document.body.appendChild(element);
  element.getBoundingClientRect = () => ({ top, left: 0, width: 0, height: 0 }) as DOMRect;
  return element;
}

afterEach(() => setReducedMotion(false));

describe("createTextEffect", () => {
  it("découpe en mots sans coller les espaces", () => {
    const element = mount("Nova en mouvement");
    createTextEffect(element);

    const mots = element.querySelectorAll(".nova-word");
    expect(Array.from(mots).map((m) => m.textContent)).toEqual([
      "Nova",
      "en",
      "mouvement",
    ]);
    // Les blancs restent de vrais nœuds texte : sans eux le copier-coller
    // recollerait les mots et la sélection à la souris casserait.
    expect(element.querySelector(".nova-text")?.textContent).toBe("Nova en mouvement");
  });

  it("garde le texte annoncé d'une seule traite", () => {
    const element = mount("Nova en mouvement");
    createTextEffect(element);
    expect(element.querySelector(".nova-sr")?.textContent).toBe("Nova en mouvement");
    expect(element.querySelector(".nova-text")?.getAttribute("aria-hidden")).toBe(
      "true",
    );
  });

  it("déduit le grain de l'effet", () => {
    const parMot = mount("un deux");
    createTextEffect(parMot, { effect: "line" });
    expect(parMot.querySelectorAll(".nova-letter")).toHaveLength(0);

    const parLettre = mount("Nova");
    createTextEffect(parLettre, { effect: "wave" });
    expect(parLettre.querySelectorAll(".nova-letter")).toHaveLength(4);
  });

  it("mesure la ligne, le rang dans la ligne et l'éloignement au centre", () => {
    // jsdom ne fait aucune mise en page : on installe une géométrie fictive
    // AVANT la construction, pour que la mesure initiale du moteur la lise.
    // Deux mots par ligne, quatre mots, deux lignes.
    const offsetTop = Object.getOwnPropertyDescriptor(
      HTMLElement.prototype,
      "offsetTop",
    );
    const rect = HTMLElement.prototype.getBoundingClientRect;

    Object.defineProperty(HTMLElement.prototype, "offsetTop", {
      configurable: true,
      get(this: HTMLElement) {
        if (!this.classList.contains("nova-word")) return 0;
        const rang = Array.from(
          this.parentElement?.querySelectorAll(".nova-word") ?? [],
        ).indexOf(this);
        return Math.floor(rang / 2) * 40;
      },
    });
    HTMLElement.prototype.getBoundingClientRect = function () {
      if (!this.classList.contains("nova-word")) {
        return { top: 5000, left: 0, width: 200, height: 80 } as DOMRect;
      }
      const rang = Array.from(
        this.parentElement?.querySelectorAll(".nova-word") ?? [],
      ).indexOf(this);
      return {
        left: (rang % 2) * 150,
        top: Math.floor(rang / 2) * 40,
        width: 50,
        height: 20,
      } as DOMRect;
    };

    try {
      const element = mount("un deux trois quatre");
      createTextEffect(element, { effect: "word" });

      const mots = Array.from(
        element.querySelectorAll<HTMLElement>(".nova-word"),
      );
      expect(mots).toHaveLength(4);

      const lire = (prop: string) =>
        mots.map((m) => m.style.getPropertyValue(prop));

      expect(lire("--nova-m")).toEqual(["0", "1", "2", "3"]);
      // Deux lignes de deux mots.
      expect(lire("--nova-l")).toEqual(["0", "0", "1", "1"]);
      // Le rang repart à zéro à chaque ligne : c'est ce qui rend le décalage
      // additif, et empêche la fin d'un texte long d'accélérer.
      expect(lire("--nova-w")).toEqual(["0", "1", "0", "1"]);
      // Avancement 0→1 : c'est lui qui échelonne les plages de défilement.
      expect(lire("--nova-p")).toEqual(["0.000", "0.333", "0.667", "1.000"]);
      // Compteur de lettres continu d'un mot à l'autre.
      expect(lire("--nova-n")).toEqual(["0", "2", "6", "11"]);
      // Éloignement normalisé : le plus loin vaut exactement 1.
      const dists = lire("--nova-dist").map(Number);
      expect(Math.max(...dists)).toBe(1);
      expect(dists.every((d) => d >= 0 && d <= 1)).toBe(true);

      // La hauteur du bloc en lignes est publiée pour le CSS.
      expect(
        element
          .querySelector<HTMLElement>(".nova-text")!
          .style.getPropertyValue("--nova-lines"),
      ).toBe("2");
    } finally {
      if (offsetTop) {
        Object.defineProperty(HTMLElement.prototype, "offsetTop", offsetTop);
      }
      HTMLElement.prototype.getBoundingClientRect = rect;
    }
  });

  it("construit une colonne de deux exemplaires pour le rouleau", () => {
    const element = mount("Nova");
    createTextEffect(element, { effect: "roll" });
    const colonnes = element.querySelectorAll(".nova-roll");
    expect(colonnes).toHaveLength(4);
    // Deux exemplaires : celui qui sort par le haut, celui qui entre par le bas.
    expect(colonnes[0]!.querySelectorAll("i")).toHaveLength(2);
  });

  it("ne fragmente pas la machine à écrire et publie sa largeur", () => {
    const element = mount("Nova");
    createTextEffect(element, { effect: "typewriter" });
    const host = element.querySelector<HTMLElement>(".nova-text")!;
    expect(host.querySelectorAll(".nova-word")).toHaveLength(0);
    expect(host.style.getPropertyValue("--nova-ch")).toBe("4");
    expect(host.style.getPropertyValue("--nova-width-end")).toBe("4ch");
  });

  it("ne fragmente RIEN en mouvement réduit", () => {
    // La garantie la plus forte : sans attribut, aucune règle du catalogue ne
    // s'applique, donc aucun état de repos ne peut cacher le texte.
    setReducedMotion(true);
    const element = mount("Nova en mouvement");
    createTextEffect(element, { effect: "blur" });

    expect(element.textContent).toBe("Nova en mouvement");
    expect(element.dataset.novaText).toBeUndefined();
    expect(element.querySelectorAll(".nova-word")).toHaveLength(0);
  });

  it("joue à l'entrée en vue, et pas avant", () => {
    const element = mount("Nova en mouvement");
    createTextEffect(element, { effect: "line", trigger: "view" });
    expect(element.dataset.novaPlay).toBeUndefined();

    MockIntersectionObserver.fire(element);
    expect(element.dataset.novaPlay).toBe("true");
  });

  it("affiche d'emblée un texte déjà à l'écran", () => {
    // Même garde-fou que Reveal : un titre déjà lu ne se cache pas pour
    // s'animer aussitôt.
    const element = mount("Nova en mouvement", 100);
    createTextEffect(element, { effect: "line" });
    expect(element.dataset.novaPlay).toBe("true");
  });

  it("n'arme rien pour un effet de défilement", () => {
    const element = mount("Un paragraphe de manifeste");
    createTextEffect(element, { effect: "reading" });
    // C'est la molette qui fournit le temps : le CSS s'en charge seul.
    expect(element.dataset.novaPlay).toBe("scroll");
  });

  it("restaure le texte brut après destroy", () => {
    const element = mount("Nova en mouvement");
    createTextEffect(element, { effect: "wave" }).destroy();
    expect(element.querySelectorAll("span")).toHaveLength(0);
    expect(element.textContent).toBe("Nova en mouvement");
    expect(element.dataset.novaText).toBeUndefined();
  });

  it("reconstruit quand l'effet change de grain", () => {
    const element = mount("Nova");
    const instance = createTextEffect(element, { effect: "line" });
    expect(element.querySelectorAll(".nova-letter")).toHaveLength(0);

    instance.update({ effect: "wave" });
    expect(element.dataset.novaText).toBe("wave");
    expect(element.querySelectorAll(".nova-letter")).toHaveLength(4);
  });
});
