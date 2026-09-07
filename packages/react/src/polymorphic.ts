import type { ComponentPropsWithoutRef, ElementType } from "react";

/**
 * Props d'un composant dont la balise rendue est choisie par l'appelant via
 * `as`. Un titre animé doit pouvoir être un `<h1>` sur une page et un `<span>`
 * dans une carte : Nova ne décide jamais de la sémantique à la place du site.
 */
export type PolymorphicProps<
  Tag extends ElementType,
  Own,
> = Own & { as?: Tag } & Omit<ComponentPropsWithoutRef<Tag>, keyof Own | "as">;
