"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { CarteFamille, type CarteCatalogue } from "./carte-famille";

export type { CarteCatalogue };

export interface GroupeCatalogue {
  id: string;
  label: string;
  /** Ce que la catégorie rassemble, en une phrase. */
  description: string;
  cartes: CarteCatalogue[];
}

/**
 * Le catalogue — un index par SECTIONS, pas une grille unique.
 *
 * Une grille d'un seul tenant forme un mur qu'on parcourt sans repère : on ne
 * sait ni où l'on est, ni ce qui reste. Rangées par catégorie, avec un titre et
 * une phrase qui dit ce que la catégorie rassemble, les mêmes cases deviennent
 * six listes courtes — et chacune se lit d'un regard.
 *
 * C'est aussi ce qui rend le filtre par catégorie inutile : les sections SONT
 * les catégories, et un menu qui refait ce que la page montre déjà est du
 * chrome. Seule la recherche textuelle reste, parce qu'elle traverse les
 * sections. Une section vidée par la recherche disparaît : un titre au-dessus
 * de rien est pire qu'une section absente.
 *
 * Chaque case porte une démonstration VIVANTE mais INERTE : le composant bouge,
 * il ne se manipule plus, et c'est ce qui permet au lien de couvrir la carte
 * entière. La vraie démonstration — réglable, avec sa télémétrie — est sur la
 * fiche. Voir DESIGN.md.
 */
export function Grille({ groupes }: { groupes: GroupeCatalogue[] }) {
  const [requete, setRequete] = useState("");

  const total = useMemo(
    () => groupes.reduce((n, groupe) => n + groupe.cartes.length, 0),
    [groupes],
  );

  const visibles = useMemo(() => {
    const terme = requete.trim().toLowerCase();
    if (!terme) return groupes;
    return groupes
      .map((groupe) => ({
        ...groupe,
        cartes: groupe.cartes.filter(
          (carte) =>
            carte.titre.toLowerCase().includes(terme) ||
            carte.nom.includes(terme) ||
            carte.accroche.toLowerCase().includes(terme),
        ),
      }))
      .filter((groupe) => groupe.cartes.length > 0);
  }, [groupes, requete]);

  const trouves = visibles.reduce((n, groupe) => n + groupe.cartes.length, 0);

  return (
    <>
      <div className="mt-8 flex max-w-md items-center gap-3">
        <label className="sr-only" htmlFor="recherche">
          Rechercher un composant
        </label>
        <Input
          id="recherche"
          type="search"
          value={requete}
          onChange={(event) => setRequete(event.target.value)}
          placeholder="Rechercher un composant…"
        />
        {/* Le compte n'apparaît QU'À la recherche, et il est calculé : c'est le
            seul endroit où un nombre apprend quelque chose, parce qu'il répond
            à ce qu'on vient de taper. */}
        {requete.trim() ? (
          <span className="shrink-0 text-sm text-second">
            {trouves} sur {total}
          </span>
        ) : null}
      </div>

      <div className="mt-12 space-y-14">
        {visibles.map((groupe) => (
          <section key={groupe.id} aria-labelledby={`groupe-${groupe.id}`}>
            <h2
              id={`groupe-${groupe.id}`}
              className="titre text-base font-semibold text-encre"
            >
              {groupe.label}
            </h2>
            <p className="mt-1 max-w-[68ch] text-second">{groupe.description}</p>

            {/* `min-w-0` sur chaque case : sans lui la colonne prend la largeur
                MIN-CONTENT de son contenu, et la piste d'un marquee (flex,
                nowrap) n'en a pas de raisonnable. Elle pousse la colonne, le
                moteur relit un conteneur plus large, duplique encore — la page
                finissait à 33 000 px de large sous 1024 px. */}
            <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
              {groupe.cartes.map((carte) => (
                <CarteFamille key={carte.nom} carte={carte} />
              ))}
            </div>
          </section>
        ))}
      </div>

      {visibles.length === 0 ? (
        <p className="mt-10 text-second">
          Rien sous ce nom. Videz la recherche pour revoir tout le catalogue.
        </p>
      ) : null}
    </>
  );
}
