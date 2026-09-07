"use client";

import { createHalftone } from "@nova-ui/core";
import type { HalftoneOptions } from "@nova-ui/core";
import { useNovaEngine } from "../hooks/use-nova-engine";

export interface HalftoneProps
  extends HalftoneOptions,
    Omit<React.ComponentPropsWithoutRef<"canvas">, "color"> {
  /**
   * Description de l'image pour les technologies d'assistance. Un canvas est
   * muet : sans elle, la trame n'existe pas pour un lecteur d'écran.
   * Passer une chaîne vide déclare l'image décorative.
   */
  alt: string;
}

/**
 * Trame d'imprimeur : une grille de modules dont la taille dit la valeur.
 *
 * La source peut être une image, un canvas déjà peint, ou une fonction de
 * couverture pour les formes calculées. Une image d'une autre origine doit
 * être servie avec un en-tête CORS, sinon le canvas est teinté et sa lecture
 * refusée.
 *
 * `pointerBoost` fait grossir les modules sous le curseur — et n'ouvre une
 * boucle que pendant le geste.
 */
export function Halftone({
  alt,
  source,
  cols,
  rows,
  steps,
  bleed,
  gamma,
  floor,
  shape,
  color,
  channel,
  invert,
  pointerBoost,
  pointerRadius,
  onReady,
  ...rest
}: HalftoneProps) {
  const ref = useNovaEngine<HTMLCanvasElement, HalftoneOptions>(createHalftone, {
    source,
    cols,
    rows,
    steps,
    bleed,
    gamma,
    floor,
    shape,
    color,
    channel,
    invert,
    pointerBoost,
    pointerRadius,
    onReady,
  });

  return (
    <canvas
      ref={ref}
      role={alt === "" ? "presentation" : "img"}
      aria-label={alt === "" ? undefined : alt}
      aria-hidden={alt === "" ? true : undefined}
      {...rest}
    />
  );
}
