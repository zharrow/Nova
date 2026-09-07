"use client";

import type { ElementType } from "react";
import { createCounter } from "@nova-ui/core";
import type { CounterOptions } from "@nova-ui/core";
import { useNovaEngine } from "../hooks/use-nova-engine";
import type { PolymorphicProps } from "../polymorphic";

export type CounterProps<Tag extends ElementType = "span"> = PolymorphicProps<
  Tag,
  CounterOptions
>;

/**
 * Nombre qui compte jusqu'à sa valeur à l'entrée en vue.
 *
 * La valeur finale est écrite dès le premier rendu : la largeur du bloc ne
 * bouge pas pendant le comptage, et la valeur reste juste sans JavaScript.
 */
export function Counter<Tag extends ElementType = "span">({
  as,
  to,
  from,
  duration,
  easing,
  decimals,
  locale,
  format,
  prefix,
  suffix,
  trigger,
  rootMargin,
  threshold,
  onComplete,
  ...rest
}: CounterProps<Tag>) {
  const Component = (as ?? "span") as ElementType;
  const ref = useNovaEngine<HTMLElement, CounterOptions>(createCounter, {
    to,
    from,
    duration,
    easing,
    decimals,
    locale,
    format,
    prefix,
    suffix,
    trigger,
    rootMargin,
    threshold,
    onComplete,
  });

  return <Component ref={ref} {...rest} />;
}
