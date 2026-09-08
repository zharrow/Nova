import {
  catalogue,
  CATEGORIES,
  libelleCategorie,
  nombreDeFormes,
  TOTAL_FORMES,
} from "@/lib/catalogue";
import { Grille, type CarteCatalogue } from "@/components/grille";

export const metadata = {
  title: "Composants — Nova",
  description:
    "Le catalogue Nova : composants animés extraits de projets en production.",
};

export default function ToutParcourir() {
  /* Le recensement est PLAFONNÉ à quatre. Le badge « New » était porté par
     quinze fiches sur vingt-et-une : un marqueur présent sur plus d'un tiers
     des éléments n'informe plus, il bruite. Voir DESIGN.md. */
  const recents = new Set(
    catalogue
      .filter((fiche) => fiche.nouveau)
      .slice(-4)
      .map((fiche) => fiche.nom),
  );

  const cartes: CarteCatalogue[] = catalogue.map((fiche) => ({
    nom: fiche.nom,
    titre: fiche.titre,
    accroche: fiche.accroche,
    categorie: fiche.categorie,
    categorieLabel: libelleCategorie(fiche.categorie),
    formes: nombreDeFormes(fiche),
    geometrie: fiche.geometrie ?? "carre",
    recent: recents.has(fiche.nom),
  }));

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <h1 className="titre text-4xl sm:text-5xl">Tout parcourir</h1>
        <p className="cote pb-1.5">
          {catalogue.length} familles · {TOTAL_FORMES} formes
        </p>
      </div>

      <p className="mt-4 max-w-[62ch] leading-relaxed text-prose">
        Une entrée du catalogue est une <b className="text-encre">famille</b>,
        pas une pièce unique : la plupart se déclinent en plusieurs formes, soit
        par une prop, soit par une autre façon de s&apos;en servir. L&apos;emprise
        d&apos;une case vient de la géométrie de son mouvement — une bande pour
        ce qui défile, un carré pour ce qui rayonne.
      </p>

      <Grille cartes={cartes} categories={[...CATEGORIES]} />
    </>
  );
}
