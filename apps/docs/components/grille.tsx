"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Demo } from "./demos";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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
  nouveau?: boolean;
}

/**
 * Grille « Tout parcourir ».
 *
 * Chaque carte porte une démonstration VIVANTE, pas une vignette : c'est ce
 * qui distingue un catalogue de composants d'une liste de liens. Le prix en
 * est réel — douze moteurs tournent sur cette page — d'où les garde-fous de
 * Nova, qui suspendent tout ce qui sort de l'écran.
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
    return cartes.filter((carte) => {
      if (categorie !== "toutes" && carte.categorie !== categorie) return false;
      if (!terme) return true;
      return (
        carte.titre.toLowerCase().includes(terme) ||
        carte.nom.includes(terme) ||
        carte.accroche.toLowerCase().includes(terme)
      );
    });
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

      <div className="mt-6 grid gap-8 sm:grid-cols-2 xl:grid-cols-3">
        {visibles.map((carte) => (
          <article key={carte.nom} className="group">
            <div className="relative">
              <Demo nom={carte.nom} compact />
              {carte.nouveau ? (
                <Badge className="absolute left-3 top-3 bg-signal px-2 py-0.5 font-mono text-[9px] uppercase tracking-wider text-white hover:bg-signal">
                  New
                </Badge>
              ) : null}
            </div>

            {/* Le lien couvre le titre ET la catégorie, pas la démonstration :
                celle-ci reste vivante et cliquable pour ce qu'elle est. Une
                surcouche sur toute la carte rendrait les boutons des démos
                inatteignables. */}
            <Link
              href={`/composants/${carte.nom}`}
              className="mt-4 block rounded-nova py-1 transition-colors hover:bg-surface/40"
            >
              <span className="flex items-baseline justify-between gap-3">
                <span className="text-[15px] font-medium tracking-tight">
                  {carte.titre}
                </span>
                {carte.formes > 1 ? (
                  <span className="cote shrink-0 text-signal">
                    {carte.formes} formes
                  </span>
                ) : null}
              </span>
              <span className="cote mt-1 block">{carte.categorieLabel}</span>
            </Link>
          </article>
        ))}
      </div>

      {visibles.length === 0 ? (
        <p className="mt-10 text-sourdine">
          Rien sous ce nom. Essayez une catégorie, ou videz la recherche.
        </p>
      ) : null}
    </>
  );
}
