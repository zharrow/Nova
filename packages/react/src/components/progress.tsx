"use client";

import { Progress as RadixProgress } from "radix-ui";
import { createProgress } from "@nova-ui/core";
import type { ProgressOptions } from "@nova-ui/core";
import { useNovaEngine } from "../hooks/use-nova-engine";

export interface ProgressProps
  extends ProgressOptions,
    Omit<React.ComponentPropsWithoutRef<"div">, "children"> {
  /** Texte lu à la place du pourcentage. Utile pour « 3 images sur 7 ». */
  label?: string;
}

/**
 * La jauge d'avancement, en six formes.
 *
 * **Radix porte la sémantique, Nova porte le geste** — la division du dépôt,
 * appliquée ici à la lettre. `Progress.Root` de Radix pose `role="progressbar"`,
 * les bornes, et surtout RETIRE `aria-valuenow` quand la valeur est inconnue,
 * ce qui est la façon normée de dire « en cours, on ne sait pas où ». Le moteur
 * Nova voit ce rôle déjà posé et se tait : il ne dessine que la forme.
 *
 * ```tsx
 * const { progress } = useReady({ until: ["fonts", "images"] });
 * <Progress form="ticks" value={progress} />
 * ```
 *
 * `value` va de 0 à 1, et `null` signifie INCONNU : la jauge avance quand même
 * — une jauge immobile ressemble à une panne — mais son bord devient hachuré
 * pour dire que la suite est estimée et non comptée.
 *
 * L'intérieur appartient au moteur : le composant ne rend aucun enfant, ce qui
 * évite que React et le moteur se disputent les mêmes nœuds.
 */
export function Progress({
  form,
  value,
  steps,
  duration,
  curve,
  decimals,
  locale,
  label,
  ...rest
}: ProgressProps) {
  const ref = useNovaEngine<HTMLDivElement, ProgressOptions>(createProgress, {
    form,
    value,
    steps,
    duration,
    curve,
    decimals,
    locale,
  });

  const connue = value !== null && value !== undefined && !Number.isNaN(value);

  return (
    <RadixProgress.Root
      ref={ref}
      // Radix compte sur 0–100, Nova sur 0–1. La conversion est ici et nulle
      // part ailleurs : deux échelles dans une même API se confondent au
      // premier appel.
      value={connue ? Math.min(1, Math.max(0, value)) * 100 : null}
      max={100}
      aria-label={label}
      {...rest}
    />
  );
}
