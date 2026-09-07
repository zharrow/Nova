/**
 * TextHighlight — surligner un passage dans du contenu déjà rendu.
 *
 * On donne une phrase, le moteur la retrouve dans le DOM et pose une bande
 * PAR LIGNE VISUELLE. Pas un rectangle autour du bloc : les bandes épousent le
 * texte, y compris quand il se casse sur trois lignes ou traverse plusieurs
 * balises.
 *
 * Porté de `PhraseHighlight` (générateur de CV). C'est un primitif rare : rien
 * dans les librairies de composants ne sait surligner un passage qu'on n'a pas
 * balisé soi-même. Il sert à annoter, à montrer un résultat de recherche, à
 * pointer ce dont une machine parle.
 *
 * ── Deux difficultés, et comment elles sont traitées ────────────────────────
 *
 * **Le texte rendu n'est pas le texte source.** Les retours à la ligne et
 * l'indentation du JSX deviennent des blancs, et un passage peut traverser un
 * `<strong>`. On construit donc une chaîne normalisée de tout le sous-arbre,
 * avec une table qui ramène chaque caractère à son nœud et son décalage — la
 * recherche se fait sur la chaîne, le `Range` se construit depuis la table.
 *
 * **La mise en page bouge après le montage.** Une police qui arrive, une image
 * qui se charge, une colonne qui se réorganise : les rectangles changent.
 * L'original relevait toutes les 800 ms, ce qui coûte un calcul de mise en
 * page quatre fois par seconde pour rien. Ici on écoute ce qui bouge
 * réellement — `ResizeObserver`, `document.fonts.ready`, et les mutations du
 * sous-arbre.
 */

import { isBrowser } from "../internal/env";
import { observeInView, isAlreadyInView } from "../internal/in-view";
import { mergeOptions } from "../internal/options";
import type { NovaInstance, Trigger } from "../internal/types";

export interface TextHighlightOptions {
  /** Le passage à retrouver. La casse et les blancs sont ignorés. */
  text: string;
  /** Classes posées sur chaque bande — c'est là que vit la couleur. */
  className?: string;
  /** Décalage entre deux lignes, en ms. Défaut : 30. */
  stagger?: number;
  /** Durée d'apparition d'une bande, en ms. Défaut : 350. */
  duration?: number;
  /** Débord horizontal et vertical de la bande, en px. Défaut : [2, 1]. */
  padding?: [number, number];
  /** Quand surligner. Défaut : `view`. */
  trigger?: Trigger;
  rootMargin?: string;
  threshold?: number;
  /**
   * Appelé quand le passage est introuvable — ponctuation altérée, contenu pas
   * encore rendu. À l'appelant de replier sur autre chose : surligner le bloc
   * entier, ou ne rien montrer. Le moteur ne devine pas à sa place.
   */
  onMiss?: () => void;
}

const defaults = {
  stagger: 30,
  duration: 350,
  padding: [2, 1] as [number, number],
  trigger: "view" as Trigger,
};

/** Un caractère de la chaîne normalisée, ramené à sa source. */
interface Ancre {
  noeud: Text;
  decalage: number;
}

/**
 * Aplatit le sous-arbre en une chaîne comparable, et garde la table de
 * correspondance. Les suites de blancs deviennent une espace unique — c'est ce
 * que le navigateur affiche, et donc ce qu'un humain a copié.
 */
function aplatir(racine: HTMLElement): { texte: string; ancres: Ancre[] } {
  const marcheur = document.createTreeWalker(racine, NodeFilter.SHOW_TEXT);
  let texte = "";
  const ancres: Ancre[] = [];
  let blancEnCours = false;

  let noeud = marcheur.nextNode() as Text | null;
  while (noeud) {
    const brut = noeud.data;
    for (let index = 0; index < brut.length; index++) {
      const caractere = brut[index]!;
      if (/\s/.test(caractere)) {
        if (blancEnCours || texte.length === 0) continue;
        blancEnCours = true;
        texte += " ";
        ancres.push({ noeud, decalage: index });
        continue;
      }
      blancEnCours = false;
      texte += caractere.toLowerCase();
      ancres.push({ noeud, decalage: index });
    }
    noeud = marcheur.nextNode() as Text | null;
  }

  return { texte, ancres };
}

/** Construit un `Range` sur le passage, ou `null` s'il est introuvable. */
function trouverRange(racine: HTMLElement, requete: string): Range | null {
  const cible = requete.replace(/\s+/g, " ").trim().toLowerCase();
  if (cible.length < 2) return null;

  const { texte, ancres } = aplatir(racine);
  const debut = texte.indexOf(cible);
  if (debut === -1) return null;

  const premier = ancres[debut];
  const dernier = ancres[debut + cible.length - 1];
  if (!premier || !dernier) return null;

  const range = document.createRange();
  range.setStart(premier.noeud, premier.decalage);
  // `+1` : la fin d'un Range est exclusive, il faut donc pointer APRÈS le
  // dernier caractère.
  range.setEnd(dernier.noeud, dernier.decalage + 1);
  return range;
}

export function createTextHighlight(
  container: HTMLElement,
  options: TextHighlightOptions,
): NovaInstance<TextHighlightOptions> & { play(): void } {
  let config = mergeOptions(defaults, options);

  let couche: HTMLElement | null = null;
  let detachInView: (() => void) | null = null;
  let resizeObserver: ResizeObserver | null = null;
  let mutationObserver: MutationObserver | null = null;
  let frame = 0;

  function couvrir(): HTMLElement {
    if (couche?.isConnected) return couche;
    couche = document.createElement("span");
    couche.className = "nova-highlight";
    couche.setAttribute("aria-hidden", "true");
    container.appendChild(couche);
    container.dataset.novaHighlight = "";
    return couche;
  }

  function mesurer(): void {
    if (!isBrowser) return;
    const range = trouverRange(container, config.text);
    const hote = couvrir();
    hote.textContent = "";

    if (!range) {
      config.onMiss?.();
      return;
    }

    const cadre = container.getBoundingClientRect();
    const [padX, padY] = config.padding;

    // Un rectangle par ligne visuelle : c'est exactement ce que rend
    // `getClientRects` sur un Range, et c'est pour ça qu'on passe par lui
    // plutôt que par le rectangle englobant.
    const lignes = Array.from(range.getClientRects()).filter(
      (rect) => rect.width > 0 && rect.height > 0,
    );

    lignes.forEach((rect, index) => {
      const bande = document.createElement("span");
      bande.className = `nova-highlight__band${
        config.className ? ` ${config.className}` : ""
      }`;
      bande.style.left = `${rect.left - cadre.left - padX}px`;
      bande.style.top = `${rect.top - cadre.top - padY}px`;
      bande.style.width = `${rect.width + padX * 2}px`;
      bande.style.height = `${rect.height + padY * 2}px`;
      bande.style.setProperty("--nova-highlight-duration", `${config.duration}ms`);
      bande.style.setProperty(
        "--nova-highlight-delay",
        `${index * config.stagger}ms`,
      );
      hote.appendChild(bande);
    });

    range.detach?.();
  }

  /** Une seule re-mesure par image, quelle que soit la source du signal. */
  function planifier(): void {
    if (frame) return;
    frame = requestAnimationFrame(() => {
      frame = 0;
      mesurer();
    });
  }

  function play(): void {
    container.dataset.novaHighlightState = "shown";
  }

  function arm(): void {
    detachInView?.();
    detachInView = null;
    if (!isBrowser) return;

    if (config.trigger === "manual") return;
    if (config.trigger === "mount" || isAlreadyInView(container)) return play();

    detachInView = observeInView(container, (visible) => visible && play(), {
      rootMargin: config.rootMargin,
      threshold: config.threshold,
      once: true,
    });
  }

  if (isBrowser) {
    mesurer();
    arm();

    if (typeof ResizeObserver !== "undefined") {
      resizeObserver = new ResizeObserver(planifier);
      resizeObserver.observe(container);
    }
    // Le contenu peut changer sous nos pieds — un rendu progressif, une
    // traduction qui arrive. On ne surveille pas notre propre couche, sinon
    // chaque mesure en déclencherait une autre.
    if (typeof MutationObserver !== "undefined") {
      mutationObserver = new MutationObserver((mutations) => {
        const nôtre = mutations.every(
          (m) => m.target === couche || couche?.contains(m.target),
        );
        if (!nôtre) planifier();
      });
      mutationObserver.observe(container, {
        childList: true,
        subtree: true,
        characterData: true,
      });
    }
    // Une police qui arrive après coup redistribue tous les retours à la ligne.
    document.fonts?.ready.then(planifier).catch(() => {});
  }

  return {
    element: container,
    play,
    update(next) {
      const texteChange = next.text !== undefined && next.text !== config.text;
      config = mergeOptions(config, next);
      if (texteChange) {
        container.dataset.novaHighlightState = "";
        mesurer();
        arm();
      } else {
        mesurer();
      }
    },
    destroy() {
      if (frame) cancelAnimationFrame(frame);
      detachInView?.();
      detachInView = null;
      resizeObserver?.disconnect();
      resizeObserver = null;
      mutationObserver?.disconnect();
      mutationObserver = null;
      couche?.remove();
      couche = null;
      delete container.dataset.novaHighlight;
      delete container.dataset.novaHighlightState;
    },
  };
}
