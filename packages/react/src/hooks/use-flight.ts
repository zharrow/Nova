"use client";

import { useCallback, useEffect } from "react";
import { flight } from "@nova-ui/core";
import type { FlightOptions, FlightResult } from "@nova-ui/core";

/**
 * Renvoie une fonction de vol stable.
 *
 * Les vols en cours sont interrompus au démontage : naviguer pendant un vol
 * ne laisse pas de fantôme orphelin derrière soi.
 *
 * Le résultat porte `flew: false` quand rien n'a volé — source hors écran, ou
 * mouvement réduit. C'est le signal pour replier sur autre chose ; `onArrive`
 * est appelé dans tous les cas, pour que la suite du scénario ne reste pas
 * suspendue.
 */
export function useFlight(defaults: FlightOptions = {}) {
  useEffect(() => () => flight.stop(), []);

  return useCallback(
    (
      source: HTMLElement,
      target: HTMLElement | { x: number; y: number },
      options: FlightOptions = {},
    ): Promise<FlightResult> => flight(source, target, { ...defaults, ...options }),
    // Les réglages par défaut sont lus au moment du vol ; les inclure dans les
    // dépendances rendrait la fonction instable à chaque rendu.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );
}
