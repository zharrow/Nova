import { describe, it, expect } from "vitest";
import { createRollText } from "../src/engines/roll-text";

describe("createRollText", () => {
  it("empile deux exemplaires et n'en annonce qu'un", () => {
    const bouton = document.createElement("button");
    const label = document.createElement("span");
    label.textContent = "Contact";
    bouton.appendChild(label);
    document.body.appendChild(bouton);

    createRollText(label);

    const copies = label.querySelectorAll(".nova-roll-text > span");
    expect(copies).toHaveLength(2);
    expect(copies[0]!.getAttribute("aria-hidden")).toBeNull();
    expect(copies[1]!.getAttribute("aria-hidden")).toBe("true");
  });

  it("marque le parent comme déclencheur, pas le mot", () => {
    // Le label d'un bouton doit pivoter quand on survole le bouton, pas
    // seulement les quelques pixels du texte.
    const bouton = document.createElement("button");
    const label = document.createElement("span");
    label.textContent = "Contact";
    bouton.appendChild(label);
    document.body.appendChild(bouton);

    createRollText(label);
    expect(bouton.hasAttribute("data-nova-roll-trigger")).toBe(true);
    expect(label.hasAttribute("data-nova-roll-trigger")).toBe(false);
  });

  it("accepte un ancêtre choisi", () => {
    document.body.innerHTML = '<article class="carte"><button><span id="l">Voir</span></button></article>';
    const label = document.getElementById("l") as HTMLElement;
    createRollText(label, { trigger: ".carte" });
    expect(
      document.querySelector(".carte")!.hasAttribute("data-nova-roll-trigger"),
    ).toBe(true);
  });

  it("rend tout intact après destroy", () => {
    const bouton = document.createElement("button");
    const label = document.createElement("span");
    label.textContent = "Contact";
    bouton.appendChild(label);
    document.body.appendChild(bouton);

    createRollText(label).destroy();
    expect(label.textContent).toBe("Contact");
    expect(label.querySelectorAll("span")).toHaveLength(0);
    expect(bouton.hasAttribute("data-nova-roll-trigger")).toBe(false);
  });
});
