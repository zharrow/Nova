import { describe, it, expect, afterEach } from "vitest";
import { createBloom } from "../src/engines/bloom";
import { setReducedMotion } from "./setup";

function monter(): HTMLElement {
  const panneau = document.createElement("div");
  panneau.innerHTML = `
    <img data-nova-bloom-media alt="" />
    <figcaption data-nova-bloom-late>Verrière</figcaption>`;
  document.body.appendChild(panneau);
  return panneau;
}

/**
 * Une timeline GSAP n'applique son premier `set` qu'à sa première image : elle
 * est planifiée, pas exécutée à la construction. On laisse donc passer une
 * frame avant de lire les styles.
 */
const uneImage = () => new Promise((r) => setTimeout(r, 30));

/** jsdom ne recompose pas le raccourci `border-radius` depuis ses longhands. */
const rayon = (element: HTMLElement) => element.style.borderTopLeftRadius;

afterEach(() => setReducedMotion(false));

describe("createBloom", () => {
  it("part du point cliqué, pas du centre", async () => {
    // C'est tout le geste : la bulle naît là où la main était.
    //
    // La durée est portée à dix minutes pour que la mesure soit DÉTERMINISTE :
    // le temps de laisser passer une image, une course de huit dixièmes a déjà
    // bien avancé, et l'assertion dépendrait de la charge de la machine.
    //
    // Soixante secondes ne suffisaient pas, et le test échouait une fois sur
    // cinq : l'easing est `power4.out`, qui abat le plus gros de sa course dans
    // ses premiers pour cent. Sur soixante secondes, une image qui traîne de
    // cinquante millisecondes suffisait à faire sortir la largeur des trois
    // pixels de tolérance. Dix minutes demandent dix fois ce retard.
    const panneau = monter();
    const bloom = createBloom(panneau, {
      origin: { x: 300, y: 200 },
      seed: 40,
      duration: 600,
    });
    bloom.open();
    await uneImage();

    expect(panneau.style.position).toBe("fixed");
    // Le point moins la moitié de la graine : la bulle est centrée dessus.
    // Trois pixels de tolérance : l'image qu'on a laissé passer suffit à la
    // faire bouger d'un pixel, et prétendre à l'exactitude rendrait le test
    // dépendant de la charge de la machine.
    expect(Math.abs(parseFloat(panneau.style.left) - 280)).toBeLessThan(3);
    expect(Math.abs(parseFloat(panneau.style.top) - 180)).toBeLessThan(3);
    expect(Math.abs(parseFloat(panneau.style.width) - 40)).toBeLessThan(3);

    bloom.destroy();
  });

  it("garde le contenu caché tant que la bulle n'a pas pris sa place", async () => {
    // Le montrer pendant la course donnerait une image qu'on étire, pas une
    // matière qui s'ouvre.
    const panneau = monter();
    const bloom = createBloom(panneau, { origin: { x: 100, y: 100 } });
    bloom.open();
    await uneImage();

    const media = panneau.querySelector<HTMLElement>("[data-nova-bloom-media]")!;
    expect(media.style.filter).toContain("blur");
    bloom.destroy();
  });

  it("pose l'état d'arrivée d'emblée en mouvement réduit", () => {
    // GSAP anime en JavaScript : la règle CSS ne peut rien pour lui, le
    // réglage se lit à la main. Ici tout est posé, sans aucune timeline.
    setReducedMotion(true);
    const panneau = monter();
    const bloom = createBloom(panneau, {
      origin: { x: 300, y: 200 },
      aspect: 2,
      radius: "1rem",
    });
    bloom.open();

    expect(rayon(panneau)).toBe("1rem");
    // jsdom : 1024 × 768. La hauteur est bornée à 0,82 × 768 = 629,8 ; la
    // largeur à 0,86 × 1024 / 2 = 440,3. C'est la largeur qui borne — le
    // panneau fait donc 440,3 de haut et le double de large.
    expect(parseFloat(panneau.style.width)).toBeCloseTo(880.64, 1);
    expect(parseFloat(panneau.style.height)).toBeCloseTo(440.32, 1);

    const media = panneau.querySelector<HTMLElement>("[data-nova-bloom-media]")!;
    expect(media.style.filter).toBe("blur(0px)");
    bloom.destroy();
  });

  it("centre le panneau dans la fenêtre", () => {
    setReducedMotion(true);
    const panneau = monter();
    const bloom = createBloom(panneau, { origin: { x: 0, y: 0 }, aspect: 2 });
    bloom.open();

    expect(parseFloat(panneau.style.left)).toBeCloseTo((1024 - 880.64) / 2, 1);
    expect(parseFloat(panneau.style.top)).toBeCloseTo((768 - 440.32) / 2, 1);
    bloom.destroy();
  });

  it("ne promet rien à fermer si rien n'a été ouvert", async () => {
    const panneau = monter();
    const bloom = createBloom(panneau, { origin: { x: 0, y: 0 } });
    await expect(bloom.close()).resolves.toBeUndefined();
    bloom.destroy();
  });

  it("rend le panneau à son état de départ après destroy", async () => {
    const panneau = monter();
    const bloom = createBloom(panneau, { origin: { x: 300, y: 200 } });
    bloom.open();
    await uneImage();
    bloom.destroy();

    expect(panneau.style.position).toBe("");
    expect(panneau.style.width).toBe("");
    // Les quatre coins doivent partir aussi : GSAP les écrit un par un, et un
    // panneau rouvert repartirait du 50 % de la bulle précédente.
    expect(rayon(panneau)).toBe("");
    const media = panneau.querySelector<HTMLElement>("[data-nova-bloom-media]")!;
    expect(media.style.filter).toBe("");
  });
});
