import { catalogue, CATEGORIES } from "@/lib/catalogue";
import { Grille, type GroupeCatalogue } from "@/components/grille";
import { carteDe } from "@/components/carte-famille";
import { BlocCode } from "@/components/bloc-code";

export const metadata = {
  title: "Composants — Nova",
  description:
    "Le catalogue Nova : des composants animés en TypeScript, copiés dans votre projet.",
};

/**
 * L'index du catalogue.
 *
 * Un en-tête, puis une section par catégorie. Pas de compte global affiché :
 * le catalogue grossit à chaque composant récolté, et un nombre écrit dans une
 * phrase se périme à la ligne suivante — on passait plus de temps à le mettre à
 * jour qu'il n'apprenait au lecteur. Le seul compte qui reste est celui que la
 * recherche calcule, parce qu'il répond à ce qu'on vient de taper, et celui de
 * chaque carte, qui est une propriété de la famille et non du catalogue.
 */
export default function ToutParcourir() {
  /* Le recensement est PLAFONNÉ à quatre. Le badge « New » était porté par plus
     d'un tiers des fiches : un marqueur si fréquent n'informe plus, il bruite.
     Voir DESIGN.md. */
  const recents = new Set(
    catalogue
      .filter((fiche) => fiche.nouveau)
      .slice(-4)
      .map((fiche) => fiche.nom),
  );

  const groupes: GroupeCatalogue[] = CATEGORIES.map((categorie) => ({
    id: categorie.id,
    label: categorie.label,
    description: categorie.description,
    cartes: catalogue
      .filter((fiche) => fiche.categorie === categorie.id)
      .map((fiche) => carteDe(fiche, { recent: recents.has(fiche.nom) })),
  })).filter((groupe) => groupe.cartes.length > 0);

  return (
    <>
      <h1 className="titre text-2xl">Les composants de Nova</h1>

      <p className="mt-3 max-w-[68ch] leading-relaxed text-prose">
        Des composants animés en TypeScript, récoltés dans des projets en
        production. Une seule boucle d&apos;animation pour toute la page,
        l&apos;état par défaut toujours visible, et un{" "}
        <code className="valeur text-encre">destroy()</code> qui rend
        l&apos;élément exactement comme il était. La source atterrit dans votre
        projet : vous la possédez.
      </p>

      <p className="mt-3 max-w-[68ch] leading-relaxed text-prose">
        Une entrée est une <b className="text-encre">famille</b>, pas une pièce
        unique : la plupart se déclinent en plusieurs formes, soit par une prop,
        soit par une autre façon de s&apos;en servir.
      </p>

      {/* La commande plutôt qu'un bouton « explorer » : ce que le visiteur
          vient chercher, c'est la ligne à coller. Leur équivalent mène à une
          ancre sur la même page, ce qui ne fait rien avancer. */}
      <div className="mt-6 max-w-md">
        <BlocCode langue="terminal" code="npx novaui init" />
      </div>

      {groupes.length > 0 ? (
        <Grille groupes={groupes} />
      ) : (
        /* Le cas d'un catalogue entièrement en attente. Il n'est pas
           théorique : une famille ne sort que si quelqu'un a posé
           `valide: true` sur elle, et l'état de départ est « aucune ». Une
           grille vide laisserait croire à une panne — on dit donc ce qui se
           passe, sans transformer la page en formulaire d'excuse. */
        <p className="mt-10 max-w-[62ch] border-t border-filet pt-6 leading-relaxed text-second">
          Aucune famille n&apos;est publiée pour l&apos;instant. Le catalogue
          n&apos;expose que ce qui a été relu et validé une pièce à la fois ;
          le reste attend son tour.
        </p>
      )}
    </>
  );
}
