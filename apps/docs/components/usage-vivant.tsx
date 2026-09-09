"use client";

import { useSceneFiche } from "./scene-fiche";
import { BlocCode } from "./bloc-code";
import { codeVivant } from "@/lib/code-vivant";

/**
 * L'exemple d'usage, écrit avec les valeurs de la scène.
 *
 * C'est le pendant manquant du panneau de réglages. Celui-ci affiche le NOM
 * réel de chaque prop pour qu'on apprenne quoi écrire ; il ne montrait pas
 * quoi lui donner. On pouvait donc pousser une durée à 2000 ms, voir la scène
 * ralentir, et lire `duration={700}` trois écrans plus bas.
 *
 * La copie repart maintenant avec les valeurs qu'on vient de régler : le
 * bouton « copier » du bloc rend le code de ce qu'on regarde, pas un exemple
 * générique. Voir `lib/code-vivant.ts` pour les trois règles de substitution.
 */
export function UsageVivant() {
  const { fiche, formeActive, valeurs } = useSceneFiche();
  const forme = fiche.formes?.find((f) => f.id === formeActive);

  return <BlocCode code={codeVivant(fiche, forme, valeurs)} />;
}
