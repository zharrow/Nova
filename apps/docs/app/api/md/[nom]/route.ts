import { catalogue, trouverFiche } from "@/lib/catalogue";
import { ficheEnMarkdown } from "@/lib/markdown";

/**
 * Une fiche, en markdown.
 *
 * Servie sous `/composants/<nom>.md` par une réécriture déclarée dans
 * `next.config.ts` : l'adresse doit être devinable depuis celle de la page,
 * parce que c'est ainsi que la convention se propage — on lit une page, on
 * ajoute `.md`, on obtient la source. Le gestionnaire, lui, vit sous `/api`
 * pour ne pas entrer en collision avec la route dynamique de la page.
 *
 * `text/plain` et non `text/markdown` : le second déclenche un
 * téléchargement dans certains navigateurs, et l'intérêt de « voir en
 * markdown » est justement de le LIRE dans l'onglet.
 */
export function generateStaticParams() {
  return catalogue.map((fiche) => ({ nom: fiche.nom }));
}

export async function GET(
  requete: Request,
  { params }: { params: Promise<{ nom: string }> },
) {
  const { nom } = await params;
  const fiche = trouverFiche(nom);
  if (!fiche) return new Response("Composant inconnu.\n", { status: 404 });

  const origine = new URL(requete.url).origin;
  return new Response(ficheEnMarkdown(fiche, origine), {
    headers: {
      "content-type": "text/plain; charset=utf-8",
      "cache-control": "public, max-age=0, must-revalidate",
    },
  });
}
