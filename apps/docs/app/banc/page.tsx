import type { Metadata } from "next";
import { notFound } from "next/navigation";

/**
 * Le banc de test — hors vitrine, et hors production.
 *
 * C'est l'établi, pas une page du catalogue : on y règle un composant au-delà
 * des options curées de sa fiche, et on y essaie des brouillons qui ne sont
 * pas encore dans `packages/core`. Rien de tout cela n'a de sens pour un
 * visiteur, et un brouillon n'a pas encore prouvé les garde-fous du dépôt.
 *
 * `noindex` ne suffisait pas : il demande aux moteurs de ne pas indexer, il
 * n'empêche personne d'ouvrir l'adresse. En production la route répond 404.
 *
 * L'import du banc est DYNAMIQUE et logé dans la branche de développement, ce
 * qui n'est pas un détail de style : `process.env.NODE_ENV` est remplacé par
 * une constante au build, la branche devient morte, et le bundler retire avec
 * elle le code des brouillons. Un import en tête de fichier laissait la page
 * en 404 mais expédiait quand même l'établi dans les fichiers servis.
 */
export function generateMetadata(): Metadata {
  if (process.env.NODE_ENV === "production") return {};
  return {
    title: "Banc de test — Nova",
    robots: { index: false, follow: false },
  };
}

export default async function PageBanc() {
  if (process.env.NODE_ENV !== "production") {
    const { Banc } = await import("@/components/banc");
    return <Banc />;
  }
  notFound();
}
