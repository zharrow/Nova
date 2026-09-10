import { describe, it, expect, afterEach } from "vitest";
import { createMagnet } from "../src/engines/magnet";
import { tickerSize } from "../src/internal/ticker";
import { setFinePointer, setReducedMotion } from "./setup";
import type { NovaInstance } from "../src/internal/types";
import type { MagnetOptions } from "../src/engines/magnet";

/**
 * Ce qu'on vérifie ici, c'est l'ARBITRAGE.
 *
 * Qu'un élément penche vers le pointeur, n'importe quelle implémentation le
 * fait. Ce qui distingue celle-ci — un seul aimant tenu à la fois, le plus
 * proche — est aussi la seule chose qui se casserait sans qu'on s'en aperçoive :
 * le symptôme est une rangée qui gondole légèrement, ce qu'on ne voit pas en
 * relecture de différence et qu'on prend pour le rendu normal de l'effet.
 */

/* Un moteur qui survit à son test bloque le ticker pour TOUS les suivants : le
   ticker est un module global, et un abonné jamais retiré garde `frame` non nul
   avec un handle appartenant à une horloge jetée. On enregistre, on démonte. */
const vivants: Array<NovaInstance<MagnetOptions>> = [];

function monter(
  centre: { x: number; y: number },
  options: MagnetOptions = {},
): HTMLElement {
  const element = document.createElement("button");
  document.body.appendChild(element);
  /* Le rectangle SUIT le décalage posé par le moteur, comme le ferait un vrai
     navigateur. C'est ce qui rend le test capable d'attraper la rétroaction :
     un moteur qui mesurerait sans retrancher son propre décalage convergerait
     court, et le voisin lui volerait la capture. */
  element.getBoundingClientRect = () => {
    const dx = parseFloat(element.style.getPropertyValue("--nova-magnet-x")) || 0;
    const dy = parseFloat(element.style.getPropertyValue("--nova-magnet-y")) || 0;
    return {
      left: centre.x - 40 + dx,
      top: centre.y - 20 + dy,
      width: 80,
      height: 40,
    } as DOMRect;
  };
  vivants.push(createMagnet(element, options));
  return element;
}

function bouger(x: number, y: number): void {
  const evenement = new Event("pointermove") as PointerEvent;
  Object.defineProperty(evenement, "clientX", { value: x });
  Object.defineProperty(evenement, "clientY", { value: y });
  window.dispatchEvent(evenement);
}

/** Laisse passer assez d'images pour que le ressort ait convergé. */
function images(ms = 400): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

const decalage = (element: HTMLElement) => ({
  x: parseFloat(element.style.getPropertyValue("--nova-magnet-x")) || 0,
  y: parseFloat(element.style.getPropertyValue("--nova-magnet-y")) || 0,
});

afterEach(() => {
  while (vivants.length) vivants.pop()!.destroy();
  document.body.innerHTML = "";
  setFinePointer(true);
  setReducedMotion(false);
});

describe("createMagnet", () => {
  it("laisse l'élément à sa place tant que rien n'approche", async () => {
    const bouton = monter({ x: 500, y: 300 });
    await images(100);

    expect(decalage(bouton)).toEqual({ x: 0, y: 0 });
    expect(bouton.dataset.novaMagnetState).toBe("idle");
  });

  it("penche vers le pointeur, sans le rejoindre", async () => {
    const bouton = monter({ x: 500, y: 300 }, { force: 0.4, radius: 200 });

    bouger(600, 300);
    await images();

    const { x } = decalage(bouton);
    // 100 px de distance, force 0,4 → 40 px. L'élément PENCHE : s'il couvrait
    // les 100 px il aurait déménagé, et la place de départ serait perdue.
    expect(x).toBeCloseTo(40, 0);
    expect(bouton.dataset.novaMagnetState).toBe("held");
  });

  it("ne bouge pas quand le pointeur est hors du rayon", async () => {
    const bouton = monter({ x: 500, y: 300 }, { radius: 60 });

    bouger(700, 300);
    await images(150);

    expect(decalage(bouton).x).toBeCloseTo(0, 1);
    expect(bouton.dataset.novaMagnetState).toBe("idle");
  });

  /* ── LA THÈSE ─────────────────────────────────────────────────────────── */

  it("ne laisse qu'UN aimant tenu, même quand deux champs se recouvrent", async () => {
    // Deux boutons à 100 px l'un de l'autre, rayon 200 : le pointeur posé
    // entre eux est dans les deux champs. C'est le cas exact d'une barre de
    // navigation, et celui que toutes les copies ratent.
    const gauche = monter({ x: 400, y: 300 }, { radius: 200 });
    const droite = monter({ x: 500, y: 300 }, { radius: 200 });

    bouger(460, 300); // 60 px du droit, 60 de plus du gauche
    await images();

    expect(droite.dataset.novaMagnetState).toBe("held");
    expect(gauche.dataset.novaMagnetState).toBe("idle");
    // Et le perdant est VRAIMENT rangé, pas simplement moins tiré.
    expect(Math.abs(decalage(gauche).x)).toBeLessThan(1);
  });

  it("passe la capture au plus proche quand le pointeur traverse", async () => {
    const gauche = monter({ x: 400, y: 300 }, { radius: 200 });
    const droite = monter({ x: 500, y: 300 }, { radius: 200 });

    bouger(410, 300);
    await images();
    expect(gauche.dataset.novaMagnetState).toBe("held");
    expect(droite.dataset.novaMagnetState).toBe("idle");

    bouger(490, 300);
    await images();
    expect(droite.dataset.novaMagnetState).toBe("held");
    expect(gauche.dataset.novaMagnetState).toBe("idle");
  });

  it("ne laisse pas un grand rayon voler la capture à un voisin plus proche", async () => {
    // L'aimant lointain a un champ trois fois plus large : il ATTEINT le
    // pointeur. Ce n'est pas une raison pour gagner — c'est la distance qui
    // départage, pas la portée.
    const proche = monter({ x: 500, y: 300 }, { radius: 80 });
    const lointain = monter({ x: 800, y: 300 }, { radius: 400 });

    bouger(540, 300);
    await images();

    expect(proche.dataset.novaMagnetState).toBe("held");
    expect(lointain.dataset.novaMagnetState).toBe("idle");
  });

  it("ne capture pas depuis un élément sans boîte", async () => {
    // Conteneur replié : le rectangle vaut zéro. Sans la garde, son centre
    // serait le coin de l'écran — souvent plus proche du pointeur que le vrai
    // voisin, qui perdrait sa capture au profit d'un élément invisible.
    const visible = monter({ x: 500, y: 300 }, { radius: 300 });
    const replie = monter({ x: 0, y: 0 }, { radius: 300 });
    replie.getBoundingClientRect = () =>
      ({ left: 0, top: 0, width: 0, height: 0 }) as DOMRect;

    bouger(520, 300);
    await images();

    expect(visible.dataset.novaMagnetState).toBe("held");
    expect(replie.dataset.novaMagnetState).toBe("idle");
  });

  /* ── LE RELÂCHEMENT ───────────────────────────────────────────────────── */

  it("dépasse sa place en rentrant, et finit par s'y ranger", async () => {
    const bouton = monter({ x: 500, y: 300 }, { radius: 200, overshoot: 1 });

    bouger(600, 300);
    await images();
    expect(decalage(bouton).x).toBeGreaterThan(20);

    // Le pointeur s'en va : on échantillonne pendant le retour.
    bouger(2000, 2000);
    let minimum = Infinity;
    for (let i = 0; i < 30; i++) {
      await new Promise((r) => setTimeout(r, 16));
      minimum = Math.min(minimum, decalage(bouton).x);
    }

    // Un retour sans dépassement s'arrête à zéro par le haut ; celui-ci passe
    // DE L'AUTRE CÔTÉ. C'est ce qui fait lire un relâchement plutôt qu'un
    // trajet calculé.
    expect(minimum).toBeLessThan(0);

    await images();
    expect(decalage(bouton).x).toBeCloseTo(0, 1);
  });

  it("rentre sans dépasser quand on le lui demande", async () => {
    const bouton = monter({ x: 500, y: 300 }, { radius: 200, overshoot: 0 });

    bouger(600, 300);
    await images();

    bouger(2000, 2000);
    let minimum = Infinity;
    for (let i = 0; i < 30; i++) {
      await new Promise((r) => setTimeout(r, 16));
      minimum = Math.min(minimum, decalage(bouton).x);
    }

    expect(minimum).toBeGreaterThan(-0.5);
  });

  /* ── LES GARDE-FOUS DU DÉPÔT ──────────────────────────────────────────── */

  it("ne monte rien en mouvement réduit", () => {
    setReducedMotion(true);
    const bouton = monter({ x: 500, y: 300 });

    expect(bouton.dataset.novaMagnet).toBeUndefined();
    expect(bouton.style.getPropertyValue("--nova-magnet-x")).toBe("");
  });

  it("ne monte rien au tactile", () => {
    setFinePointer(false);
    const bouton = monter({ x: 500, y: 300 });

    expect(bouton.dataset.novaMagnet).toBeUndefined();
  });

  it("ne tient qu'UNE boucle pour toute la page", () => {
    const avant = tickerSize();
    monter({ x: 100, y: 100 });
    monter({ x: 300, y: 100 });
    monter({ x: 500, y: 100 });

    // Trois aimants, un abonnement. Un moteur par boucle est exactement ce que
    // le dépôt interdit, et c'est aussi ce qui empêcherait l'arbitrage.
    expect(tickerSize()).toBe(avant + 1);
  });

  it("rend la boucle quand le dernier aimant s'en va", () => {
    const avant = tickerSize();
    const a = createMagnet(document.createElement("button"));
    const b = createMagnet(document.createElement("button"));
    expect(tickerSize()).toBe(avant + 1);

    a.destroy();
    expect(tickerSize()).toBe(avant + 1);
    b.destroy();
    expect(tickerSize()).toBe(avant);
  });

  it("rend l'élément à son état de départ", async () => {
    const bouton = monter({ x: 500, y: 300 }, { radius: 300 });
    bouger(520, 300);
    await images(120);
    expect(bouton.style.getPropertyValue("--nova-magnet-x")).not.toBe("");

    vivants.pop()!.destroy();

    expect(bouton.dataset.novaMagnet).toBeUndefined();
    expect(bouton.dataset.novaMagnetState).toBeUndefined();
    expect(bouton.style.getPropertyValue("--nova-magnet-x")).toBe("");
    expect(bouton.style.getPropertyValue("--nova-magnet-y")).toBe("");
    expect(bouton.style.getPropertyValue("--nova-magnet-pull")).toBe("");
  });

  it("ne relâche pas au moindre tremblement, une fois tenu", async () => {
    // Le pointeur posé PILE sur le rayon. Sans hystérésis, le sous-pixel du
    // rectangle rendu fait basculer la comparaison d'une image à l'autre :
    // l'élément se fige à mi-course entre une cible pleine et une cible nulle
    // qui alternent, et l'attribut d'état clignote soixante fois par seconde.
    const bouton = monter({ x: 500, y: 300 }, { radius: 100, force: 0.5 });

    bouger(600, 300);
    await images();

    // Il a convergé sur sa cible entière — 100 px de distance, force 0,5 — et
    // non sur un compromis entre deux régimes.
    expect(decalage(bouton).x).toBeCloseTo(50, 0);
    expect(bouton.dataset.novaMagnetState).toBe("held");

    // Et il tient encore un peu au-delà du rayon, sans tenir indéfiniment.
    bouger(610, 300);
    await images(150);
    expect(bouton.dataset.novaMagnetState).toBe("held");

    bouger(640, 300);
    await images(150);
    expect(bouton.dataset.novaMagnetState).toBe("idle");
  });

  it("publie la part de la prise, de 0 à 1", async () => {
    const bouton = monter({ x: 500, y: 300 }, { radius: 100, force: 0.5 });

    // Pointeur au bord du rayon : déplacement maximal, donc part de 1.
    bouger(600, 300);
    await images();

    const part = parseFloat(bouton.style.getPropertyValue("--nova-magnet-pull"));
    expect(part).toBeGreaterThan(0.9);
    expect(part).toBeLessThanOrEqual(1);
  });

  it("se désarme si le mouvement réduit est activé en cours de session", async () => {
    const bouton = monter({ x: 500, y: 300 }, { radius: 300 });
    bouger(520, 300);
    await images(120);
    expect(bouton.dataset.novaMagnet).toBe("");

    setReducedMotion(true);

    // Aucune règle CSS ne peut arrêter un ressort : c'est au moteur de se
    // retirer, et de rendre la place en le faisant.
    expect(bouton.dataset.novaMagnet).toBeUndefined();
    expect(bouton.style.getPropertyValue("--nova-magnet-x")).toBe("");
  });
});
