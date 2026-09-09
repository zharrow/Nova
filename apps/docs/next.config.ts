import type { NextConfig } from "next";

const config: NextConfig = {
  // Les paquets Nova sont consommés depuis la source du monorepo : le site
  // teste donc toujours le code qui vient d'être écrit, pas un build figé.
  transpilePackages: ["@nova-ui/core", "@nova-ui/react"],

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
