import type { NextConfig } from "next";

const config: NextConfig = {
  // Les paquets Nova sont consommés depuis la source du monorepo : le site
  // teste donc toujours le code qui vient d'être écrit, pas un build figé.
  transpilePackages: ["@nova-ui/core", "@nova-ui/react"],
};

export default config;
