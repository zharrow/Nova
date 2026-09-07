/**
 * ScrollMarquee — bandeau entraîné par le défilement de la page.
 *
 * Porté de `TriadMarquee` (KaopyX). Le bandeau n'a pas de vitesse propre : il
 * a une DÉRIVE, et le défilement de la page le pousse. Descendre l'accélère,
 * remonter le fait repartir en arrière. C'est ce qui le sort du bandeau
 * décoratif : il ne tourne pas à côté de la page, il est entraîné par elle.
 *
 * Pourquoi un moteur distinct de `createMarquee` plutôt qu'une option : une
 * `@keyframes` ne peut pas être poussée. Elle a une durée, pas une vitesse.
 * Le mouvement est donc écrit en JavaScript, image par image — c'est le seul
 * moteur de Nova dans ce cas, et le coût est d'une boucle, arrêtée dès que le
 * bandeau sort du champ.
 *
 * Toutes les constantes sont en pixels par seconde, jamais par image : à
 * 120 Hz, une constante par image ferait défiler deux fois plus vite.
 */

import { isBrowser, prefersReducedMotion } from "../internal/env";
import { observeInView } from "../internal/in-view";
import { subscribe } from "../internal/ticker";
import { mergeOptions } from "../internal/options";
import type { NovaInstance } from "../internal/types";

export interface ScrollMarqueeOptions {
  /** Dérive au repos, en px/s. Assez lente pour qu'on puisse lire. Défaut : 44. */
  drift?: number;
  /**
   * Ce que vaut un pixel de défilement de page. Au-delà de 1, le bandeau va
   * plus vite que la page et la main du lecteur se sent démultipliée.
   * Défaut : 0.9.
   */
  push?: number;
  /**
   * Plafond de vitesse, en px/s. Sans lui, un coup de molette envoie le
   * bandeau à 8000 px/s et le texte devient une barre grise. Défaut : 2400.
   */
  maxSpeed?: number;
  /**
   * Constante de temps du lissage, en secondes. Le défilement arrive par
   * à-coups ; sans lissage le bandeau tremble au lieu de prendre son élan.
   * Défaut : 0.1.
   */
  smoothing?: number;
  /** Inclinaison en degrés par millier de px/s. Défaut : 2.6. */
  skew?: number;
  /** Plafond d'inclinaison, en degrés. Défaut : 6.5. */
  maxSkew?: number;
  /**
   * Part de vitesse gardée au survol : le bandeau s'arrête presque, pour
   * qu'on puisse lire ce qu'on est venu regarder. Défaut : 0.12.
   */
  hoverFactor?: number;
  /** Espace entre deux copies, unité CSS. Défaut : `0px`. */
  gap?: string;
}

const defaults = {
  drift: 44,
  push: 0.9,
  maxSpeed: 2400,
  smoothing: 0.1,
  skew: 2.6,
  maxSkew: 6.5,
  hoverFactor: 0.12,
  gap: "0px",
};

const clamp = (value: number, low: number, high: number) =>
  Math.min(high, Math.max(low, value));

export function createScrollMarquee(
  element: HTMLElement,
  options: ScrollMarqueeOptions = {},
): NovaInstance<ScrollMarqueeOptions> {
  let config = mergeOptions(defaults, options);

  const original = Array.from(element.childNodes);
  let track: HTMLElement | null = null;
  let resizeObserver: ResizeObserver | null = null;
  let detachInView: (() => void) | null = null;
  let unsubscribeTick: (() => void) | null = null;

  /* État de la boucle */
  let offset = 0;
  let velocity = config.drift;
  /** Pixels de défilement accumulés depuis la dernière image. */
  let pushed = 0;
  let lastScrollY = 0;
  let visible = true;
  let slowed = false;
  /**
   * Longueur d'un cycle, mesurée sur la piste : l'écart entre une copie et la
   * suivante. La calculer en divisant la largeur totale serait faux — la
   * dernière copie n'a pas d'écart derrière elle, et le bandeau sauterait
   * d'un écart à chaque tour. Relevée au montage et au redimensionnement,
   * jamais dans la boucle : c'est une lecture de mise en page, elle force un
   * calcul de style.
   */
  let period = 1;

  function build(): void {
    element.dataset.novaScrollMarquee = "";
    element.textContent = "";

    track = document.createElement("div");
    track.className = "nova-marquee__track";

    // Trois copies au minimum : une seule disparaît en bouclant, et après le
    // saut ce sont les autres qui doivent couvrir la fenêtre.
    for (let index = 0; index < 3; index++) {
      const group = document.createElement("div");
      group.className = "nova-marquee__group";
      if (index > 0) group.setAttribute("aria-hidden", "true");
      for (const node of original) group.appendChild(node.cloneNode(true));
      track.appendChild(group);
    }

    element.appendChild(track);
    measure();
  }

  function measure(): void {
    if (!track || !isBrowser) return;
    element.style.setProperty("--nova-marquee-gap", config.gap);

    const first = track.children[0] as HTMLElement | undefined;
    const second = track.children[1] as HTMLElement | undefined;
    if (!first) return;

    const mesure = second ? second.offsetLeft - first.offsetLeft : 0;

    // Une mesure nulle est un cas RÉEL, pas une bizarrerie de test : conteneur
    // en `display: none`, panneau replié, appel avant la première mise en
    // page. Sans cette garde, `element.clientWidth / 0` vaut l'infini et la
    // boucle de copies ci-dessous ne s'arrête jamais — le navigateur se fige.
    // On garde alors la période précédente et on ne duplique rien de plus :
    // le ResizeObserver rappellera cette fonction dès que le bloc aura une
    // taille.
    if (mesure <= 0) return;
    period = mesure;

    // Assez de copies pour couvrir la fenêtre après le saut de boucle. Le
    // plafond protège d'un contenu minuscule dans un conteneur immense.
    const needed = Math.min(
      64,
      Math.max(3, Math.ceil(element.clientWidth / period) + 2),
    );
    while (track.children.length < needed) {
      const clone = first.cloneNode(true) as HTMLElement;
      clone.setAttribute("aria-hidden", "true");
      track.appendChild(clone);
    }
  }

  function paint(delta: number): void {
    if (!track) return;

    // Plafonné à 50 ms : au retour d'un onglet en arrière-plan, l'écart depuis
    // la dernière image se compte en secondes et le bandeau sauterait d'un
    // demi-tour.
    const dt = Math.min(0.05, delta / 1000);
    if (dt <= 0) return;

    const target =
      (config.drift +
        clamp(
          (pushed / Math.max(dt, 0.001)) * config.push,
          -config.maxSpeed,
          config.maxSpeed,
        )) *
      (slowed ? config.hoverFactor : 1);
    pushed = 0;

    // Lissage exponentiel calé sur le temps écoulé, pas sur le nombre
    // d'images : la même inertie à 60 et à 120 Hz.
    velocity += (target - velocity) * (1 - Math.exp(-dt / config.smoothing));

    offset = (((offset + velocity * dt) % period) + period) % period;
    const skew = clamp(
      (velocity / 1000) * config.skew,
      -config.maxSkew,
      config.maxSkew,
    );
    track.style.transform = `translate3d(${-offset}px,0,0) skewX(${skew.toFixed(2)}deg)`;

    // Le sens de marche est publié pour le CSS : une flèche qui pointe devant
    // alors que le bandeau repart en arrière se lit comme un défaut.
    element.dataset.novaScrollDirection = velocity < 0 ? "backward" : "forward";
  }

  function run(): void {
    if (unsubscribeTick) return;
    unsubscribeTick = subscribe((_now, delta) => paint(delta));
  }

  function halt(): void {
    unsubscribeTick?.();
    unsubscribeTick = null;
  }

  function sync(): void {
    // Ni hors écran, ni onglet caché, ni mouvement réduit.
    const active =
      visible &&
      !(typeof document !== "undefined" && document.hidden) &&
      !prefersReducedMotion();
    if (active) run();
    else halt();
  }

  const onScroll = () => {
    pushed += window.scrollY - lastScrollY;
    lastScrollY = window.scrollY;
  };
  const onVisibility = () => sync();
  const onEnter = () => {
    slowed = true;
  };
  const onLeave = () => {
    slowed = false;
  };

  build();

  if (isBrowser) {
    lastScrollY = window.scrollY;
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", measure);
    document.addEventListener("visibilitychange", onVisibility);
    element.addEventListener("pointerenter", onEnter);
    element.addEventListener("pointerleave", onLeave);

    if (typeof ResizeObserver !== "undefined") {
      resizeObserver = new ResizeObserver(() => measure());
      resizeObserver.observe(element);
    }

    detachInView = observeInView(
      element,
      (inView) => {
        visible = inView;
        sync();
      },
      { rootMargin: "0px", threshold: 0, once: false },
    );

    sync();
  }

  return {
    element,
    update(next) {
      config = mergeOptions(config, next);
      measure();
      sync();
    },
    destroy() {
      halt();
      detachInView?.();
      detachInView = null;
      resizeObserver?.disconnect();
      resizeObserver = null;
      if (isBrowser) {
        window.removeEventListener("scroll", onScroll);
        window.removeEventListener("resize", measure);
        document.removeEventListener("visibilitychange", onVisibility);
        element.removeEventListener("pointerenter", onEnter);
        element.removeEventListener("pointerleave", onLeave);
      }
      element.textContent = "";
      for (const node of original) element.appendChild(node);
      delete element.dataset.novaScrollMarquee;
      delete element.dataset.novaScrollDirection;
      element.style.removeProperty("--nova-marquee-gap");
    },
  };
}
