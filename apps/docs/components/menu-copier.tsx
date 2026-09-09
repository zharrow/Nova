"use client";

import { useState } from "react";
import { DropdownMenu } from "radix-ui";
import { Check, ChevronDown, Copy, X } from "lucide-react";

/**
 * Emporter la fiche ailleurs.
 *
 * Nova s'installe par copie, et la copie est de plus en plus faite par un
 * agent : `npx novaui add reveal` est tapé trois fois sur quatre par un outil
 * qui a d'abord lu la page. Or une page rendue est du bruit pour ce lecteur —
 * barre latérale, scènes animées, panneaux de réglages — et rien de ce qui
 * compte n'y est structuré.
 *
 * Ce menu donne donc la même fiche sous la forme que l'autre lecteur attend :
 * du markdown, à une adresse devinable (`/composants/<nom>.md`), et deux
 * raccourcis qui l'ouvrent directement dans une conversation.
 *
 * Radix tient le menu — clavier, focus, Échap, clic au-dehors — comme partout
 * ailleurs dans le dépôt. Nova n'ajoute rien : c'est du chrome, il ne s'anime
 * pas.
 */
export function MenuCopier({ nom, titre }: { nom: string; titre: string }) {
  const [etat, setEtat] = useState<"repos" | "copie" | "echec">("repos");

  const chemin = `/composants/${nom}.md`;

  /**
   * L'adresse absolue, lue au CLIC et non au rendu.
   *
   * Le composant est rendu côté serveur au build : `window` n'y existe pas, et
   * coder un domaine en dur ferait pointer les liens de la prévisualisation
   * vers la production.
   */
  function adresse(): string {
    return new URL(chemin, window.location.origin).toString();
  }

  async function copier() {
    try {
      const reponse = await fetch(chemin);
      if (!reponse.ok) throw new Error(String(reponse.status));
      await navigator.clipboard.writeText(await reponse.text());
      setEtat("copie");
    } catch {
      // L'API presse-papiers échoue hors contexte sécurisé, et le réseau peut
      // tomber : l'échec se dit, il ne s'avale pas. Laisser croire que la
      // copie a marché coûte plus cher que de l'annoncer.
      setEtat("echec");
    }
    setTimeout(() => setEtat("repos"), 2000);
  }

  function ouvrir(base: string) {
    const question = `Lis ${adresse()} et aide-moi à me servir du composant ${titre} de Nova.`;
    window.open(`${base}${encodeURIComponent(question)}`, "_blank", "noreferrer");
  }

  const ligne =
    "flex w-full cursor-default items-center gap-2.5 rounded-presse px-2.5 py-1.5 text-[13px] text-second outline-none transition-colors data-[highlighted]:bg-banc-haut data-[highlighted]:text-encre";

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger className="cote flex items-center gap-1 rounded-presse px-1.5 py-1 transition-colors hover:text-encre data-[state=open]:text-encre">
        {etat === "copie" ? (
          <Check className="size-3" aria-hidden />
        ) : etat === "echec" ? (
          <X className="size-3" aria-hidden />
        ) : (
          <Copy className="size-3" aria-hidden />
        )}
        {etat === "copie" ? "copié" : etat === "echec" ? "échec" : "emporter"}
        <ChevronDown className="size-3" aria-hidden />
      </DropdownMenu.Trigger>

      <DropdownMenu.Portal>
        <DropdownMenu.Content
          align="end"
          sideOffset={6}
          className="z-50 min-w-[13rem] rounded-plan border border-filet bg-banc p-1"
        >
          <DropdownMenu.Item className={ligne} onSelect={copier}>
            Copier la fiche en markdown
          </DropdownMenu.Item>
          <DropdownMenu.Item asChild className={ligne}>
            <a href={chemin} target="_blank" rel="noreferrer">
              Voir le markdown
            </a>
          </DropdownMenu.Item>
          <DropdownMenu.Separator className="my-1 h-px bg-filet" />
          <DropdownMenu.Item
            className={ligne}
            onSelect={() => ouvrir("https://claude.ai/new?q=")}
          >
            Ouvrir dans Claude
          </DropdownMenu.Item>
          <DropdownMenu.Item
            className={ligne}
            onSelect={() => ouvrir("https://chatgpt.com/?q=")}
          >
            Ouvrir dans ChatGPT
          </DropdownMenu.Item>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}
