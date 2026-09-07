import { describe, it, expect, vi, afterEach, beforeEach } from "vitest";
import { createLoader } from "../src/engines/loader";
import { setReducedMotion } from "./setup";

function monter(): HTMLElement {
  const element = document.createElement("div");
  element.innerHTML = "<p>Bât &amp; Verre</p>";
  document.body.appendChild(element);
  return element;
}

beforeEach(() => {
  try {
    sessionStorage.clear();
  } catch {
    /* jsdom fournit sessionStorage, mais on ne parie pas dessus. */
  }
});
afterEach(() => setReducedMotion(false));

describe("createLoader", () => {
  it("monte un rideau de lames et garde le contenu fourni", () => {
    const element = monter();
    createLoader(element, { form: "blades", blades: 5, sessionKey: null });

    expect(element.dataset.novaLoader).toBe("blades");
    expect(element.querySelectorAll(".nova-loader__blade")).toHaveLength(5);
    expect(element.querySelector(".nova-loader__content")?.textContent).toContain(
      "Bât & Verre",
    );
  });

  it("ne monte RIEN en mouvement réduit, et libère la page tout de suite", () => {
    // Pas « plus court » : absent. Et `onDone` part immédiatement, sinon la
    // suite du scénario resterait suspendue derrière un voile inexistant.
    setReducedMotion(true);
    const element = monter();
    const fait = vi.fn();
    createLoader(element, { onDone: fait, sessionKey: null });

    expect(fait).toHaveBeenCalledTimes(1);
    expect(element.querySelectorAll(".nova-loader__blade")).toHaveLength(0);
    expect(element.dataset.novaLoaderState).toBe("done");
  });

  it("ne rejoue pas dans la même session", () => {
    const premier = monter();
    createLoader(premier, { sessionKey: "essai" });
    expect(premier.dataset.novaLoaderState).toBe("showing");

    const second = monter();
    const fait = vi.fn();
    createLoader(second, { sessionKey: "essai", onDone: fait });
    expect(second.dataset.novaLoaderState).toBe("done");
    expect(fait).toHaveBeenCalledTimes(1);
  });

  it("se saute à la première interaction", async () => {
    vi.useFakeTimers();
    const element = monter();
    const fait = vi.fn();
    createLoader(element, {
      sessionKey: null,
      holdMs: 10000,
      exitMs: 100,
      onDone: fait,
    });

    // Un visiteur qui veut lire ne doit jamais attendre une animation.
    window.dispatchEvent(new Event("wheel"));
    expect(element.dataset.novaLoaderState).toBe("leaving");

    await vi.advanceTimersByTimeAsync(150);
    expect(fait).toHaveBeenCalledTimes(1);
    expect(element.dataset.novaLoaderState).toBe("done");
    vi.useRealTimers();
  });

  it("sort tout seul après son temps d'affichage", async () => {
    vi.useFakeTimers();
    const element = monter();
    const fait = vi.fn();
    createLoader(element, {
      sessionKey: null,
      holdMs: 300,
      exitMs: 100,
      onDone: fait,
    });

    await vi.advanceTimersByTimeAsync(250);
    expect(fait).not.toHaveBeenCalled();

    await vi.advanceTimersByTimeAsync(200);
    expect(fait).toHaveBeenCalledTimes(1);
    vi.useRealTimers();
  });

  it("fait défiler les mots d'accueil", async () => {
    vi.useFakeTimers();
    const element = monter();
    createLoader(element, {
      form: "greetings",
      greetings: ["Bonjour", "Hello", "Hola"],
      stepMs: 100,
      holdMs: 10000,
      sessionKey: null,
    });

    const mot = element.querySelector(".nova-loader__greeting")!;
    expect(mot.textContent).toBe("Bonjour");

    await vi.advanceTimersByTimeAsync(100);
    expect(mot.textContent).toBe("Hello");
    await vi.advanceTimersByTimeAsync(100);
    expect(mot.textContent).toBe("Hola");
    // La liste boucle : un rideau ne s'arrête pas sur le dernier mot.
    await vi.advanceTimersByTimeAsync(100);
    expect(mot.textContent).toBe("Bonjour");

    vi.useRealTimers();
  });

  it("rend le contenu d'origine après destroy", () => {
    const element = monter();
    createLoader(element, { sessionKey: null }).destroy();
    expect(element.innerHTML).toBe("<p>Bât &amp; Verre</p>");
    expect(element.dataset.novaLoader).toBeUndefined();
  });
});
