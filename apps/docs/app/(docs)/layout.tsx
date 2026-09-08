import { BarreLaterale, type GroupeNav } from "@/components/barre-laterale";
import { catalogue, parCategorie, nombreDeFormes } from "@/lib/catalogue";

/**
 * Coque de la documentation : barre latérale fixe à gauche, contenu à droite.
 *
 * La barre est construite ici, côté serveur, à partir du catalogue ; seul le
 * filtre est client. Elle disparaît sous 1024 px, où le contenu prend toute la
 * largeur — une colonne de navigation de 260 px sur un téléphone mangerait la
 * page qu'elle sert à atteindre.
 */
export default function DocsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  /* Plafonné à quatre, comme dans la grille : un marqueur porté par plus d'un
     tiers des entrées n'informe plus. Voir DESIGN.md. */
  const recents = new Set(
    catalogue
      .filter((fiche) => fiche.nouveau)
      .slice(-4)
      .map((fiche) => fiche.nom),
  );

  const groupes: GroupeNav[] = parCategorie().map((groupe) => ({
    id: groupe.id,
    label: groupe.label,
    entrees: groupe.fiches.map((fiche) => ({
      nom: fiche.nom,
      titre: fiche.titre,
      formes: nombreDeFormes(fiche),
      nouveau: recents.has(fiche.nom),
    })),
  }));

  return (
    <div className="mx-auto flex w-full max-w-[1400px] gap-10 px-6">
      <aside className="sticky top-14 hidden h-[calc(100dvh-3.5rem)] w-[248px] shrink-0 border-r border-filet lg:block">
        <BarreLaterale groupes={groupes} total={catalogue.length} />
      </aside>
      <div className="min-w-0 flex-1 py-12">{children}</div>
    </div>
  );
}
