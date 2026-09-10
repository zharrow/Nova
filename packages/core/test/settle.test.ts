import { describe, it, expect, vi, afterEach } from "vitest";
import { createLoader } from "../src/engines/loader";
import { isPageCovered } from "../src/internal/curtain";
import { observeInView } from "../src/internal/in-view";
import { MockIntersectionObserver, setReducedMotion } from "./setup";

/**
 * `settle` — la marque emporte le voile.
 *
 * Un seul geste : la marque rejoint sa place dans la page pendant que le
 * panneau se rétracte SUR ELLE. Ce qui se vérifie ici est ce qu'un test PEUT
 * vérifier — les mesures, les bornes des deux animations, le fait qu'elles
 * partagent leur horloge, le repli, et l'origine transmise au sillage. Le
 * reste se regarde.
 */
const vivants: Array<{ destroy(): void }> = [];

/** Un élément à qui l'on donne une boîte, ce que jsdom ne fait pas. */
function boite(el: HTMLElement, x: number, y: number, w: number, h: number) {
  el.getBoundingClientRect = () =>
    ({ left: x, top: y, width: w, height: h, right: x + w, bottom: y + h }) as DOMRect;
  return el;
}

function scene() {
  document.body.innerHTML = "";
  // La place que la marque doit rejoindre, dans l'en-tête de la page.
  const place = boite(document.createElement("span"), 40, 20, 32, 32);
  place.dataset.novaSettle = "";
  document.body.appendChild(place);

  const voile = document.createElement("div");
  voile.innerHTML = "<p>Marque</p>";
  document.body.appendChild(voile);
  return { place, voile };
}

const centre = (s: string) => {
  const m = /at (-?[\d.]+)px (-?[\d.]+)px/.exec(s)!;
  return { x: Number(m[1]), y: Number(m[2]) };
};
const deplacement = (s: string) => {
  const m = /translate\((-?[\d.]+)px, (-?[\d.]+)px\)/.exec(s)!;
  return { x: Number(m[1]), y: Number(m[2]) };
};

afterEach(() => {
  for (const instance of vivants.splice(0)) instance.destroy();
  setReducedMotion(false);
  delete document.documentElement.dataset.novaLoaded;
  document.body.innerHTML = "";
  expect(isPageCovered()).toBe(false);
});

function monter(voile: HTMLElement, options = {}) {
  const instance = createLoader(voile, {
    form: "settle",
    sessionKey: null,
    holdMs: 50,
    exitMs: 400,
    ...options,
  });
  vivants.push(instance);
  return instance;
}

describe("Loader · settle", () => {
  it("monte un panneau SOUS la marque, jamais autour d'elle", () => {
    // Le disque qui se referme découpe ce qu'il couvre. Poser ce découpage sur
    // le rideau aurait rogné la marque : on l'aurait vue se faire manger par
    // une lucarne au lieu d'atterrir.
    const { voile } = scene();
    monter(voile);

    const panneau = voile.querySelector(".nova-loader__panel");
    const contenu = voile.querySelector(".nova-loader__content");
    expect(panneau).not.toBeNull();
    expect(contenu).not.toBeNull();
    expect(panneau!.contains(contenu!)).toBe(false);
    expect(contenu!.textContent).toContain("Marque");
  });

  it("fait voler la marque et rétracte le panneau SUR LE MÊME CHEMIN", async () => {
    // L'INVARIANT QUI PORTE TOUTE L'IDÉE. Le disque et la marque ne sont pas
    // deux animations qu'on synchronise : c'est un seul chemin échantillonné
    // deux fois. S'ils pouvaient diverger, il ne resterait qu'un logo qui se
    // déplace pendant qu'un masque se ferme ailleurs — exactement ce que cette
    // forme existe pour ne pas être.
    vi.useFakeTimers();
    const anime = vi.spyOn(Element.prototype, "animate");
    const { voile } = scene();
    const instance = monter(voile);
    boite(voile.querySelector(".nova-loader__content")!, 480, 360, 64, 64);

    instance.skip();
    await vi.advanceTimersByTimeAsync(10);

    // Panneau, marque, couleur, liseré.
    expect(anime).toHaveBeenCalledTimes(4);
    const disques = anime.mock.calls[0]![0] as Keyframe[];
    const vols = anime.mock.calls[1]![0] as Keyframe[];
    expect(disques.length).toBe(vols.length);
    expect(disques.length).toBeGreaterThan(20);

    const x0 = 512;
    const y0 = 392;
    for (let index = 0; index < disques.length; index++) {
      const c = centre(disques[index]!.clipPath as string);
      const d = deplacement(vols[index]!.transform as string);
      expect(disques[index]!.offset).toBe(vols[index]!.offset);
      expect(c.x).toBeCloseTo(x0 + d.x, 6);
      expect(c.y).toBeCloseTo(y0 + d.y, 6);
    }

    // La marque finit exactement sur sa place, à son échelle.
    expect(vols[vols.length - 1]!.transform).toBe(
      "translate(-456px, -356px) scale(0.5)",
    );
    expect(disques[disques.length - 1]!.clipPath).toBe("circle(0px at 56px 36px)");
    vi.useRealTimers();
    anime.mockRestore();
  });

  it("CUIT la courbe dans les échantillons, et n'en laisse aucune aux intervalles", async () => {
    // Les Web Animations appliquent la courbe à CHAQUE intervalle, jamais à
    // l'ensemble. Avec quelques points de passage et un `cubic-bezier`, le
    // geste accélérait puis ralentissait à chaque étape — c'est ce qu'on
    // lisait comme des à-coups. Tout doit donc être linéaire ICI, et la courbe
    // vivre dans la position des échantillons.
    vi.useFakeTimers();
    const anime = vi.spyOn(Element.prototype, "animate");
    const { voile } = scene();
    const instance = monter(voile);
    boite(voile.querySelector(".nova-loader__content")!, 480, 360, 64, 64);
    instance.skip();
    await vi.advanceTimersByTimeAsync(10);

    for (const appel of anime.mock.calls) {
      const options = appel[1] as { easing: string };
      expect(options.easing).toBe("linear");
      for (const image of appel[0] as Keyframe[]) {
        if (image.easing !== undefined) expect(image.easing).toBe("linear");
      }
    }
    // Et la course n'est PAS une rampe : sans courbe cuite, le pas serait
    // constant d'un échantillon à l'autre.
    const vols = anime.mock.calls[1]![0] as Keyframe[];
    const pas = (i: number) =>
      deplacement(vols[i]!.transform as string).x -
      deplacement(vols[i - 1]!.transform as string).x;
    expect(Math.abs(pas(1))).toBeLessThan(Math.abs(pas(Math.floor(vols.length / 2))));

    vi.useRealTimers();
    anime.mockRestore();
  });

  it("se pose au lieu de s'arrêter : la marque DÉPASSE puis se range", async () => {
    // Sans dépassement, une forme qui s'appelle `settle` ne pose rien.
    vi.useFakeTimers();
    const anime = vi.spyOn(Element.prototype, "animate");
    const { voile } = scene();
    const instance = monter(voile);
    boite(voile.querySelector(".nova-loader__content")!, 480, 360, 64, 64);
    instance.skip();
    await vi.advanceTimersByTimeAsync(10);

    const vols = anime.mock.calls[1]![0] as Keyframe[];
    const distances = vols.map((v) => {
      const d = deplacement(v.transform as string);
      return Math.hypot(d.x, d.y);
    });
    const arrivee = distances[distances.length - 1]!;
    // Un échantillon au moins est allé PLUS LOIN que la place.
    expect(Math.max(...distances)).toBeGreaterThan(arrivee);
    // Et le dépassement reste modeste : au-delà, on lit un rebond.
    expect(Math.max(...distances)).toBeLessThan(arrivee * 1.09);
    vi.useRealTimers();
    anime.mockRestore();
  });

  it("ne ROUVRE JAMAIS le voile pendant le dépassement", async () => {
    // Le piège du ressort : le rayon calculé sur la même course repasserait
    // par des valeurs négatives — donc nulles — puis positives, et le voile se
    // rouvrirait d'un souffle juste après s'être éteint. Le rayon suit donc sa
    // propre fermeture, monotone.
    vi.useFakeTimers();
    const anime = vi.spyOn(Element.prototype, "animate");
    const { voile } = scene();
    const instance = monter(voile);
    boite(voile.querySelector(".nova-loader__content")!, 480, 360, 64, 64);
    instance.skip();
    await vi.advanceTimersByTimeAsync(10);

    const rayons = (anime.mock.calls[0]![0] as Keyframe[]).map((d) =>
      Number(/circle\((-?[\d.]+)px/.exec(d.clipPath as string)![1]),
    );
    for (let i = 1; i < rayons.length; i++) {
      expect(rayons[i]!).toBeLessThanOrEqual(rayons[i - 1]!);
    }
    expect(rayons[rayons.length - 1]).toBe(0);
    // Le voile s'éteint AVANT la fin : c'est ce qui laisse voir la marque se
    // ranger sur la page, une fois le rideau parti.
    const premierZero = rayons.findIndex((r) => r === 0);
    expect(premierZero).toBeGreaterThan(0);
    expect(premierZero).toBeLessThan(rayons.length - 1);
    vi.useRealTimers();
    anime.mockRestore();
  });

  it("fait passer la marque à la couleur de sa destination", async () => {
    // La marque quitte un voile pour une page. Sans ce passage, au contact, un
    // logo clair se substituait d'un coup au logo sombre de l'en-tête : deux
    // objets, et l'idée tombait sur la dernière image.
    vi.useFakeTimers();
    const anime = vi.spyOn(Element.prototype, "animate");
    const { place, voile } = scene();
    place.style.color = "rgb(27, 79, 216)";
    voile.style.color = "rgb(255, 255, 255)";

    const instance = monter(voile);
    boite(voile.querySelector(".nova-loader__content")!, 480, 360, 64, 64);
    instance.skip();
    await vi.advanceTimersByTimeAsync(10);

    const couleurs = anime.mock.calls[2]![0] as Keyframe[];
    expect(couleurs[0]!.color).toBe("rgb(255, 255, 255)");
    expect(couleurs[couleurs.length - 1]!.color).toBe("rgb(27, 79, 216)");

    // ELLE TIENT PUIS BASCULE. Étalée sur toute la course, la marque
    // traversait le milieu du dégradé au cœur du disque sombre — un logo
    // lavande sur du bleu nuit, illisible au pire moment.
    const tenue = couleurs[1]!;
    expect(tenue.color).toBe("rgb(255, 255, 255)");
    expect(Number(tenue.offset)).toBeGreaterThan(0.3);
    // Et elle a fini AU CONTACT, pas après : le voile s'éteint sur une marque
    // qui a déjà la couleur de la page.
    expect(Number(couleurs[2]!.offset)).toBeLessThan(1);
    expect(Number(couleurs[2]!.offset)).toBeGreaterThan(Number(tenue.offset));
    vi.useRealTimers();
    anime.mockRestore();
  });

  it("CAMBRE le trajet, et le disque cambre avec lui", async () => {
    vi.useFakeTimers();
    const anime = vi.spyOn(Element.prototype, "animate");
    const { voile } = scene();
    const instance = monter(voile, { settleArc: 0.3 });
    boite(voile.querySelector(".nova-loader__content")!, 480, 360, 64, 64);
    instance.skip();
    await vi.advanceTimersByTimeAsync(10);

    const vols = anime.mock.calls[1]![0] as Keyframe[];
    const milieu = vols[Math.floor(vols.length / 2)]!;
    const d = deplacement(milieu.transform as string);
    // L'écart au milieu de la CORDE, en coordonnées relatives au départ.
    const ecart = Math.hypot(d.x - -456 / 2, d.y - -356 / 2);
    expect(ecart).toBeGreaterThan(30);
    vi.useRealTimers();
    anime.mockRestore();
  });

  it("CACHE la place le temps du vol, et la rend à la toute fin", async () => {
    // Le disque est centré sur la marque QUI VOLE : en se resserrant, il cesse
    // de couvrir la destination avant que la marque n'y arrive, et on voyait
    // DEUX marques — le fantôme et la vraie, déjà découverte à côté. C'est le
    // « deux écrans » que cette forme existe pour supprimer.
    vi.useFakeTimers();
    const { place, voile } = scene();
    place.style.visibility = "visible";
    const instance = monter(voile);
    boite(voile.querySelector(".nova-loader__content")!, 480, 360, 64, 64);

    instance.skip();
    await vi.advanceTimersByTimeAsync(10);
    expect(place.style.visibility).toBe("hidden");

    // Rendue à la FIN, pas au premier contact : le dépassement du ressort
    // écarterait ensuite le fantôme, et on relirait deux marques.
    await vi.advanceTimersByTimeAsync(500);
    expect(voile.dataset.novaLoaderState).toBe("done");
    expect(place.style.visibility).toBe("visible");
    vi.useRealTimers();
  });

  it("rend la place même si le rideau est démonté en plein vol", () => {
    // Sans ça, un démontage à mi-course laisserait le logo de l'en-tête
    // invisible pour toujours, sans que rien ne dise pourquoi.
    const { place, voile } = scene();
    const instance = createLoader(voile, {
      form: "settle",
      sessionKey: null,
      holdMs: 5000,
      exitMs: 400,
    });
    vivants.push(instance);
    instance.skip();
    expect(place.style.visibility).toBe("hidden");
    instance.destroy();
    expect(place.style.visibility).toBe("");
  });

  it("REPLIE quand la place n'existe pas, au lieu de voler dans le vide", async () => {
    // Même principe que `Flight`, qui renonce si sa source est hors écran : un
    // vol vers une cible absente n'a aucun sens spatial.
    vi.useFakeTimers();
    const anime = vi.spyOn(Element.prototype, "animate");
    const { place, voile } = scene();
    place.remove();

    const instance = monter(voile);
    instance.skip();
    await vi.advanceTimersByTimeAsync(10);

    expect(anime).not.toHaveBeenCalled();
    expect(voile.dataset.novaSettle).toBe("fallback");
    anime.mockRestore();
    vi.useRealTimers();
  });

  it("REPLIE aussi sur une place de taille nulle", async () => {
    // `display: none`, panneau replié, mise en page pas encore faite : voler
    // vers elle produirait une échelle nulle et une marque qui s'évanouit.
    vi.useFakeTimers();
    const anime = vi.spyOn(Element.prototype, "animate");
    const { place, voile } = scene();
    boite(place, 0, 0, 0, 0);

    const instance = monter(voile);
    instance.skip();
    await vi.advanceTimersByTimeAsync(10);

    expect(anime).not.toHaveBeenCalled();
    expect(voile.dataset.novaSettle).toBe("fallback");
    anime.mockRestore();
    vi.useRealTimers();
  });

  it("ouvre la page EN SILLAGE depuis le point d'atterrissage", async () => {
    // Le détail qui fait que ce n'est pas un logo qui se déplace : l'arrivée
    // de la marque est la CAUSE du mouvement de la page. Ce qui est près
    // d'elle entre en premier.
    vi.useFakeTimers();
    const { voile } = scene();
    const instance = monter(voile);
    boite(voile.querySelector(".nova-loader__content")!, 480, 360, 64, 64);

    // Deux éléments : l'un contre la place (56, 36), l'autre à l'opposé.
    const proche = boite(document.createElement("div"), 60, 40, 20, 20);
    const loin = boite(document.createElement("div"), 900, 700, 20, 20);
    document.body.append(proche, loin);
    const ordre: string[] = [];
    const detacherProche = observeInView(proche, () => ordre.push("proche"));
    const detacherLoin = observeInView(loin, () => ordre.push("loin"));
    MockIntersectionObserver.fire(proche);
    MockIntersectionObserver.fire(loin);

    // Sous le voile, les deux sont RETENUS : jouer là dépenserait le geste.
    expect(ordre).toEqual([]);

    instance.skip();
    // Le proche est à ~20 px de la place : son retard vaut une poignée de
    // millisecondes. Le lointain est à plus de mille pixels, donc au plafond
    // du sillage — l'écart entre les deux est l'effet qu'on cherche.
    await vi.advanceTimersByTimeAsync(20);
    expect(ordre).toEqual(["proche"]);

    await vi.advanceTimersByTimeAsync(500);
    expect(ordre).toEqual(["proche", "loin"]);

    detacherProche();
    detacherLoin();
    vi.useRealTimers();
  });

  it("ne vole pas en mouvement réduit — la marque est déjà à sa place", () => {
    // Rien n'est monté du tout : il n'y a ni voile à emporter ni vol à faire,
    // et l'en-tête de la page porte déjà sa marque.
    setReducedMotion(true);
    const anime = vi.spyOn(Element.prototype, "animate");
    const { voile } = scene();
    monter(voile);

    expect(anime).not.toHaveBeenCalled();
    expect(voile.querySelector(".nova-loader__panel")).toBeNull();
    expect(document.documentElement.dataset.novaLoaded).toBe("");
    anime.mockRestore();
  });
});
