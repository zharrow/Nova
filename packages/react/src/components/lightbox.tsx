"use client";

import { useEffect, useRef, useState } from "react";
import { Dialog } from "radix-ui";
import { createBloom } from "@nova-ui/core/bloom";
import type { BloomInstance, BloomOptions } from "@nova-ui/core/bloom";

export interface LightboxProps extends Omit<BloomOptions, "origin"> {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /**
   * Point d'où la bulle jaillit, en coordonnées viewport. Typiquement
   * `{ x: event.clientX, y: event.clientY }` relevé au clic sur la vignette.
   */
  origin: { x: number; y: number } | null;
  /** Titre pour les technologies d'assistance. Une boîte modale doit se nommer. */
  title: string;
  children?: React.ReactNode;
  className?: string;
  overlayClassName?: string;
}

/**
 * Une visionneuse qui jaillit du point cliqué.
 *
 * La division est nette, et c'est la doctrine du dépôt : **Radix apporte la
 * sémantique, Nova apporte le geste.** Le piège de focus, la fermeture par
 * Échap, le verrou du défilement, l'ARIA, le portail, le retour du focus à ce
 * qui a ouvert : tout cela est le `Dialog` de Radix, et rien n'en est
 * réimplémenté ici. Nova ne fait que la bulle.
 *
 * ```tsx
 * <Lightbox
 *   open={ouvert}
 *   onOpenChange={setOuvert}
 *   origin={point}
 *   aspect={16 / 9}
 *   title="Verrière de l'atelier"
 * >
 *   <img data-nova-bloom-media src={src} alt="" />
 *   <figcaption data-nova-bloom-late>{legende}</figcaption>
 * </Lightbox>
 * ```
 */
export function Lightbox({
  open,
  onOpenChange,
  origin,
  title,
  children,
  className,
  overlayClassName,
  ...bloom
}: LightboxProps) {
  /**
   * Ce qui est RENDU. Diffère de `open` le temps de la fermeture : Radix
   * démonte son contenu dès que l'état passe à faux, et il n'y aurait alors
   * plus rien à animer. `forceMount` nous rend la main sur le démontage.
   */
  const [monte, setMonte] = useState(open);
  /**
   * Le panneau est tenu dans un ÉTAT, pas dans une ref.
   *
   * Le portail de Radix ne rend son contenu qu'au commit suivant : il attend
   * d'avoir un conteneur, qu'il pose lui-même dans un effet. À l'image où
   * `monte` passe à vrai, il n'y a donc encore aucun nœud — une ref resterait
   * nulle, et l'effet ne se rejouerait jamais puisque ses dépendances n'ont
   * plus bougé. Une ref de rappel stockée en état, elle, provoque un rendu
   * quand le nœud arrive.
   */
  const [panneau, setPanneau] = useState<HTMLDivElement | null>(null);
  const moteur = useRef<BloomInstance | null>(null);

  useEffect(() => {
    if (open) setMonte(true);
  }, [open]);

  useEffect(() => {
    if (!panneau || !open || !origin) return;
    const cree = createBloom(panneau, { ...bloom, origin });
    moteur.current = cree;
    cree.open();
    return () => {
      cree.destroy();
      moteur.current = null;
    };
    // Le geste dure une seconde : il ne se reconfigure pas en cours de route.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [panneau, open]);

  useEffect(() => {
    if (open || !monte) return;
    let vivant = true;
    const moteurCourant = moteur.current;
    if (!moteurCourant) {
      setMonte(false);
      return;
    }
    void moteurCourant.close().then(() => {
      if (vivant) setMonte(false);
    });
    return () => {
      vivant = false;
    };
  }, [open, monte]);

  return (
    <Dialog.Root open={monte} onOpenChange={(v) => !v && onOpenChange(false)}>
      <Dialog.Portal forceMount={monte ? true : undefined}>
        {monte ? (
          <>
            <Dialog.Overlay
              data-nova-bloom-veil
              className={overlayClassName}
              style={{ position: "fixed", inset: 0 }}
            />
            {/* Radix pose ses propres styles de positionnement sur le contenu
                d'une modale. Ici c'est le moteur qui écrit `position`, `top`,
                `left` et la taille image par image : on ne lui met donc rien
                dans les pattes. */}
            <Dialog.Content
              ref={setPanneau}
              className={className}
              aria-describedby={undefined}
            >
              <Dialog.Title
                style={{
                  position: "absolute",
                  width: 1,
                  height: 1,
                  overflow: "hidden",
                  clipPath: "inset(50%)",
                  whiteSpace: "nowrap",
                }}
              >
                {title}
              </Dialog.Title>
              {children}
            </Dialog.Content>
          </>
        ) : null}
      </Dialog.Portal>
    </Dialog.Root>
  );
}
