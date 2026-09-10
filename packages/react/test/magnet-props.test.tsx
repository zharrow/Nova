import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import type { MagnetOptions } from "@nova-ui/core";
import { Magnet } from "../src/index";
import type { MagnetProps } from "../src/components/magnet";

/**
 * Le même garde-fou que `loader-props.test.tsx`, pour la même raison.
 *
 * `Magnet` déstructure ses props une par une : une option ajoutée au moteur et
 * oubliée ici tombe dans le `...rest`, atterrit sur la balise comme attribut
 * DOM, se retrouve documentée sur la fiche, et ne fait rien. C'est arrivé trois
 * fois sur `Loader`, et aucune n'a été trouvée autrement qu'en regardant la
 * page.
 *
 * Le type mappé ne compile que si CHAQUE option de `MagnetOptions` a une valeur
 * ci-dessous : ajouter une option au moteur casse la compilation du test tant
 * qu'on ne l'a pas déclarée dans le composant.
 */
const TOUTES: { [K in keyof Required<MagnetOptions>]: unknown } = {
  force: 0.4,
  radius: 120,
  stiffness: 0.2,
  overshoot: 0.5,
};

describe("Magnet · surface d'options", () => {
  it("ne laisse AUCUNE option filtrer vers le DOM", () => {
    const { container } = render(
      <Magnet {...(TOUTES as MagnetProps)} className="temoin" />,
    );
    const element = container.querySelector(".temoin") as HTMLElement;
    expect(element).not.toBeNull();

    const attributs = element.getAttributeNames().map((nom) => nom.toLowerCase());
    for (const cle of Object.keys(TOUTES)) {
      expect(attributs, `l'option « ${cle} » n'atteint pas le moteur`).not.toContain(
        cle.toLowerCase(),
      );
    }
  });

  it("rend la balise demandée, et non un conteneur de plus", () => {
    // Aimanter l'élément LUI-MÊME est le point : la zone cliquable doit se
    // déplacer avec lui. Un `<div>` enveloppant un bouton laisserait la cible
    // du clic là où le bouton n'est plus.
    const { container } = render(
      <Magnet as="button" className="temoin">
        Envoyer
      </Magnet>,
    );

    const element = container.querySelector(".temoin") as HTMLElement;
    expect(element.tagName).toBe("BUTTON");
    expect(element.textContent).toBe("Envoyer");
  });
});
