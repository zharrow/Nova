import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

/**
 * Les tests de la vitrine.
 *
 * Ils ne rendent aucun composant : ils vérifient les INVARIANTS DU CATALOGUE,
 * qui sont du calcul pur — la couverture des réglages par les exemples
 * d'usage, et la réécriture du code par `code-vivant`. Pas de jsdom, donc, et
 * pas d'environnement à monter : c'est ce qui les rend instantanés, et ce qui
 * justifie qu'ils tournent à chaque `pnpm test`.
 */
export default defineConfig({
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./", import.meta.url)),
    },
  },
});
