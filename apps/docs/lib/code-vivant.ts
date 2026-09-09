/**
 * Le bloc d'usage, réécrit avec ce que la scène montre vraiment.
 *
 * La fiche laissait déjà changer deux choses — la forme, par le sélecteur, et
 * les options, par le panneau de réglages — pendant que le code juste en
 * dessous restait figé sur les valeurs écrites à la main dans le catalogue. On
 * pouvait donc pousser `duration` à 2000 ms, regarder la scène ralentir, et
 * lire `duration={700}` sous le nez. Le panneau de réglages existe pour
 * apprendre les noms de props ; il ne servait à rien si le code ne montrait
 * jamais les valeurs.
 *
 * Trois règles, et chacune vient d'un exemple réel du catalogue.
 *
 * 1. **Substitution seule, jamais d'ajout.** L'exemple de Reveal porte deux
 *    éléments et `stagger` n'appartient qu'au second : greffer une prop dans
 *    une balise choisie au hasard produirait du code faux, ce qui est pire
 *    qu'un code figé. La contrepartie est une contrainte sur le catalogue, et
 *    elle est vérifiable — voir `verifierCouverture`.
 * 2. **La PREMIÈRE occurrence d'une prop, jamais les suivantes.** Un exemple de
 *    famille montre plusieurs formes côte à côte : TextEffect en aligne trois,
 *    Halftone deux, Counter deux. La première est celle qui reflète la scène ;
 *    les autres sont là pour montrer autre chose, et les réécrire toutes
 *    effacerait ce qu'elles enseignent — trois `effect="blur"` identiques,
 *    deux `cols={64}` là où l'exemple opposait justement 64 à 32.
 * 3. **On n'écrit jamais par-dessus une variable.** `text={manifeste}` et
 *    `<SmoothScroll>{children}` montrent une composition, pas une valeur : y
 *    coller une chaîne remplacerait un exemple qui apprend quelque chose par
 *    un exemple qui ne veut plus rien dire.
 */

import type { Fiche, Forme, Reglage } from "./catalogue";

export type ValeurProp = string | number | boolean;

/** Une valeur entre accolades qui est une simple variable : `{manifeste}`. */
const VARIABLE = /^\{\s*[A-Za-z_$][\w$]*\s*\}$/;

/**
 * Une valeur, dans la notation qu'attend l'emplacement qu'on remplace.
 *
 * Le style suit ce qui était écrit : une prop notée `duration={700}` garde ses
 * accolades, une prop notée `variant="mask"` garde ses guillemets. Recopier la
 * notation d'origine évite de réécrire l'exemple dans un style qui n'est pas
 * celui du dépôt.
 */
function ecrire(
  valeur: ValeurProp,
  notation: "accolades" | "guillemets" | "objet",
): string {
  if (notation === "objet") {
    return typeof valeur === "string" ? `"${valeur}"` : String(valeur);
  }
  if (notation === "guillemets" && typeof valeur === "string") return `"${valeur}"`;
  if (typeof valeur === "string") return `{"${valeur}"}`;
  return `{${String(valeur)}}`;
}

function echapper(nom: string): string {
  return nom.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Remplace la PREMIÈRE valeur d'une prop dans un extrait.
 *
 * Quatre notations à couvrir, et les deux dernières sont les pièges.
 *
 * `pauseOnHover` sans valeur est un booléen VRAI en JSX. Passé à `false`, il ne
 * peut pas rester nu — il faut l'écrire `pauseOnHover={false}`, sinon le code
 * affiché dit l'inverse de ce que la scène fait.
 *
 * Et tout ce que Nova expose n'est pas un composant : `useConfetti({ colors })`,
 * `useFlight({ duration: 700 })` et `useExpand` prennent un objet d'options.
 * Sans la branche « clé d'objet », les curseurs de ces trois familles ne
 * déplaceraient rien dans leur exemple.
 *
 * L'espace exigé avant le nom empêche `on` de mordre dans `onValueChange`, et
 * l'ancrage sur `=` ou sur une fin d'attribut empêche de toucher au texte des
 * enfants.
 */
function substituer(code: string, prop: string, valeur: ValeurProp): string {
  const nom = echapper(prop);

  const attribut = code.match(new RegExp(`\\s${nom}=(\\{[^{}]*\\}|"[^"]*")`));
  if (attribut?.index !== undefined) {
    const ancienne = attribut[1]!;
    if (VARIABLE.test(ancienne)) return code;
    const notation = ancienne.startsWith('"') ? "guillemets" : "accolades";
    return remplacerUneFois(code, attribut[0], `${attribut[0].slice(0, -ancienne.length)}${ecrire(valeur, notation)}`, attribut.index);
  }

  const cleObjet = code.match(new RegExp(`\\b${nom}:\\s*([^,\\n}]+)`));
  if (cleObjet?.index !== undefined) {
    const ancienne = cleObjet[1]!;
    if (/^[A-Za-z_$][\w$]*$/.test(ancienne.trim())) return code;
    return remplacerUneFois(code, cleObjet[0], `${cleObjet[0].slice(0, -ancienne.length)}${ecrire(valeur, "objet")}`, cleObjet.index);
  }

  // Booléen nu : `<Marquee pauseOnHover>`.
  const nu = code.match(new RegExp(`\\s${nom}(?=[\\s/>])`));
  if (nu?.index !== undefined) {
    const espace = nu[0]!.slice(0, 1);
    const ecrit = valeur === true ? `${espace}${prop}` : `${espace}${prop}={false}`;
    return remplacerUneFois(code, nu[0], ecrit, nu.index);
  }

  return code;
}

/** Un remplacement positionnel : `String.replace` referait la recherche. */
function remplacerUneFois(
  code: string,
  ancien: string,
  nouveau: string,
  index: number,
): string {
  return code.slice(0, index) + nouveau + code.slice(index + ancien.length);
}

/**
 * Les props que la scène applique réellement, dans l'ordre où elles gagnent.
 *
 * Le sélecteur de formes d'abord, les réglages du visiteur ensuite : c'est
 * l'ordre des démonstrations, où `{...reglages}` est étalé après les valeurs
 * propres à la forme. Le panneau gagne donc sur la forme, et le code le dit.
 */
export function propsDeLaScene(
  fiche: Pick<Fiche, "formeProp">,
  forme: Forme | undefined,
  valeurs: Record<string, ValeurProp>,
): Record<string, ValeurProp> {
  const sortie: Record<string, ValeurProp> = {};
  if (forme) {
    if (fiche.formeProp) sortie[fiche.formeProp] = forme.id;
    Object.assign(sortie, forme.props ?? {});
  }
  Object.assign(sortie, valeurs);
  return sortie;
}

/**
 * L'exemple d'usage d'une fiche, réécrit avec l'état courant de la scène.
 *
 * Pure : elle ne lit rien d'autre que ses arguments, ce qui la rend testable
 * et utilisable côté serveur — le markdown servi aux agents s'en sert pour
 * figer l'exemple sur la forme par défaut plutôt que sur des valeurs écrites
 * à la main.
 */
export function codeVivant(
  fiche: Pick<Fiche, "usage" | "formeProp">,
  forme: Forme | undefined,
  valeurs: Record<string, ValeurProp>,
): string {
  let code = fiche.usage;
  for (const [prop, valeur] of Object.entries(propsDeLaScene(fiche, forme, valeurs))) {
    code = substituer(code, prop, valeur);
  }
  return code;
}

/**
 * Les réglages qu'une famille déclare sans que son exemple les montre.
 *
 * C'est le garde-fou de la règle « substitution seule » : un réglage absent de
 * l'exemple est un curseur qui ne déplace rien dans le code, donc une promesse
 * cassée. La fonction sert au test du catalogue, pas au rendu — elle est ici
 * plutôt que dans le test parce que c'est ici qu'est écrite la règle qu'elle
 * vérifie.
 */
export function verifierCouverture(
  fiche: Pick<Fiche, "usage">,
  reglages: Reglage[],
): string[] {
  return reglages
    .filter((reglage) => {
      const nom = echapper(reglage.nom);
      return !new RegExp(`(\\s${nom}(=|[\\s/>])|\\b${nom}:\\s)`).test(fiche.usage);
    })
    .map((reglage) => reglage.nom);
}
