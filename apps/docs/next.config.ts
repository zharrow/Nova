import type { NextConfig } from "next";

/**
 * `/banc` en production : un interrupteur, pas une constante.
 *
 * Le banc était fermé par `NODE_ENV`, ce qui le rendait injoignable ailleurs
 * que sur la machine qui fait tourner le serveur de développement. C'est
 * précisément le cas où l'on en a besoin : on regarde un composant depuis un
 * autre appareil, et la seule adresse qui existe est celle du déploiement.
 *
 * Le drapeau est lu ICI, au build, et republié en constante par `env` : c'est
 * ce qui préserve la propriété qui comptait dans l'ancienne garde. La branche
 * fermée devient morte à la compilation, et le bundler emporte avec elle le
 * code des brouillons — un import en tête de fichier laissait la page en 404
 * mais expédiait quand même l'établi.
 *
 * Ouvert par défaut, donc, et `NOVA_BANC=0` le referme depuis les variables
 * d'environnement du déploiement, sans toucher au code ni attendre une
 * relecture. Ce qui reste vrai dans les deux cas : aucune navigation n'y mène
 * et la page porte `noindex`.
 */
const banc = process.env.NOVA_BANC === "0" ? "0" : "1";

const config: NextConfig = {
  // Les paquets Nova sont consommés depuis la source du monorepo : le site
  // teste donc toujours le code qui vient d'être écrit, pas un build figé.
  transpilePackages: ["@nova-ui/core", "@nova-ui/react"],

  /* Inliné au build. `process.env.NOVA_BANC` devient un littéral dans les
     bundles, et c'est ce qui permet à la branche fermée de disparaître. */
  env: { NOVA_BANC: banc },

  /**
   * `/composants/<nom>.md` sert la fiche en markdown.
   *
   * L'adresse doit être DEVINABLE depuis celle de la page : on lit une fiche,
   * on ajoute `.md`, on obtient la source. C'est la convention que suivent les
   * documentations lues par des agents, et elle ne vaut que si elle se devine
   * — une adresse qu'il faut chercher n'est utilisée par personne.
   *
   * Une réécriture plutôt qu'une route : un segment de dossier App Router est
   * soit littéral, soit entièrement dynamique, jamais `[nom].md`. Le
   * gestionnaire vit donc sous `/api/md/[nom]`, où il n'entre pas en collision
   * avec la page.
   */
  async rewrites() {
    return [{ source: "/composants/:nom.md", destination: "/api/md/:nom" }];
  },
};

export default config;
