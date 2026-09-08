import { describe, it, expect } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { fr } from "react-day-picker/locale";
import { DatePicker } from "../src/index";

/**
 * Le panneau vit dans un portail : il n'est pas dans le `container` rendu.
 * On interroge donc le document entier.
 *
 * Les libellés de jour sont cherchés ancrés sur la FIN : « 1 octobre » est un
 * préfixe de « 11 octobre » et de « 21 octobre », et une recherche par
 * sous-chaîne en trouve trois.
 */
function ouvrir(): void {
  fireEvent.click(screen.getByRole("button", { name: /1995|MM|JJ/ }));
}

const enTete = () =>
  document
    .querySelector<HTMLElement>('[aria-label="Choisir le mois et l\'année"]')
    ?.textContent?.trim();

describe("DatePicker", () => {
  it("fait suivre l'en-tête aux flèches de mois", () => {
    // Le bug signalé : la grille passait à octobre, l'en-tête restait à
    // septembre. Deux sources de vérité pour « le mois regardé » — les flèches
    // n'en déplaçaient qu'une, et seul le jour choisi révélait laquelle disait
    // vrai. `mois` est désormais la seule.
    render(
      <DatePicker
        defaultValue={new Date(1995, 8, 12)}
        locale={fr}
        labels={{ changeMonth: "Choisir le mois et l'année" }}
      />,
    );
    ouvrir();
    expect(enTete()).toBe("sept. 1995");

    fireEvent.click(screen.getByRole("button", { name: /\+1$/ }));
    expect(enTete()).toBe("oct. 1995");
    // La grille et l'en-tête nomment bien le MÊME mois.
    expect(screen.getByLabelText(/ 1 octobre 1995$/)).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: /-1$/ }));
    fireEvent.click(screen.getByRole("button", { name: /-1$/ }));
    expect(enTete()).toBe("août 1995");
  });

  it("déplie les cadrans sur le mois regardé, pas sur celui d'où l'on vient", () => {
    render(
      <DatePicker
        defaultValue={new Date(1995, 8, 12)}
        locale={fr}
        labels={{
          changeMonth: "Choisir le mois et l'année",
          months: "Mois",
          years: "Année",
        }}
      />,
    );
    ouvrir();
    fireEvent.click(screen.getByRole("button", { name: /\+1$/ }));
    fireEvent.click(screen.getByRole("button", { name: /\+1$/ }));
    expect(enTete()).toBe("nov. 1995");

    // Les cadrans doivent s'ouvrir SUR novembre.
    fireEvent.click(
      document.querySelector<HTMLElement>(
        '[aria-label="Choisir le mois et l\'année"]',
      )!,
    );
    const moisChoisi = document
      .querySelector('[role="listbox"][aria-label="Mois"]')
      ?.querySelector('[aria-selected="true"]')?.textContent;
    expect(moisChoisi).toBe("novembre");
    expect(enTete()).toBe("nov. 1995");
  });

  it("rend le feuilletage réversible : refermer les cadrans ne valide rien", () => {
    render(
      <DatePicker
        defaultValue={new Date(1995, 8, 12)}
        locale={fr}
        labels={{ changeMonth: "Choisir le mois et l'année", months: "Mois" }}
      />,
    );
    ouvrir();
    const bascule = document.querySelector<HTMLElement>(
      '[aria-label="Choisir le mois et l\'année"]',
    )!;

    fireEvent.click(bascule);
    fireEvent.click(screen.getByText("mars"));
    expect(enTete()).toBe("mars 1995");

    // Refermer SANS appliquer : on revient au mois regardé.
    fireEvent.click(bascule);
    expect(enTete()).toBe("sept. 1995");
    expect(screen.getByLabelText(/ 1 septembre 1995$/)).toBeTruthy();
  });

  it("ouvre sur les cadrans puis mène à la grille en startWith=\"month\"", () => {
    // Le geste de l'image d'inspiration : on choisit le mois et l'année, on
    // applique, ET SEULEMENT ENSUITE on choisit le jour. Ce qui compte est
    // qu'« appliquer » ne valide PAS la valeur ici — il fait avancer d'une
    // étape, alors qu'en `granularity="month"` il conclut.
    const vues: Array<Date | null> = [];
    render(
      <DatePicker
        defaultValue={new Date(1995, 8, 12)}
        locale={fr}
        startWith="month"
        onValueChange={(v) => vues.push(v)}
        labels={{ changeMonth: "Choisir le mois et l'année", apply: "Appliquer" }}
      />,
    );
    ouvrir();

    // Le panneau s'ouvre sur les cadrans : aucune grille.
    expect(document.querySelectorAll('[role="listbox"]')).toHaveLength(2);
    expect(document.querySelector(".rdp-root")).toBeNull();

    fireEvent.click(screen.getByText("mars"));
    expect(enTete()).toBe("mars 1995");
    fireEvent.click(screen.getByRole("button", { name: "Appliquer" }));

    // Appliquer FAIT AVANCER : la grille de mars apparaît, rien n'est validé.
    expect(document.querySelector(".rdp-root")).toBeTruthy();
    expect(screen.getByLabelText(/ 1 mars 1995$/)).toBeTruthy();
    expect(vues).toHaveLength(0);

    fireEvent.click(screen.getByLabelText(/ 7 mars 1995$/));
    expect(vues).toHaveLength(1);
    expect(vues[0]?.getMonth()).toBe(2);
    expect(vues[0]?.getDate()).toBe(7);
  });

  it("garde « appliquer » conclusif en granularity=\"month\"", () => {
    // Le même bouton, deux conséquences. Celle-ci doit rester : appliquer
    // valide et referme, puisqu'il n'y a pas d'étape suivante.
    const vues: Array<Date | null> = [];
    render(
      <DatePicker
        defaultValue={new Date(1995, 8, 12)}
        locale={fr}
        granularity="month"
        onValueChange={(v) => vues.push(v)}
        labels={{ apply: "Appliquer" }}
      />,
    );
    ouvrir();
    fireEvent.click(screen.getByText("mars"));
    fireEvent.click(screen.getByRole("button", { name: "Appliquer" }));

    expect(vues).toHaveLength(1);
    expect(vues[0]?.getMonth()).toBe(2);
    expect(vues[0]?.getDate()).toBe(1);
  });

  it("n'annonce la valeur qu'au clic sur un jour", () => {
    const vues: Array<Date | null> = [];
    render(
      <DatePicker
        defaultValue={new Date(1995, 8, 12)}
        locale={fr}
        onValueChange={(v) => vues.push(v)}
        labels={{ changeMonth: "Choisir le mois et l'année" }}
      />,
    );
    ouvrir();
    // Feuilleter ne choisit rien.
    fireEvent.click(screen.getByRole("button", { name: /\+1$/ }));
    expect(vues).toHaveLength(0);

    fireEvent.click(screen.getByLabelText(/ 3 octobre 1995$/));
    expect(vues).toHaveLength(1);
    expect(vues[0]?.getMonth()).toBe(9);
    expect(vues[0]?.getDate()).toBe(3);
  });
});
