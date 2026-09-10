import { describe, it, expect, vi, afterEach } from "vitest";
import { createReady } from "../src/engines/ready";

/**
 * Les attentes créées par un test, démontées à sa sortie.
 *
 * Une attente qui survit à son test garde son abonnement au ticker PARTAGÉ.
 * Quand le test suivant repasse aux vrais minuteurs, la boucle reste marquée
 * « en cours » avec un handle appartenant à l'horloge jetée, et plus aucun
 * abonné n'est appelé — dans aucun test, sans le moindre message.
 */
const vivantes: Array<{ destroy(): void }> = [];
function creer(...args: Parameters<typeof createReady>) {
  const instance = createReady(...args);
  vivantes.push(instance);
  return instance;
}

afterEach(() => {
  for (const instance of vivantes.splice(0)) instance.destroy();
});

describe("createReady", () => {
  it("attend le signal au lieu d'une durée devinée", async () => {
    vi.useFakeTimers();
    let resoudre!: () => void;
    const promesse = new Promise<void>((r) => {
      resoudre = r;
    });
    const pret = vi.fn();
    creer({ until: promesse, minMs: 100, maxMs: 30000, onReady: pret });

    // Bien après la durée par défaut de 1100 ms : l'attente tient parce que
    // rien n'est arrivé, ce qu'une durée fixe ne pouvait pas savoir.
    await vi.advanceTimersByTimeAsync(3000);
    expect(pret).not.toHaveBeenCalled();

    resoudre();
    await vi.advanceTimersByTimeAsync(10);
    expect(pret).toHaveBeenCalledTimes(1);
    vi.useRealTimers();
  });

  it("ne clignote pas quand tout est déjà là", async () => {
    // Sous le plancher, une attente n'est pas brève : c'est un clignotement,
    // strictement pire que pas d'attente du tout.
    vi.useFakeTimers();
    const pret = vi.fn();
    creer({ until: Promise.resolve(), minMs: 500, onReady: pret });

    await vi.advanceTimersByTimeAsync(300);
    expect(pret).not.toHaveBeenCalled();
    await vi.advanceTimersByTimeAsync(300);
    expect(pret).toHaveBeenCalledTimes(1);
    vi.useRealTimers();
  });

  it("finit même si l'attente ne finit JAMAIS", async () => {
    vi.useFakeTimers();
    const pret = vi.fn();
    creer({ until: new Promise(() => {}), minMs: 100, maxMs: 800, onReady: pret });

    await vi.advanceTimersByTimeAsync(700);
    expect(pret).not.toHaveBeenCalled();
    await vi.advanceTimersByTimeAsync(200);
    expect(pret).toHaveBeenCalledTimes(1);
    vi.useRealTimers();
  });

  it("traite un échec comme une fin, pas comme une raison d'attendre", async () => {
    vi.useFakeTimers();
    const pret = vi.fn();
    creer({
      until: Promise.reject(new Error("réseau")),
      minMs: 100,
      maxMs: 30000,
      onReady: pret,
    });

    await vi.advanceTimersByTimeAsync(200);
    expect(pret).toHaveBeenCalledTimes(1);
    vi.useRealTimers();
  });

  it("compte les images une par une, ce qui donne une mesure fine", async () => {
    vi.useFakeTimers();
    const images = [0, 1, 2].map(() => {
      const image = document.createElement("img");
      document.body.appendChild(image);
      return image;
    });
    // jsdom ne charge rien : `complete` est vrai pour une image sans source,
    // donc les trois comptent tout de suite. Ce qu'on vérifie ici est le
    // COMPTE, pas le chargement — la finesse de la mesure en dépend.
    const parts: number[] = [];
    const pret = vi.fn();
    creer({ until: "images", minMs: 200, onProgress: (p) => parts.push(p), onReady: pret });

    await vi.advanceTimersByTimeAsync(300);
    expect(pret).toHaveBeenCalledTimes(1);
    expect(parts[parts.length - 1]).toBe(1);
    for (const image of images) image.remove();
    vi.useRealTimers();
  });

  it("ignore les images différées, qui n'arriveraient jamais", async () => {
    // `loading="lazy"` déclare que l'image n'est pas nécessaire maintenant.
    // Comptée, une image restée hors écran enverrait l'attente au plafond à
    // chaque visite — huit secondes pour une vignette de pied de page.
    vi.useFakeTimers();
    const paresseuse = document.createElement("img");
    paresseuse.loading = "lazy";
    paresseuse.src = "https://exemple.test/lourde.jpg";
    document.body.appendChild(paresseuse);

    const pret = vi.fn();
    creer({ until: "images", minMs: 100, maxMs: 30000, onReady: pret });
    await vi.advanceTimersByTimeAsync(200);

    expect(pret).toHaveBeenCalledTimes(1);
    paresseuse.remove();
    vi.useRealTimers();
  });

  it("rend un avancement monotone dont le dernier vaut exactement 1", async () => {
    // Un compteur qui recule est lu comme un défaut, jamais comme une
    // correction. Et une barre qui resterait à 87 % pendant que la suite
    // démarre au-dessus d'elle serait un mensonge.
    vi.useFakeTimers();
    const parts: number[] = [];
    creer({ holdMs: 400, onProgress: (part) => parts.push(part) });

    await vi.advanceTimersByTimeAsync(500);
    expect(parts.length).toBeGreaterThan(3);
    for (let index = 1; index < parts.length; index++) {
      expect(parts[index]!).toBeGreaterThanOrEqual(parts[index - 1]!);
    }
    expect(parts[parts.length - 1]).toBe(1);
    vi.useRealTimers();
  });

  it("porte l'intervalle par un repli qui ne prétend jamais avoir fini", async () => {
    // Une seule promesse ne donne que 0 puis 1 : mesurée seule, la barre ne
    // bougerait pas d'un pixel avant de sauter au bout.
    vi.useFakeTimers();
    const parts: number[] = [];
    creer({
      until: new Promise(() => {}),
      minMs: 100,
      maxMs: 2000,
      onProgress: (part) => parts.push(part),
    });

    await vi.advanceTimersByTimeAsync(1000);
    const atteint = parts[parts.length - 1]!;
    expect(atteint).toBeGreaterThan(0.3);
    expect(atteint).toBeLessThan(1);
    vi.useRealTimers();
  });

  it("se saute, et ne prévient qu'une fois", async () => {
    vi.useFakeTimers();
    const pret = vi.fn();
    const attente = creer({ until: new Promise(() => {}), maxMs: 30000, onReady: pret });

    attente.skip();
    expect(pret).toHaveBeenCalledTimes(1);
    expect(attente.done()).toBe(true);
    expect(attente.progress()).toBe(1);

    attente.skip();
    await vi.advanceTimersByTimeAsync(100);
    expect(pret).toHaveBeenCalledTimes(1);
    vi.useRealTimers();
  });

  it("ne prévient plus après démontage", async () => {
    vi.useFakeTimers();
    const pret = vi.fn();
    const attente = creer({ holdMs: 200, onReady: pret });
    attente.destroy();

    await vi.advanceTimersByTimeAsync(400);
    expect(pret).not.toHaveBeenCalled();
    vi.useRealTimers();
  });
});
