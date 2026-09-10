"use client";

import type { ReactNode } from "react";
import { createLoader } from "@nova-ui/core";
import type { LoaderOptions } from "@nova-ui/core";
import { useNovaEngine } from "../hooks/use-nova-engine";

export interface LoaderProps
  extends LoaderOptions,
    Omit<React.ComponentPropsWithoutRef<"div">, "onProgress"> {
  children?: ReactNode;
}

/**
 * Le rideau d'ouverture, en quatorze formes.
 *
 * À monter une seule fois, dans le layout racine. Les enfants sont le contenu
 * du rideau — un logo, un filet, une légende ; la forme `greetings` y ajoute
 * elle-même le mot d'accueil.
 *
 * `until` est ce qui fait la différence entre un rideau et un loader : sans
 * lui le voile joue une durée fixe et se trompe forcément — il fait patienter
 * une page prête, ou se lève sur une page trouée. Avec lui, il attend ce qu'il
 * faut, jamais moins de `minMs`, jamais plus de `maxMs`.
 *
 * ```tsx
 * <Loader
 *   form="diagonal"
 *   until={["fonts", "images"]}
 *   onReveal={() => setPret(true)}
 * />
 * ```
 *
 * `until` est lu au montage et une seule fois : passer une promesse construite
 * dans le rendu ne la ré-armera pas, et c'est voulu — un rideau ne change pas
 * d'avis sur ce qu'il attend. Pour une promesse qui doit naître au démarrage,
 * passer une fonction plutôt que son résultat.
 *
 * Cinq garanties : il se saute à la première interaction, il ne rejoue pas
 * dans la même session, il n'existe pas en `prefers-reduced-motion`, aucune
 * attente n'y est infinie, et sans JavaScript il n'y a pas de rideau du tout —
 * donc jamais de page bloquée derrière un voile qui ne se lèvera pas.
 */
export function Loader({
  children,
  form,
  blades,
  greetings,
  stepMs,
  until,
  minMs,
  maxMs,
  holdMs,
  exitMs,
  settleTo,
  settleArc,
  covers,
  skippable,
  sessionKey,
  onProgress,
  onReveal,
  onDone,
  ...rest
}: LoaderProps) {
  const ref = useNovaEngine<HTMLDivElement, LoaderOptions>(createLoader, {
    form,
    blades,
    greetings,
    stepMs,
    until,
    minMs,
    maxMs,
    holdMs,
    exitMs,
    settleTo,
    settleArc,
    covers,
    skippable,
    sessionKey,
    onProgress,
    onReveal,
    onDone,
  });

  return (
    <div ref={ref} {...rest}>
      {children}
    </div>
  );
}
