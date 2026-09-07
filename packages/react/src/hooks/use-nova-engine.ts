"use client";

import { useEffect, useRef } from "react";
import type { NovaInstance } from "@nova-ui/core";

/**
 * Pont générique entre un moteur `@nova-ui/core` et le cycle de vie React.
 *
 * C'est la seule pièce d'adaptation réelle du paquet : tous les composants
 * ci-dessous en découlent en quelques lignes. C'est aussi ce qui rendra
 * l'adaptateur Angular mécanique — il lui suffira d'une directive qui fait la
 * même chose dans `ngOnInit` / `ngOnChanges` / `ngOnDestroy`.
 *
 * Deux difficultés sont traitées ici une fois pour toutes :
 *
 *  1. **Les callbacks changent d'identité à chaque rendu.** Les comparer
 *     naïvement relancerait le moteur en boucle. On les remplace donc par des
 *     relais stables adossés à une ref : le moteur garde la même fonction pour
 *     toute sa vie, mais elle appelle toujours la version la plus récente.
 *  2. **Les options sont un objet littéral, neuf à chaque rendu.** On compare
 *     donc leur contenu, pas leur référence, et on n'appelle `update()` que
 *     lorsqu'une valeur a réellement bougé.
 */
export function useNovaEngine<
  Element_ extends HTMLElement,
  Options extends object,
  Instance extends NovaInstance<Options> = NovaInstance<Options>,
>(
  factory: (element: Element_, options: Options) => Instance,
  options: Options,
  /**
   * Ref optionnelle, remplie avec l'instance créée. Utile aux moteurs dont on
   * pilote l'état depuis le rendu — le graphe, dont la liste HTML désigne le
   * nœud actif. Elle vaut `null` hors montage.
   */
  instanceRef?: React.MutableRefObject<Instance | null>,
): React.RefObject<Element_ | null> {
  const ref = useRef<Element_>(null);
  const instance = useRef<Instance | null>(null);
  const callbacks = useRef<Record<string, (...args: unknown[]) => unknown>>({});
  const previous = useRef<Options | null>(null);

  // Les callbacks les plus récents, relus à chaque appel du relais.
  for (const [key, value] of Object.entries(options)) {
    if (typeof value === "function") {
      callbacks.current[key] = value as (...args: unknown[]) => unknown;
    }
  }

  /** Remplace chaque fonction par un relais d'identité stable. */
  function stabilize(source: Options): Options {
    const output: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(source)) {
      output[key] =
        typeof value === "function"
          ? (...args: unknown[]) => callbacks.current[key]?.(...args)
          : value;
    }
    return output as Options;
  }

  useEffect(() => {
    if (!ref.current) return;
    const created = factory(ref.current, stabilize(options));
    instance.current = created;
    if (instanceRef) instanceRef.current = created;
    previous.current = options;
    return () => {
      created.destroy();
      instance.current = null;
      if (instanceRef) instanceRef.current = null;
      previous.current = null;
    };
    // Création unique : les changements d'options passent par `update()`.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!instance.current || !previous.current) return;
    if (shallowEqualIgnoringFunctions(previous.current, options)) return;
    instance.current.update(stabilize(options));
    previous.current = options;
  });

  return ref;
}

/**
 * Égalité de surface, les fonctions mises à part : deux callbacks sont tenus
 * pour équivalents dès lors qu'ils sont tous deux des fonctions, puisque le
 * relais stable garantit déjà que la dernière version sera appelée.
 */
function shallowEqualIgnoringFunctions(a: object, b: object): boolean {
  const keysA = Object.keys(a);
  const keysB = Object.keys(b);
  if (keysA.length !== keysB.length) return false;

  for (const key of keysA) {
    const valueA = (a as Record<string, unknown>)[key];
    const valueB = (b as Record<string, unknown>)[key];
    if (typeof valueA === "function" && typeof valueB === "function") continue;
    if (!Object.is(valueA, valueB)) return false;
  }
  return true;
}
