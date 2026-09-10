import type { Metadata } from "next";
import { notFound } from "next/navigation";

/**
 * Le banc de test — hors vitrine, et joignable partout.
 *
 * C'est l'établi, pas une page du catalogue : on y règle un composant au-delà
 * des options curées de sa fiche, on y parcourt ses formes, et on y essaie des
 * brouillons qui ne sont pas encore dans `packages/core`.
 *
 * IL ÉTAIT FERMÉ EN PRODUCTION, ET NE L'EST PLUS. La garde tenait sur
 * `NODE_ENV`, ce qui revenait à dire « le banc n'existe que sur la machine qui
 * compile ». Or c'est exactement le cas où l'on en a besoin : regarder un
 * geste depuis un autre appareil, où la seule adresse qui existe est celle du
 * déploiement. Un outil qu'on ne peut pas ouvrir là où l'on regarde n'est pas
 * un outil.
 *
 * Ce qui reste : la page n'est liée depuis aucune navigation, elle porte
 * `noindex`, et `NOVA_BANC=0` la referme depuis les variables d'environnement
 * du déploiement — voir `next.config.ts`. `noindex` seul ne suffirait pas à
 * fermer quoi que ce soit : il demande aux moteurs de ne pas indexer, il
 * n'empêche personne d'ouvrir l'adresse. Le drapeau, lui, ferme.
 *
 * L'import du banc est DYNAMIQUE et logé dans la branche ouverte, ce qui n'est
 * pas un détail de style : `process.env.NOVA_BANC` est remplacé par une
 * constante au build, la branche fermée devient morte, et le bundler retire
 * avec elle le code des brouillons. Un import en tête de fichier laissait la
 * page en 404 mais expédiait quand même l'établi.
 */
export function generateMetadata(): Metadata {
  if (process.env.NOVA_BANC !== "1") return {};
  return {
    title: "Banc de test — Nova",
    robots: { index: false, follow: false },
  };
}

export default async function PageBanc() {
  if (process.env.NOVA_BANC === "1") {
    const { Banc } = await import("@/components/banc");
    return <Banc />;
  }
  notFound();
}
