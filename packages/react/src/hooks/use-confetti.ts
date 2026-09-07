"use client";

import { useCallback, useEffect } from "react";
import { confetti } from "@nova-ui/core";
import type { ConfettiOptions } from "@nova-ui/core";

/**
 * Renvoie une fonction de tir stable.
 *
 * Les salves en cours sont interrompues au démontage : naviguer pendant la
 * chute ne laisse pas de particules orphelines derrière soi.
 */
export function useConfetti(defaults: ConfettiOptions = {}) {
  useEffect(() => () => confetti.stop(), []);

  return useCallback(
    (options: ConfettiOptions = {}) => confetti({ ...defaults, ...options }),
    // Les réglages par défaut sont lus au moment du tir ; les inclure dans les
    // dépendances rendrait la fonction instable à chaque rendu.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );
}
