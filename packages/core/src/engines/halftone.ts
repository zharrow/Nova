/**
 * Halftone — trame d'imprimeur sur canvas.
 *
 * Une grille de modules dont la TAILLE dit la valeur : plein au centre des
 * masses, minuscule sur les bords, absent dans les blancs. C'est la trame
 * d'un journal, pas un filtre de pixellisation — un pixel garde sa taille et
 * change de couleur, un module de trame garde sa couleur et change de taille.
 *
 * Généralisé depuis deux dessins qui appliquaient le même écran à des tracés
 * faits à la main. Ici la source peut être n'importe
 * quoi : une image, un canvas déjà peint, ou une fonction de couverture pour
 * les formes calculées — c'est ce dernier cas qui reproduit l'original.
 *
 * Trois réglages font la différence entre une trame et une bouillie :
 *
 *   `bleed`  le filet de blanc entre modules. Sans lui, les pleins se
 *            referment en aplat et la trame disparaît.
 *   `steps`  les paliers de valeur. Une trame d'imprimeur est DISCRÈTE : trois
 *            ou quatre paliers se lisent, un dégradé continu ne se lit pas.
 *   `gamma`  la courbe taille/couverture. À 0,45, les valeurs faibles restent
 *            visibles au lieu de disparaître.
 *
 * La boucle ne tourne que tant qu'il se passe quelque chose : un point de
 * mire qui n'a pas rejoint sa cible. Entre deux gestes, rien ne tourne.
 */

import { isBrowser, isFinePointer, prefersReducedMotion } from "../internal/env";
import { observeInView } from "../internal/in-view";
import { subscribe } from "../internal/ticker";
import { mergeOptions } from "../internal/options";
import type { NovaInstance } from "../internal/types";

/**
 * Couverture d'un point, entre 0 et 1. Les coordonnées sont normalisées :
 * 0,0 en haut à gauche, 1,1 en bas à droite. C'est la porte d'entrée des
 * formes calculées — un œil, une aiguille d'horloge, un cercle.
 */
export type CoverageFn = (x: number, y: number) => number;

export type HalftoneSource =
  | string
  | HTMLImageElement
  | HTMLCanvasElement
  | CoverageFn;

export interface HalftoneOptions {
  /** Image, canvas déjà peint, ou fonction de couverture. */
  source: HalftoneSource;
  /** Nombre de colonnes. La grille est carrée par défaut. Défaut : 48. */
  cols?: number;
  /** Nombre de lignes. Défaut : déduit du rapport du canvas. */
  rows?: number;
  /** Paliers de valeur. Défaut : 4. */
  steps?: number;
  /** Filet de blanc entre modules, en px. Défaut : 1. */
  bleed?: number;
  /** Courbe taille/couverture. Défaut : 0.45. */
  gamma?: number;
  /** En deçà, le module n'est pas dessiné. Défaut : 0.06. */
  floor?: number;
  /** Forme d'un module. Défaut : `square`. */
  shape?: "square" | "circle";
  /** Couleur des modules. Défaut : la couleur de texte héritée. */
  color?: string;
  /**
   * Canal lu dans une image. `alpha` pour un logo détouré, `luminance` pour
   * une photo. Défaut : `alpha` si l'image a de la transparence, sinon
   * `luminance`.
   */
  channel?: "alpha" | "luminance";
  /** Inverser la valeur lue. Défaut : false. */
  invert?: boolean;
  /**
   * Agrandissement des modules sous le curseur, entre 0 et 1. `0` — le défaut
   * — désactive le suivi et n'ouvre aucune boucle.
   */
  pointerBoost?: number;
  /** Rayon d'influence du curseur, en fraction de la largeur. Défaut : 0.22. */
  pointerRadius?: number;
  onReady?: () => void;
}

const defaults = {
  cols: 48,
  steps: 4,
  bleed: 1,
  gamma: 0.45,
  floor: 0.06,
  // Type élargi volontairement : `as const` figerait la valeur par défaut
  // et rendrait la comparaison avec "circle" impossible à écrire.
  shape: "square" as NonNullable<HalftoneOptions["shape"]>,
  invert: false,
  pointerBoost: 0,
  pointerRadius: 0.22,
};

/** Rattrapage par image du point de mire vers sa cible. */
const EASE = 0.16;

export function createHalftone(
  canvas: HTMLCanvasElement,
  options: HalftoneOptions,
): NovaInstance<HalftoneOptions> & { redraw(): void } {
  let config = mergeOptions(defaults, options);
  const context = canvas.getContext("2d");

  /** Couverture échantillonnée, une valeur par cellule. */
  let coverage: Float32Array | null = null;
  let cols = config.cols;
  let rows = config.rows ?? config.cols;

  let unsubscribeTick: (() => void) | null = null;
  let detachInView: (() => void) | null = null;
  let resizeObserver: ResizeObserver | null = null;
  let visible = true;
  let disposed = false;

  /* Point de mire : position lissée du curseur, en coordonnées normalisées.
     Hors écran par défaut, pour qu'aucun module ne soit gonflé au montage. */
  let focusX = -1;
  let focusY = -1;
  let targetX = -1;
  let targetY = -1;

  canvas.dataset.novaHalftone = "";

  /* ---------------------------------------------------------------------- */
  /* Échantillonnage                                                         */
  /* ---------------------------------------------------------------------- */

  /**
   * Une fonction de couverture est échantillonnée au centre de chaque cellule.
   * Une image est redessinée à la taille de la grille : c'est le lisseur du
   * navigateur qui fait la moyenne, et il le fait mieux et plus vite qu'une
   * boucle de sous-échantillonnage écrite ici.
   */
  function sample(): void {
    const total = cols * rows;
    const values = new Float32Array(total);

    if (typeof config.source === "function") {
      const fn = config.source;
      for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
          values[row * cols + col] = fn((col + 0.5) / cols, (row + 0.5) / rows);
        }
      }
      coverage = values;
      return;
    }

    const image = config.source as HTMLImageElement | HTMLCanvasElement;
    const grid = document.createElement("canvas");
    grid.width = cols;
    grid.height = rows;
    const gridContext = grid.getContext("2d", { willReadFrequently: true });
    if (!gridContext) return;

    gridContext.drawImage(image, 0, 0, cols, rows);

    let pixels: ImageData;
    try {
      pixels = gridContext.getImageData(0, 0, cols, rows);
    } catch {
      // Image d'une autre origine sans en-tête CORS : le canvas est teinté et
      // sa lecture est refusée. On le dit plutôt que de dessiner du vide.
      throw new Error(
        "Halftone : impossible de lire cette image. Elle doit être de même " +
          "origine, ou servie avec un en-tête CORS et chargée en crossOrigin.",
      );
    }

    const data = pixels.data;
    // Sans canal demandé, on choisit celui qui porte l'information : une image
    // détourée dit tout par son alpha, une photo opaque par sa luminance.
    let channel = config.channel;
    if (!channel) {
      let transparent = false;
      for (let i = 3; i < data.length; i += 4) {
        if (data[i]! < 250) {
          transparent = true;
          break;
        }
      }
      channel = transparent ? "alpha" : "luminance";
    }

    for (let index = 0; index < total; index++) {
      const offset = index * 4;
      let value: number;
      if (channel === "alpha") {
        value = data[offset + 3]! / 255;
      } else {
        // Luminance perceptuelle, puis inversée : sur une photo, c'est le
        // SOMBRE qui doit produire un gros module, comme à l'impression.
        const luma =
          (0.2126 * data[offset]! +
            0.7152 * data[offset + 1]! +
            0.0722 * data[offset + 2]!) /
          255;
        value = 1 - luma;
      }
      values[index] = config.invert ? 1 - value : value;
    }

    coverage = values;
  }

  /* ---------------------------------------------------------------------- */
  /* Rendu                                                                   */
  /* ---------------------------------------------------------------------- */

  function draw(): void {
    if (!context || !coverage) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;
    if (width === 0 || height === 0) return;

    if (
      canvas.width !== Math.round(width * dpr) ||
      canvas.height !== Math.round(height * dpr)
    ) {
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
    }
    context.setTransform(dpr, 0, 0, dpr, 0, 0);
    context.clearRect(0, 0, width, height);
    context.fillStyle =
      config.color ?? getComputedStyle(canvas).color ?? "currentColor";

    const cellW = width / cols;
    const cellH = height / rows;
    const pitch = Math.min(cellW, cellH);
    const boost = config.pointerBoost;
    const radius = config.pointerRadius;
    const tracking = boost > 0 && focusX >= 0;

    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        let value = coverage[row * cols + col]!;
        if (value < config.floor) continue;

        if (tracking) {
          // Le curseur ne déplace rien : il fait GROSSIR. Une trame dont les
          // modules bougent n'est plus une trame — ils deviennent un semis.
          const dx = (col + 0.5) / cols - focusX;
          const dy = (row + 0.5) / rows - focusY;
          const distance = Math.hypot(dx, dy);
          if (distance < radius) {
            value += boost * (1 - distance / radius);
          }
        }

        value = Math.min(1, value);
        const stepped = Math.ceil(value * config.steps) / config.steps;
        const size = pitch * Math.pow(stepped, config.gamma) - config.bleed;
        if (size <= 0) continue;

        const cx = (col + 0.5) * cellW;
        const cy = (row + 0.5) * cellH;

        if (config.shape === "circle") {
          context.beginPath();
          context.arc(cx, cy, size / 2, 0, Math.PI * 2);
          context.fill();
        } else {
          context.fillRect(cx - size / 2, cy - size / 2, size, size);
        }
      }
    }
  }

  /* ---------------------------------------------------------------------- */
  /* Boucle et gestes                                                        */
  /* ---------------------------------------------------------------------- */

  function run(): void {
    if (unsubscribeTick || disposed) return;
    unsubscribeTick = subscribe(() => {
      focusX += (targetX - focusX) * EASE;
      focusY += (targetY - focusY) * EASE;
      draw();
      // La boucle se gare dès que le point de mire a rejoint sa cible : rien
      // ne tourne entre deux gestes.
      const moving =
        Math.abs(targetX - focusX) > 0.001 || Math.abs(targetY - focusY) > 0.001;
      if (!moving) halt();
    });
  }

  function halt(): void {
    unsubscribeTick?.();
    unsubscribeTick = null;
  }

  const onPointerMove = (event: PointerEvent) => {
    const rect = canvas.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    targetX = (event.clientX - rect.left) / rect.width;
    targetY = (event.clientY - rect.top) / rect.height;
    if (focusX < 0) {
      // Premier contact : on se pose là sans traverser la trame en glissant.
      focusX = targetX;
      focusY = targetY;
    }
    if (visible) run();
  };

  const onPointerLeave = () => {
    targetX = -1;
    targetY = -1;
    focusX = -1;
    focusY = -1;
    halt();
    draw();
  };

  function attachPointer(): void {
    canvas.removeEventListener("pointermove", onPointerMove);
    canvas.removeEventListener("pointerleave", onPointerLeave);
    if (config.pointerBoost <= 0) return;
    if (!isFinePointer() || prefersReducedMotion()) return;
    canvas.addEventListener("pointermove", onPointerMove, { passive: true });
    canvas.addEventListener("pointerleave", onPointerLeave, { passive: true });
  }

  /* ---------------------------------------------------------------------- */
  /* Cycle de vie                                                            */
  /* ---------------------------------------------------------------------- */

  function resolveGrid(): void {
    cols = config.cols;
    if (config.rows) {
      rows = config.rows;
    } else {
      // Grille à modules carrés : on déduit les lignes du rapport du canvas.
      const width = canvas.clientWidth || 1;
      const height = canvas.clientHeight || 1;
      rows = Math.max(1, Math.round((cols * height) / width));
    }
  }

  function build(): void {
    resolveGrid();

    const source = config.source;
    if (typeof source === "string") {
      const image = new Image();
      // Sans cet attribut, une image d'une autre origine teinte le canvas et
      // sa lecture lève une erreur de sécurité.
      image.crossOrigin = "anonymous";
      image.onload = () => {
        if (disposed) return;
        config = mergeOptions(config, { source: image });
        sample();
        draw();
        config.onReady?.();
      };
      image.src = source;
      return;
    }

    sample();
    draw();
    config.onReady?.();
  }

  if (isBrowser && context) {
    build();
    attachPointer();

    if (typeof ResizeObserver !== "undefined") {
      resizeObserver = new ResizeObserver(() => {
        const avant = rows;
        resolveGrid();
        // Le nombre de lignes suit le rapport : s'il change, il faut
        // ré-échantillonner, sinon un simple redessin suffit.
        if (rows !== avant) sample();
        draw();
      });
      resizeObserver.observe(canvas);
    }

    detachInView = observeInView(
      canvas,
      (inView) => {
        visible = inView;
        if (!inView) halt();
      },
      { rootMargin: "0px", threshold: 0, once: false },
    );
  }

  return {
    element: canvas,
    redraw: draw,
    update(next) {
      const resample =
        next.source !== undefined ||
        next.cols !== undefined ||
        next.rows !== undefined ||
        next.channel !== undefined ||
        next.invert !== undefined;
      const pointerChanged = next.pointerBoost !== undefined;

      config = mergeOptions(config, next);

      if (resample) build();
      else draw();
      if (pointerChanged) attachPointer();
    },
    destroy() {
      disposed = true;
      halt();
      detachInView?.();
      detachInView = null;
      resizeObserver?.disconnect();
      resizeObserver = null;
      canvas.removeEventListener("pointermove", onPointerMove);
      canvas.removeEventListener("pointerleave", onPointerLeave);
      context?.clearRect(0, 0, canvas.width, canvas.height);
      delete canvas.dataset.novaHalftone;
    },
  };
}
