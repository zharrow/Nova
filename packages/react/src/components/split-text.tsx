"use client";

import type { ElementType } from "react";
import { createSplitText } from "@nova-ui/core";
import type { SplitTextOptions } from "@nova-ui/core";
import { useNovaEngine } from "../hooks/use-nova-engine";
import type { PolymorphicProps } from "../polymorphic";

export type SplitTextProps<Tag extends ElementType = "span"> = PolymorphicProps<
  Tag,
  SplitTextOptions & { text: string }
>;

/**
 * Titre qui monte dans son masque, mot par mot ou lettre par lettre.
 *
 * Rendre un `<h1>` : `<SplitText as="h1" text="Bâtir en verre" />`. Le titre
 * reste annoncé d'une seule traite aux lecteurs d'écran.
 */
export function SplitText<Tag extends ElementType = "span">({
  as,
  text,
  by,
  duration,
  delay,
  stagger,
  easing,
  trigger,
  rootMargin,
  threshold,
  onComplete,
  ...rest
}: SplitTextProps<Tag>) {
  const Component = (as ?? "span") as ElementType;
  const ref = useNovaEngine<HTMLElement, SplitTextOptions>(createSplitText, {
    text,
    by,
    duration,
    delay,
    stagger,
    easing,
    trigger,
    rootMargin,
    threshold,
    onComplete,
  });

  return (
    <Component ref={ref} {...rest}>
      {text}
    </Component>
  );
}
