import { describe, it, expect, afterEach } from "vitest";
import { createSmoothScroll } from "../src/engines/smooth-scroll";
import { tickerSize } from "../src/internal/ticker";
import { setReducedMotion } from "./setup";

afterEach(() => setReducedMotion(false));

describe("createSmoothScroll", () => {
  it("ne monte RIEN en mouvement réduit", () => {
    // Pas « moins lissé » : absent. Le défilement natif est ce que le réglage
    // demande, et Lenis n'est même pas instancié.
    setReducedMotion(true);
    const avant = tickerSize();
    const instance = createSmoothScroll();

    expect(instance.lenis).toBeNull();
    expect(tickerSize()).toBe(avant);
    instance.destroy();
  });

  it("expose un scrollTo qui marche même sans Lenis", () => {
    setReducedMotion(true);
    const cible = document.createElement("div");
    cible.id = "bas";
    document.body.appendChild(cible);

    const instance = createSmoothScroll();
    // Le repli ne doit lever aucune erreur : une ancre reste une ancre.
    expect(() => instance.scrollTo("#bas")).not.toThrow();
    expect(() => instance.scrollTo(400)).not.toThrow();
    expect(() => instance.scrollTo("#inconnu")).not.toThrow();
    instance.destroy();
  });

  it("branche Lenis sur le ticker de Nova, et le libère", () => {
    // Lenis ouvre sa propre boucle par défaut. Ici il partage celle de la
    // librairie : une seule pour le défilement, les compteurs, le curseur.
    const avant = tickerSize();
    const instance = createSmoothScroll({ lerp: 0.12 });

    expect(instance.lenis).not.toBeNull();
    expect(tickerSize()).toBe(avant + 1);

    instance.destroy();
    expect(tickerSize()).toBe(avant);
  });

  it("laisse le tactile natif par défaut", () => {
    // Lisser un défilement au doigt lui retire l'inertie que l'utilisateur
    // connaît pour la remplacer par une autre.
    const instance = createSmoothScroll();
    expect(instance.lenis?.options.syncTouch).toBe(false);
    instance.destroy();
  });
});
