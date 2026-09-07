"use client";

import { useMemo, useRef, useState } from "react";
import { createGraph } from "@nova-ui/core";
import type { GraphOptions, GraphInstance, GraphNode } from "@nova-ui/core";
import { useNovaEngine } from "../hooks/use-nova-engine";

export interface GraphProps
  extends GraphOptions,
    Omit<React.ComponentPropsWithoutRef<"div">, "color"> {
  /** Libellé lisible de chaque famille, pour les intertitres de la liste. */
  groupLabels?: Record<string, string>;
  /** Ordre d'affichage des familles. Défaut : ordre d'apparition. */
  groupOrder?: readonly string[];
  /** Classe appliquée au canvas. */
  canvasClassName?: string;
  /**
   * Description du canvas pour les technologies d'assistance. Par défaut, elle
   * renvoie vers la liste rendue en dessous. À remplacer lorsque le graphe est
   * affiché en aperçu, sans sa liste : la description ne doit pas promettre un
   * contenu qui n'est pas là.
   */
  canvasLabel?: string;
}

/**
 * Graphe de connaissances.
 *
 * Le canvas est une COUCHE DE PRÉSENTATION : toute l'information qu'il montre
 * est aussi rendue dans la liste sous le visuel, navigable au clavier,
 * indexable et lisible sans JavaScript. C'est la liste qui pilote le graphe,
 * jamais l'inverse — survoler ou cibler une entrée met le nœud en avant.
 *
 * Retirer cette liste rendrait le composant inaccessible : elle fait partie du
 * composant, pas de son habillage.
 */
export function Graph({
  nodes,
  edges,
  colors,
  defaultColor,
  edgeColor,
  labelColor,
  font,
  seed,
  padding,
  settleCold,
  settleVisible,
  autoCycle,
  onAutoChange,
  groupLabels,
  groupOrder,
  canvasClassName,
  canvasLabel,
  ...rest
}: GraphProps) {
  const instance = useRef<GraphInstance | null>(null);

  /**
   * Trois sources pour le nœud actif, par priorité : un clic qui reste, un
   * survol ou focus le temps du geste, puis le cycle automatique quand
   * personne ne désigne rien.
   */
  const [pinned, setPinned] = useState<string | null>(null);
  const [hovered, setHovered] = useState<string | null>(null);
  const [cycled, setCycled] = useState<string | null>(null);

  const manual = pinned ?? hovered;
  const active = manual ?? cycled;

  const ref = useNovaEngine<HTMLDivElement, GraphOptions, GraphInstance>(
    // Le moteur pilote le canvas, pas le conteneur : on le lui passe.
    (element, opts) =>
      createGraph(element.querySelector("canvas") as HTMLCanvasElement, opts),
    {
      nodes,
      edges,
      colors,
      defaultColor,
      edgeColor,
      labelColor,
      font,
      seed,
      padding,
      settleCold,
      settleVisible,
      autoCycle,
      onAutoChange: (id) => {
        setCycled(id);
        onAutoChange?.(id);
      },
    },
    instance,
  );

  const groups = useMemo(() => {
    const order =
      groupOrder ??
      [...new Set(nodes.map((node) => node.group ?? "—"))];
    return order.map((group) => ({
      group,
      label: groupLabels?.[group] ?? group,
      items: nodes.filter((node) => (node.group ?? "—") === group),
    }));
  }, [nodes, groupOrder, groupLabels]);

  const degrees = useMemo(() => {
    const map = new Map<string, number>();
    for (const node of nodes) map.set(node.id, 0);
    for (const [a, b] of edges) {
      map.set(a, (map.get(a) ?? 0) + 1);
      map.set(b, (map.get(b) ?? 0) + 1);
    }
    return map;
  }, [nodes, edges]);

  function designer(id: string | null): void {
    instance.current?.setActive(id);
  }

  return (
    <div ref={ref} {...rest}>
      <canvas
        className={canvasClassName}
        role="img"
        aria-label={
          canvasLabel ??
          `Graphe de ${nodes.length} entrées reliées par ${edges.length} liens. La liste complète et navigable se trouve immédiatement sous ce visuel.`
        }
      />

      {/* Le contenu réel : indexable, navigable au clavier, lisible sans JS. */}
      <div data-nova-graph-legend>
        {groups.map((group) => (
          <div key={group.group}>
            <h4>{group.label}</h4>
            <ul>
              {group.items.map((node: GraphNode) => (
                <li key={node.id}>
                  <button
                    type="button"
                    data-nova-graph-active={
                      active === node.id ? "true" : undefined
                    }
                    /* `aria-pressed` ne décrit que le choix délibéré : le cycle
                       automatique ne doit pas bavarder au lecteur d'écran
                       toutes les secondes et demie. */
                    aria-pressed={pinned === node.id}
                    onMouseEnter={() => {
                      setHovered(node.id);
                      designer(node.id);
                    }}
                    onMouseLeave={() => {
                      setHovered(null);
                      designer(pinned);
                    }}
                    onFocus={() => {
                      setHovered(node.id);
                      designer(node.id);
                    }}
                    onBlur={() => {
                      setHovered(null);
                      designer(pinned);
                    }}
                    onClick={() => {
                      const next = pinned === node.id ? null : node.id;
                      setPinned(next);
                      designer(next);
                    }}
                  >
                    <span>{node.label}</span>
                    <span data-nova-graph-degree>
                      {degrees.get(node.id) ?? 0}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}
