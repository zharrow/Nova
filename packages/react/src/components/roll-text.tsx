"use client";

import { createRollText } from "@nova-ui/core";
import type { RollTextOptions } from "@nova-ui/core";
import { useNovaEngine } from "../hooks/use-nova-engine";

export interface RollTextProps
  extends RollTextOptions,
    Omit<React.ComponentPropsWithoutRef<"span">, "children"> {
  text: string;
}

/**
 * Label qui pivote sur lui-même au survol de son parent.
 *
 * À placer dans un bouton ou un lien : c'est le survol de celui-ci qui
 * déclenche le pivot, pas celui des quelques pixels du texte.
 */
export function RollText({ text, trigger, ...rest }: RollTextProps) {
  const ref = useNovaEngine<HTMLSpanElement, RollTextOptions>(createRollText, {
    text,
    trigger,
  });

  // Le texte est rendu dès le serveur : lisible sans JavaScript.
  return (
    <span ref={ref} {...rest}>
      {text}
    </span>
  );
}
