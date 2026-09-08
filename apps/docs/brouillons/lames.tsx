"use client";

import { useEffect, useMemo, useState } from "react";

import { Plaque, Repere } from "@/components/plaque";

/**
 * Lames — dix variations du rideau à lames.
 *
 * Le rideau `blades` de `Loader` est aujourd'hui une seule chorégraphie : des
 * lames verticales qui se retirent vers le haut, de gauche à droite. Cette
 * planche existe pour trancher s'il en mérite d'autres, et lesquelles — donc
 * pour REGARDER dix candidats dans les mêmes conditions plutôt que d'en
 * imaginer neuf.
 *
 * TROIS DÉCISIONS DE MÉTHODE, et ce sont elles qui rendent la comparaison
 * utilisable :
 *
 *  - **une seule horloge.** Les dix vignettes partagent un état et un jeu de
 *    minuteries. Dix cycles indépendants dériveraient en quelques secondes, et
 *    on comparerait des instants différents en croyant comparer des gestes ;
 *  - **le même budget pour tous.** `exitMs` est le temps que dure la sortie,
 *    point. Chaque variation répartit ce budget entre l'étalement de ses
 *    pièces et la course de chacune — 40 % et 55 %, 5 % de marge, la même
 *    règle que le moteur. Une variation qui dépasserait son budget serait
 *    coupée net, et paraîtrait simplement ratée ;
 *  - **la boucle est le mode par défaut.** Un rideau dure une seconde : on ne
 *    juge pas un geste d'une seconde en le regardant une fois. Le banc n'est
 *    pas la vitrine, le mouvement continu y est un outil.
 *
 * Ce que le brouillon doit prouver avant d'aller dans `packages/core` :
 *
 *  1. l'état par défaut est visible — le voile n'est monté qu'au premier effet
 *     client, donc en SSR et sans JavaScript la vignette est découverte ;
 *  2. le mouvement réduit est respecté — rien n'est monté du tout, et la
 *     planche le dit au lieu de faire semblant ;
 *  3. aucune boucle d'animation propre — le JavaScript pose des attributs et
 *     des variables, le CSS anime. Il n'y a pas un seul `requestAnimationFrame`
 *     dans ce fichier, et c'est ce qui permettrait de porter n'importe laquelle
 *     de ces dix chorégraphies dans `engines/loader.ts` sans rien réécrire :
 *     elles ne demandent au moteur qu'un rang et une origine par pièce.
 */

type Etat = "couvert" | "sortie" | "fini";

interface Variation {
  id: string;
  nom: string;
  /** Ce que cette variation change, et donc ce qu'on est en train de juger. */
  note: string;
  /** Découpe du voile. Une lame verticale est une colonne sur un rang. */
  grille: (lames: number) => { colonnes: number; rangs: number };
  /** Ordre de départ d'une pièce. 0 part en premier ; l'échelle est libre. */
  rang: (col: number, rang: number, colonnes: number, rangs: number) => number;
  /** Origine de transformation, quand elle dépend de la pièce. */
  origine?: (col: number, rang: number, colonnes: number, rangs: number) => string;
}

/* Une grille reste lisible en vignette tant qu'elle garde peu de rangs : à
   six colonnes sur six rangs, on ne lit plus une vague, on lit du bruit. */
const rangsDeGrille = (lames: number) => Math.max(2, Math.round(lames / 2));

const VARIATIONS: Variation[] = [
  {
    id: "rideau",
    nom: "Rideau",
    note: "La référence. Lames verticales, retrait vers le haut, de gauche à droite.",
    grille: (n) => ({ colonnes: n, rangs: 1 }),
    rang: (col) => col,
  },
  {
    id: "alterne",
    nom: "Alterné",
    note: "Une lame sur deux part vers le bas. Le rideau se déchire au lieu de se lever.",
    grille: (n) => ({ colonnes: n, rangs: 1 }),
    rang: (col) => col,
    origine: (col) => (col % 2 === 1 ? "50% 100%" : "50% 0%"),
  },
  {
    id: "centre",
    nom: "Depuis le centre",
    note: "Les lames du milieu cèdent d'abord, les bords ferment la marche. Le regard part du sujet.",
    grille: (n) => ({ colonnes: n, rangs: 1 }),
    rang: (col, _r, colonnes) => Math.abs(col - (colonnes - 1) / 2),
  },
  {
    id: "accordeon",
    nom: "Accordéon",
    note: "Les lames se replient latéralement vers le centre, par paires, au lieu de monter.",
    grille: (n) => ({ colonnes: n, rangs: 1 }),
    rang: (col, _r, colonnes) =>
      (colonnes - 1) / 2 - Math.abs(col - (colonnes - 1) / 2),
    origine: (col, _r, colonnes) => (col < colonnes / 2 ? "0% 50%" : "100% 50%"),
  },
  {
    id: "persienne",
    nom: "Persienne",
    note: "Lames horizontales, retrait vers la gauche, de haut en bas. Le rideau devient store.",
    grille: (n) => ({ colonnes: 1, rangs: n }),
    rang: (_c, rang) => rang,
  },
  {
    id: "volet",
    nom: "Volet",
    note: "Chaque lame pivote sur son bord, comme une jalousie qu'on ouvre. Seule variation en perspective.",
    grille: (n) => ({ colonnes: n, rangs: 1 }),
    rang: (col) => col,
  },
  {
    id: "glissement",
    nom: "Glissement",
    note: "Les lames ne se réduisent pas : elles sortent du cadre par le haut, en gardant leur masse.",
    grille: (n) => ({ colonnes: n, rangs: 1 }),
    rang: (col) => col,
  },
  {
    id: "diagonale",
    nom: "Diagonale",
    note: "Le voile devient grille, et la vague part du coin. Le grain est plus fin que la lame.",
    grille: (n) => ({ colonnes: n, rangs: rangsDeGrille(n) }),
    rang: (col, rang) => col + rang,
  },
  {
    id: "damier",
    nom: "Damier",
    note: "La même grille en deux passes : une case sur deux, puis l'autre moitié. Le fond apparaît en négatif.",
    grille: (n) => ({ colonnes: n, rangs: rangsDeGrille(n) }),
    rang: (col, rang, colonnes, rangs) =>
      ((col + rang) % 2) * (colonnes + rangs) + (col + rang) / 2,
  },
  {
    id: "lisere",
    nom: "Liseré",
    note: "Le retrait laisse filer un trait d'accent sur le bord de chaque lame. Ce qui reste du bord.",
    grille: (n) => ({ colonnes: n, rangs: 1 }),
    rang: (col) => col,
  },
];

/**
 * La feuille de la planche, posée une fois.
 *
 * Elle vit ici et pas dans `nova.css` : un brouillon ne s'installe pas dans la
 * feuille de la librairie avant d'avoir été choisi. Le jour où une variation
 * gagne, ses trois règles partent dans `nova.css` sous le nom du moteur.
 *
 * Toutes les chorégraphies sont des TRANSITIONS sur une pièce, déclenchées par
 * un attribut. Aucune n'a besoin de connaître le temps qui passe.
 */
const FEUILLE = `
.lm {
  position: relative;
  overflow: hidden;
  isolation: isolate;
}

/* L'état par défaut est ce qu'on découvre : le voile se pose par-dessus. */
.lm__voile {
  position: absolute;
  inset: 0;
  z-index: 2;
}
.lm__voile[data-nova-lames-state="fini"] {
  display: none;
}

.lm__piece {
  position: absolute;
  background: var(--nova-lames-couleur, var(--banc-haut));
  transform-origin: var(--lm-origine, 50% 0%);
  transition-property: transform, opacity;
  transition-duration: var(--nova-lames-course, 550ms);
  transition-timing-function: var(--nova-ease-expo, cubic-bezier(0.16, 1, 0.3, 1));
  transition-delay: var(--lm-retard, 0ms);
}

/* Le joint : sans lui les pièces forment un aplat, et on ne voit pas ce qui
   se retire — seulement que quelque chose a disparu. La variable --filet est
   à trois points de --banc-haut et ne se voyait pas : il faut --filet-vif. */
.lm__piece {
  box-shadow: inset -1px 0 0 var(--filet-vif), inset 0 -1px 0 var(--filet-vif);
}

/* ── Les dix chorégraphies. Une déclaration chacune, sur l'état de sortie. ── */

[data-lm="rideau"] .lm__piece,
[data-lm="centre"] .lm__piece,
[data-lm="alterne"] .lm__piece,
[data-lm="lisere"] .lm__piece {
  transform-origin: var(--lm-origine, 50% 0%);
}
[data-lm="rideau"][data-nova-lames-state="sortie"] .lm__piece,
[data-lm="centre"][data-nova-lames-state="sortie"] .lm__piece,
[data-lm="alterne"][data-nova-lames-state="sortie"] .lm__piece,
[data-lm="lisere"][data-nova-lames-state="sortie"] .lm__piece {
  transform: scaleY(0);
}

[data-lm="accordeon"][data-nova-lames-state="sortie"] .lm__piece,
[data-lm="persienne"][data-nova-lames-state="sortie"] .lm__piece {
  transform: scaleX(0);
}
[data-lm="persienne"] .lm__piece {
  transform-origin: 0% 50%;
}

[data-lm="volet"] {
  perspective: 900px;
}
[data-lm="volet"] .lm__piece {
  transform-origin: 0% 50%;
  backface-visibility: hidden;
}
[data-lm="volet"][data-nova-lames-state="sortie"] .lm__piece {
  transform: rotateY(-84deg);
  opacity: 0.15;
}

[data-lm="glissement"][data-nova-lames-state="sortie"] .lm__piece {
  transform: translateY(-101%);
}

[data-lm="diagonale"] .lm__piece,
[data-lm="damier"] .lm__piece {
  transform-origin: 50% 50%;
}
[data-lm="diagonale"][data-nova-lames-state="sortie"] .lm__piece {
  transform: scale(0);
}
[data-lm="damier"][data-nova-lames-state="sortie"] .lm__piece {
  transform: rotate(10deg) scale(0);
}

/* Le liseré : il RIDE le bord bas de la lame pendant qu'elle remonte. Sans
   lui, la lame semble s'évaporer ; avec lui, on voit un bord se retirer. */
[data-lm="lisere"] .lm__piece::after {
  content: "";
  position: absolute;
  inset: auto 0 0 0;
  height: 2px;
  background: var(--signal);
  transform: scaleX(0);
  transform-origin: 0 50%;
  transition: transform calc(var(--nova-lames-course, 550ms) * 0.5) ease-out
    var(--lm-retard, 0ms);
}
[data-lm="lisere"][data-nova-lames-state="sortie"] .lm__piece::after {
  transform: scaleX(1);
}

/* Ce qu'on découvre vit dans <Plaque> : la planche d'étalonnage, la même que
   sur la fiche du Loader. Trois fonds y sont passés avant — une mire de
   grosses rayures qui gagnait contre les lames, un faux article dont le titre
   se faisait hacher en plein passage, et une mire d'imprimeur juste mais
   banale. Voir l'en-tête de components/plaque.tsx. */

/* Le repère du voile s'efface avant les lames : il appartient au voile, pas à
   la page, et le voir traverser le retrait le ferait flotter. */
.lm__mot {
  position: absolute;
  inset: 0;
  z-index: 1;
  display: grid;
  place-items: center;
  transition:
    opacity calc(var(--nova-lames-course, 550ms) * 0.5) ease-in,
    transform calc(var(--nova-lames-course, 550ms) * 0.5) ease-in;
}
[data-nova-lames-state="sortie"] .lm__mot {
  opacity: 0;
  transform: translateY(-0.5rem);
}

/* Sans JavaScript, et en mouvement réduit, aucune de ces règles ne s'applique
   puisque aucun voile n'est monté. La garde est ici pour le cas où un voile
   serait déjà dans l'arbre au moment où l'utilisateur change de réglage. */
@media (prefers-reduced-motion: reduce) {
  .lm__voile { display: none !important; }
}
`;

interface ProprietesLames {
  /** Nombre de lames, ou de colonnes pour les variations en grille. */
  lames?: number;
  /** Temps de couverture avant la sortie, en ms. */
  holdMs?: number;
  /** Durée de la sortie, en ms. Tout tient dedans, dernière pièce comprise. */
  exitMs?: number;
  /** Temps découvert avant que la boucle ne recouvre, en ms. */
  pauseMs?: number;
  /** Rejoue en continu. C'est le mode d'usage du banc. */
  boucle?: boolean;
  /** Id d'une variation pour l'examiner seule, ou "" pour la planche. */
  solo?: string;
}

export function Lames({
  lames = 6,
  holdMs = 700,
  exitMs = 1000,
  pauseMs = 900,
  boucle = true,
  solo = "",
}: ProprietesLames) {
  const [reduit, setReduit] = useState(false);
  const [monte, setMonte] = useState(false);
  const [etat, setEtat] = useState<Etat>("couvert");
  const [tour, setTour] = useState(0);
  /* La prop `solo` du banc n'est qu'une VALEUR DE DÉPART : on clique ensuite
     une vignette pour l'isoler. Le banc remonte le brouillon quand ses props
     changent, donc la graine se réapplique quand on l'édite en JSON. */
  const [isole, setIsole] = useState(solo);
  const [enBoucle, setEnBoucle] = useState(boucle);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const lire = () => setReduit(media.matches);
    lire();
    media.addEventListener("change", lire);
    return () => media.removeEventListener("change", lire);
  }, []);

  /**
   * L'horloge unique.
   *
   * Un cycle = couvrir, tenir, sortir, découvrir. Le retour à l'état couvert
   * passe par un REMONTAGE (`tour`), jamais par un changement d'attribut :
   * repasser de `fini` à `couvert` rejouerait la transition à l'envers, et on
   * verrait les lames redescendre — ce qui n'est pas le geste qu'on juge.
   */
  useEffect(() => {
    if (reduit) return;
    setMonte(true);

    const minuteries: Array<ReturnType<typeof setTimeout>> = [];
    function cycle() {
      setTour((n) => n + 1);
      setEtat("couvert");
      minuteries.push(setTimeout(() => setEtat("sortie"), holdMs));
      minuteries.push(
        setTimeout(() => {
          setEtat("fini");
          if (enBoucle) minuteries.push(setTimeout(cycle, pauseMs));
        }, holdMs + exitMs),
      );
    }
    cycle();

    return () => {
      for (const minuterie of minuteries) clearTimeout(minuterie);
    };
  }, [holdMs, exitMs, pauseMs, enBoucle, reduit]);

  const affichees = useMemo(
    () => (isole ? VARIATIONS.filter((v) => v.id === isole) : VARIATIONS),
    [isole],
  );

  return (
    <div
      className="w-full"
      /* Les variables sont préfixées `--nova-` pour que la télémétrie du banc
         les lise : un brouillon qui ne se laisse pas mesurer ne prouve rien. */
      style={
        {
          "--nova-lames-exit": `${exitMs}ms`,
          "--nova-lames-course": `${exitMs * 0.55}ms`,
        } as React.CSSProperties
      }
    >
      <style>{FEUILLE}</style>

      {/* Tout à gauche : la télémétrie du banc est posée en absolu au coin haut
          droit de la scène, et un en-tête en `justify-between` passait dessous. */}
      <div className="mb-4 flex flex-wrap items-center gap-x-5 gap-y-2 lg:pr-64">
        <p className="cote">
          {isole ? "1 variation isolée" : `${VARIATIONS.length} variations`} ·{" "}
          {lames} lames · sortie {exitMs} ms
        </p>
        {isole ? (
          <button
            type="button"
            onClick={() => setIsole("")}
            className="cote lien hover:text-encre"
          >
            revenir à la planche
          </button>
        ) : null}
        <button
          type="button"
          onClick={() => setEnBoucle((b) => !b)}
          aria-pressed={enBoucle}
          className="cote lien hover:text-encre"
        >
          boucle · {enBoucle ? "en marche" : "arrêtée"}
        </button>
      </div>

      {reduit ? (
        <p className="max-w-[62ch] text-sm leading-relaxed text-prose">
          Mouvement réduit demandé : aucun voile n&apos;est monté. Ce n&apos;est
          pas un rideau plus court, c&apos;est l&apos;absence de rideau — la
          page est immédiatement lisible, ce qui est le comportement attendu et
          non une dégradation.
        </p>
      ) : (
        <div
          className={
            isole
              ? "mx-auto w-full max-w-[560px] lg:mt-10"
              : "grid w-full gap-x-4 gap-y-6 grid-cols-2 sm:grid-cols-3 xl:grid-cols-5 lg:mt-10"
          }
        >
          {affichees.map((variation) => (
            <Vignette
              key={`${variation.id}-${tour}`}
              variation={variation}
              lames={lames}
              exitMs={exitMs}
              etat={etat}
              monte={monte}
              isole={Boolean(isole)}
              onIsoler={() => setIsole(isole ? "" : variation.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * Une vignette : ce qu'on découvre, et le voile qui le couvrait.
 *
 * La mire compte. Un rideau qui se lève sur du vide ne démontre rien — on ne
 * saurait pas dire si le voile s'est retiré ou s'il a simplement disparu. Un
 * motif régulier rend le passage lisible : on voit la lame couper la rayure.
 */
function Vignette({
  variation,
  lames,
  exitMs,
  etat,
  monte,
  isole,
  onIsoler,
}: {
  variation: Variation;
  lames: number;
  exitMs: number;
  etat: Etat;
  monte: boolean;
  isole: boolean;
  onIsoler: () => void;
}) {
  const pieces = useMemo(() => {
    const { colonnes, rangs } = variation.grille(lames);

    // Le rang le plus tardif fixe l'échelle : chaque variation compte ses
    // pièces comme elle veut, et l'étalement se normalise ensuite. C'est ce
    // qui permet de comparer une vague sur trente cases à une vague sur six
    // lames en gardant le MÊME budget de sortie.
    let rangMax = 0;
    for (let col = 0; col < colonnes; col++) {
      for (let rang = 0; rang < rangs; rang++) {
        rangMax = Math.max(rangMax, variation.rang(col, rang, colonnes, rangs));
      }
    }

    // 40 % d'étalement, 55 % de course, 5 % de marge — la règle du moteur.
    // Une transition démarre à l'image SUIVANTE, jamais au poser de
    // l'attribut : sans cette marge, la dernière pièce est coupée.
    const etalement = exitMs * 0.4;

    const liste: Array<{
      cle: string;
      style: React.CSSProperties;
    }> = [];

    for (let rang = 0; rang < rangs; rang++) {
      for (let col = 0; col < colonnes; col++) {
        const position = variation.rang(col, rang, colonnes, rangs);
        const retard = rangMax > 0 ? (position / rangMax) * etalement : 0;
        liste.push({
          cle: `${col}-${rang}`,
          style: {
            left: `${(col / colonnes) * 100}%`,
            top: `${(rang / rangs) * 100}%`,
            // Un pixel de recouvrement : à largeur exacte, l'arrondi
            // sous-pixel laisse une raie du fond entre deux pièces, et on
            // croit voir un défaut de rendu là où il n'y a qu'un joint.
            width: `calc(${100 / colonnes}% + 1px)`,
            height: `calc(${100 / rangs}% + 1px)`,
            ["--lm-retard" as string]: `${retard}ms`,
            ...(variation.origine
              ? {
                  ["--lm-origine" as string]: variation.origine(
                    col,
                    rang,
                    colonnes,
                    rangs,
                  ),
                }
              : {}),
          },
        });
      }
    }
    return liste;
  }, [variation, lames, exitMs]);

  return (
    <figure className="m-0">
      <button
        type="button"
        onClick={onIsoler}
        aria-label={
          isole ? `Revenir à la planche` : `Isoler la variation ${variation.nom}`
        }
        className="lm block w-full cursor-pointer border border-filet bg-banc text-left transition-colors hover:border-filet-vif focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-signal"
        style={{ aspectRatio: isole ? "16 / 9" : "4 / 3" }}
      >
        {/* Ce qu'on découvre. Toujours dans l'arbre : c'est l'état par défaut.
            La planche d'étalonnage, la même que sur la fiche du Loader — et
            c'est précisément parce qu'elle se lit À MOITIÉ COUVERTE qu'elle
            sert ici : une courbe entamée dit au pixel où en est le retrait, et
            c'est comme cela que deux chorégraphies se départagent. En vignette
            il ne reste que le dessin, sans l'appareil autour. */}
        <Plaque dense={!isole} />

        {/* Le voile. Monté au premier effet client seulement. */}
        {monte ? (
          <span
            className="lm__voile"
            data-lm={variation.id}
            data-nova-lames-state={etat}
          >
            {pieces.map((piece) => (
              <span key={piece.cle} className="lm__piece" style={piece.style} />
            ))}
            {/* Le repère n'a de sens QU'ISOLÉ. Sur la planche, il tombe pile
                sur la cible de la mire qu'il couvre : deux croix au même
                endroit ne font pas une rime, elles font une tache. Le voile
                se distingue déjà par sa valeur, --banc-haut sur --banc. */}
            {isole ? (
              <span className="lm__mot">
                <Repere />
              </span>
            ) : null}
          </span>
        ) : null}
      </button>

      <figcaption className="mt-2.5">
        <p className="valeur text-[12px] text-encre">{variation.nom}</p>
        <p className="mt-1 text-[12px] leading-relaxed text-second">
          {variation.note}
        </p>
      </figcaption>
    </figure>
  );
}
