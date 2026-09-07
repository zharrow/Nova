/**
 * Graph — graphe de connaissances sur canvas.
 *
 * Porté de `KnowledgeGraph` (KaopyX), dont la règle centrale est conservée et
 * fait partie du contrat :
 *
 *   LE CANVAS EST UNE COUCHE DE PRÉSENTATION.
 *
 * Il ne porte aucune information qui n'existe pas déjà en HTML. Le contenu
 * réel est la liste rendue à côté — c'est elle que lisent les moteurs de
 * recherche, les lecteurs d'écran et tout navigateur sans JavaScript. Le
 * composant React de Nova rend cette liste ; un adaptateur qui l'oublierait
 * livrerait un graphe inaccessible.
 *
 * Trois choix de simulation, tous pour la même raison — ne pas faire tourner
 * une boucle pour rien :
 *
 *  - la disposition est DÉTERMINISTE (générateur à graine). Deux chargements
 *    donnent la même topologie, donc la page ne se réagence pas sous l'œil du
 *    lecteur qui revient ;
 *  - la simulation est déroulée à froid avant la première image. On ne montre
 *    pas un nuage qui se démêle pendant cinq secondes ;
 *  - une fois la topologie posée, la boucle SE GARE. Laisser tourner un rAF
 *    sur une image figée coûte du processeur et de la batterie pour rien.
 */

import { isBrowser, prefersReducedMotion } from "../internal/env";
import { observeInView } from "../internal/in-view";
import { subscribe } from "../internal/ticker";
import { mergeOptions } from "../internal/options";
import type { NovaInstance } from "../internal/types";

export interface GraphNode {
  id: string;
  label: string;
  /** Famille du nœud. Sert à la couleur et au regroupement de la liste. */
  group?: string;
}

/** Une arête, par identifiants de nœuds. */
export type GraphEdge = [string, string];

export interface GraphOptions {
  nodes: readonly GraphNode[];
  edges: readonly GraphEdge[];
  /** Couleur par famille. Une famille absente prend `defaultColor`. */
  colors?: Record<string, string>;
  defaultColor?: string;
  edgeColor?: string;
  labelColor?: string;
  /** Police des étiquettes. Défaut : la police du canvas. */
  font?: string;
  /**
   * Graine de la disposition. La changer réagence le graphe ; la garder
   * garantit la même image à chaque chargement. Défaut : 20260904.
   */
  seed?: number;
  /** Marge autour du nuage, en px. Défaut : 78. */
  padding?: number;
  /**
   * Pas de simulation joués AVANT la première image. Défaut : 240.
   */
  settleCold?: number;
  /**
   * Pas joués À L'ÉCRAN, après quoi la boucle se gare. Défaut : 90 (~1,5 s).
   */
  settleVisible?: number;
  /**
   * Cadence du cycle automatique, en ms. `0` le désactive. Le cycle ne tourne
   * que si personne ne désigne un nœud, et seulement à l'écran. Défaut : 0.
   */
  autoCycle?: number;
  /** Prévenu quand le cycle automatique change de nœud. */
  onAutoChange?: (id: string | null) => void;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
}

const defaults = {
  defaultColor: "#888888",
  edgeColor: "#26313F",
  labelColor: "#B6C2D0",
  seed: 20260904,
  padding: 78,
  settleCold: 240,
  settleVisible: 90,
  autoCycle: 0,
};

/** Générateur déterministe : la même topologie à chaque chargement. */
function seeded(seed: number) {
  let state = seed;
  return () => {
    state = (state * 1664525 + 1013904223) % 4294967296;
    return state / 4294967296;
  };
}

export interface GraphInstance extends NovaInstance<GraphOptions> {
  /**
   * Désigne le nœud mis en avant, ou `null`. Appelé par la liste HTML au
   * survol, au focus clavier et au clic. Ne relance pas la simulation : une
   * seule image est redessinée.
   */
  setActive(id: string | null): void;
  /** Voisins d'un nœud — sert à la liste pour afficher son degré. */
  neighbours(id: string): readonly string[];
}

export function createGraph(
  canvas: HTMLCanvasElement,
  options: GraphOptions,
): GraphInstance {
  let config = mergeOptions(defaults, options);
  const context = canvas.getContext("2d");

  let particles: Particle[] = [];
  let links: Array<[number, number]> = [];
  let adjacency = new Map<string, Set<string>>();
  let active: string | null = null;

  let unsubscribeTick: (() => void) | null = null;
  let detachInView: (() => void) | null = null;
  let resizeObserver: ResizeObserver | null = null;
  let autoTimer: ReturnType<typeof setInterval> | null = null;
  let autoIndex = -1;
  let visible = true;
  let frames = 0;
  let disposed = false;

  canvas.dataset.novaGraph = "";

  /* ---------------------------------------------------------------------- */
  /* Topologie                                                               */
  /* ---------------------------------------------------------------------- */

  function buildTopology(): void {
    const random = seeded(config.seed);
    particles = config.nodes.map(() => ({
      x: (random() - 0.5) * 320,
      y: (random() - 0.5) * 200,
      vx: 0,
      vy: 0,
    }));

    const index = new Map(config.nodes.map((node, i) => [node.id, i]));
    links = config.edges
      .map(([a, b]) => [index.get(a), index.get(b)] as [number, number])
      .filter(([a, b]) => a !== undefined && b !== undefined);

    adjacency = new Map(config.nodes.map((node) => [node.id, new Set<string>()]));
    for (const [a, b] of config.edges) {
      adjacency.get(a)?.add(b);
      adjacency.get(b)?.add(a);
    }
  }

  function step(): void {
    // Répulsion — chaque nœud pousse tous les autres.
    for (let i = 0; i < particles.length; i++) {
      const a = particles[i]!;
      for (let j = i + 1; j < particles.length; j++) {
        const b = particles[j]!;
        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const d2 = dx * dx + dy * dy || 0.01;
        const d = Math.sqrt(d2);
        const force = 2600 / d2;
        const fx = (dx / d) * force;
        const fy = (dy / d) * force;
        a.vx -= fx;
        a.vy -= fy;
        b.vx += fx;
        b.vy += fy;
      }
    }

    // Ressorts — chaque arête tire vers une longueur de repos.
    for (const [i, j] of links) {
      const a = particles[i]!;
      const b = particles[j]!;
      const dx = b.x - a.x;
      const dy = b.y - a.y;
      const d = Math.hypot(dx, dy) || 0.01;
      const force = (d - 118) * 0.012;
      const fx = (dx / d) * force;
      const fy = (dy / d) * force;
      a.vx += fx;
      a.vy += fy;
      b.vx -= fx;
      b.vy -= fy;
    }

    // Rappel au centre, plus fort en vertical : le nuage doit être large et
    // bas, comme le bloc qui l'accueille. Puis amortissement.
    for (const p of particles) {
      p.vx -= p.x * 0.0022;
      p.vy -= p.y * 0.0045;
      p.vx *= 0.86;
      p.vy *= 0.86;
      p.x += p.vx;
      p.y += p.vy;
    }
  }

  /* ---------------------------------------------------------------------- */
  /* Rendu                                                                   */
  /* ---------------------------------------------------------------------- */

  function colorOf(node: GraphNode): string {
    return (
      (node.group ? config.colors?.[node.group] : undefined) ??
      config.defaultColor
    );
  }

  function draw(): void {
    if (!context || particles.length === 0) return;

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

    // Cadrage automatique du nuage : la simulation vit dans ses propres
    // unités, le canvas dans les siennes.
    let minX = Infinity;
    let maxX = -Infinity;
    let minY = Infinity;
    let maxY = -Infinity;
    for (const p of particles) {
      minX = Math.min(minX, p.x);
      maxX = Math.max(maxX, p.x);
      minY = Math.min(minY, p.y);
      maxY = Math.max(maxY, p.y);
    }
    const pad = config.padding;
    const scale = Math.min(
      (width - pad * 2) / Math.max(maxX - minX, 1),
      (height - pad * 2) / Math.max(maxY - minY, 1),
      1.6,
    );
    const ox = width / 2 - ((minX + maxX) / 2) * scale;
    const oy = height / 2 - ((minY + maxY) / 2) * scale;
    const px = (i: number) => particles[i]!.x * scale + ox;
    const py = (i: number) => particles[i]!.y * scale + oy;

    const near = active ? adjacency.get(active) : null;

    // Arêtes
    for (const [i, j] of links) {
      const a = config.nodes[i]!;
      const b = config.nodes[j]!;
      const lit = active !== null && (a.id === active || b.id === active);
      context.beginPath();
      context.moveTo(px(i), py(i));
      context.lineTo(px(j), py(j));
      context.strokeStyle = lit ? colorOf(a) : config.edgeColor;
      context.lineWidth = lit ? 1.6 : 1;
      context.globalAlpha = active === null ? 1 : lit ? 1 : 0.28;
      context.stroke();
    }
    context.globalAlpha = 1;

    // Nœuds
    config.nodes.forEach((node, i) => {
      const isActive = node.id === active;
      const isNear = near?.has(node.id) ?? false;
      const faded = active !== null && !isActive && !isNear;
      const radius = isActive ? 7 : 4.5;

      context.globalAlpha = faded ? 0.3 : 1;
      context.beginPath();
      context.arc(px(i), py(i), radius, 0, Math.PI * 2);
      context.fillStyle = colorOf(node);
      context.fill();

      if (isActive) {
        context.beginPath();
        context.arc(px(i), py(i), radius + 6, 0, Math.PI * 2);
        context.strokeStyle = colorOf(node);
        context.lineWidth = 1;
        context.globalAlpha = 0.5;
        context.stroke();
        context.globalAlpha = 1;
      }

      // Sous ~640 px les étiquettes se chevauchent et deviennent illisibles.
      // On ne dessine alors que celle du nœud actif : la liste reste la source
      // complète et lisible.
      if (width >= 640 || isActive) {
        context.font =
          config.font ??
          `${isActive ? 600 : 400} 11.5px ui-monospace, monospace`;
        context.fillStyle = isActive ? colorOf(node) : config.labelColor;
        context.globalAlpha = faded ? 0.35 : 1;
        context.textAlign = "center";
        context.textBaseline = "top";
        context.fillText(node.label, px(i), py(i) + radius + 7);
      }
    });
    context.globalAlpha = 1;
  }

  /** Redessin ponctuel : survol, focus clavier, redimensionnement. */
  let singleFrame = 0;
  function requestFrame(): void {
    if (disposed || singleFrame || unsubscribeTick) return;
    singleFrame = requestAnimationFrame(() => {
      singleFrame = 0;
      draw();
    });
  }

  /* ---------------------------------------------------------------------- */
  /* Cycle automatique                                                       */
  /* ---------------------------------------------------------------------- */

  function startAuto(): void {
    if (autoTimer !== null || config.autoCycle <= 0) return;
    if (prefersReducedMotion()) return;
    autoTimer = setInterval(() => {
      autoIndex = (autoIndex + 1) % config.nodes.length;
      const node = config.nodes[autoIndex];
      active = node?.id ?? null;
      config.onAutoChange?.(active);
      requestFrame();
    }, config.autoCycle);
  }

  function stopAuto(): void {
    if (autoTimer === null) return;
    clearInterval(autoTimer);
    autoTimer = null;
  }

  /* ---------------------------------------------------------------------- */
  /* Mise en place                                                           */
  /* ---------------------------------------------------------------------- */

  function settle(): void {
    // Mouvement réduit : tout est déroulé à froid, dessiné une fois, aucune
    // boucle n'est ouverte.
    if (prefersReducedMotion()) {
      for (let i = 0; i < config.settleCold + config.settleVisible; i++) step();
      draw();
      return;
    }

    for (let i = 0; i < config.settleCold; i++) step();
    frames = 0;
    unsubscribeTick?.();
    unsubscribeTick = subscribe(() => {
      step();
      draw();
      frames++;
      if (frames >= config.settleVisible) {
        // La topologie est posée : la boucle se gare.
        unsubscribeTick?.();
        unsubscribeTick = null;
      }
    });
  }

  buildTopology();

  if (isBrowser && context) {
    settle();

    if (typeof ResizeObserver !== "undefined") {
      resizeObserver = new ResizeObserver(() => requestFrame());
      resizeObserver.observe(canvas);
    }

    detachInView = observeInView(
      canvas,
      (inView) => {
        visible = inView;
        // Un défilé qu'on ne regarde pas ne coûterait que du processeur.
        if (inView) startAuto();
        else stopAuto();
      },
      { rootMargin: "0px", threshold: 0.35, once: false },
    );
  }

  return {
    element: canvas,
    setActive(id) {
      active = id;
      // La main de l'utilisateur reprend le dessus sans lutter contre le
      // minuteur : le cycle s'arrête tant que quelqu'un désigne un nœud.
      if (id !== null) stopAuto();
      else if (visible) startAuto();
      requestFrame();
    },
    neighbours(id) {
      return [...(adjacency.get(id) ?? [])];
    },
    update(next) {
      const rebuilds =
        next.nodes !== undefined ||
        next.edges !== undefined ||
        next.seed !== undefined;
      const cycleChanged = next.autoCycle !== undefined;
      config = mergeOptions(config, next);
      if (rebuilds) {
        buildTopology();
        settle();
      } else {
        requestFrame();
      }
      if (cycleChanged) {
        stopAuto();
        if (visible) startAuto();
      }
    },
    destroy() {
      disposed = true;
      unsubscribeTick?.();
      unsubscribeTick = null;
      if (singleFrame) cancelAnimationFrame(singleFrame);
      stopAuto();
      detachInView?.();
      detachInView = null;
      resizeObserver?.disconnect();
      resizeObserver = null;
      context?.clearRect(0, 0, canvas.width, canvas.height);
      delete canvas.dataset.novaGraph;
    },
  };
}
