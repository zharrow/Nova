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
/**
 * Les rideaux créés par un test, démontés à sa sortie.
 *
 * Ce n'est pas de la politesse : un rideau qui survit à son test garde son
 * abonnement au ticker PARTAGÉ. Quand le test suivant repasse aux vrais
 * minuteurs, la boucle reste marquée « en cours » avec un handle qui appartient
 * à une horloge jetée, et plus aucun abonné n'est jamais appelé — l'avancement
 * des tests d'après ne bougeait plus d'un pixel, sans que rien ne l'explique.
 */
const vivants: Array<{ destroy(): void }> = [];
function creer(...args: Parameters<typeof createLoader>) {
  const instance = createLoader(...args);
  vivants.push(instance);
  return instance;
}

afterEach(() => {
  for (const instance of vivants.splice(0)) instance.destroy();
  setReducedMotion(false);
  // Le relais pose un drapeau sur <html>. Il survivrait d'un test à l'autre.
  delete document.documentElement.dataset.novaLoaded;
});

/** Les dix formes qui sont des rideaux à lames. */
const LAMES = [
  "blades", "alternate", "center", "accordion", "slats",
  "shutter", "slide", "diagonal", "checker", "edge",
] as const;

const ms = (valeur: string) => Number.parseFloat(valeur.replace("ms", ""));

describe("createLoader", () => {
  it("monte un rideau de lames et garde le contenu fourni", () => {
    const element = monter();
    creer(element, { form: "blades", blades: 5, sessionKey: null });

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
    creer(element, { onDone: fait, sessionKey: null });

    expect(fait).toHaveBeenCalledTimes(1);
    expect(element.querySelectorAll(".nova-loader__blade")).toHaveLength(0);
    expect(element.dataset.novaLoaderState).toBe("done");
  });

  it("ne rejoue pas dans la même session", () => {
    const premier = monter();
    creer(premier, { sessionKey: "essai" });
    expect(premier.dataset.novaLoaderState).toBe("showing");

    const second = monter();
    const fait = vi.fn();
    creer(second, { sessionKey: "essai", onDone: fait });
    expect(second.dataset.novaLoaderState).toBe("done");
    expect(fait).toHaveBeenCalledTimes(1);
  });

  it("se saute à la première interaction", async () => {
    vi.useFakeTimers();
    const element = monter();
    const fait = vi.fn();
    creer(element, {
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
    creer(element, {
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
    creer(element, {
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
    creer(element, { form: "blades", blades: lames, exitMs, sessionKey: null });

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
    creer(element, { form: "blades", blades: 1, sessionKey: null });
    const lame = element.querySelector<HTMLElement>(".nova-loader__blade")!;
    expect(lame.style.getPropertyValue("--nova-blade-delay")).toBe("0ms");
  });

  it("rejoue l'entrée à chaque mot d'accueil", async () => {
    // Changer un attribut ne rejoue pas une animation CSS ; changer son
    // `animation-name`, si. La parité doit donc alterner à CHAQUE pas, y
    // compris quand une liste de longueur impaire reboucle sur l'index 0.
    vi.useFakeTimers();
    const element = monter();
    creer(element, {
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
    creer(element, {
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

  /* ── Les dix chorégraphies ─────────────────────────────────────────── */

  it("découpe une grille pour les chorégraphies qui en demandent une", () => {
    // Une lame verticale est un cas particulier de grille : une colonne sur un
    // rang. `diagonal` en demande plusieurs, et c'est la même mécanique.
    const plate = monter();
    creer(plate, { form: "blades", blades: 6, sessionKey: null });
    expect(plate.querySelectorAll(".nova-loader__blade")).toHaveLength(6);

    const grille = monter();
    creer(grille, { form: "diagonal", blades: 6, sessionKey: null });
    // 6 colonnes × max(2, round(6 / 2)) rangs.
    expect(grille.querySelectorAll(".nova-loader__blade")).toHaveLength(18);

    const store = monter();
    creer(store, { form: "slats", blades: 6, sessionKey: null });
    expect(store.querySelectorAll(".nova-loader__blade")).toHaveLength(6);
  });

  it("fait tenir les DIX chorégraphies dans le même budget de sortie", () => {
    // C'est tout l'intérêt de normaliser les rangs : une vague sur trente
    // cases et une vague sur six lames doivent finir au même instant. Une
    // pièce encore en course quand le voile est retiré est coupée net, et la
    // sortie se termine par un saut au lieu d'un retrait.
    const exitMs = 700;
    for (const form of LAMES) {
      const element = monter();
      creer(element, { form, blades: 6, exitMs, sessionKey: null });

      const course = ms(element.style.getPropertyValue("--nova-loader-blade"));
      const retards = Array.from(
        element.querySelectorAll<HTMLElement>(".nova-loader__blade"),
        (piece) => ms(piece.style.getPropertyValue("--nova-blade-delay")),
      );

      expect(retards.length).toBeGreaterThan(0);
      expect(course).toBeGreaterThan(0);
      expect(Math.max(...retards) + course).toBeLessThanOrEqual(exitMs);
    }
  });

  it("donne une origine par pièce aux chorégraphies qui en dépendent", () => {
    // `alternate` n'existe QUE par là : une lame sur deux se replie vers le
    // bas, et c'est ce qui déchire le rideau au lieu de le lever.
    const element = monter();
    creer(element, { form: "alternate", blades: 4, sessionKey: null });
    const origines = Array.from(
      element.querySelectorAll<HTMLElement>(".nova-loader__blade"),
      (piece) => piece.style.getPropertyValue("--nova-blade-origin"),
    );
    expect(origines).toEqual(["50% 0%", "50% 100%", "50% 0%", "50% 100%"]);

    // `blades` n'en pose aucune : la valeur par défaut du CSS suffit.
    const sobre = monter();
    creer(sobre, { form: "blades", blades: 3, sessionKey: null });
    const lame = sobre.querySelector<HTMLElement>(".nova-loader__blade")!;
    expect(lame.style.getPropertyValue("--nova-blade-origin")).toBe("");
  });

  /* ── L'attente réelle ──────────────────────────────────────────────── */

  it("attend le signal au lieu d'une durée devinée", async () => {
    vi.useFakeTimers();
    const element = monter();
    let resoudre!: () => void;
    const promesse = new Promise<void>((r) => {
      resoudre = r;
    });
    const revele = vi.fn();
    creer(element, {
      sessionKey: null,
      until: promesse,
      minMs: 100,
      maxMs: 30000,
      exitMs: 50,
      onReveal: revele,
    });

    // Bien après l'ancien `holdMs` de 1100 ms : le voile tient parce que la
    // page n'est pas prête, ce qu'une durée fixe ne pouvait pas savoir.
    await vi.advanceTimersByTimeAsync(3000);
    expect(element.dataset.novaLoaderState).toBe("showing");
    expect(revele).not.toHaveBeenCalled();

    // Moins que `exitMs` : on veut voir le voile EN COURS de retrait, pas
    // déjà retiré. Le signal ne transite plus par une image d'animation, la
    // levée part donc dès la microtâche de la promesse.
    resoudre();
    await vi.advanceTimersByTimeAsync(10);
    expect(revele).toHaveBeenCalledTimes(1);
    expect(element.dataset.novaLoaderState).toBe("leaving");
    vi.useRealTimers();
  });

  it("ne clignote pas quand tout est déjà là", async () => {
    // Un rideau qui passe en 80 ms n'est pas un rideau bref, c'est un
    // clignotement — strictement pire que pas de rideau du tout.
    vi.useFakeTimers();
    const element = monter();
    const revele = vi.fn();
    creer(element, {
      sessionKey: null,
      until: Promise.resolve(),
      minMs: 500,
      exitMs: 50,
      onReveal: revele,
    });

    await vi.advanceTimersByTimeAsync(300);
    expect(revele).not.toHaveBeenCalled();
    await vi.advanceTimersByTimeAsync(300);
    expect(revele).toHaveBeenCalledTimes(1);
    vi.useRealTimers();
  });

  it("lève le voile même si l'attente ne finit JAMAIS", async () => {
    // Le garde-fou qui rend `until` utilisable : sans plafond, une promesse
    // en suspens laisse le visiteur derrière le voile pour toujours.
    vi.useFakeTimers();
    const element = monter();
    const fait = vi.fn();
    creer(element, {
      sessionKey: null,
      until: new Promise(() => {}),
      minMs: 100,
      maxMs: 800,
      exitMs: 100,
      onDone: fait,
    });

    await vi.advanceTimersByTimeAsync(700);
    expect(fait).not.toHaveBeenCalled();
    await vi.advanceTimersByTimeAsync(400);
    expect(fait).toHaveBeenCalledTimes(1);
    vi.useRealTimers();
  });

  it("traite un échec comme une fin, pas comme une raison d'attendre", async () => {
    // Une attente se règle sur le SETTLE. Un fetch qui échoue, une police
    // absente : le visiteur n'a pas à payer l'erreur en temps d'attente.
    vi.useFakeTimers();
    const element = monter();
    creer(element, {
      sessionKey: null,
      until: Promise.reject(new Error("réseau")),
      minMs: 100,
      maxMs: 30000,
      exitMs: 50,
    });

    await vi.advanceTimersByTimeAsync(200);
    expect(element.dataset.novaLoaderState).not.toBe("showing");
    vi.useRealTimers();
  });

  it("ignore les images différées, qui n'arriveraient jamais", async () => {
    // `loading="lazy"` déclare que l'image n'est pas nécessaire maintenant.
    // Comptée, une image restée hors écran enverrait le rideau au plafond à
    // chaque visite — huit secondes de voile pour une vignette de pied de page.
    vi.useFakeTimers();
    const paresseuse = document.createElement("img");
    paresseuse.loading = "lazy";
    paresseuse.src = "https://exemple.test/lourde.jpg";
    document.body.appendChild(paresseuse);

    const element = monter();
    const revele = vi.fn();
    creer(element, {
      sessionKey: null,
      until: "images",
      minMs: 100,
      maxMs: 30000,
      exitMs: 50,
      onReveal: revele,
    });

    await vi.advanceTimersByTimeAsync(300);
    expect(revele).toHaveBeenCalledTimes(1);
    paresseuse.remove();
    vi.useRealTimers();
  });

  /* ── L'avancement ──────────────────────────────────────────────────── */

  it("rend un avancement monotone qui finit à 1", async () => {
    // Un compteur qui recule est lu comme un bug, jamais comme une correction.
    vi.useFakeTimers();
    const element = monter();
    const parts: number[] = [];
    creer(element, {
      sessionKey: null,
      holdMs: 400,
      exitMs: 50,
      onProgress: (part) => parts.push(part),
    });

    await vi.advanceTimersByTimeAsync(500);
    expect(parts.length).toBeGreaterThan(3);
    for (let index = 1; index < parts.length; index++) {
      expect(parts[index]!).toBeGreaterThanOrEqual(parts[index - 1]!);
    }
    expect(parts[parts.length - 1]).toBe(1);
    expect(element.style.getPropertyValue("--nova-loader-progress")).toBe("1");
    vi.useRealTimers();
  });

  it("porte l'intervalle par un repli quand la mesure est grossière", async () => {
    // Une seule promesse ne donne que 0 puis 1 : mesurée seule, la barre ne
    // bougerait pas d'un pixel avant de sauter au bout. Le repli la porte, et
    // il PLAFONNE sous 1 — il ne prétend jamais avoir fini.
    vi.useFakeTimers();
    const element = monter();
    const parts: number[] = [];
    creer(element, {
      sessionKey: null,
      until: new Promise(() => {}),
      minMs: 100,
      maxMs: 2000,
      exitMs: 50,
      onProgress: (part) => parts.push(part),
    });

    await vi.advanceTimersByTimeAsync(1000);
    const atteint = parts[parts.length - 1]!;
    expect(atteint).toBeGreaterThan(0.3);
    expect(atteint).toBeLessThan(1);
    vi.useRealTimers();
  });

  /* ── Le passage de relais ──────────────────────────────────────────── */

  it("passe le relais au DÉBUT de la sortie, pas à la fin", async () => {
    // L'entrée de la page doit chevaucher le retrait du voile, sinon on lit
    // deux gestes à la suite au lieu d'un seul.
    vi.useFakeTimers();
    const element = monter();
    const ordre: string[] = [];
    creer(element, {
      sessionKey: null,
      holdMs: 200,
      exitMs: 400,
      onReveal: () => ordre.push("relais"),
      onDone: () => ordre.push("fini"),
    });

    await vi.advanceTimersByTimeAsync(250);
    expect(ordre).toEqual(["relais"]);
    expect(document.documentElement.dataset.novaLoaded).toBe("");

    await vi.advanceTimersByTimeAsync(450);
    expect(ordre).toEqual(["relais", "fini"]);
    vi.useRealTimers();
  });

  it("passe quand même le relais en mouvement réduit", () => {
    // Sans cela, une page qui attend `onReveal` pour entrer resterait
    // invisible chez précisément les visiteurs qu'on cherche à ménager.
    setReducedMotion(true);
    const element = monter();
    const revele = vi.fn();
    creer(element, { sessionKey: null, onReveal: revele, until: "fonts" });
    expect(revele).toHaveBeenCalledTimes(1);
    expect(document.documentElement.dataset.novaLoaded).toBe("");
  });

  it("retire le drapeau de relais au démontage", () => {
    const element = monter();
    const instance = creer(element, { sessionKey: null, holdMs: 10 });
    instance.skip();
    expect(document.documentElement.dataset.novaLoaded).toBe("");
    instance.destroy();
    expect(document.documentElement.dataset.novaLoaded).toBeUndefined();
  });

  it("rend le contenu d'origine après destroy", () => {
    const element = monter();
    creer(element, { sessionKey: null }).destroy();
    expect(element.innerHTML).toBe("<p>Le rideau &amp; la page</p>");
    expect(element.dataset.novaLoader).toBeUndefined();
  });
});
