import { llmsTxt } from "@/lib/markdown";

/**
 * L'index que les agents lisent en premier.
 *
 * Convention `llms.txt` : le fichier se trouve à la racine, il annonce ce
 * qu'est le projet, et il pointe vers une version markdown de chaque page.
 * Sans lui, chaque fiche `.md` reste une adresse qu'il faut connaître.
 */
export const dynamic = "force-static";

export async function GET(requete: Request) {
  const origine = new URL(requete.url).origin;
  return new Response(llmsTxt(origine), {
    headers: { "content-type": "text/plain; charset=utf-8" },
  });
}
