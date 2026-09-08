"use client";

import { resolveEasing } from "@nova-ui/core";
import type { Courbe } from "@/lib/courbes";

/**
 * La vignette d'une courbe d'accélération.
 *
 * C'est la pièce qui rend le sélecteur utilisable sans connaître le
 * vocabulaire. « ease-in » et « ease-out » se retiennent à l'envers une fois
 * sur deux, et `cubic-bezier(0.34, 1.56, 0.64, 1)` ne dit rien à personne :
 * on choisit sur le DESSIN, le nom vient après.
 *
 * Deux tracés selon la nature de la courbe, et la distinction n'est pas
 * cosmétique. Une courbe CSS est une Bézier : on la trace exactement, avec ses
 * poignées. Une courbe JavaScript est une fonction : on l'ÉCHANTILLONNE. La
 * dessiner en Bézier approchée montrerait une courbe qui n'est pas celle qui
 * tournera — un aperçu qui ment est pire que pas d'aperçu.
 *
 * L'ordonnée déborde volontairement de l'unité : `back` dépasse la cible à
 * 1,1 environ, et l'écrêter effacerait justement ce qui le distingue.
 */

/* Repère du tracé. La bande haute et la bande basse laissent la place au
   dépassement de `back` sans que l'unité change d'échelle d'une vignette à
   l'autre — deux courbes côte à côte doivent être comparables. */
const DEBORD = 0.18;
const L = 40;
const H = 28;

const cx = (u: number) => u * L;
const cy = (v: number) => H - ((v + DEBORD) / (1 + 2 * DEBORD)) * H;

/** Le tracé d'une courbe, échantillonné ou exact selon ce qu'elle est. */
function tracer(courbe: Courbe): string {
  if (courbe.poignees) {
    const [x1, y1, x2, y2] = courbe.poignees;
    return `M${cx(0)},${cy(0)} C${cx(x1)},${cy(y1)} ${cx(x2)},${cy(y2)} ${cx(1)},${cy(1)}`;
  }
  // 24 points suffisent à 40 px de large : au-delà on paie des décimales que
  // personne ne voit.
  const f = resolveEasing(courbe.valeur as never);
  const pas = 24;
  let d = `M${cx(0)},${cy(f(0))}`;
  for (let i = 1; i <= pas; i++) {
    const t = i / pas;
    d += ` L${cx(t).toFixed(2)},${cy(f(t)).toFixed(2)}`;
  }
  return d;
}

export function VignetteCourbe({
  courbe,
  actif,
}: {
  courbe: Courbe;
  actif: boolean;
}) {
  return (
    <svg
      viewBox={`0 0 ${L} ${H}`}
      fill="none"
      aria-hidden
      className="h-[28px] w-[40px] shrink-0"
    >
      {/* La diagonale linéaire, en fond : sans référence, une courbe seule ne
          dit pas si elle freine ou si elle accélère. */}
      <line
        x1={cx(0)}
        y1={cy(0)}
        x2={cx(1)}
        y2={cy(1)}
        stroke="var(--filet-vif)"
        strokeWidth="1"
        strokeDasharray="2 2"
        vectorEffect="non-scaling-stroke"
      />
      <path
        d={tracer(courbe)}
        stroke={actif ? "var(--signal)" : "var(--second)"}
        strokeWidth={actif ? 1.75 : 1.25}
        strokeLinecap="round"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}
