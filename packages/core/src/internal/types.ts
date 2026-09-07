/**
 * Contrat commun à tous les moteurs Nova.
 *
 * Chaque moteur est une fabrique `createX(element, options)` qui renvoie une
 * instance pilotable. Ce contrat unique est ce qui rend les adaptateurs React
 * — et demain Angular — mécaniques à écrire : un `useEffect` qui crée, un
 * `update` sur changement de props, un `destroy` au démontage.
 */
export interface NovaInstance<Options> {
  /** L'élément piloté. */
  readonly element: HTMLElement;
  /** Applique de nouvelles options à chaud, sans reconstruire l'instance. */
  update(next: Partial<Options>): void;
  /** Détache tout : listeners, observers, ticker, styles injectés. */
  destroy(): void;
}

/** Instance dont l'animation peut être rejouée à la demande. */
export interface NovaPlayable<Options> extends NovaInstance<Options> {
  /** (Re)joue l'animation depuis le début. */
  play(): void;
}

/** Moment de déclenchement d'une animation d'entrée. */
export type Trigger = "view" | "mount" | "hover" | "manual";
