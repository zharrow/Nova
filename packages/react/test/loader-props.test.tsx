import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import type { LoaderOptions } from "@nova-ui/core";
import { Loader } from "../src/index";
import type { LoaderProps } from "../src/components/loader";

/**
 * UNE OPTION QUI N'ATTEINT PAS SON MOTEUR EST UNE OPTION QUI MENT.
 *
 * `Loader` déstructure ses props une par une, et une option ajoutée au moteur
 * sans être ajoutée à cette liste tombe dans le `...rest` : elle atterrit sur
 * le `<div>` comme attribut DOM, elle est documentée sur la fiche, et elle ne
 * fait rien. Trois options s'y sont perdues — `covers`, `settleTo`,
 * `settleArc` — et aucune n'a été trouvée par un test : c'est en regardant la
 * page qu'on s'en est aperçu, à chaque fois.
 *
 * Le garde-fou tient en deux morceaux. Le type mappé ci-dessous ne compile que
 * si CHAQUE option de `LoaderOptions` a une valeur ici — ajouter une option au
 * moteur casse donc la compilation du test tant qu'on ne l'a pas déclarée. Et
 * l'assertion vérifie qu'aucune ne se retrouve dans le DOM, ce qui est le
 * symptôme exact de l'oubli.
 */
const TOUTES: { [K in keyof Required<LoaderOptions>]: unknown } = {
  form: "settle",
  blades: 6,
  greetings: ["Bonjour"],
  stepMs: 100,
  until: "fonts",
  minMs: 10,
  maxMs: 60,
  holdMs: 20,
  exitMs: 20,
  covers: "element",
  settleTo: "#une-place-qui-n-existe-pas",
  settleArc: 0.2,
  skippable: false,
  sessionKey: null,
  onProgress: () => {},
  onReveal: () => {},
  onDone: () => {},
};

describe("Loader · surface d'options", () => {
  it("ne laisse AUCUNE option filtrer vers le DOM", () => {
    const { container } = render(
      <Loader {...(TOUTES as LoaderProps)} className="temoin" />,
    );
    const element = container.querySelector(".temoin") as HTMLElement;
    expect(element).not.toBeNull();

    const attributs = element.getAttributeNames().map((nom) => nom.toLowerCase());
    for (const cle of Object.keys(TOUTES)) {
      // React pose les props qu'il ne connaît pas en attributs, en minuscules.
      expect(attributs, `l'option « ${cle} » n'atteint pas le moteur`).not.toContain(
        cle.toLowerCase(),
      );
    }
  });
});
