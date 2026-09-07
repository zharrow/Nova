import { describe, it, expect, vi, afterEach } from "vitest";
import { flight } from "../src/engines/flight";
import { setReducedMotion } from "./setup";

function element(rect: Partial<DOMRect>): HTMLElement {
  const noeud = document.createElement("div");
  noeud.id = "source";
  noeud.innerHTML = '<span id="dedans">preuve</span>';
  document.body.appendChild(noeud);
  noeud.getBoundingClientRect = () =>
    ({ left: 0, top: 0, width: 40, height: 20, right: 40, bottom: 20, ...rect }) as DOMRect;
  return noeud;
}

afterEach(() => {
  setReducedMotion(false);
  flight.stop();
});

describe("flight", () => {
  it("fait voler un fantôme, puis le retire", async () => {
    const source = element({ left: 10, top: 10, right: 50, bottom: 30 });
    const resultat = await flight(source, { x: 400, y: 300 }, { duration: 10 });

    expect(resultat.flew).toBe(true);
    expect(document.querySelectorAll(".nova-flight__ghost")).toHaveLength(0);
    // La source n'a pas bougé : c'est le fantôme seul qui traverse.
    expect(document.getElementById("source")).not.toBeNull();
  });

  it("ne vole pas depuis une source hors écran", async () => {
    // Un vol qu'on ne voit pas n'a aucun sens spatial : il n'apporte rien et
    // coûte une animation. L'appelant peut replier sur autre chose.
    const source = element({ top: -400, bottom: -380 });
    const arrive = vi.fn();
    const resultat = await flight(source, { x: 10, y: 10 }, { onArrive: arrive });

    expect(resultat.flew).toBe(false);
    // `onArrive` part quand même : la suite du scénario ne reste pas suspendue.
    expect(arrive).toHaveBeenCalledTimes(1);
  });

  it("ne vole pas en mouvement réduit, mais prévient quand même", async () => {
    setReducedMotion(true);
    const source = element({});
    const arrive = vi.fn();
    const resultat = await flight(source, { x: 200, y: 200 }, { onArrive: arrive });

    expect(resultat.flew).toBe(false);
    expect(arrive).toHaveBeenCalledTimes(1);
  });

  it("dépouille le fantôme de ses identifiants et le rend inerte", async () => {
    // Deux `id` identiques dans le document, et tout `label for` ou
    // `aria-labelledby` se met à désigner le fantôme.
    const source = element({});

    /* Le fantôme est ajouté de façon SYNCHRONE, avant l'appel à `animate` :
       on l'inspecte donc tout de suite. Attendre ne servirait à rien — la
       doublure d'`animate` résout sa promesse sur la microtâche suivante, et
       le fantôme est retiré à ce moment-là. */
    const promesse = flight(source, { x: 300, y: 300 }, { duration: 40 });
    const vu = document.querySelector<HTMLElement>(".nova-flight__ghost");

    expect(vu).not.toBeNull();
    expect(vu!.id).toBe("");
    expect(vu!.querySelector("[id]")).toBeNull();
    expect(vu!.hasAttribute("inert")).toBe(true);
    expect(vu!.getAttribute("aria-hidden")).toBe("true");

    await promesse;
  });

  it("accepte un élément comme cible", async () => {
    const source = element({ left: 0, top: 0, right: 40, bottom: 20 });
    const cible = element({ left: 500, top: 400, right: 540, bottom: 420 });
    const resultat = await flight(source, cible, { duration: 10 });
    expect(resultat.flew).toBe(true);
  });
});
