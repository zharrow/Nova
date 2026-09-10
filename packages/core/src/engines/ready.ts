/**
 * Ready — attendre ce qu'il faut, ni moins ni plus, et le dire.
 *
 * Ce n'est pas un moteur : il n'anime aucun élément et n'en connaît aucun. Il
 * répond à une question que presque toute mise en scène d'arrivée se pose, et
 * qu'on résout d'habitude par une durée devinée : **quand la page est-elle
 * prête ?**
 *
 * Une durée devinée se trompe forcément dans un sens ou dans l'autre — elle
 * fait patienter une page déjà prête, ou elle libère une page encore trouée.
 * Ici on attend un SIGNAL : les polices, les images, le chargement complet, ou
 * une promesse de l'application. La durée n'est plus qu'un plancher et un
 * plafond autour de lui.
 *
 * Il est né en sortant du rideau d'ouverture, parce que quelqu'un peut vouloir
 * attendre ses polices et révéler son titre SANS aucun voile. `createLoader`
 * en est désormais un consommateur parmi d'autres.
 *
 * Trois garde-fous, tous non négociables :
 *
 *  - **le plancher.** Une attente qui passe en 80 ms n'est pas brève, c'est un
 *    clignotement — strictement pire que pas d'attente du tout ;
 *  - **le plafond.** Aucune attente n'est infinie. Une promesse en suspens, un
 *    réseau qui pend, une image qui n'arrive pas : passé `maxMs`, c'est fini ;
 *  - **une attente se règle sur la FIN, pas sur le succès.** Un fetch qui
 *    échoue, une police absente : c'est une fin. Le visiteur n'a pas à payer
 *    l'erreur en temps d'attente.
 *
 * Et une propriété qui vaut d'être tenue : **le compte à rebours est porté par
 * des minuteries, jamais par la boucle d'animation.** Dans un onglet
 * d'arrière-plan `requestAnimationFrame` ne tourne pas ; la boucle ne sert
 * qu'à rafraîchir l'avancement affiché, et l'attente se termine à l'heure même
 * si personne ne regarde.
 */

import { isBrowser } from "../internal/env";
import { mergeOptions } from "../internal/options";
import { subscribe } from "../internal/ticker";

/**
 * Ce qu'on attend.
 *
 * Les trois chaînes sont les signaux du document ; une promesse est ce que
 * l'application, elle, sait attendre. Une fonction est appelée au démarrage —
 * utile quand la promesse ne doit naître qu'à ce moment.
 */
export type ReadySignal =
  | "fonts"
  | "images"
  | "load"
  | Promise<unknown>
  | (() => Promise<unknown>);

export interface ReadyOptions {
  /**
   * Ce qu'il faut attendre. Absent, l'attente dure `holdMs` — une durée fixe,
   * et le seul cas où deviner est honnête, puisqu'on n'a rien à écouter.
   */
  until?: ReadySignal | readonly ReadySignal[];
  /** Plancher, en ms. Lu seulement avec `until`. Défaut : 600. */
  minMs?: number;
  /** Plafond, en ms. Lu seulement avec `until`. Défaut : 8000. */
  maxMs?: number;
  /** Durée quand il n'y a RIEN à attendre, en ms. Défaut : 1100. */
  holdMs?: number;
  /**
   * Avancement, de 0 à 1. Monotone : il ne redescend jamais, parce qu'un
   * compteur qui recule est lu comme un défaut et non comme une correction.
   * Le dernier appel avant `onReady` vaut toujours exactement 1.
   */
  onProgress?: (part: number) => void;
  /** Appelé une seule fois, quand l'attente est finie. */
  onReady?: () => void;
}

export interface ReadyInstance {
  /** Termine l'attente immédiatement. */
  skip(): void;
  /** L'avancement courant, de 0 à 1. */
  progress(): number;
  /** `true` une fois l'attente terminée. */
  done(): boolean;
  /** Arrête tout sans appeler `onReady`. */
  destroy(): void;
}

const defaults = {
  minMs: 600,
  maxMs: 8000,
  holdMs: 1100,
};

/** Le repli plafonne ici : il ne prétend jamais avoir fini. */
const PLAFOND_REPLI = 0.9;

export function createReady(options: ReadyOptions = {}): ReadyInstance {
  const config = mergeOptions(defaults, options);

  const minuteries: Array<ReturnType<typeof setTimeout>> = [];
  const detachements: Array<() => void> = [];
  /** Les attentes en cours. `total` dépasse 1 quand les pièces se comptent. */
  const attentes: Array<{ total: number; faits: number }> = [];

  let arreterTicker: (() => void) | null = null;
  let fini = false;
  let signalPret = false;
  let plancherAtteint = false;
  let avancement = 0;
  let emis = false;
  /* L'avancement se mesure sur l'horloge des MINUTERIES, pas sur celle des
     images. La fraction affichée est celle d'un budget, et ce budget est tenu
     par des `setTimeout` : prendre l'horodatage du ticker pour numérateur et
     un `setTimeout` pour dénominateur revient à diviser deux horloges l'une
     par l'autre. Sous des minuteurs simulés elles divergent d'un facteur
     mille, et en production rien ne garantit qu'elles partagent une origine.
     Le ticker ne donne que la CADENCE du rafraîchissement. */
  let depart = 0;

  function terminer(): void {
    if (fini) return;
    fini = true;
    // L'avancement finit à 1, et il y finit d'un coup : une barre qui reste à
    // 87 % pendant que la suite démarre au-dessus d'elle est un mensonge.
    poser(1);
    arreter();
    config.onReady?.();
  }

  function arreter(): void {
    for (const minuterie of minuteries) clearTimeout(minuterie);
    minuteries.length = 0;
    arreterTicker?.();
    arreterTicker = null;
    for (const detacher of detachements) detacher();
    detachements.length = 0;
  }

  /**
   * Le seul endroit qui décide de terminer sur signal.
   *
   * Appelé par l'arrivée d'une attente et par la minuterie du plancher — donc
   * JAMAIS par la boucle d'animation. Voir l'en-tête : un onglet
   * d'arrière-plan ne peint pas, mais ses minuteries tournent.
   */
  function terminerSiPret(): void {
    if (fini || !signalPret || !plancherAtteint) return;
    terminer();
  }

  function poser(part: number): void {
    const borne = Math.max(avancement, Math.min(1, Math.max(0, part)));
    // `emis` et non `borne !== 0` : le premier avancement vaut zéro, et sans
    // ce drapeau il serait soit tu, soit republié à chaque image.
    if (emis && borne === avancement) return;
    emis = true;
    avancement = borne;
    config.onProgress?.(borne);
  }

  /**
   * Enregistre une attente et renvoie de quoi la faire avancer.
   *
   * `total` peut dépasser 1 : les images se comptent une par une, ce qui donne
   * une mesure FINE là où une promesse ne donne que 0 puis 1.
   */
  function inscrire(total: number): (faits: number) => void {
    const attente = { total: Math.max(1, total), faits: 0 };
    attentes.push(attente);
    return (faits: number) => {
      attente.faits = Math.min(attente.total, faits);
      if (!attentes.every((a) => a.faits >= a.total)) return;
      signalPret = true;
      terminerSiPret();
    };
  }

  function armer(signal: ReadySignal): void {
    if (signal === "fonts") {
      const avance = inscrire(1);
      const polices = (
        document as Document & { fonts?: { ready: Promise<unknown> } }
      ).fonts;
      if (!polices?.ready) {
        avance(1);
        return;
      }
      polices.ready.then(
        () => avance(1),
        () => avance(1),
      );
      return;
    }

    if (signal === "images") {
      // Les images DIFFÉRÉES sont exclues : `loading="lazy"` déclare
      // explicitement qu'elles ne sont pas nécessaires maintenant, et l'une
      // d'elles, restée hors écran, ne se chargerait jamais — l'attente irait
      // au plafond à chaque visite, pour une vignette de pied de page.
      const images = Array.from(document.images).filter(
        (image) => image.loading !== "lazy",
      );
      const avance = inscrire(images.length);
      if (images.length === 0) {
        avance(1);
        return;
      }
      let faits = 0;
      const une = () => avance((faits += 1));
      for (const image of images) {
        if (image.complete) {
          une();
          continue;
        }
        image.addEventListener("load", une, { once: true });
        image.addEventListener("error", une, { once: true });
        detachements.push(() => {
          image.removeEventListener("load", une);
          image.removeEventListener("error", une);
        });
      }
      return;
    }

    if (signal === "load") {
      const avance = inscrire(1);
      if (document.readyState === "complete") {
        avance(1);
        return;
      }
      const fait = () => avance(1);
      window.addEventListener("load", fait, { once: true });
      detachements.push(() => window.removeEventListener("load", fait));
      return;
    }

    const avance = inscrire(1);
    const promesse = typeof signal === "function" ? signal() : signal;
    // `then(ok, ko)` et non `then(ok)` : une attente se règle sur le SETTLE.
    Promise.resolve(promesse).then(
      () => avance(1),
      () => avance(1),
    );
  }

  /**
   * L'avancement affiché.
   *
   * Sans `until`, la fin est CONNUE : c'est la rampe du temps, et elle atteint
   * 1 pile à l'échéance. Il n'y a rien à lisser, et lisser ferait courir la
   * courbe devant la vérité.
   *
   * Avec `until`, la mesure existe mais elle est souvent grossière — une seule
   * promesse ne donne que 0 puis 1, ce qui ne bouge pas. Une courbe de repli
   * porte donc l'intervalle, et la mesure la dépasse dès qu'elle est plus fine
   * qu'elle. Le repli PLAFONNE sous 1 : seule la fin met la barre au bout.
   */
  function calculer(): number {
    const ecoule = Date.now() - depart;
    if (!config.until) return ecoule / Math.max(1, config.holdMs);

    let total = 0;
    let faits = 0;
    for (const attente of attentes) {
      total += attente.total;
      faits += attente.faits;
    }
    const mesure = total > 0 ? faits / total : 0;

    // Tau au tiers du plafond : à `maxMs`, la courbe est à 95 % de son propre
    // plafond. Plus vite elle stagnerait visiblement ; plus lentement elle
    // n'aurait pas bougé quand le plafond tombe.
    const tau = Math.max(1, config.maxMs / 3);
    const repli = PLAFOND_REPLI * (1 - Math.exp(-ecoule / tau));
    return Math.max(mesure, repli);
  }

  function demarrer(): void {
    if (!isBrowser) {
      // En SSR il n'y a rien à attendre et personne à prévenir : l'attente est
      // finie d'avance, et c'est ce qui garde l'état par défaut visible.
      fini = true;
      return;
    }

    depart = Date.now();

    if (!config.until) {
      minuteries.push(setTimeout(terminer, config.holdMs));
      arreterTicker = subscribe(() => poser(calculer()));
      return;
    }

    const signaux = Array.isArray(config.until)
      ? (config.until as readonly ReadySignal[])
      : [config.until as ReadySignal];
    for (const signal of signaux) armer(signal);

    minuteries.push(
      setTimeout(() => {
        plancherAtteint = true;
        terminerSiPret();
      }, config.minMs),
    );
    minuteries.push(setTimeout(terminer, config.maxMs));
    arreterTicker = subscribe(() => poser(calculer()));
  }

  demarrer();

  return {
    skip: terminer,
    progress: () => avancement,
    done: () => fini,
    destroy() {
      fini = true;
      arreter();
    },
  };
}
