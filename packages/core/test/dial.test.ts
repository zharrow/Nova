import { describe, it, expect, afterEach } from "vitest";
import { createDial } from "../src/engines/dial";
import { tickerSize } from "../src/internal/ticker";
import { setReducedMotion } from "./setup";

/**
 * jsdom ne fait aucune mise en page : `clientHeight` vaut zéro, `offsetHeight`
 * aussi, et `scrollTop` est un accesseur qui ignore ce qu'on lui écrit. On
 * pose donc les trois à la main — c'est exactement la même doublure que
 * `dimensionner()` pour les canvas, et sans elle le moteur refuserait de
 * s'armer, ce qui est d'ailleurs le comportement qu'un des tests vérifie.
 */
function monter(
  nombre: number,
  { hauteurVue = 200, hauteurItem = 40 } = {},
): HTMLElement {
  const colonne = document.createElement("div");
  for (let i = 0; i < nombre; i++) {
    const item = document.createElement("button");
    item.dataset.novaDialItem = "";
    item.textContent = `${i}`;
    Object.defineProperty(item, "offsetHeight", {
      value: hauteurItem,
      configurable: true,
    });
    colonne.appendChild(item);
  }
  Object.defineProperty(colonne, "clientHeight", {
    value: hauteurVue,
    configurable: true,
  });
  Object.defineProperty(colonne, "scrollHeight", {
    value: nombre * hauteurItem + (hauteurVue - hauteurItem),
    configurable: true,
  });
  // Une propriété de données ordinaire : jsdom n'a pas de boîte défilante et
  // son accesseur natif renvoie zéro quoi qu'on écrive.
  Object.defineProperty(colonne, "scrollTop", {
    value: 0,
    writable: true,
    configurable: true,
  });
  document.body.appendChild(colonne);
  return colonne;
}

const image = () => new Promise((r) => setTimeout(r, 32));

afterEach(() => setReducedMotion(false));

describe("createDial", () => {
  it("pose le rembourrage qui laisse le premier item atteindre le centre", () => {
    // Sans lui, on ne pourrait jamais choisir janvier : la colonne bute sur
    // son propre bord avant que le premier item soit sous la ligne.
    const colonne = monter(12);
    const dial = createDial(colonne);

    // (200 - 40) / 2
    expect(colonne.style.getPropertyValue("--nova-dial-pad")).toBe("80px");
    expect(colonne.dataset.novaDial).toBe("armed");

    dial.destroy();
  });

  it("ne s'arme pas quand la colonne ne mesure rien", () => {
    // Cas réel, pas théorique : le cadran d'un sélecteur de date est construit
    // dans un panneau replié, donc de hauteur nulle. S'armer là poserait une
    // géométrie fausse que rien ne viendrait corriger.
    const colonne = monter(12, { hauteurVue: 0 });
    const dial = createDial(colonne);

    expect(colonne.dataset.novaDial).toBe("");
    expect(colonne.style.getPropertyValue("--nova-dial-pad")).toBe("");

    dial.destroy();
  });

  it("écrit le rang une fois par item, et la position une fois par image", () => {
    // C'est la propriété qui rend un cadran de cent vingt années aussi peu
    // coûteux qu'un cadran de douze mois : le fondu est calculé en CSS depuis
    // ces deux variables, pas écrit sur chaque item à chaque image.
    const colonne = monter(5);
    const dial = createDial(colonne);
    const items = [...colonne.children] as HTMLElement[];

    expect(items.map((i) => i.style.getPropertyValue("--nova-dial-i"))).toEqual([
      "0",
      "1",
      "2",
      "3",
      "4",
    ]);
    expect(colonne.style.getPropertyValue("--nova-dial-position")).toBe(
      "0.0000",
    );

    dial.destroy();
  });

  it("amène l'item demandé sous la ligne", () => {
    const colonne = monter(12);
    const dial = createDial(colonne, { index: 3 });

    // 80 + 3 * 40 + 20 - 100
    expect(colonne.scrollTop).toBe(120);
    expect(dial.index).toBe(3);
    expect(colonne.style.getPropertyValue("--nova-dial-position")).toBe(
      "3.0000",
    );

    dial.destroy();
  });

  it("annonce la sélection tout de suite, et anime ensuite", async () => {
    // Une sélection programmée est une INTENTION : le `tabindex` mobile et
    // l'`aria-selected` ne peuvent pas attendre la fin de la course.
    const vus: number[] = [];
    const colonne = monter(12);
    const dial = createDial(colonne, { onChange: (i) => vus.push(i) });

    dial.select(6);
    expect(vus).toEqual([6]);
    expect(dial.index).toBe(6);
    // La course a commencé : l'accroche native est suspendue le temps qu'elle
    // écrive `scrollTop` elle-même.
    expect(colonne.dataset.novaDialState).toBe("settling");
    expect(colonne.scrollTop).toBe(0);

    dial.destroy();
  });

  it("saute sans animer en mouvement réduit", () => {
    setReducedMotion(true);
    const colonne = monter(12);
    const dial = createDial(colonne);

    dial.select(6);
    // 80 + 6 * 40 + 20 - 100
    expect(colonne.scrollTop).toBe(240);
    expect(colonne.dataset.novaDialState).toBeUndefined();

    dial.destroy();
  });

  it("déplace la sélection au clavier", () => {
    setReducedMotion(true);
    const colonne = monter(12, { hauteurVue: 200, hauteurItem: 40 });
    const dial = createDial(colonne, { index: 4 });

    colonne.dispatchEvent(
      new KeyboardEvent("keydown", { key: "ArrowDown", bubbles: true }),
    );
    expect(dial.index).toBe(5);

    colonne.dispatchEvent(new KeyboardEvent("keydown", { key: "Home" }));
    expect(dial.index).toBe(0);

    colonne.dispatchEvent(new KeyboardEvent("keydown", { key: "End" }));
    expect(dial.index).toBe(11);

    // Bornée : la colonne n'a pas de douzième voisin.
    colonne.dispatchEvent(new KeyboardEvent("keydown", { key: "PageDown" }));
    expect(dial.index).toBe(11);

    dial.destroy();
  });

  it("laisse le raccourci du navigateur passer", () => {
    const colonne = monter(12);
    const dial = createDial(colonne, { index: 4 });

    const evenement = new KeyboardEvent("keydown", {
      key: "ArrowDown",
      metaKey: true,
      cancelable: true,
    });
    colonne.dispatchEvent(evenement);

    expect(dial.index).toBe(4);
    expect(evenement.defaultPrevented).toBe(false);

    dial.destroy();
  });

  it("annonce le calage une fois le défilement arrêté, jamais pendant", async () => {
    const vus: number[] = [];
    const survols: number[] = [];
    const colonne = monter(12);
    const dial = createDial(colonne, {
      onChange: (i) => vus.push(i),
      onScrub: (i) => survols.push(i),
    });

    colonne.scrollTop = 200; // (200 + 100 - 80 - 20) / 40 = 5
    colonne.dispatchEvent(new Event("scroll"));

    // Le survol suit la colonne dès la première image ; le calage attend le
    // silence.
    await image();
    expect(survols).toContain(5);

    await new Promise((r) => setTimeout(r, 220));
    expect(vus).toEqual([5]);
    expect(dial.index).toBe(5);

    dial.destroy();
  });

  it("ne gonfle pas sa propre mesure", () => {
    // Le bug qui a fait une colonne de deux mille cinq cents pixels sur la
    // vitrine. `clientHeight` compte le rembourrage : sur un élément dont la
    // hauteur suit son contenu, mesurer par-dessus son propre rembourrage
    // fait diverger la boucle mesure → rembourrage → mesure.
    //
    // On simule exactement ça : une hauteur qui vaut le contenu PLUS le
    // rembourrage déjà posé, comme le navigateur la rendrait. En production
    // c'est l'observateur de taille qui rejoue la mesure ; ici on la rejoue
    // en changeant la liste, ce qui passe par le même chemin.
    const colonne = monter(12, { hauteurVue: 0 });
    Object.defineProperty(colonne, "clientHeight", {
      get() {
        const pad = parseFloat(
          colonne.style.getPropertyValue("--nova-dial-pad"),
        );
        return colonne.children.length * 40 + 2 * (Number.isNaN(pad) ? 0 : pad);
      },
      configurable: true,
    });

    const dial = createDial(colonne);
    // (12 × 40 − 40) / 2
    expect(colonne.style.getPropertyValue("--nova-dial-pad")).toBe("220px");

    const treizieme = document.createElement("button");
    treizieme.dataset.novaDialItem = "";
    Object.defineProperty(treizieme, "offsetHeight", {
      value: 40,
      configurable: true,
    });
    colonne.appendChild(treizieme);
    dial.update({});

    // (13 × 40 − 40) / 2, la hauteur du CONTENU seul. En comptant par-dessus
    // son propre rembourrage, le moteur trouvait 460px, puis 940px, sans fin.
    expect(colonne.style.getPropertyValue("--nova-dial-pad")).toBe("240px");

    dial.destroy();
  });

  it("fait suivre `index` au doigt, pas au repos", async () => {
    // L'invariant dont dépend l'adaptateur React. Un appelant qui recopie
    // `onScrub` dans son état renvoie aussitôt cet index au moteur ; si
    // `index` était resté sur l'ancienne valeur, le moteur lancerait une
    // course vers un endroit où la colonne se trouve DÉJÀ — et la course
    // contredirait le doigt à chaque image.
    const colonne = monter(12);
    const dial = createDial(colonne, {
      onScrub: () => {},
      onChange: () => {},
    });

    colonne.scrollTop = 200;
    colonne.dispatchEvent(new Event("scroll"));
    await image();

    expect(dial.index).toBe(5);

    dial.destroy();
  });

  it("rend l'élément à son état de départ", async () => {
    const colonne = monter(12);
    const abonnesAvant = tickerSize();
    const dial = createDial(colonne, { index: 2 });
    dial.select(7);

    dial.destroy();

    expect(colonne.hasAttribute("data-nova-dial")).toBe(false);
    expect(colonne.hasAttribute("data-nova-dial-state")).toBe(false);
    expect(colonne.style.getPropertyValue("--nova-dial-pad")).toBe("");
    expect(colonne.style.getPropertyValue("--nova-dial-position")).toBe("");
    expect(colonne.style.getPropertyValue("--nova-dial-falloff")).toBe("");
    for (const item of [...colonne.children] as HTMLElement[]) {
      expect(item.style.getPropertyValue("--nova-dial-i")).toBe("");
    }
    expect(tickerSize()).toBe(abonnesAvant);

    // Plus rien ne réagit : le moteur détaché ne doit pas ressusciter.
    colonne.dispatchEvent(new Event("scroll"));
    await image();
    expect(tickerSize()).toBe(abonnesAvant);
  });
});
