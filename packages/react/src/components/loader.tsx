"use client";

import type { ReactNode } from "react";
import { createLoader } from "@nova-ui/core";
import type { LoaderOptions } from "@nova-ui/core";
import { useNovaEngine } from "../hooks/use-nova-engine";

export interface LoaderProps
  extends LoaderOptions,
    React.ComponentPropsWithoutRef<"div"> {
  children?: ReactNode;
}

/**
 * Le rideau d'ouverture, en trois formes.
 *
 * À monter une seule fois, dans le layout racine. Les enfants sont le contenu
 * du rideau — un logo, un filet, une légende ; la forme `greetings` y ajoute
 * elle-même le mot d'accueil.
 *
 * Quatre garanties : il se saute à la première interaction, il ne rejoue pas
 * dans la même session, il n'existe pas en `prefers-reduced-motion`, et sans
 * JavaScript il n'y a pas de rideau du tout — donc jamais de page bloquée
 * derrière un voile qui ne se lèvera pas.
 */
export function Loader({
  children,
  form,
  blades,
  greetings,
  stepMs,
  holdMs,
  exitMs,
  skippable,
  sessionKey,
  onDone,
  ...rest
}: LoaderProps) {
  const ref = useNovaEngine<HTMLDivElement, LoaderOptions>(createLoader, {
    form,
    blades,
    greetings,
    stepMs,
    holdMs,
    exitMs,
    skippable,
    sessionKey,
    onDone,
  });

  return (
    <div ref={ref} {...rest}>
      {children}
    </div>
  );
}
