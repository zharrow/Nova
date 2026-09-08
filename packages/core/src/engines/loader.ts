/**
 * Loader — le rideau d'ouverture.
 *
 * Trois formes, récoltées dans trois projets. Elles ne se ressemblent pas,
 * mais elles partagent tout ce qui compte : un rideau qui ne s'éternise pas,
 * qu'on peut sauter, qui ne rejoue pas à chaque page, et qui n'existe pas du
 * tout pour qui a demandé moins de mouvement.
 *
 *   `blades`     un rideau de lames qui se retirent une à une
 *   `greetings`  un mot d'accueil qui défile en vingt langues
 *   `splash`     une pastille brève, réservée à l'application installée
 *   `seam`       le panneau se lève d'un bloc en laissant filer un liseré
 *
 * Quatre garde-fous, tous tirés des originaux et tous non négociables :
 *
 *  - **il se saute.** Molette, clic, touche, contact : la première interaction
 *    termine le rideau. Un visiteur qui veut lire ne doit jamais attendre une
 *    animation ;
 *  - **il ne rejoue pas.** Une clé de session suffit : revenir en arrière ne
 *    doit pas redonner le générique ;
 *  - **il n'existe pas en mouvement réduit.** Pas « il est plus court » :
 *    `onDone` part tout de suite et rien n'est monté ;
 *  - **la page est l'état par défaut.** Le rideau ne couvre qu'une fois le
 *    moteur monté. Sans JavaScript, il n'y a pas de rideau — donc jamais de
 *    page bloquée derrière un voile qui ne se lèvera pas.
 */

import { isBrowser, prefersReducedMotion } from "../internal/env";
import { mergeOptions } from "../internal/options";
import type { NovaInstance } from "../internal/types";

export type LoaderForm = "blades" | "greetings" | "splash" | "seam";

export interface LoaderOptions {
  /** Forme du rideau. Défaut : `blades`. */
  form?: LoaderForm;
  /** Nombre de lames, pour la forme `blades`. Défaut : 6. */
  blades?: number;
  /** Les mots d'accueil, pour la forme `greetings`. */
  greetings?: readonly string[];
  /** Cadence du défilé des mots, en ms. Défaut : 200. */
  stepMs?: number;
  /** Temps d'affichage avant la sortie, en ms. Défaut : 1100. */
  holdMs?: number;
  /** Durée de la sortie, en ms. Défaut : 700. */
  exitMs?: number;
  /** Une interaction termine le rideau. Défaut : true. */
  skippable?: boolean;
  /**
   * Clé de session. Tant qu'elle est posée, le rideau ne rejoue pas.
   * `null` le fait rejouer à chaque montage — utile en démonstration.
   * Défaut : `nova:loader`.
   */
  sessionKey?: string | null;
  /** Appelé quand le rideau est fini, ou tout de suite s'il ne joue pas. */
  onDone?: () => void;
}

const SALUTATIONS = [
  "Bonjour", "Hello", "Hola", "Ciao", "Hallo", "Olá", "Привет",
  "こんにちは", "你好", "안녕하세요", "مرحبا", "नमस्ते", "Hej",
  "Salut", "Ahoj", "Γεια σου", "שלום", "Merhaba", "Sawubona", "Jambo",
] as const;

const defaults = {
  form: "blades" as LoaderForm,
  blades: 6,
  stepMs: 200,
  holdMs: 1100,
  exitMs: 700,
  skippable: true,
  sessionKey: "nova:loader" as string | null,
};

export function createLoader(
  element: HTMLElement,
  options: LoaderOptions = {},
): NovaInstance<LoaderOptions> & { skip(): void } {
  let config = mergeOptions(defaults, options);

  const contenuOrigine = Array.from(element.childNodes);
  const minuteries: Array<ReturnType<typeof setTimeout>> = [];
  let cycle: ReturnType<typeof setInterval> | null = null;
  let detacherSaut: (() => void) | null = null;
  let fini = false;

  function deja(): boolean {
    if (!config.sessionKey) return false;
    try {
      return sessionStorage.getItem(config.sessionKey) === "1";
    } catch {
      // Navigation privée ou stockage bloqué : on joue le rideau. Mieux vaut
      // le rejouer une fois de trop que de le retenir sur une erreur.
      return false;
    }
  }

  function marquer(): void {
    if (!config.sessionKey) return;
    try {
      sessionStorage.setItem(config.sessionKey, "1");
    } catch {
      /* Sans persistance, le rideau vaut pour la session en cours. */
    }
  }

  function terminer(): void {
    if (fini) return;
    fini = true;
    for (const minuterie of minuteries) clearTimeout(minuterie);
    minuteries.length = 0;
    if (cycle !== null) clearInterval(cycle);
    cycle = null;
    detacherSaut?.();
    detacherSaut = null;
    element.dataset.novaLoaderState = "done";
    config.onDone?.();
  }

  /** Termine le rideau après sa sortie. */
  function sortir(): void {
    if (fini) return;
    // Le défilé s'arrête AVANT la sortie. Un mot qui continue de changer
    // pendant que le contenu s'efface donne deux mouvements contradictoires,
    // et on ne lit ni l'un ni l'autre.
    if (cycle !== null) {
      clearInterval(cycle);
      cycle = null;
    }
    element.dataset.novaLoaderState = "leaving";
    minuteries.push(setTimeout(terminer, config.exitMs));
  }

  function skip(): void {
    if (fini) return;
    if (cycle !== null) {
      clearInterval(cycle);
      cycle = null;
    }
    for (const minuterie of minuteries) clearTimeout(minuterie);
    minuteries.length = 0;
    sortir();
  }

  function armerSaut(): void {
    if (!config.skippable) return;
    const evenements = [
      "wheel",
      "pointerdown",
      "keydown",
      "touchstart",
    ] as const;
    const sauter = () => skip();
    for (const nom of evenements) {
      window.addEventListener(nom, sauter, { passive: true, once: true });
    }
    detacherSaut = () => {
      for (const nom of evenements) window.removeEventListener(nom, sauter);
    };
  }

  function build(): void {
    element.dataset.novaLoader = config.form;
    element.dataset.novaLoaderState = "showing";
    element.setAttribute("aria-hidden", "true");
    element.style.setProperty("--nova-loader-exit", `${config.exitMs}ms`);

    // Le contenu fourni par l'appelant est enveloppé : c'est lui qui monte,
    // se retire, ou porte le mot d'accueil.
    const contenu = document.createElement("div");
    contenu.className = "nova-loader__content";
    for (const noeud of contenuOrigine) contenu.appendChild(noeud);

    if (config.form === "blades") {
      const rideau = document.createElement("div");
      rideau.className = "nova-loader__blades";

      // TOUTE la chorégraphie tient dans `exitMs`, dernière lame comprise.
      // Le rideau est retiré de la page à la fin de ce budget : une lame
      // encore en course y était coupée net, et la sortie se terminait par un
      // saut au lieu d'un retrait. L'ancien calcul dépassait de 30 % —
      // 292 ms de décalage plus 630 ms de course pour un budget de 700.
      // 55 % pour la course d'une lame, 40 % pour l'étalement, 5 % de marge :
      // une transition démarre à l'image SUIVANTE, pas au poser de l'attribut.
      const course = config.exitMs * 0.55;
      const etalement =
        config.blades > 1 ? (config.exitMs * 0.4) / (config.blades - 1) : 0;
      element.style.setProperty("--nova-loader-blade", `${course}ms`);

      for (let index = 0; index < config.blades; index++) {
        const lame = document.createElement("span");
        lame.className = "nova-loader__blade";
        // Les lames se retirent l'une après l'autre : c'est le décalage qui
        // fait le calepinage, pas un rideau qui tombe d'un bloc.
        lame.style.setProperty("--nova-blade-delay", `${index * etalement}ms`);
        rideau.appendChild(lame);
      }
      element.appendChild(rideau);
    }

    element.appendChild(contenu);

    if (config.form === "greetings") {
      const mots = config.greetings ?? SALUTATIONS;
      // L'entrée d'un mot doit se terminer avant l'arrivée du suivant, sinon
      // on lit un fondu permanent au lieu d'une succession de mots.
      element.style.setProperty("--nova-loader-step", `${config.stepMs}ms`);

      const mot = document.createElement("span");
      mot.className = "nova-loader__greeting";
      mot.textContent = mots[0] ?? "";
      mot.dataset.novaParite = "0";
      contenu.appendChild(mot);

      let index = 0;
      let pas = 0;
      cycle = setInterval(() => {
        index = (index + 1) % mots.length;
        mot.textContent = mots[index] ?? "";
        // CHANGER UN ATTRIBUT NE REJOUE PAS UNE ANIMATION CSS. Changer son
        // `animation-name`, si : la parité fait alterner entre deux keyframes
        // identiques sous deux noms. Sans cela l'animation jouait une fois,
        // au montage, et les dix-neuf mots suivants se substituaient d'un
        // coup — c'est le clignotement qu'on prenait pour un rideau raté.
        // La parité compte les PAS, pas l'index : une liste de longueur
        // impaire reboucle sur la même parité et ne rejouerait rien.
        pas += 1;
        mot.dataset.novaParite = pas % 2 === 0 ? "0" : "1";
      }, config.stepMs);
    }
  }

  function start(): void {
    if (!isBrowser) return;

    // Mouvement réduit, ou rideau déjà vu : rien n'est monté du tout, et la
    // suite du scénario part immédiatement.
    if (prefersReducedMotion() || deja()) {
      element.dataset.novaLoaderState = "done";
      config.onDone?.();
      fini = true;
      return;
    }

    marquer();
    build();
    armerSaut();
    minuteries.push(setTimeout(sortir, config.holdMs));
  }

  start();

  return {
    element,
    skip,
    update(next) {
      // Un rideau ne se reconfigure pas en cours de route : il dure une
      // seconde. On accepte les réglages tant qu'il n'a pas commencé.
      config = mergeOptions(config, next);
    },
    destroy() {
      for (const minuterie of minuteries) clearTimeout(minuterie);
      minuteries.length = 0;
      if (cycle !== null) clearInterval(cycle);
      cycle = null;
      detacherSaut?.();
      detacherSaut = null;
      element.textContent = "";
      for (const noeud of contenuOrigine) element.appendChild(noeud);
      element.removeAttribute("aria-hidden");
      delete element.dataset.novaLoader;
      delete element.dataset.novaLoaderState;
      element.style.removeProperty("--nova-loader-exit");
      element.style.removeProperty("--nova-loader-blade");
      element.style.removeProperty("--nova-loader-step");
    },
  };
}
