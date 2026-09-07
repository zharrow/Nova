/**
 * TextEffect — fragmentation d'un texte et catalogue d'effets.
 *
 * Porté du banc d'essai de KaopyX (`lab/texte`), qui est de loin la meilleure
 * pièce des projets d'origine sur ce sujet. Il remplace l'ancien
 * `createSplitText`, qui n'en faisait qu'un tiers.
 *
 * ── La structure, qui décide de tout ────────────────────────────────────────
 *
 *     .nova-word          boîte qui ROGNE      (overflow: hidden)
 *       .nova-word-i      boîte qui BOUGE      (transform)
 *         .nova-letter    lettre, si le grain l'exige
 *
 * Deux boîtes et non une : un masque qui se déplace ne masque plus rien. C'est
 * cette séparation qui permet à un mot de monter de derrière son propre cache,
 * et elle est le socle de la moitié des effets.
 *
 * Le masque est posé sur le MOT, jamais sur la ligne. Une ligne n'existe pas
 * dans le DOM ; la découper demanderait de reconstruire l'arbre à chaque
 * changement de largeur. Or un masque par mot, avec un délai identique pour
 * tous les mots d'une même ligne, donne exactement la même image.
 *
 * ── Les six variables ───────────────────────────────────────────────────────
 *
 *   --nova-m      index du mot                      décalage global
 *   --nova-n      index de lettre, continu          décalage par lettre
 *   --nova-p      avancement 0→1 dans le texte      plages de défilement
 *   --nova-l      index de la LIGNE                 décalage par ligne  (mesuré)
 *   --nova-w      rang du mot DANS sa ligne         ligne + mot         (mesuré)
 *   --nova-dist   éloignement 0→1 du centre         départ géométrique  (mesuré)
 *
 * Les trois dernières dépendent de la mise en page réelle : elles sont
 * recalculées au redimensionnement et à l'arrivée des polices.
 *
 * ── Un piège que ce moteur évite par construction ───────────────────────────
 *
 * Dans l'implémentation React d'origine, ces variables étaient écrites à la
 * main dans un attribut `style` que React possédait. React le réappliquait au
 * premier re-rendu et effaçait tout : les effets échelonnés partaient tous
 * ensemble au premier affichage, puis se comportaient correctement après un
 * redimensionnement. Ici les fragments sont créés par le moteur, jamais rendus
 * par le framework — personne d'autre ne touche à leur attribut `style`.
 */

import { isBrowser, prefersReducedMotion } from "../internal/env";
import { observeInView, isAlreadyInView } from "../internal/in-view";
import { mergeOptions } from "../internal/options";
import type { NovaInstance, Trigger } from "../internal/types";

/**
 * Les dix-huit effets, en deux familles qui ne se règlent pas pareil.
 *
 * AU DÉCLENCHEMENT — le texte est caché, un événement le fait arriver. Le
 * réglage porte sur le rythme : durée, décalage, courbe.
 *
 * AU DÉFILEMENT — le texte est là, sa lecture suit la molette. Le réglage
 * porte sur la plage, et il n'y a aucune durée nulle part.
 *
 * Confondre les deux est l'erreur courante : un effet d'arrivée branché sur le
 * défilement rejoue à chaque remontée, un effet de lecture déclenché une fois
 * ne sert à rien.
 */
export type TextEffectName =
  /* Au déclenchement */
  | "line"
  | "word"
  | "letter"
  | "flip"
  | "curtain"
  | "blur"
  | "focus"
  | "center"
  | "shear"
  | "wave"
  | "tracking"
  | "weight"
  | "roll"
  | "typewriter"
  /* Au défilement */
  | "reading"
  | "reading-blur"
  | "highlight";

/** Grain de découpe. La lettre coûte un nœud par caractère. */
export type TextGrain = "word" | "letter";

export interface TextEffectOptions {
  /** Texte à traiter. Défaut : le `textContent` de l'élément. */
  text?: string;
  /** Effet appliqué. Défaut : `line`. */
  effect?: TextEffectName;
  /** Force le grain. Par défaut, déduit de l'effet. */
  grain?: TextGrain;
  /** Quand jouer. Sans objet pour les effets de défilement. Défaut : `view`. */
  trigger?: Trigger;
  /** Durée d'une unité, en ms. Défaut : selon l'effet. */
  duration?: number;
  /** Courbe CSS. Défaut : la courbe du catalogue. */
  easing?: string;
  rootMargin?: string;
  threshold?: number;
  onComplete?: () => void;
}

/** Effets pilotés par le défilement : ils ne se déclenchent pas, ils se lisent. */
const SCROLL_DRIVEN = new Set<TextEffectName>([
  "reading",
  "reading-blur",
  "highlight",
]);

/** Effets qui exigent un découpage à la lettre. */
const LETTER_GRAIN = new Set<TextEffectName>([
  "letter",
  "wave",
  "weight",
  "roll",
]);

/** Effets qui ne se fragmentent pas du tout. */
const NO_FRAGMENTS = new Set<TextEffectName>(["typewriter", "highlight"]);

const defaults = {
  effect: "line" as TextEffectName,
  trigger: "view" as Trigger,
};

export function createTextEffect(
  element: HTMLElement,
  options: TextEffectOptions = {},
): NovaInstance<TextEffectOptions> & { play(): void } {
  let config = mergeOptions(defaults, options);
  let text = config.text ?? element.textContent ?? "";

  let host: HTMLElement | null = null;
  let words: HTMLElement[] = [];
  let detach: (() => void) | null = null;
  let resizeObserver: ResizeObserver | null = null;
  let measureFrame = 0;
  let completionTimer: ReturnType<typeof setTimeout> | null = null;
  let mounted = false;

  function grainOf(): TextGrain {
    return config.grain ?? (LETTER_GRAIN.has(config.effect) ? "letter" : "word");
  }

  /* ---------------------------------------------------------------------- */
  /* Construction                                                            */
  /* ---------------------------------------------------------------------- */

  function build(): void {
    element.textContent = "";
    element.dataset.novaText = config.effect;
    if (config.duration !== undefined) {
      element.style.setProperty("--nova-text-duration", `${config.duration}ms`);
    }
    if (config.easing) {
      element.style.setProperty("--nova-text-easing", config.easing);
    }

    // Le vrai texte, rendu une fois pour les lecteurs d'écran. Sans lui, un
    // titre fragmenté se fait épeler mot par mot — ou lettre par lettre.
    const readable = document.createElement("span");
    readable.className = "nova-sr";
    readable.textContent = text;
    element.appendChild(readable);

    host = document.createElement("span");
    host.className = "nova-text";
    host.setAttribute("aria-hidden", "true");
    element.appendChild(host);

    words = [];

    if (NO_FRAGMENTS.has(config.effect)) {
      host.textContent = text;
      if (config.effect === "typewriter") {
        // steps() a besoin du nombre de caractères, et la largeur finale doit
        // être exprimée en `ch` — sur une police à chasse fixe, un caractère
        // vaut exactement une unité.
        host.style.setProperty("--nova-ch", String(text.length));
        host.style.setProperty("--nova-width-end", `${text.length}ch`);
      }
      return;
    }

    const grain = grainOf();
    const pieces = text.split(" ");

    pieces.forEach((piece, index) => {
      const word = document.createElement("span");
      word.className = "nova-word";

      const inner = document.createElement("span");
      inner.className = "nova-word-i";

      if (config.effect === "roll") {
        // Le rouleau d'odomètre : chaque lettre est une colonne de DEUX
        // exemplaires, celui qui sort par le haut et celui qui entre par le
        // bas. Le découpage commun ne produit pas cette structure.
        for (const char of Array.from(piece)) {
          const column = document.createElement("span");
          column.className = "nova-roll";
          const out = document.createElement("i");
          out.textContent = char;
          const incoming = document.createElement("i");
          incoming.textContent = char;
          column.append(out, incoming);
          inner.appendChild(column);
        }
      } else if (grain === "letter") {
        for (const char of Array.from(piece)) {
          const letter = document.createElement("span");
          letter.className = "nova-letter";
          letter.textContent = char;
          inner.appendChild(letter);
        }
      } else {
        inner.textContent = piece;
      }

      word.appendChild(inner);
      host!.appendChild(word);
      words.push(word);

      // Un espace RÉEL entre les boîtes, pas une marge : sans lui le
      // copier-coller recolle les mots et la sélection à la souris casse.
      if (index < pieces.length - 1) {
        host!.appendChild(document.createTextNode(" "));
      }
    });
  }

  /* ---------------------------------------------------------------------- */
  /* Mesure                                                                  */
  /* ---------------------------------------------------------------------- */

  function measure(): void {
    if (!host || words.length === 0) return;

    // Le regroupement se fait sur `offsetTop` et non sur la position à
    // l'écran : deux mots de la même ligne partagent exactement le même
    // offsetTop, là où getBoundingClientRect renvoie des fractions qui
    // diffèrent d'un centième et casseraient l'égalité. Les transforms en
    // cours ne l'affectent pas non plus, donc on peut re-mesurer pendant
    // qu'une animation tourne.
    let line = -1;
    let previousTop = Number.NaN;
    let rankInLine = 0;
    // Compteur de lettres continu d'un mot à l'autre : une vague doit
    // traverser le texte sans se réinitialiser à chaque espace.
    let letterIndex = 0;

    words.forEach((word, index) => {
      const top = word.offsetTop;
      if (top !== previousTop) {
        line += 1;
        rankInLine = 0;
        previousTop = top;
      }

      word.style.setProperty("--nova-m", String(index));
      word.style.setProperty("--nova-n", String(letterIndex));
      word.style.setProperty(
        "--nova-p",
        words.length > 1 ? (index / (words.length - 1)).toFixed(3) : "0",
      );
      word.style.setProperty("--nova-l", String(line));
      word.style.setProperty("--nova-w", String(rankInLine));
      rankInLine += 1;

      const units = word.querySelectorAll<HTMLElement>(
        ".nova-letter, .nova-roll",
      );
      units.forEach((unit, position) => {
        unit.style.setProperty("--nova-c", String(position));
        unit.style.setProperty("--nova-n", String(letterIndex + position));
      });
      letterIndex += units.length || (word.textContent?.length ?? 0);
    });

    host.style.setProperty("--nova-lines", String(line + 1));

    // Éloignement au centre du bloc, normalisé sur le mot le plus loin. Sans
    // la normalisation, un titre large et un titre étroit n'auraient pas la
    // même durée totale : l'effet changerait de rythme au seul
    // redimensionnement de la fenêtre.
    const box = element.getBoundingClientRect();
    const cx = box.left + box.width / 2;
    const cy = box.top + box.height / 2;
    const distances = words.map((word) => {
      const rect = word.getBoundingClientRect();
      return Math.hypot(
        rect.left + rect.width / 2 - cx,
        rect.top + rect.height / 2 - cy,
      );
    });
    const longest = Math.max(...distances, 1);
    words.forEach((word, index) => {
      word.style.setProperty(
        "--nova-dist",
        ((distances[index] ?? 0) / longest).toFixed(3),
      );
    });
  }

  function watchLayout(): void {
    if (!isBrowser) return;

    // Une seconde mesure à l'image suivante : au montage la police de repli
    // est encore en place, donc les retours à la ligne ne sont pas ceux qu'on
    // verra. Deux parcours de quelques dizaines de nœuds coûtent moins qu'un
    // titre parti avec un découpage en lignes faux.
    measureFrame = requestAnimationFrame(measure);

    // ResizeObserver et non l'événement `resize` : un bloc peut changer de
    // largeur sans que la fenêtre bouge — une colonne de grille qui se
    // réorganise, par exemple.
    if (typeof ResizeObserver !== "undefined") {
      resizeObserver = new ResizeObserver(() => measure());
      resizeObserver.observe(element);
    }

    // Une police qui arrive après coup redistribue tous les retours à la
    // ligne. Sans ce rappel, les délais restent calés sur la police de repli.
    document.fonts?.ready.then(measure).catch(() => {});
  }

  /* ---------------------------------------------------------------------- */
  /* Lecture                                                                 */
  /* ---------------------------------------------------------------------- */

  function play(): void {
    if (!mounted) return;
    element.dataset.novaPlay = "true";

    if (completionTimer) clearTimeout(completionTimer);
    if (config.onComplete && !SCROLL_DRIVEN.has(config.effect)) {
      // Estimation généreuse : la durée d'une unité plus le décalage cumulé.
      // Le catalogue ne dépasse pas 2,2 s, on borne large plutôt que de lire
      // les styles calculés à chaque appel.
      const total = (config.duration ?? 1000) + words.length * 60 + 400;
      completionTimer = setTimeout(() => config.onComplete?.(), total);
    }
  }

  function arm(): void {
    detach?.();
    detach = null;
    if (!isBrowser) return;

    // Les effets de défilement n'ont rien à armer : c'est la molette qui
    // fournit le temps, et le CSS s'en charge seul.
    if (SCROLL_DRIVEN.has(config.effect)) {
      element.dataset.novaPlay = "scroll";
      return;
    }

    if (config.trigger === "manual") return;

    if (config.trigger === "mount") {
      // Une image d'écart pour que l'état de repos soit peint avant que la
      // transition ne parte : sans elle, rien ne s'anime.
      requestAnimationFrame(() => requestAnimationFrame(play));
      return;
    }

    // `view` : même garde-fou que Reveal. Un titre déjà lu ne se cache pas
    // pour s'animer aussitôt — ce serait un clignotement, pas une apparition.
    if (isAlreadyInView(element)) {
      element.dataset.novaPlay = "true";
      return;
    }

    detach = observeInView(element, (visible) => visible && play(), {
      rootMargin: config.rootMargin,
      threshold: config.threshold,
      once: true,
    });
  }

  /* ---------------------------------------------------------------------- */
  /* Cycle de vie                                                            */
  /* ---------------------------------------------------------------------- */

  function mount(): void {
    // Mouvement réduit : on ne fragmente RIEN. Le texte reste tel quel, sans
    // attribut, donc aucune règle du catalogue ne s'applique. C'est la
    // garantie la plus forte contre le défaut le plus fréquent de ce genre de
    // librairie — une page laissée vide parce que l'état de repos cache le
    // texte et que l'animation a été coupée.
    if (!isBrowser || prefersReducedMotion()) {
      element.textContent = text;
      return;
    }
    mounted = true;
    build();
    measure();
    watchLayout();
    arm();
  }

  function unmount(): void {
    detach?.();
    detach = null;
    resizeObserver?.disconnect();
    resizeObserver = null;
    if (measureFrame) cancelAnimationFrame(measureFrame);
    if (completionTimer) clearTimeout(completionTimer);
    element.textContent = text;
    delete element.dataset.novaText;
    delete element.dataset.novaPlay;
    element.style.removeProperty("--nova-text-duration");
    element.style.removeProperty("--nova-text-easing");
    host = null;
    words = [];
    mounted = false;
  }

  mount();

  return {
    element,
    play,
    update(next) {
      const rebuilds =
        (next.text !== undefined && next.text !== text) ||
        (next.effect !== undefined && next.effect !== config.effect) ||
        (next.grain !== undefined && next.grain !== config.grain);

      config = mergeOptions(config, next);

      if (rebuilds) {
        unmount();
        text = config.text ?? text;
        mount();
        return;
      }

      if (config.duration !== undefined) {
        element.style.setProperty(
          "--nova-text-duration",
          `${config.duration}ms`,
        );
      }
      if (config.easing) {
        element.style.setProperty("--nova-text-easing", config.easing);
      }
    },
    destroy: unmount,
  };
}
