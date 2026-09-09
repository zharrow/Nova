import { readFileSync } from "node:fs";
import { describe, it, expect } from "vitest";
import {
  catalogue,
  familles,
  reglagesDe,
  trouverFiche,
  trouverFamille,
} from "../lib/catalogue";
import { codeVivant, verifierCouverture } from "../lib/code-vivant";

/**
 * Les invariants du catalogue.
 *
 * La vitrine n'avait aucun test, et c'était tenable tant qu'elle ne faisait
 * qu'afficher. Elle CALCULE désormais : le bloc d'usage d'une fiche est
 * réécrit avec la forme choisie et les valeurs des réglages. Cette réécriture
 * repose sur une règle que rien ne garantissait — tout réglage déclaré doit
 * apparaître dans l'exemple d'usage de sa famille — et une règle qu'on ne
 * vérifie pas se casse à la prochaine fiche ajoutée, en silence : le curseur
 * bouge, le code ne suit pas, et personne ne s'en aperçoit.
 */
describe("catalogue", () => {
  /* Ces invariants portent sur `familles` — tout ce qui est DÉCLARÉ — et non
     sur `catalogue`, qui n'en garde que les validées. Une règle qu'on ne
     vérifierait que sur les publiées se casserait pendant qu'une famille
     attend son tour, et sauterait au visage le jour de sa validation. */
  it("montre chaque réglage dans l'exemple d'usage de sa famille", () => {
    // La règle de `code-vivant` est la SUBSTITUTION SEULE : on remplace la
    // valeur d'une prop déjà écrite, jamais on n'en ajoute une — greffer une
    // prop dans une balise choisie au hasard produirait du code faux. La
    // contrepartie est cette contrainte-ci, et elle se vérifie.
    const trous = familles
      .map((fiche) => ({
        nom: fiche.nom,
        manque: verifierCouverture(fiche, reglagesDe(fiche.nom)),
      }))
      .filter((entree) => entree.manque.length > 0);

    expect(trous).toEqual([]);
  });

  it("déclare une prop de forme, ou des props par forme, pour chaque famille déclinée", () => {
    // Sans l'un des deux, le sélecteur de formes déplace la scène sans
    // déplacer le code : la fiche montrerait une forme et en documenterait une
    // autre.
    const muettes = familles
      .filter((fiche) => (fiche.formes?.length ?? 0) > 1)
      .filter(
        (fiche) =>
          !fiche.formeProp &&
          !fiche.formes!.every((forme) => forme.props !== undefined),
      )
      .map((fiche) => fiche.nom);

    expect(muettes).toEqual([]);
  });

  it("réécrit l'exemple avec la forme choisie et les réglages", () => {
    const reveal = trouverFamille("reveal")!;
    const fade = reveal.formes!.find((f) => f.id === "fade")!;

    const code = codeVivant(reveal, fade, { duration: 300, stagger: 200 });

    expect(code).toContain('variant="fade"');
    expect(code).toContain("duration={300}");
    expect(code).toContain("stagger={200}");
  });

  it("ne réécrit que la PREMIÈRE occurrence d'une prop", () => {
    // L'exemple de TextEffect aligne trois formes côte à côte : c'est le propre
    // d'une famille de les montrer ensemble, et choisir « flou » dans le
    // sélecteur ne doit pas réécrire les trois.
    const te = trouverFamille("text-effect")!;
    const blur = te.formes!.find((f) => f.id === "blur")!;

    const code = codeVivant(te, blur, {});

    expect(code).toContain('effect="blur"');
    expect(code).toContain('effect="wave"');
    expect(code).toContain('effect="reading"');
  });

  it("n'écrit jamais par-dessus une variable", () => {
    // `text={manifeste}` montre une composition, pas une valeur : y coller une
    // chaîne remplacerait un exemple qui apprend quelque chose par un exemple
    // qui ne veut plus rien dire.
    const te = trouverFamille("text-effect")!;

    const code = codeVivant(te, te.formes![0], { text: "Bonjour" });

    expect(code).toContain("text={manifeste}");
    expect(code).toContain('text="Bonjour"');
  });

  it("substitue aussi dans les options d'un crochet", () => {
    // Tout ce que Nova expose n'est pas un composant : `useFlight`,
    // `useConfetti` et `useExpand` prennent un objet d'options, et sans cette
    // branche leurs curseurs ne déplaçaient rien.
    const flight = trouverFamille("flight")!;

    const code = codeVivant(flight, undefined, { duration: 1200, arc: 0.5 });

    expect(code).toContain("duration: 1200");
    expect(code).toContain("arc: 0.5");
  });

  it("garde un nom, une accroche et un exemple sur chaque fiche", () => {
    for (const fiche of familles) {
      expect(fiche.nom, `${fiche.nom} : nom`).toMatch(/^[a-z][a-z-]*$/);
      expect(fiche.accroche.length, `${fiche.nom} : accroche`).toBeGreaterThan(10);
      expect(fiche.usage.length, `${fiche.nom} : usage`).toBeGreaterThan(10);
      expect(fiche.options.length, `${fiche.nom} : options`).toBeGreaterThan(0);
    }
  });
});

/**
 * Le garde-fou de publication.
 *
 * Une famille ne sort — sur le site comme par la CLI — que si quelqu'un a posé
 * `valide: true` sur elle. Ce n'est pas une préférence d'affichage : c'est ce
 * qui empêche un composant récolté la veille d'atterrir chez un utilisateur
 * avant d'avoir été relu. La règle tient à UN filtre dans `lib/catalogue.ts`,
 * donc elle tombe silencieusement si quelqu'un exporte le tableau brut.
 */
describe("publication", () => {
  it("ne publie que ce qui porte le drapeau", () => {
    const sorties = catalogue
      .filter((fiche) => fiche.valide !== true)
      .map((fiche) => fiche.nom);

    expect(sorties).toEqual([]);
  });

  it("laisse une famille non validée introuvable", () => {
    // Pas d'adresse secrète : `trouverFiche` est ce que la route de fiche et
    // la route markdown appellent, et son absence de réponse EST le 404.
    const candidate = familles.find((fiche) => fiche.valide !== true);
    if (!candidate) return; // Tout est validé : rien à vérifier ici.

    expect(trouverFiche(candidate.nom)).toBeUndefined();
    expect(trouverFamille(candidate.nom)).toBeDefined();
  });

  it("donne au registry une entrée pour chaque famille publiée", () => {
    // Le même contrôle existe dans `scripts/build-registry.ts`, qui refuse de
    // construire. Il est doublé ici parce qu'il est instantané, et qu'une
    // fiche en ligne dont `npx novaui add <nom>` échoue est le pire des deux
    // mondes : la page promet une commande que la CLI ne connaît pas.
    const manifeste = JSON.parse(
      readFileSync(
        new URL("../../../registry/registry.json", import.meta.url),
        "utf8",
      ),
    ) as { items: Array<{ name: string }> };

    const connues = new Set(manifeste.items.map((item) => item.name));
    const orphelines = catalogue
      .map((fiche) => fiche.nom)
      .filter((nom) => !connues.has(nom));

    expect(orphelines).toEqual([]);
  });
});
