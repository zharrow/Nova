/**
 * Fusion d'options qui ignore les valeurs `undefined`.
 *
 * `{ ...defaults, ...options }` a un défaut sournois : une clé explicitement
 * à `undefined` écrase la valeur par défaut au lieu de la laisser en place.
 *
 *   { ...{ by: "word" }, ...{ by: undefined } }  →  { by: undefined }
 *
 * Ce n'est pas un cas théorique : les adaptateurs de framework construisent
 * leur objet d'options à partir des props, donc toute prop non renseignée
 * arrive à `undefined`. Sans cette fonction, un `<SplitText />` sans prop `by`
 * découpait le texte lettre par lettre au lieu de mot par mot.
 */
export function mergeOptions<Base extends object, Next extends object>(
  base: Base,
  next: Next | undefined,
): Base & Next {
  const output = { ...base } as Record<string, unknown>;
  if (next) {
    for (const [key, value] of Object.entries(next)) {
      if (value !== undefined) output[key] = value;
    }
  }
  return output as Base & Next;
}
