"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Demo, type Geometrie } from "./demos";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export interface CarteCatalogue {
  nom: string;
  titre: string;
  accroche: string;
  categorie: string;
  categorieLabel: string;
  formes: number;
  geometrie: Geometrie;
  /** Parmi les quatre entrées les plus récentes. Voir le recensement. */
  recent?: boolean;
}

/** L'emprise d'une case, en colonnes sur une grille de 6. */
const COLONNES: Record<Geometrie, number> = {
  bande: 6,
  bloc: 3,
  carre: 2,
  champ: 6,
};

const EMPRISE: Record<number, string> = {
  2: "sm:col-span-2",
  3: "sm:col-span-3",
  6: "sm:col-span-6",
};

type Posee = { carte: CarteCatalogue; colonnes: number };

/**
 * Compose des RANGÉES COMPLÈTES au lieu de laisser l'auto-placement deviner.
 *
 * Le problème est arithmétique : dans une grille de 6, `3 + 3` tombe juste et
 * `2 + 2 + 2` aussi, mais `3 + 2` fait 5 et laisse une colonne vide. Comme les
 * familles arrivent dans l'ordre du catalogue, les demies et les tiers se
 * mélangeaient en permanence. `grid-auto-flow: dense` rebouchait au hasard :
 * il cassait l'ordre de lecture SANS supprimer les trous, et laissait un bord
 * droit en dents de scie.
 *
 * On groupe donc par emprise — les blocs par deux, les carrés par trois, les
 * bandes seules — puis on intercale pour que les six bandes ne s'empilent pas
 * d'affilée. Le reliquat est PROMU à une emprise plus large plutôt que de
 * laisser un trou : c'est la seule entorse à la géométrie déclarée, et elle ne
 * touche que la fin de chaque groupe.
 */
function ranger(cartes: CarteCatalogue[]): Posee[] {
  const bandes = cartes.filter((c) => c.geometrie === "bande");
  const blocs = cartes.filter((c) => c.geometrie === "bloc");
  const carres = cartes.filter((c) => c.geometrie === "carre");

  const rangees: Posee[][] = [];

  for (let i = 0; i + 1 < blocs.length; i += 2) {
    rangees.push([
      { carte: blocs[i]!, colonnes: 3 },
      { carte: blocs[i + 1]!, colonnes: 3 },
    ]);
  }
  // Un bloc orphelin prend la largeur entière : mieux vaut une bande de plus
  // qu'une demi-rangée vide.
  if (blocs.length % 2 === 1) {
    rangees.push([{ carte: blocs[blocs.length - 1]!, colonnes: 6 }]);
  }

  for (let i = 0; i + 2 < carres.length; i += 3) {
    rangees.push([
      { carte: carres[i]!, colonnes: 2 },
      { carte: carres[i + 1]!, colonnes: 2 },
      { carte: carres[i + 2]!, colonnes: 2 },
    ]);
  }
  const resteCarres = carres.length % 3;
  if (resteCarres === 1) {
    rangees.push([{ carte: carres[carres.length - 1]!, colonnes: 6 }]);
  } else if (resteCarres === 2) {
    rangees.push([
      { carte: carres[carres.length - 2]!, colonnes: 3 },
      { carte: carres[carres.length - 1]!, colonnes: 3 },
    ]);
  }

  // Intercalage : une bande toutes les deux rangées, pour qu'elles ne
  // s'empilent pas les unes sur les autres comme le faisait l'ordre brut.
  const sortie: Posee[] = [];
  let prochaineBande = 0;
  rangees.forEach((rangee, index) => {
    sortie.push(...rangee);
    if (index % 2 === 1 && prochaineBande < bandes.length) {
      sortie.push({ carte: bandes[prochaineBande++]!, colonnes: 6 });
    }
  });
  while (prochaineBande < bandes.length) {
    sortie.push({ carte: bandes[prochaineBande++]!, colonnes: 6 });
  }
  return sortie;
}

/**
 * Grille « Tout parcourir » — un plan disséqué, pas vingt-et-un objets.
 *
 * Chaque case porte une démonstration VIVANTE, pas une vignette : c'est ce
 * qui distingue un catalogue de composants d'une liste de liens. Le prix en
 * est réel — douze moteurs tournent sur cette page — d'où les garde-fous de
 * Nova, qui suspendent tout ce qui sort de l'écran.
 *
 * L'emprise de chaque case vient de la GÉOMÉTRIE DE SON MOUVEMENT : une bande
 * pour ce qui défile, un carré pour ce qui rayonne. La forme de la case
 * annonce la nature de l'effet avant qu'on lise l'étiquette. Voir DESIGN.md.
 *
 * La recherche porte sur le titre, le nom technique et l'accroche : on cherche
 * autant « défilement » que « marquee ».
 */
export function Grille({
  cartes,
  categories,
}: {
  cartes: CarteCatalogue[];
  categories: Array<{ id: string; label: string }>;
}) {
  const [requete, setRequete] = useState("");
  const [categorie, setCategorie] = useState("toutes");

  const visibles = useMemo(() => {
    const terme = requete.trim().toLowerCase();
    const gardees = cartes.filter((carte) => {
      if (categorie !== "toutes" && carte.categorie !== categorie) return false;
      if (!terme) return true;
      return (
        carte.titre.toLowerCase().includes(terme) ||
        carte.nom.includes(terme) ||
        carte.accroche.toLowerCase().includes(terme)
      );
    });
    // Le rangement se refait à chaque filtrage : une recherche qui ne laisse
    // que trois carrés doit produire une rangée pleine, pas trois orphelins.
    return ranger(gardees);
  }, [cartes, requete, categorie]);

  return (
    <>
      <div className="mt-8 flex flex-wrap items-center gap-3">
        <div className="relative min-w-[200px] flex-1">
          <label className="sr-only" htmlFor="recherche">
            Rechercher un composant
          </label>
          <Input
            id="recherche"
            type="search"
            value={requete}
            onChange={(event) => setRequete(event.target.value)}
            placeholder="Rechercher…"
          />
        </div>

        {/* Radix plutôt qu'un `<select>` natif : le natif ne se met pas en
            forme, et son chevron doit être redessiné à la main dès qu'on lui
            retire son apparence système. */}
        <Select value={categorie} onValueChange={setCategorie}>
          <SelectTrigger className="w-[220px]" aria-label="Filtrer par catégorie">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="toutes">Toutes les catégories</SelectItem>
            {categories.map((c) => (
              <SelectItem key={c.id} value={c.id}>
                {c.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <p className="cote mt-4">
        {visibles.length} sur {cartes.length}
      </p>

      {/* `min-w-0` sur chaque case : sans lui la colonne prend la largeur
          MIN-CONTENT de son contenu, et la piste d'un marquee (flex, nowrap)
          n'en a pas de raisonnable. Elle pousse la colonne, le moteur relit un
          conteneur plus large, duplique encore — la page finissait à 33 000 px
          de large sous 1024 px. */}
      {/* Pas de `grid-auto-flow: dense` : les rangées sont composées par
          `ranger`, donc elles tombent juste. Le laisser réintroduirait un
          réordonnancement invisible par-dessus le tri. */}
      <div className="mt-6 grid grid-cols-1 gap-2.5 sm:grid-cols-6">
        {visibles.map(({ carte, colonnes }) => (
          <article
            key={carte.nom}
            className={[
              "group flex min-w-0 flex-col overflow-hidden rounded-plan border border-filet bg-banc transition-colors hover:border-filet-vif",
              EMPRISE[colonnes],
            ].join(" ")}
          >
            <div className="min-w-0 flex-1">
              {/* La géométrie DÉCLARÉE pilote la hauteur, pas l'emprise
                  effective : un carré promu à la pleine largeur reste un
                  carré, il ne doit pas s'aplatir en bande. */}
              <Demo nom={carte.nom} compact geometrie={carte.geometrie} />
            </div>

            {/* L'étiquette est DANS la case, sur un filet qui traverse toute
                sa largeur : il n'y a donc aucun chrome hors scène. Le lien ne
                couvre pas la démonstration — une surcouche rendrait ses
                boutons inatteignables. */}
            <Link
              href={`/composants/${carte.nom}`}
              className="flex items-baseline justify-between gap-3 border-t border-filet px-4 py-2.5 transition-colors group-hover:border-filet-vif"
            >
              <span className="truncate text-sm font-semibold text-second transition-colors group-hover:text-encre">
                {carte.titre}
                {/* Le recensement remplace le badge : un carré de 3 px au bout
                    du nom. Un badge porté par quinze fiches sur vingt-et-une
                    n'informait plus, il bruitait. */}
                {carte.recent ? (
                  <span
                    className="ml-2 inline-block size-[3px] align-middle bg-signal"
                    aria-hidden
                  />
                ) : null}
              </span>
              <span className="cote shrink-0">
                {carte.categorieLabel}
                {carte.formes > 1 ? ` · ${carte.formes}` : ""}
              </span>
            </Link>
          </article>
        ))}
      </div>

      {visibles.length === 0 ? (
        <p className="mt-10 text-second">
          Rien sous ce nom. Essayez une catégorie, ou videz la recherche.
        </p>
      ) : null}
    </>
  );
}
