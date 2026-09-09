import { describe, it, expect, afterEach } from "vitest";
import { createFlipList } from "../src/engines/flip-list";
import { setReducedMotion } from "./setup";

/** Une liste de pièces, chacune identifiée : c'est ce que le moteur replace. */
function liste(ids: string[]): HTMLElement {
  const hote = document.createElement("ul");
  hote.innerHTML = ids.map((id) => `<li data-id="${id}">${id}</li>`).join("");
  document.body.appendChild(hote);
  return hote;
}

function ids(hote: HTMLElement): string[] {
  return [...hote.querySelectorAll("li")].map((li) => li.dataset.id ?? "");
}

afterEach(() => {
  setReducedMotion(false);
  document.body.innerHTML = "";
});

describe("createFlipList", () => {
  it("ne pose rien tant qu'on ne lui demande pas de jouer", () => {
    // La règle non négociable du dépôt : l'état par défaut est visible. Un
    // moteur qui écrirait une opacité au montage rendrait possible une liste
    // invisible en production, si le geste ne venait jamais.
    const hote = liste(["a", "b", "c"]);
    const moteur = createFlipList(hote);

    for (const piece of hote.querySelectorAll("li")) {
      expect(piece.style.opacity).toBe("");
      expect(piece.style.transform).toBe("");
    }

    moteur.destroy();
  });

  it("ne joue rien sans état relevé, et laisse la liste telle quelle", () => {
    // Oublier `capture()` est le cas le plus fréquent chez l'appelant. Il doit
    // dégrader vers le comportement natif — la liste se réorganise d'un coup —
    // et jamais vers un état intermédiaire masqué.
    const hote = liste(["a", "b", "c"]);
    const moteur = createFlipList(hote);

    hote.innerHTML = `<li data-id="c">c</li><li data-id="a">a</li>`;
    expect(() => moteur.play()).not.toThrow();

    expect(ids(hote)).toEqual(["c", "a"]);
    for (const piece of hote.querySelectorAll("li")) {
      expect(piece.style.opacity).toBe("");
    }

    moteur.destroy();
  });

  it("ne relève rien en mouvement réduit", () => {
    // GSAP anime en JavaScript : la règle CSS ne peut rien pour lui, le moteur
    // lit donc la préférence à la main, à chaque geste. Sans état relevé, le
    // `play()` qui suit ne fait rien — la liste se réorganise, sans mouvement.
    setReducedMotion(true);
    const hote = liste(["a", "b", "c"]);
    const moteur = createFlipList(hote);

    moteur.capture();
    hote.innerHTML = `<li data-id="b">b</li>`;
    moteur.play();

    expect(ids(hote)).toEqual(["b"]);
    expect(hote.querySelector("li")!.style.opacity).toBe("");

    moteur.destroy();
  });

  it("raccorde une réorganisation sans lever d'erreur", () => {
    const hote = liste(["a", "b", "c"]);
    const moteur = createFlipList(hote);

    moteur.capture();
    hote.innerHTML = `
      <li data-id="c">c</li>
      <li data-id="a">a</li>
      <li data-id="d">d</li>`;

    expect(() => moteur.play()).not.toThrow();
    // Ce qui est demandé est rendu : le moteur replace, il ne décide de rien.
    expect(ids(hote)).toEqual(["c", "a", "d"]);

    moteur.destroy();
  });

  it("ne vise que les pièces désignées par `items`", () => {
    // Un conteneur qui mêle ses items à autre chose — un en-tête, un
    // séparateur — ne doit pas voir ce reste emporté par le geste.
    const hote = document.createElement("div");
    hote.innerHTML = `
      <p id="entete">Résultats</p>
      <span data-item>a</span>
      <span data-item>b</span>`;
    document.body.appendChild(hote);

    const moteur = createFlipList(hote, { items: "[data-item]" });
    moteur.capture();
    hote.querySelector("[data-item]")!.remove();
    moteur.play();

    expect(hote.querySelector("#entete")).not.toBeNull();
    expect(hote.querySelector<HTMLElement>("#entete")!.style.opacity).toBe("");

    moteur.destroy();
  });

  it("rend les pièces à leur état de départ au démontage", () => {
    // Le contrat commun à tous les moteurs : `destroy()` ne laisse rien
    // derrière lui — ni transformation en ligne, ni opacité, ni échelle.
    const hote = liste(["a", "b", "c"]);
    const moteur = createFlipList(hote);

    moteur.capture();
    hote.innerHTML = `<li data-id="c">c</li><li data-id="b">b</li>`;
    moteur.play();
    moteur.destroy();

    for (const piece of hote.querySelectorAll("li")) {
      expect(piece.style.opacity).toBe("");
      expect(piece.style.transform).toBe("");
      expect(piece.style.scale).toBe("");
    }
  });

  it("accepte un changement d'options à chaud", () => {
    const hote = liste(["a", "b"]);
    const moteur = createFlipList(hote, { duration: 0.4 });

    expect(() => moteur.update({ duration: 0.9, enter: "fade" })).not.toThrow();

    moteur.capture();
    hote.innerHTML = `<li data-id="b">b</li><li data-id="a">a</li>`;
    expect(() => moteur.play()).not.toThrow();

    moteur.destroy();
  });

  it("supporte deux `capture` de suite sans jouer entre les deux", () => {
    // Un appelant qui capture à chaque frappe d'un champ de recherche, mais ne
    // change la liste qu'au bout de trois lettres : le dernier relevé gagne, et
    // rien ne fuit d'un geste à l'autre.
    const hote = liste(["a", "b", "c"]);
    const moteur = createFlipList(hote);

    moteur.capture();
    moteur.capture();
    hote.innerHTML = `<li data-id="a">a</li>`;

    expect(() => moteur.play()).not.toThrow();
    moteur.destroy();
  });
});
