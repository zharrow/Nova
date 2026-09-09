import Link from "next/link";
import { Demo, type Geometrie } from "./demos";
import { dependancesDe, nombreDeFormes, type Fiche } from "@/lib/catalogue";

export interface CarteCatalogue {
  nom: string;
  titre: string;
  accroche: string;
  categorie: string;
  categorieLabel: string;
  formes: number;
  geometrie: Geometrie;
  /** Ce que la CLI installe en plus. Vide quand le moteur suffit. */
  deps: string[];
  /** Parmi les quatre entrées les plus récentes. Voir le recensement. */
  recent?: boolean;
  /**
   * Ce que la seconde ligne raconte, quand ce n'est pas le compte de formes.
   *
   * L'accueil met en avant trois familles hors de leur section : la catégorie
   * y est l'information utile, alors que dans le catalogue elle est déjà le
   * titre de la section qui contient la carte.
   */
  legende?: string;
}

/** Une carte à partir d'une fiche du catalogue. */
export function carteDe(
  fiche: Fiche,
  options: { recent?: boolean; legende?: string } = {},
): CarteCatalogue {
  return {
    nom: fiche.nom,
    titre: fiche.titre,
    accroche: fiche.accroche,
    categorie: fiche.categorie,
    categorieLabel: fiche.categorie,
    formes: nombreDeFormes(fiche),
    geometrie: fiche.geometrie ?? "carre",
    deps: dependancesDe(fiche.nom),
    recent: options.recent,
    legende: options.legende,
  };
}

/**
 * Une carte de famille — la même partout : catalogue, accueil, affiche.
 *
 * Trois traitements pour le même objet à trois endroits du site apprendraient
 * au visiteur qu'il regarde trois choses différentes. Il n'y en a donc qu'un,
 * et il vit ici plutôt que dans la grille : l'accueil s'en sert aussi.
 *
 * La carte est UNE SEULE BOÎTE : cadre et étiquette dedans, pas l'un dans un
 * cadre et l'autre posée sur le fond de la page. C'est ce qui la fait lire
 * comme un objet unique, et ce qui justifie que le lien la couvre entière.
 *
 * Trois plans emboîtés, chacun avec son rayon :
 *
 * - la CARTE — rayon 12 px, fond de scène, un anneau INTERNE de 1 px. Interne
 *   et non une bordure : une bordure ajouterait un pixel à la boîte, et les
 *   cartes d'une rangée ne mesureraient plus tout à fait pareil ;
 * - l'APERÇU — niché à 4 px sur trois côtés, RIEN en bas : c'est l'étiquette
 *   qui ferme la carte, et un quatrième côté de gouttière ferait flotter le
 *   cadre au milieu au lieu de le poser sur son texte. Rayon 8 px, filet
 *   propre, et une PROPORTION de 1,92 plutôt qu'une hauteur — la carte donne
 *   la mesure, la scène la remplit ;
 * - l'ÉTIQUETTE — 12 px de haut, 16 px de côté, deux lignes de 12 px.
 *
 * Le survol change le FOND DE LA CARTE, pas la couleur du filet. L'aperçu, lui,
 * garde le sien : c'est une scène, elle ne doit pas se teinter parce que le
 * pointeur passe.
 *
 * La démonstration est INERTE — présentée, pas manipulable. C'est ce qui permet
 * au lien de couvrir la carte entière : une ancre qui envelopperait un bouton
 * imbriquerait deux éléments interactifs, ce que HTML interdit. La vraie
 * démonstration, réglable, est sur la fiche. Voir DESIGN.md.
 *
 * Les deux lignes de légende sont en sans, pas en chasse fixe capitale. C'est
 * une exception assumée à la règle « un chiffre est toujours en mono » :
 * celle-ci sert les valeurs qu'on COMPARE — télémétrie, tableau d'options,
 * code — et une légende capitale et espacée sous chaque cadre fabriquait une
 * rangée de plaques signalétiques là où on veut une légende qu'on lit une fois.
 */
export function CarteFamille({ carte }: { carte: CarteCatalogue }) {
  const formes = carte.formes > 1 ? `${carte.formes} formes` : "1 forme";
  const legende =
    carte.legende ??
    `${formes}${carte.deps.length > 0 ? ` · ${carte.deps.join(", ")}` : ""}`;

  return (
    <Link
      href={`/composants/${carte.nom}`}
      className="group block min-w-0 rounded-[12px] bg-banc ring-1 ring-inset ring-filet transition-colors duration-100 hover:bg-banc-haut focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-signal"
    >
      <div className="px-1 pt-1">
        <div className="relative aspect-[1.92] w-full overflow-hidden rounded-[8px] bg-banc outline-1 -outline-offset-1 outline-filet">
          <Demo nom={carte.nom} compact inerte geometrie={carte.geometrie} />
        </div>
      </div>

      <div className="px-4 py-3">
        <p className="truncate text-xs font-semibold text-encre">
          {carte.titre}
          {/* Le recensement remplace le badge : un carré de 3 px au bout du
              nom. Un badge porté par plus d'un tiers des fiches n'informait
              plus, il bruitait. */}
          {carte.recent ? (
            <span
              className="ml-2 inline-block size-[3px] align-middle bg-signal"
              aria-hidden
            />
          ) : null}
        </p>
        {/* La dépendance ne se dit que si elle EXISTE. La plupart des familles
            n'en ont aucune : affiché partout, « aucune dépendance » cesse
            d'informer. L'absence se lit sur la fiche, où elle a la place
            d'être une phrase. */}
        <p className="truncate text-xs text-second">{legende}</p>
      </div>
    </Link>
  );
}
