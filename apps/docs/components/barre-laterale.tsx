"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export interface EntreeNav {
  nom: string;
  titre: string;
  formes: number;
  nouveau?: boolean;
}

export interface GroupeNav {
  id: string;
  label: string;
  entrees: EntreeNav[];
}

/**
 * Barre latérale de la documentation.
 *
 * Le filtre porte sur le titre ET sur le nom technique : on cherche aussi bien
 * « Text Effect » que `text-effect`, et c'est souvent le second qu'on a en
 * tête après avoir lu une commande d'installation.
 *
 * Le compte de formes est affiché à côté de chaque entrée : une famille du
 * catalogue n'est pas une pièce unique, et c'est l'endroit le plus tôt où le
 * dire. Voir VARIANTES.md.
 */
export function BarreLaterale({
  groupes,
  total,
}: {
  groupes: GroupeNav[];
  total: number;
}) {
  const [filtre, setFiltre] = useState("");
  const chemin = usePathname();

  const visibles = useMemo(() => {
    const requete = filtre.trim().toLowerCase();
    if (!requete) return groupes;
    return groupes
      .map((groupe) => ({
        ...groupe,
        entrees: groupe.entrees.filter(
          (entree) =>
            entree.titre.toLowerCase().includes(requete) ||
            entree.nom.includes(requete),
        ),
      }))
      .filter((groupe) => groupe.entrees.length > 0);
  }, [groupes, filtre]);

  return (
    <nav
      aria-label="Composants"
      className="flex h-full flex-col gap-6 overflow-y-auto pb-16 pr-2"
    >
      <div className="sticky top-0 z-10 bg-fond pt-6">
        <label className="sr-only" htmlFor="filtre-nav">
          Filtrer les composants
        </label>
        <Input
          id="filtre-nav"
          type="search"
          value={filtre}
          onChange={(event) => setFiltre(event.target.value)}
          placeholder={`Filtrer ${total} composants…`}
          className="h-9 text-[13px]"
        />
      </div>

      <div>
        <p className="cote mb-2.5">Démarrer</p>
        <ul className="space-y-0.5">
          <LienNav href="/composants" actif={chemin === "/composants"}>
            Tout parcourir
          </LienNav>
          <LienNav href="/installation" actif={chemin === "/installation"}>
            Installation
          </LienNav>
        </ul>
      </div>

      {visibles.map((groupe) => (
        <div key={groupe.id}>
          <p className="cote mb-2.5">{groupe.label}</p>
          <ul className="space-y-0.5">
            {groupe.entrees.map((entree) => (
              <LienNav
                key={entree.nom}
                href={`/composants/${entree.nom}`}
                actif={chemin === `/composants/${entree.nom}`}
              >
                {entree.titre}
                {entree.formes > 1 ? (
                  <span
                    className="ml-auto font-mono text-[10px] text-sourdine/70"
                    title={`${entree.formes} formes`}
                  >
                    {entree.formes}
                  </span>
                ) : null}
                {entree.nouveau ? (
                  <Badge
                    variant="secondary"
                    className="ml-1.5 bg-signal/12 px-1.5 py-0 font-mono text-[9px] uppercase tracking-wider text-signal"
                  >
                    New
                  </Badge>
                ) : null}
              </LienNav>
            ))}
          </ul>
        </div>
      ))}

      {visibles.length === 0 ? (
        <p className="text-[13px] text-sourdine">
          Rien sous ce nom. Le catalogue en compte {total}.
        </p>
      ) : null}
    </nav>
  );
}

function LienNav({
  href,
  actif,
  children,
}: {
  href: string;
  actif: boolean;
  children: React.ReactNode;
}) {
  return (
    <li>
      <Link
        href={href}
        aria-current={actif ? "page" : undefined}
        className={cn(
          "flex items-center gap-1 rounded-nova px-2 py-1.5 text-[13.5px] transition-colors",
          actif
            ? "bg-accent text-accent-foreground"
            : "text-muted-foreground hover:bg-accent/60 hover:text-foreground",
        )}
      >
        {children}
      </Link>
    </li>
  );
}
