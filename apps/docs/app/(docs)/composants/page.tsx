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
  const cartes: CarteCatalogue[] = catalogue.map((fiche) => ({
    nom: fiche.nom,
    titre: fiche.titre,
    accroche: fiche.accroche,
    categorie: fiche.categorie,
    categorieLabel: libelleCategorie(fiche.categorie),
    formes: nombreDeFormes(fiche),
    nouveau: fiche.nouveau,
  }));

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <h1 className="text-4xl font-medium tracking-tight sm:text-5xl">
          Tout parcourir
        </h1>
        <p className="cote pb-1.5">
          {catalogue.length} familles · {TOTAL_FORMES} formes
        </p>
      </div>

      <p className="mt-4 max-w-[62ch] text-[15px] leading-relaxed text-sourdine">
        Une entrée du catalogue est une <b className="text-encre">famille</b>,
        pas une pièce unique : la plupart se déclinent en plusieurs formes, soit
        par une prop, soit par une autre façon de s&apos;en servir. Le compte
        est indiqué sur chaque carte.
      </p>

      <Grille cartes={cartes} categories={[...CATEGORIES]} />
    </>
  );
}
