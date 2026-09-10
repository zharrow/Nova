"use client";

import type { ElementType, ReactNode } from "react";
import { createMagnet } from "@nova-ui/core";
import type { MagnetOptions } from "@nova-ui/core";
import { useNovaEngine } from "../hooks/use-nova-engine";
import type { PolymorphicProps } from "../polymorphic";

export type MagnetProps<Tag extends ElementType = "div"> = PolymorphicProps<
  Tag,
  MagnetOptions & { children?: ReactNode }
>;

/**
 * Attire l'élément vers le pointeur qui l'approche, et le rend à sa place
 * quand il s'éloigne.
 *
 * TOUS LES AIMANTS DE LA PAGE SE CONNAISSENT. Un seul est tenu à la fois — le
 * plus proche — et les autres lâchent. C'est ce qui rend une rangée de boutons
 * lisible : sans arbitrage, le curseur posé entre deux d'entre eux les fait
 * pencher ensemble, et la rangée gondole.
 *
 * AIMANTEZ L'ÉLÉMENT LUI-MÊME, pas un conteneur : `<Magnet as="button">` rend
 * un vrai `<button>`, donc la zone cliquable se déplace avec lui. Un bouton
 * enveloppé dans un `<div>` aimanté marche aussi, mais ajoute un nœud pour
 * rien.
 *
 * ATTENTION À LA BALISE. Le déplacement est une transformation, et une
 * transformation ne s'applique pas à une boîte en ligne. Sur un `<span>`, il
 * faut donc un `display: inline-block` — les balises interactives usuelles
 * (`button`, `a` mis en forme) l'ont déjà.
 *
 * Inactif au tactile — il n'y a pas d'approche au doigt, seulement un contact,
 * et l'effet déplacerait la cible au moment précis où l'on appuie. Inactif
 * aussi en `prefers-reduced-motion`, y compris si le réglage bascule en cours
 * de session.
 */
export function Magnet<Tag extends ElementType = "div">({
  as,
  children,
  force,
  radius,
  stiffness,
  overshoot,
  ...rest
}: MagnetProps<Tag>) {
  const Component = (as ?? "div") as ElementType;
  const ref = useNovaEngine<HTMLElement, MagnetOptions>(createMagnet, {
    force,
    radius,
    stiffness,
    overshoot,
  });

  return (
    <Component ref={ref} {...rest}>
      {children}
    </Component>
  );
}
