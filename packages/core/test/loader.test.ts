import { describe, it, expect, vi, afterEach, beforeEach } from "vitest";
import { createLoader } from "../src/engines/loader";
import { setReducedMotion } from "./setup";

function monter(): HTMLElement {
  const element = document.createElement("div");
  element.innerHTML = "<p>Le rideau &amp; la page</p>";
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
      "Le rideau & la page",
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

  it("fait tenir la chorégraphie des lames dans le budget de sortie", () => {
    // Le rideau est retiré de la page à `exitMs` pile. Une lame qui finit sa
    // course après ce budget est coupée net, et la sortie se termine par un
    // saut : c'est l'impression d'une animation inachevée.
    const element = monter();
    const exitMs = 700;
    const lames = 6;
    createLoader(element, { form: "blades", blades: lames, exitMs, sessionKey: null });

    const ms = (valeur: string) => Number.parseFloat(valeur.replace("ms", ""));
    const course = ms(element.style.getPropertyValue("--nova-loader-blade"));
    const toutes = element.querySelectorAll<HTMLElement>(".nova-loader__blade");
    const derniere = toutes[toutes.length - 1]!;
    const retard = ms(derniere.style.getPropertyValue("--nova-blade-delay"));

    expect(course).toBeGreaterThan(0);
    expect(retard + course).toBeLessThanOrEqual(exitMs);
  });

  it("ne décale rien avec une lame unique", () => {
    // `(exitMs * 0.4) / (blades - 1)` divise par zéro pour une seule lame.
    const element = monter();
    createLoader(element, { form: "blades", blades: 1, sessionKey: null });
    const lame = element.querySelector<HTMLElement>(".nova-loader__blade")!;
    expect(lame.style.getPropertyValue("--nova-blade-delay")).toBe("0ms");
  });

  it("rejoue l'entrée à chaque mot d'accueil", async () => {
    // Changer un attribut ne rejoue pas une animation CSS ; changer son
    // `animation-name`, si. La parité doit donc alterner à CHAQUE pas, y
    // compris quand une liste de longueur impaire reboucle sur l'index 0.
    vi.useFakeTimers();
    const element = monter();
    createLoader(element, {
      form: "greetings",
      greetings: ["Bonjour", "Hello", "Hola"],
      stepMs: 100,
      holdMs: 10000,
      sessionKey: null,
    });

    const mot = element.querySelector<HTMLElement>(".nova-loader__greeting")!;
    const parites: string[] = [mot.dataset.novaParite!];
    for (let pas = 0; pas < 4; pas++) {
      await vi.advanceTimersByTimeAsync(100);
      parites.push(mot.dataset.novaParite!);
    }

    expect(parites).toEqual(["0", "1", "0", "1", "0"]);
    vi.useRealTimers();
  });

  it("arrête le défilé des mots dès le début de la sortie", async () => {
    // Un mot qui continue de changer pendant que le contenu s'efface donne
    // deux mouvements contradictoires, et on ne lit ni l'un ni l'autre.
    vi.useFakeTimers();
    const element = monter();
    createLoader(element, {
      form: "greetings",
      greetings: ["Bonjour", "Hello", "Hola"],
      stepMs: 100,
      holdMs: 250,
      exitMs: 500,
      sessionKey: null,
    });

    const mot = element.querySelector<HTMLElement>(".nova-loader__greeting")!;
    await vi.advanceTimersByTimeAsync(300);
    expect(element.dataset.novaLoaderState).toBe("leaving");

    const fige = mot.textContent;
    await vi.advanceTimersByTimeAsync(150);
    expect(mot.textContent).toBe(fige);
    vi.useRealTimers();
  });

  it("rend le contenu d'origine après destroy", () => {
    const element = monter();
    createLoader(element, { sessionKey: null }).destroy();
    expect(element.innerHTML).toBe("<p>Le rideau &amp; la page</p>");
    expect(element.dataset.novaLoader).toBeUndefined();
  });
});
