/**
 * Progress — rendre compte de l'avancement, sans mentir.
 *
 * C'est le « compte rendu » d'une attente, et il vit seul parce qu'on le veut
 * seul : un téléversement, un envoi de formulaire, une vidéo en tampon n'ont
 * pas de rideau. `Loader` en est un client possible, jamais le propriétaire.
 *
 * Six formes, une seule mécanique. Le moteur pose `--nova-progress` entre 0 et
 * 1 ; toutes les formes sauf `count` sont ensuite dessinées ENTIÈREMENT par le
 * CSS, en découpant une couche allumée sur une couche éteinte. Aucune n'a
 * besoin qu'on repasse en JavaScript quand la valeur change, et c'est ce qui
 * permet de brancher la jauge sur une valeur qui bouge soixante fois par
 * seconde sans y laisser une image.
 *
 *   `bar`     le filet qui se remplit — la référence
 *   `ticks`   une règle graduée dont LE PAS SE RESSERRE vers la fin
 *   `curve`   la courbe d'accélération du geste, parcourue par un point
 *   `ring`    l'anneau qui se referme
 *   `blades`  des lames qui se retirent au rythme de l'avancement
 *   `count`   le nombre écrit
 *
 * **La valeur peut être inconnue, et alors il faut le dire.** `value: null`
 * met la jauge en INDÉTERMINÉ : elle avance quand même — une jauge immobile
 * ressemble à une panne — mais son bord d'attaque devient hachuré, ce qui dit
 * que ce qui suit est estimé et non compté. C'est le seul traitement qui ne
 * ment pas, et il coûte une règle CSS.
 *
 * Deux principes tenus :
 *
 *  - **une jauge est de l'information, pas de la décoration.** En mouvement
 *    réduit elle reste donc AFFICHÉE et continue de se mettre à jour ; c'est
 *    seulement le rattrapage animé entre deux valeurs qui disparaît. Masquer
 *    un avancement parce que quelqu'un a demandé moins de mouvement
 *    retirerait une information à ceux qu'on cherche à ménager ;
 *  - **on ne réécrit pas une sémantique déjà posée.** Le moteur ne pose
 *    `role="progressbar"` que si l'élément n'a pas déjà un rôle. Enveloppé
 *    dans un `Progress` de Radix — ce que fait l'adaptateur React — il se tait
 *    et laisse Radix parler.
 */

import { isBrowser } from "../internal/env";
import { mergeOptions } from "../internal/options";
import type { NovaInstance } from "../internal/types";

export type ProgressForm = "bar" | "ticks" | "curve" | "ring" | "blades" | "count";

export interface ProgressOptions {
  /** Forme de la jauge. Défaut : `bar`. */
  form?: ProgressForm;
  /**
   * Avancement, de 0 à 1. `null` signifie INCONNU : la jauge avance quand
   * même, mais elle marque son bord comme estimé. Défaut : 0.
   */
  value?: number | null;
  /**
   * Nombre de pièces — graduations pour `ticks`, lames pour `blades`.
   * Défaut : 28 et 12 respectivement.
   */
  steps?: number;
  /**
   * Durée du rattrapage entre deux valeurs, en ms. Défaut : 320.
   *
   * Ce n'est pas la durée de l'attente : c'est le temps que met la jauge à
   * rejoindre une valeur qui vient de sauter. Sans lui, une mesure qui passe
   * de 3 sur 7 à 4 sur 7 se lit comme un à-coup.
   */
  duration?: number;
  /**
   * La courbe tracée par la forme `curve`, en points de contrôle d'un
   * cubic-bezier. Défaut : la signature de Nova, `0.16, 1, 0.3, 1`.
   */
  curve?: readonly [number, number, number, number];
  /** Décimales du nombre, pour `count`. Défaut : 0. */
  decimals?: number;
  /** Locale de formatage, pour `count`. Sans locale, pas de séparateur. */
  locale?: string;
}

const defaults = {
  form: "bar" as ProgressForm,
  value: 0 as number | null,
  duration: 320,
  curve: [0.16, 1, 0.3, 1] as readonly [number, number, number, number],
  decimals: 0,
};

/** Pièces par défaut, par forme. Une règle n'a pas la densité d'un rideau. */
const PIECES: Partial<Record<ProgressForm, number>> = { ticks: 28, blades: 12 };

/**
 * Le resserrement de la règle graduée.
 *
 * Un exposant sous 1 étale les premières graduations et RESSERRE les
 * dernières : la fin de la course se lit plus fin que le début. Ce n'est pas
 * un ornement — c'est là que le regard s'attarde, et c'est là qu'une jauge
 * doit avoir de la résolution. Une règle à pas constant est un gabarit.
 *
 * 0,8 et non 0,62, qui était le premier essai. À 0,62 le rapport entre le
 * premier pas et le dernier atteignait six ; le tiers gauche se lisait comme
 * des graduations MANQUANTES et non comme une échelle grossière. Un détail qui
 * se remarque doit se remarquer comme une intention, jamais comme un défaut.
 */
const RESSERREMENT = 0.8;

/** Rayon du cercle de `ring`, dans son repère SVG de 100 × 100. */
const RAYON = 42;

const SVG = "http://www.w3.org/2000/svg";

export function createProgress(
  element: HTMLElement,
  options: ProgressOptions = {},
): NovaInstance<ProgressOptions> {
  let config = mergeOptions(defaults, options);

  const contenuOrigine = Array.from(element.childNodes);
  /** Le nœud qui porte le nombre, pour la forme `count`. */
  let nombre: HTMLElement | null = null;
  /** La sémantique a-t-elle été posée par NOUS ? Sinon on n'y touche pas. */
  let semantiquePosee = false;

  function pieces(): number {
    return Math.max(2, config.steps ?? PIECES[config.form] ?? 12);
  }

  /** La valeur bornée, et le fait qu'on la connaisse. */
  function lire(): { part: number; connue: boolean } {
    const brute = config.value;
    if (brute === null || brute === undefined || Number.isNaN(brute)) {
      return { part: 0, connue: false };
    }
    return { part: Math.min(1, Math.max(0, brute)), connue: true };
  }

  function formater(part: number): string {
    const pourcent = part * 100;
    if (!config.locale) return `${pourcent.toFixed(config.decimals)} %`;
    return new Intl.NumberFormat(config.locale, {
      style: "percent",
      minimumFractionDigits: config.decimals,
      maximumFractionDigits: config.decimals,
    }).format(part);
  }

  /** Écrit la valeur — la seule chose qui repasse par le JavaScript. */
  function poser(): void {
    const { part, connue } = lire();
    element.style.setProperty("--nova-progress", `${part}`);
    element.dataset.novaProgressState = connue ? "determinate" : "indeterminate";

    if (semantiquePosee) {
      // Une jauge indéterminée RETIRE `aria-valuenow` : c'est ainsi que la
      // norme dit « en cours, valeur inconnue ». Y laisser un nombre estimé
      // ferait lire un chiffre faux à voix haute.
      if (connue) {
        element.setAttribute("aria-valuenow", `${Math.round(part * 100)}`);
      } else {
        element.removeAttribute("aria-valuenow");
      }
    }

    if (nombre) nombre.textContent = connue ? formater(part) : "—";
  }

  /**
   * Une couche de pièces — graduations ou lames.
   *
   * La couche est dessinée DEUX FOIS, éteinte puis allumée, et c'est la
   * seconde qu'on découpe à la valeur. Allumer pièce par pièce en JavaScript
   * aurait demandé de repasser sur n nœuds à chaque mise à jour, pour un
   * résultat que `clip-path` obtient sans une ligne.
   */
  function couche(classe: string): HTMLElement {
    const total = pieces();
    const couche = document.createElement("span");
    couche.className = classe;
    for (let index = 0; index < total; index++) {
      const piece = document.createElement("span");
      piece.className = `${classe}-piece`;
      if (config.form === "ticks") {
        // Le pas se resserre vers la fin. La position est calculée ici et
        // écrite en clair : une classe construite à l'exécution ne
        // correspondrait à aucune règle Tailwind, et un calcul de puissance
        // n'existe pas en CSS.
        const rang = index / (total - 1);
        piece.style.left = `${Math.pow(rang, RESSERREMENT) * 100}%`;
      } else {
        piece.style.left = `${(index / total) * 100}%`;
        // UN JOINT, ET NON UN CHEVAUCHEMENT. Des lames jointives forment un
        // aplat : la forme `blades` devenait indiscernable de `bar`, et ce qui
        // la distingue est précisément qu'on VOIE les pièces. Le rideau de
        // `Loader` chevauche d'un pixel pour la raison inverse — il doit
        // couvrir sans laisser filtrer le fond.
        piece.style.width = `calc(${100 / total}% - var(--nova-progress-gap, 3px))`;
      }
      couche.appendChild(piece);
    }
    return couche;
  }

  function construireAnneau(): HTMLElement {
    const svg = document.createElementNS(SVG, "svg");
    svg.setAttribute("viewBox", "0 0 100 100");
    svg.setAttribute("class", "nova-progress__ring");
    svg.setAttribute("aria-hidden", "true");

    for (const role of ["track", "fill"] as const) {
      const cercle = document.createElementNS(SVG, "circle");
      cercle.setAttribute("cx", "50");
      cercle.setAttribute("cy", "50");
      cercle.setAttribute("r", `${RAYON}`);
      cercle.setAttribute("class", `nova-progress__ring-${role}`);
      svg.appendChild(cercle);
    }
    // La circonférence part au CSS : sans elle, `stroke-dashoffset` ne peut pas
    // se déduire de l'avancement, et il faudrait revenir en JavaScript à
    // chaque valeur.
    element.style.setProperty("--nova-progress-circ", `${2 * Math.PI * RAYON}`);
    return svg as unknown as HTMLElement;
  }

  /**
   * La courbe, en DEUX calques superposés — comme les graduations et les lames.
   *
   * Une seule mécanique pour toute la famille : un calque éteint, un calque
   * allumé par-dessus, et le second découpé à l'avancement. Deux `<svg>`
   * frères plutôt que deux `<path>` dans un même `<svg>`, parce que le
   * découpage se fait alors sur une boîte HTML, où `inset()` compte en
   * pourcentage de la LARGEUR — ce qui est précisément ce qu'on veut mesurer.
   *
   * Le premier essai traçait la course en `stroke-dasharray`, sur la longueur
   * d'arc. Deux raisons de l'avoir abandonné, et la seconde suffisait :
   * `vector-effect: non-scaling-stroke` calcule les tirets APRÈS la
   * transformation, et sous l'étirement non uniforme le tracé sortait en
   * segments ; et surtout 62 % de longueur d'arc ne font que 30 % de largeur
   * sur une courbe raide au départ, si bien que la jauge affichait « 62 % » à
   * côté d'un tracé au tiers. L'axe horizontal EST la course : c'est lui qu'on
   * découpe.
   */
  function construireCourbe(): DocumentFragment {
    const [x1, y1, x2, y2] = config.curve;
    // Repère SVG : y descend, la courbe monte. On trace donc de (0,100) vers
    // (100,0), ce qui met le départ en bas à gauche comme sur un relevé.
    const trace = `M 0 100 C ${x1 * 100} ${100 - y1 * 100} ${x2 * 100} ${100 - y2 * 100} 100 0`;

    const fragment = document.createDocumentFragment();
    for (const role of ["track", "fill"] as const) {
      const svg = document.createElementNS(SVG, "svg");
      svg.setAttribute("viewBox", "0 0 100 100");
      svg.setAttribute("preserveAspectRatio", "none");
      svg.setAttribute("class", "nova-progress__curve");
      svg.setAttribute("aria-hidden", "true");
      if (role === "fill") svg.setAttribute("data-nova-on", "");

      const chemin = document.createElementNS(SVG, "path");
      chemin.setAttribute("d", trace);
      chemin.setAttribute("class", `nova-progress__curve-${role}`);
      // Garde le trait d'épaisseur constante malgré l'étirement du repère.
      // Sans dasharray à calculer, il n'a plus d'effet de bord.
      chemin.setAttribute("vector-effect", "non-scaling-stroke");
      svg.appendChild(chemin);
      fragment.appendChild(svg);
    }
    return fragment;
  }

  function build(): void {
    element.dataset.novaProgress = config.form;
    element.style.setProperty("--nova-progress-duration", `${config.duration}ms`);

    // ON NE RÉÉCRIT PAS UNE SÉMANTIQUE DÉJÀ POSÉE. Enveloppé dans un
    // `Progress` de Radix, l'élément porte déjà son rôle : le moteur se tait.
    if (!element.hasAttribute("role")) {
      element.setAttribute("role", "progressbar");
      element.setAttribute("aria-valuemin", "0");
      element.setAttribute("aria-valuemax", "100");
      semantiquePosee = true;
    }

    element.textContent = "";

    if (config.form === "count") {
      nombre = document.createElement("span");
      nombre.className = "nova-progress__count";
      element.appendChild(nombre);
    } else if (config.form === "ring") {
      element.appendChild(construireAnneau());
    } else if (config.form === "curve") {
      // Pas de point qui court sur la courbe : la FIN DU TRACÉ le marque déjà,
      // et à l'exact endroit. Un point en plus serait un second repère pour la
      // même information — le détail gratuit doit être unique, sinon il fait
      // du bruit.
      element.appendChild(construireCourbe());
    } else if (config.form === "ticks" || config.form === "blades") {
      const classe = `nova-progress__${config.form}`;
      const eteinte = couche(classe);
      const allumee = couche(classe);
      allumee.dataset.novaOn = "";
      element.append(eteinte, allumee);
    } else {
      const piste = document.createElement("span");
      piste.className = "nova-progress__track";
      const remplissage = document.createElement("span");
      remplissage.className = "nova-progress__fill";
      piste.appendChild(remplissage);
      element.appendChild(piste);
    }

    // Le bord d'attaque hachuré de l'état indéterminé. Toujours dans l'arbre,
    // masqué par le CSS quand la valeur est connue : le monter et le démonter
    // au gré des mises à jour ferait un nœud qui apparaît en pleine course.
    if (config.form !== "count") {
      const bord = document.createElement("span");
      bord.className = "nova-progress__edge";
      bord.setAttribute("aria-hidden", "true");
      element.appendChild(bord);
    }

    poser();
  }

  if (isBrowser) build();

  return {
    element,
    update(next) {
      const avant = config;
      config = mergeOptions(config, next);
      // Une jauge se met à jour SANS SE RECONSTRUIRE : c'est son cas normal,
      // et refaire ses nœuds à chaque valeur ferait clignoter la couche
      // allumée. Seul un changement de structure justifie de rebâtir.
      const structure =
        config.form !== avant.form ||
        config.steps !== avant.steps ||
        config.curve !== avant.curve;
      if (structure && isBrowser) {
        nombre = null;
        build();
        return;
      }
      element.style.setProperty("--nova-progress-duration", `${config.duration}ms`);
      poser();
    },
    destroy() {
      nombre = null;
      element.textContent = "";
      for (const noeud of contenuOrigine) element.appendChild(noeud);
      delete element.dataset.novaProgress;
      delete element.dataset.novaProgressState;
      if (semantiquePosee) {
        element.removeAttribute("role");
        element.removeAttribute("aria-valuemin");
        element.removeAttribute("aria-valuemax");
        element.removeAttribute("aria-valuenow");
        semantiquePosee = false;
      }
      element.style.removeProperty("--nova-progress");
      element.style.removeProperty("--nova-progress-duration");
      element.style.removeProperty("--nova-progress-circ");
    },
  };
}
