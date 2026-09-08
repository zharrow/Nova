import { cn } from "@/lib/utils";

/**
 * La marque de Nova.
 *
 * Posée en MASQUE, jamais en `<img>`. Le fichier livré est un raster noir sur
 * transparent : affiché tel quel il disparaîtrait sur le plan sombre, et il
 * faudrait servir deux fichiers et les faire basculer au thème. En masque,
 * seul le canal alpha est lu et la couleur vient de `currentColor` — un seul
 * fichier, les deux modes, et la marque hérite de la couleur du texte autour
 * d'elle comme n'importe quel glyphe.
 *
 * `nova-icon-512.png` plutôt que le logo complet : le lettrage du kit est un
 * grotesque géométrique arrondi, et la vitrine écrit ses titres en Bricolage
 * Grotesque. Poser le lettrage raster à côté mettrait deux voix
 * typographiques dans le même bandeau. La marque, elle, n'a pas de voix — on
 * la met à côté du mot composé dans la police du site.
 *
 * Le jour où le symbole est vectorisé proprement (le README du kit le
 * recommande), il remplace le masque ici et rien d'autre ne bouge.
 */
export function Marque({ className }: { className?: string }) {
  return (
    <span
      aria-hidden
      className={cn("inline-block shrink-0 bg-current", className)}
      style={{
        maskImage: "url(/nova-icon-512.png)",
        WebkitMaskImage: "url(/nova-icon-512.png)",
        maskSize: "contain",
        WebkitMaskSize: "contain",
        maskRepeat: "no-repeat",
        WebkitMaskRepeat: "no-repeat",
        maskPosition: "center",
        WebkitMaskPosition: "center",
      }}
    />
  );
}
