import { describe, it, expect, vi, afterEach } from "vitest";
import { coverPage, isPageCovered, whenPageUncovered } from "../src/internal/curtain";
import { isAlreadyInView, observeInView } from "../src/internal/in-view";
import { createLoader } from "../src/engines/loader";
import { createReveal } from "../src/engines/reveal";
import { MockIntersectionObserver } from "./setup";

/**
 * LA COUTURE entre le rideau et les révélations.
 *
 * C'est le comportement qui n'existait pas : sous un voile, un élément est
 * dans la fenêtre sans que personne le voie. Le tenir pour « déjà vu » faisait
 * renoncer tout le haut de page à son entrée, et le voile se levait sur une
 * page qui était simplement LÀ.
 */
const vivants: Array<{ destroy(): void }> = [];
function monterVoile(options: Parameters<typeof createLoader>[1] = {}) {
  const element = document.createElement("div");
  document.body.appendChild(element);
  const instance = createLoader(element, { sessionKey: null, ...options });
  vivants.push(instance);
  return instance;
}

afterEach(() => {
  for (const instance of vivants.splice(0)) instance.destroy();
  delete document.documentElement.dataset.novaLoaded;
  // Un registre laissé couvert gèlerait toutes les entrées des tests suivants.
  expect(isPageCovered()).toBe(false);
});

describe("registre de rideau", () => {
  it("prévient tout de suite quand rien ne couvre", () => {
    const vu = vi.fn();
    whenPageUncovered(vu);
    expect(vu).toHaveBeenCalledTimes(1);
  });

  it("compte les rideaux : le premier retiré ne découvre pas", () => {
    // Deux voiles peuvent se superposer — l'ouverture et une transition de
    // page. Un booléen aurait découvert la page sous le second.
    const premier = coverPage();
    const second = coverPage();
    const vu = vi.fn();
    whenPageUncovered(vu);

    premier();
    expect(isPageCovered()).toBe(true);
    expect(vu).not.toHaveBeenCalled();

    second();
    expect(isPageCovered()).toBe(false);
    expect(vu).toHaveBeenCalledTimes(1);
  });

  it("ne décompte pas deux fois le même rideau", () => {
    // Un moteur appelle sa sortie PUIS son démontage. Sans idempotence, la
    // page se croirait découverte alors qu'un second rideau tient encore.
    const premier = coverPage();
    const second = coverPage();
    premier();
    premier();
    expect(isPageCovered()).toBe(true);
    second();
  });
});

describe("couture rideau ↔ entrées", () => {
  it("ne tient pas un élément couvert pour « déjà vu »", () => {
    const element = document.createElement("div");
    document.body.appendChild(element);
    // jsdom rend un rectangle nul : hors rideau, l'élément est « déjà vu ».
    expect(isAlreadyInView(element)).toBe(true);

    const retirer = coverPage();
    expect(isAlreadyInView(element)).toBe(false);
    retirer();
    element.remove();
  });

  it("retient une entrée en vue jusqu'à la levée du voile", () => {
    const cible = document.createElement("div");
    document.body.appendChild(cible);
    const vu = vi.fn();

    const retirer = coverPage();
    const detacher = observeInView(cible, vu);
    MockIntersectionObserver.fire(cible);
    // Jouer maintenant dépenserait l'animation derrière le voile.
    expect(vu).not.toHaveBeenCalled();

    retirer();
    expect(vu).toHaveBeenCalledTimes(1);
    detacher();
    cible.remove();
  });

  it("annule une entrée retenue quand son moteur se démonte", () => {
    // Sans cette annulation, le rappel partirait APRÈS le démontage de celui
    // qui l'a demandé, sur un élément qui n'est plus animé par personne.
    const cible = document.createElement("div");
    document.body.appendChild(cible);
    const vu = vi.fn();

    const retirer = coverPage();
    const detacher = observeInView(cible, vu);
    MockIntersectionObserver.fire(cible);
    detacher();
    retirer();

    expect(vu).not.toHaveBeenCalled();
    cible.remove();
  });

  it("laisse la page ENTRER quand le rideau se lève", async () => {
    // Le test qui porte tout le reste. Sans la couture, `createReveal` voyait
    // un élément « déjà à l'écran » et renonçait : le voile se levait sur un
    // titre déjà posé, et le geste que le rideau promettait n'existait pas.
    vi.useFakeTimers();
    monterVoile({ holdMs: 200, exitMs: 100 });

    const titre = document.createElement("h1");
    titre.textContent = "Le titre";
    document.body.appendChild(titre);
    const reveal = createReveal(titre);

    // Armé, et non renoncé : l'élément est couvert, donc pas encore vu.
    expect(titre.dataset.novaReveal).toBe("hidden");

    MockIntersectionObserver.fire(titre);
    expect(titre.dataset.novaReveal).toBe("hidden");

    // Le relais part au DÉBUT de la sortie : le titre entre PENDANT que le
    // voile se retire, pas après.
    await vi.advanceTimersByTimeAsync(250);
    expect(titre.dataset.novaReveal).toBe("shown");

    reveal.destroy();
    titre.remove();
    vi.useRealTimers();
  });

  it("ne retient rien quand le rideau ne couvre que son encadré", () => {
    // Une démonstration dans une fiche ne doit pas geler les entrées du reste
    // du site pendant qu'elle joue.
    const element = document.createElement("div");
    document.body.appendChild(element);
    const instance = createLoader(element, {
      sessionKey: null,
      covers: "element",
      holdMs: 5000,
    });
    vivants.push(instance);

    expect(isPageCovered()).toBe(false);
  });

  it("ne pose PAS le drapeau de page pour un rideau d'encadré", async () => {
    // Une démonstration dans une fiche annonçait « la page est chargée » au
    // reste du document. Même erreur de portée que geler les entrées : ce qui
    // déborde de la boîte est conditionné à `covers`.
    vi.useFakeTimers();
    const element = document.createElement("div");
    document.body.appendChild(element);
    const instance = createLoader(element, {
      sessionKey: null,
      covers: "element",
      holdMs: 100,
      exitMs: 50,
    });
    vivants.push(instance);

    await vi.advanceTimersByTimeAsync(200);
    expect(element.dataset.novaLoaderState).not.toBe("showing");
    expect(document.documentElement.dataset.novaLoaded).toBeUndefined();
    vi.useRealTimers();
  });

  it("découvre la page même si le rideau est démonté avant sa sortie", () => {
    // Sans ce retrait, plus aucune entrée ne s'armerait nulle part, et rien ne
    // dirait pourquoi.
    const element = document.createElement("div");
    document.body.appendChild(element);
    const instance = createLoader(element, { sessionKey: null, holdMs: 9000 });
    expect(isPageCovered()).toBe(true);

    instance.destroy();
    expect(isPageCovered()).toBe(false);
  });
});
