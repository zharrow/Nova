"use client";

import { useRef, useState } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Reveal,
  RevealGroup,
  ScrambleText,
  Counter,
  TextEffect,
  Marquee,
  ScrollMarquee,
  RollText,
  Spotlight,
  Cursor,
  Halftone,
  Graph,
  useConfetti,
  BrushUnderline,
  Blinds,
  Loader,
  useFlight,
  useExpand,
  ScrollScene,
  SmoothScroll,
  TextHighlight,
  Lightbox,
} from "@nova-ui/react";

/**
 * Démonstrations vivantes.
 *
 * Chaque démo utilise le vrai composant, avec les vraies options — rien n'est
 * simulé. Elles reçoivent toutes une `forme` : c'est le sélecteur de la fiche
 * qui la pilote, parce qu'une entrée du catalogue est une famille et non une
 * pièce unique (voir VARIANTES.md).
 *
 * REJEU. Tout ce qui s'anime tout seul porte un bouton « rejouer ». Le rejeu
 * passe par un remontage : retirer puis reposer une classe ne suffit pas —
 * React regroupe les deux mises à jour et l'animation ne repart jamais.
 *
 * Trois composants n'en ont pas, et c'est volontaire : RollText, Spotlight et
 * Cursor n'ont pas d'animation propre. Leur effet EST le geste du visiteur.
 * Un bouton « rejouer » y serait une commande morte.
 *
 * Les démos qui s'animent à l'entrée en vue sont montées avec `repeat` ou
 * `trigger="mount"` : sinon le garde-fou de Nova les laisserait affichées
 * d'emblée. Dans un encadré déjà à l'écran c'est le comportement correct en
 * production, mais on ne verrait jamais l'effet.
 */

export interface PropsDemo {
  forme?: string;
  /**
   * Vignette de grille : hauteur fixe et typographie réduite.
   *
   * Les démonstrations restent VIVANTES en grille — c'est ce qui distingue un
   * catalogue de composants d'une liste de liens — mais elles doivent tenir
   * dans une case de largeur imposée.
   */
  compact?: boolean;
  /** Emprise de la case, déclarée par la famille dans `lib/catalogue.ts`. */
  geometrie?: Geometrie;
  /** Nom posé sur le plancher de la scène, sur les fiches. */
  nomAffiche?: string;
  /**
   * Réglages manipulés en direct sous la scène, sur les fiches.
   *
   * Les clés sont les NOMS RÉELS des props du composant Nova : chaque démo se
   * contente donc de les étaler après ses propres valeurs, et le réglage du
   * visiteur gagne. En grille l'objet est absent, et rien ne change.
   */
  reglages?: Record<string, unknown>;
}

/**
 * Géométrie d'une scène. Elle vient du MOUVEMENT, pas de l'importance de la
 * famille : un marquee est une bande, un halftone est un carré. Enfermer les
 * vingt-et-un dans le même rectangle de 208 px effaçait précisément ce qui
 * les distingue. Voir DESIGN.md.
 */
export type Geometrie = "bande" | "bloc" | "carre" | "champ";

const HAUTEURS: Record<Geometrie, string> = {
  bande: "h-[180px]",
  bloc: "h-[250px]",
  carre: "h-[250px]",
  champ: "min-h-[clamp(300px,52vh,560px)]",
};

/**
 * Le banc : la mise en scène d'une démonstration.
 *
 * UN PLAN, PAS UNE BOÎTE. Filet haut, filet bas, aucun filet vertical, aucun
 * rayon — les bords verticaux fabriquent une carte, les retirer fabrique une
 * bande. C'est l'écart principal de la direction, et le seul geste qui retire
 * l'apparence de carte à vingt-et-un éléments d'un coup.
 *
 * En mode `compact` (une case du catalogue), le banc est NU : la case fournit
 * déjà le cadre et l'étiquette, un second cadre à l'intérieur ferait deux
 * bordures concentriques.
 */
function Scene({
  children,
  onRejouer,
  compact,
  geometrie = "bloc",
  nom,
  className,
}: {
  children: React.ReactNode;
  onRejouer?: () => void;
  compact?: boolean;
  geometrie?: Geometrie;
  /** Nom de la famille, posé sur le plancher de la scène. Fiches seulement. */
  nom?: string;
  className?: string;
}) {
  const aire = (
    <div
      className={[
        "relative flex items-center overflow-hidden",
        // On centre ce qui rayonne, on aligne à gauche ce qui se lit — le
        // choix est fait par chaque démo via `className`, le défaut est le
        // centrage parce que la majorité des scènes sont des figures.
        "justify-center",
        compact ? `${HAUTEURS[geometrie]} p-5` : `${HAUTEURS.champ} px-6 sm:px-12`,
        className ?? "",
      ].join(" ")}
    >
      {children}
      {/* En grille, le rejeu n'a pas de plancher où se poser : il flotte au
          coin, mais reste un mot souligné et non un bouton encadré. */}
      {compact && onRejouer ? (
        <button
          type="button"
          onClick={onRejouer}
          className="lien cote absolute bottom-2 right-3 bg-banc px-1.5 opacity-0 transition-opacity hover:text-encre focus-visible:opacity-100 group-hover:opacity-100"
        >
          rejouer
        </button>
      ) : null}
    </div>
  );

  if (compact) return aire;

  return (
    <div className="banc">
      {aire}
      {/* Le plancher : la légende est DANS la scène, sur son filet du bas. */}
      <div className="flex items-baseline justify-between gap-4 border-t border-filet px-4 py-2.5 sm:px-6">
        <span className="titre text-[1.05rem] text-second transition-colors">
          {nom ?? ""}
        </span>
        {onRejouer ? (
          <button
            type="button"
            onClick={onRejouer}
            className="lien cote shrink-0 hover:text-encre"
          >
            rejouer
          </button>
        ) : null}
      </div>
    </div>
  );
}

/**
 * Mire de démonstration — calculée, jamais chargée.
 *
 * Plusieurs démos ont besoin de « quelque chose à révéler » : un rideau qui se
 * lève sur du vide ne démontre rien, une visionneuse qui agrandit un aplat gris
 * non plus. Un dégradé neutre était le remplissage muet que DESIGN.md interdit
 * — il ne dit ni ce qu'on regarde, ni que quelque chose a bougé.
 *
 * Un motif régulier, lui, rend le passage lisible : on voit la lame couper la
 * rayure, on voit la bulle grandir parce que le pas de trame grandit avec elle.
 */
function Mire({
  motif = "rayures",
  className,
}: {
  motif?: "rayures" | "trame" | "grille";
  className?: string;
}) {
  const fonds: Record<string, string> = {
    rayures:
      "repeating-linear-gradient(135deg, var(--encre) 0 8px, transparent 8px 18px)",
    trame: "radial-gradient(var(--encre) 30%, transparent 32%)",
    grille:
      "linear-gradient(var(--encre) 1px, transparent 1px), linear-gradient(90deg, var(--encre) 1px, transparent 1px)",
  };
  const tailles: Record<string, string> = {
    rayures: "auto",
    trame: "10px 10px",
    grille: "18px 18px",
  };
  return (
    <div
      aria-hidden
      className={["opacity-[0.55]", className ?? ""].join(" ")}
      style={{ backgroundImage: fonds[motif], backgroundSize: tailles[motif] }}
    />
  );
}

/**
 * Remonte ses enfants à chaque appel de `rejouer`.
 *
 * La clé inclut la forme courante : changer de forme depuis le sélecteur
 * remonte donc aussi, et l'effet se joue au lieu d'apparaître déjà fini.
 */
function useRejeu(cleExterne?: string) {
  const [tour, setTour] = useState(0);
  return {
    cle: `${cleExterne ?? ""}-${tour}`,
    rejouer: () => setTour((n) => n + 1),
  };
}

export function DemoReveal({ forme = "slide-up", compact, geometrie, nomAffiche, reglages }: PropsDemo) {
  const { cle, rejouer } = useRejeu(forme);
  return (
    <Scene onRejouer={rejouer} compact={compact} geometrie={geometrie} nom={nomAffiche}>
      <RevealGroup
        key={cle}
        repeat
        stagger={110}
        variant={forme as never}
        {...reglages}
        className="grid w-full max-w-sm grid-cols-3 gap-3"
      >
        {/* Numérotées, les pastilles montrent l'ordre d'arrivée. Mais un
            aplat ne montre pas un MASQUE : sans texture, la variante `mask` se
            confond avec un simple fondu. La mire donne au bord du masque de
            quoi se voir passer, et aux variantes `slide-*` de quoi trahir leur
            direction. */}
        {[1, 2, 3, 4, 5, 6].map((index) => (
          <div
            key={index}
            className="relative flex aspect-square items-center justify-center overflow-hidden rounded-presse border border-filet bg-banc-haut"
          >
            <Mire motif="grille" className="absolute inset-0" />
            <span className="valeur relative text-[13px] text-encre">
              {String(index).padStart(2, "0")}
            </span>
          </div>
        ))}
      </RevealGroup>
    </Scene>
  );
}

export function DemoScrambleText({ forme = "interval", compact, geometrie, nomAffiche, reglages }: PropsDemo) {
  const boucle = forme === "interval";
  const { cle, rejouer } = useRejeu(forme);
  return (
    <Scene onRejouer={rejouer} compact={compact} geometrie={geometrie} nom={nomAffiche}>
      <p className="text-center">
        <ScrambleText
          key={cle}
          text="INCANDESCENCE"
          trigger={boucle ? "view" : "hover"}
          interval={boucle ? 5000 : 0}
          replayOnHover
          {...reglages}
          className={
            compact
              ? "font-mono text-base tracking-[0.1em]"
              : "font-mono text-2xl tracking-[0.12em] sm:text-3xl"
          }
        />
        <span className="cote mt-4 block">
          {boucle
            ? "il se rejoue seul — et le survol le relance"
            : "survolez le mot"}
        </span>
      </p>
    </Scene>
  );
}

export function DemoCounter({ forme = "localise", compact, geometrie, nomAffiche, reglages }: PropsDemo) {
  const { cle, rejouer } = useRejeu(forme);

  /* Type explicite : sans lui, TypeScript infère trois formes de cellules
     différentes selon la branche, et l'union n'a plus aucune propriété en
     commun à lire. */
  type Cellule = {
    valeur: number;
    legende: string;
    decimales?: number;
    suffixe?: string;
    locale?: string;
    devise?: string;
  };

  const cellules: Cellule[] =
    forme === "brut"
      ? [
          { valeur: 12480, legende: "identifiants" },
          { valeur: 994, legende: "requêtes" },
          { valeur: 37, legende: "projets" },
        ]
      : forme === "monetaire"
        ? [
            { valeur: 12480, devise: "EUR", legende: "chiffre d'affaires" },
            { valeur: 990, devise: "EUR", legende: "panier moyen" },
            { valeur: 37, devise: "EUR", legende: "abonnement" },
          ]
        : [
            { valeur: 12480, locale: "fr-FR", legende: "visiteurs" },
            {
              valeur: 99.4,
              decimales: 1,
              suffixe: " %",
              locale: "fr-FR",
              legende: "disponibilité",
            },
            { valeur: 37, locale: "fr-FR", legende: "projets" },
          ];

  const visibles = compact ? cellules.slice(0, 1) : cellules;

  return (
    <Scene onRejouer={rejouer} compact={compact} geometrie={geometrie} nom={nomAffiche}>
      <div
        key={cle}
        className={[
          "grid w-full text-center",
          compact ? "grid-cols-1" : "grid-cols-3 gap-6",
        ].join(" ")}
      >
        {visibles.map((cellule) => (
          <div key={cellule.legende}>
            <Counter
              to={cellule.valeur}
              decimals={cellule.decimales}
              suffix={cellule.suffixe}
              locale={cellule.locale ?? (cellule.devise ? "fr-FR" : undefined)}
              format={
                cellule.devise
                  ? {
                      style: "currency",
                      currency: cellule.devise,
                      maximumFractionDigits: 0,
                    }
                  : undefined
              }
              duration={1800}
              {...reglages}
              trigger="mount"
              className={
                compact
                  ? "block font-mono text-2xl tabular-nums"
                  : "block font-mono text-xl tabular-nums sm:text-2xl"
              }
            />
            <span className="cote mt-2 block">{cellule.legende}</span>
          </div>
        ))}
      </div>
    </Scene>
  );
}

const DEFILEMENT = new Set(["reading", "reading-blur", "highlight"]);

/* Le grain que le moteur déduit de l'effet — voir `LETTER_GRAIN` dans
   `engines/text-effect.ts`. Recopié ici plutôt qu'exporté : c'est un détail de
   présentation de la fiche, pas un contrat public du moteur. */
const GRAIN_LETTRE = new Set(["letter", "wave", "weight", "roll"]);

export function DemoTextEffect({ forme = "line", compact, geometrie, nomAffiche, reglages }: PropsDemo) {
  const { cle, rejouer } = useRejeu(forme);
  const defilement = DEFILEMENT.has(forme);

  return (
    <Scene onRejouer={defilement ? undefined : rejouer} compact={compact} geometrie={geometrie} nom={nomAffiche}>
      <div className="w-full text-center">
        <TextEffect
          key={cle}
          as="p"
          {...reglages}
          /* « Bâtir en verre » faisait trois mots : sur un effet dont la
             matière EST le décalage entre les grains, trois mots ne montrent
             rien. Une phrase entière rend le `stagger` lisible, et la
             différence entre un grain mot et un grain lettre devient visible
             au lieu d'être une note de bas de page. */
          text={
            defilement
              ? "Le conseil que nous vendons, nous le pratiquons d'abord sur nous-mêmes."
              : "Bâtir en verre, tenir la lumière"
          }
          effect={forme as never}
          trigger={defilement ? undefined : "mount"}
          className={
            defilement
              ? compact
                ? "mx-auto max-w-[22ch] text-sm leading-snug"
                : "mx-auto max-w-[24ch] text-lg leading-snug sm:text-xl"
              : compact
                ? "text-xl font-medium tracking-tight"
                : "text-3xl font-medium tracking-tight sm:text-4xl"
          }
        />
        {/* Le grain est la seule chose qui distingue certaines des dix-sept
            formes entre elles : le taire rendait la famille illisible. */}
        <span className="cote mt-4 block">
          {defilement
            ? "effet de défilement — descendez la page pour le lire"
            : `grain ${GRAIN_LETTRE.has(forme) ? "lettre" : "mot"} · ${forme}`}
        </span>
      </div>
    </Scene>
  );
}

export function DemoMarquee({ forme = "left", compact, geometrie, nomAffiche, reglages }: PropsDemo) {
  const vertical = forme === "up" || forme === "down";
  const { cle, rejouer } = useRejeu(forme);

  return (
    <Scene onRejouer={rejouer} compact={compact} geometrie={geometrie} nom={nomAffiche}>
      {vertical ? (
        <Marquee
          key={cle}
          direction={forme as never}
          speed={38}
          {...reglages}
          className={[
            compact ? "h-32" : "h-40",
            "w-full max-w-xs [mask-image:linear-gradient(transparent,#000_22%,#000_78%,transparent)]",
          ].join(" ")}
        >
          {[
            "ISO 27001",
            "NIS 2",
            "DORA",
            "RGPD",
            "SOC 2",
            "PCI DSS",
            "HDS",
            "SecNumCloud",
          ].map((référentiel) => (
            <span
              key={référentiel}
              className="block py-2 text-center font-mono text-sm text-sourdine"
            >
              {référentiel}
            </span>
          ))}
        </Marquee>
      ) : (
        <div className="w-full">
          <Marquee
            key={cle}
            direction={forme as never}
            speed={70}
            {...reglages}
            gap="2.5rem"
            pauseOnHover
            className="py-2"
          >
            {["ATELIER", "VERRE", "MÉTAL", "LUMIÈRE", "TRAME"].map((mot) => (
              <span
                key={mot}
                className="mr-10 font-mono text-lg tracking-[0.18em] text-sourdine"
              >
                {mot}
              </span>
            ))}
          </Marquee>
          <span className="cote mt-5 block text-center">
            survolez pour suspendre
          </span>
        </div>
      )}
    </Scene>
  );
}

export function DemoScrollMarquee({ compact, geometrie, nomAffiche, reglages }: PropsDemo) {
  const { cle, rejouer } = useRejeu();
  return (
    <Scene onRejouer={rejouer} compact={compact} geometrie={geometrie} nom={nomAffiche}>
      <div className="w-full">
        <ScrollMarquee key={cle} drift={40} gap="1.5rem" className="py-2" {...reglages}>
          {["PRÉVOIR", "SÉCURISER", "LIBÉRER"].map((mot) => (
            <span
              key={mot}
              className="mr-6 inline-flex items-center gap-6 font-mono text-lg tracking-[0.16em] text-sourdine"
            >
              {mot}
              <i data-nova-marquee-arrow className="not-italic text-signal">
                →
              </i>
            </span>
          ))}
        </ScrollMarquee>
        <span className="cote mt-5 block text-center">
          faites défiler — la bande suit, et recule si vous remontez
        </span>
      </div>
    </Scene>
  );
}

/* --- Sans rejeu : l'effet EST le geste du visiteur ----------------------- */

export function DemoRollText({ compact, geometrie, nomAffiche, reglages }: PropsDemo) {
  return (
    <Scene compact={compact} geometrie={geometrie} nom={nomAffiche}>
      <div className="flex flex-col items-center gap-5">
        <button
          type="button"
          className="rounded-presse border border-filet px-6 py-2.5 font-mono text-sm tracking-wider text-sourdine transition-colors hover:border-encre hover:text-encre"
        >
          <RollText text="Nous écrire" />
        </button>
        <span className="cote">survolez le bouton, pas le mot</span>
      </div>
    </Scene>
  );
}

export function DemoSpotlight({ compact, geometrie, nomAffiche, reglages }: PropsDemo) {
  return (
    <Scene compact={compact} geometrie={geometrie} nom={nomAffiche}>
      <Spotlight radius="13rem" {...reglages} />
      {/* Le halo doit avoir quelque chose à ÉCLAIRER. Avant, il balayait un
          panneau vide avec une phrase au milieu : l'effet fonctionnait, mais
          il n'y avait rien à repérer, donc rien à comprendre. Un champ
          d'étiquettes presque éteintes fait du halo ce qu'il est — un outil de
          repérage, pas une lueur décorative. */}
      <div className="relative grid w-full grid-cols-3 gap-x-6 gap-y-2 sm:grid-cols-4">
        {[
          "ticker", "in-view", "reveal", "marquee",
          "scramble", "halftone", "confetti", "blinds",
          "loader", "flight", "expand", "lightbox",
          "spotlight", "cursor", "counter", "graph",
        ].map((mot) => (
          <span key={mot} className="valeur text-[11px] text-encre/25">
            {mot}
          </span>
        ))}
      </div>
      <span className="cote absolute bottom-3 left-4">
        promenez le curseur — inactif au tactile
      </span>
    </Scene>
  );
}

/**
 * Le curseur n'est pas monté sur le site : c'est un composant de la
 * librairie, pas une signature imposée à toutes les pages. La démonstration
 * le met donc en marche à la demande, et le retire quand on la quitte.
 */
export function DemoCursor({ forme = "blob", compact, geometrie, nomAffiche, reglages }: PropsDemo) {
  const [actif, setActif] = useState(false);
  return (
    <Scene compact={compact} geometrie={geometrie} nom={nomAffiche}>
      <div className="text-center">
        {actif ? <Cursor key={forme} variant={forme as never} /> : null}
        {/* La forme au repos, avant même d'activer : sans elle, la vignette du
            catalogue ne montrait qu'un bouton, et on ne savait pas de quoi on
            parlait. */}
        <div className="mb-5 flex items-center justify-center gap-6" aria-hidden>
          {forme === "dot-ring" ? (
            <>
              <span className="size-1.5 rounded-full bg-encre" />
              <span className="-ml-[1.35rem] size-9 rounded-full border border-encre/50" />
            </>
          ) : (
            <span className="size-9 rounded-full bg-encre/70" />
          )}
        </div>
        <button
          type="button"
          onClick={() => setActif((v) => !v)}
          aria-pressed={actif}
          className={[
            "rounded-presse border px-5 py-2 font-mono text-sm tracking-wider transition-colors",
            actif
              ? "border-signal bg-signal text-fond"
              : "border-filet text-sourdine hover:border-encre hover:text-encre",
          ].join(" ")}
        >
          {actif ? "Désactiver" : "Activer sur cette page"}
        </button>
        <p className="cote mt-4">
          {actif
            ? "survolez un lien — le disque grossit"
            : "il n'est pas monté par défaut sur ce site"}
        </p>
      </div>
    </Scene>
  );
}

/**
 * Une forme calculée plutôt qu'une image : la démo n'a alors aucune ressource
 * à charger, et elle montre le cas le plus intéressant du moteur : une
 * fonction de couverture, plutôt qu'un pixel source.
 */
function couvertureAnneau(x: number, y: number): number {
  const dx = x - 0.5;
  const dy = (y - 0.5) * 1.15;
  const anneau = 1 - Math.abs(Math.hypot(dx, dy) - 0.3) / 0.16;
  return Math.max(0, Math.min(1, anneau));
}

export function DemoHalftone({ forme = "square", compact, geometrie, nomAffiche, reglages }: PropsDemo) {
  return (
    <Scene compact={compact} geometrie={geometrie} nom={nomAffiche}>
      <div className="text-center">
        <Halftone
          alt=""
          source={couvertureAnneau}
          cols={40}
          steps={4}
          shape={forme as never}
          pointerBoost={0.5}
          {...reglages}
          className={[
            compact ? "h-28 w-28" : "h-44 w-44",
            "mx-auto text-encre",
          ].join(" ")}
        />
        <span className="cote mt-4 block">
          les modules grossissent sous le curseur — ils ne bougent pas
        </span>
      </div>
    </Scene>
  );
}

const NOEUDS = [
  { id: "reveal", label: "Reveal", group: "scroll" },
  { id: "text", label: "TextEffect", group: "texte" },
  { id: "scramble", label: "Scramble", group: "texte" },
  { id: "roll", label: "RollText", group: "texte" },
  { id: "marquee", label: "Marquee", group: "scroll" },
  { id: "scrollm", label: "ScrollMarquee", group: "scroll" },
  { id: "spot", label: "Spotlight", group: "pointeur" },
  { id: "cursor", label: "Cursor", group: "pointeur" },
];

const ARETES: [string, string][] = [
  ["reveal", "marquee"],
  ["marquee", "scrollm"],
  ["text", "scramble"],
  ["text", "roll"],
  ["scramble", "roll"],
  ["spot", "cursor"],
  ["cursor", "scrollm"],
  ["reveal", "text"],
];

export function DemoGraph({ compact, geometrie, nomAffiche, reglages }: PropsDemo) {
  const { cle, rejouer } = useRejeu();
  return (
    <div className="relative">
      <Graph
        key={cle}
        nodes={NOEUDS}
        edges={ARETES}
        /* Les teintes du graphe viennent des jetons : en dur, elles
           disparaissaient sur le fond sombre. */
        colors={{
          scroll: "var(--signal)",
          texte: "var(--encre)",
          pointeur: "var(--second)",
        }}
        groupLabels={{
          scroll: "Défilement",
          texte: "Texte",
          pointeur: "Pointeur",
        }}
        /* En aperçu, aucun groupe n'est demandé : la liste ne rend rien. La
           masquer en CSS l'aurait retirée aux lecteurs d'écran tout en
           laissant ses boutons dans l'ordre de tabulation — des cibles
           clavier invisibles. Ici il n'y a simplement rien à masquer. */
        groupOrder={compact ? [] : ["scroll", "texte", "pointeur"]}
        canvasLabel={
          compact
            ? "Aperçu d'un graphe de huit entrées. Le détail complet et navigable est sur la fiche du composant."
            : undefined
        }
        edgeColor="var(--filet-vif)"
        labelColor="var(--sourdine)"
        autoCycle={1900}
        settleVisible={70}
        padding={56}
        canvasClassName={[
          compact ? "h-52" : "h-56",
          "w-full rounded-plan border border-filet bg-banc",
        ].join(" ")}
        className="[&_[data-nova-graph-legend]]:mt-5 [&_[data-nova-graph-legend]]:grid [&_[data-nova-graph-legend]]:grid-cols-3 [&_[data-nova-graph-legend]]:gap-5 [&_h4]:mb-2 [&_h4]:font-mono [&_h4]:text-[10px] [&_h4]:uppercase [&_h4]:tracking-[0.14em] [&_h4]:text-sourdine [&_button]:text-[13px] [&_button]:text-sourdine hover:[&_button]:text-encre [&_[data-nova-graph-degree]]:font-mono [&_[data-nova-graph-degree]]:text-[11px] [&_[data-nova-graph-degree]]:opacity-60"
      />
      <button
        type="button"
        onClick={rejouer}
        className="cote absolute right-4 top-3 transition-colors hover:text-encre"
      >
        rejouer
      </button>
    </div>
  );
}

export function DemoConfetti({ forme = "mixed", compact, geometrie, nomAffiche, reglages }: PropsDemo) {
  const tirer = useConfetti({
    // Sur fond blanc, une palette claire disparaît : on assombrit.
    colors: ["#c93c08", "#101013", "#8b8b95"],
    count: 70,
  });
  return (
    <Scene compact={compact} geometrie={geometrie} nom={nomAffiche}>
      <button
        type="button"
        onClick={() => tirer({ shape: forme as never })}
        className="rounded-presse border border-signal px-6 py-2.5 font-mono text-sm tracking-wider text-signal transition-colors hover:bg-signal hover:text-fond"
      >
        TIRER
      </button>
    </Scene>
  );
}

export function DemoBlinds({ forme = "vertical", compact, geometrie, nomAffiche, reglages }: PropsDemo) {
  const { cle, rejouer } = useRejeu(forme);
  return (
    <Scene onRejouer={rejouer} compact={compact} geometrie={geometrie} nom={nomAffiche}>
      <Blinds
        key={cle}
        trigger="mount"
        orientation={forme as never}
        count={forme === "vertical" ? 7 : 5}
        color="var(--banc)"
        {...reglages}
        className={[
          compact ? "h-32 w-48" : "h-40 w-64",
          "overflow-hidden rounded-plan",
        ].join(" ")}
      >
        {/* Une mire plutôt qu'une image : la démo ne charge aucune ressource,
            et le motif rend le passage des lames lisible. */}
        <div className="h-full w-full bg-[repeating-linear-gradient(135deg,var(--color-encre)_0_10px,var(--color-surface-haute)_10px_20px)]" />
      </Blinds>
    </Scene>
  );
}

export function DemoBrushUnderline({ compact, geometrie, nomAffiche, reglages }: PropsDemo) {
  const { cle, rejouer } = useRejeu();
  return (
    <Scene onRejouer={rejouer} compact={compact} geometrie={geometrie} nom={nomAffiche}>
      <p
        key={cle}
        className={[
          "text-center font-medium tracking-tight",
          compact ? "text-lg" : "text-2xl sm:text-3xl",
        ].join(" ")}
      >
        Rendre lisible{" "}
        <BrushUnderline seed={3} trigger="mount" delay={260} {...reglages}>
          ce qui ne l&apos;est pas
        </BrushUnderline>
        .
      </p>
    </Scene>
  );
}

/**
 * Le rideau est monté DANS la scène, pas sur la page : `position: fixed` le
 * sortirait de son encadré et couvrirait tout le site. Une démonstration ne
 * doit pas faire ce que le composant ferait en production.
 */
export function DemoLoader({ forme = "blades", compact, geometrie, nomAffiche, reglages }: PropsDemo) {
  const { cle, rejouer } = useRejeu(forme);
  return (
    <Scene
      onRejouer={rejouer}
      compact={compact}
      geometrie={geometrie}
      nom={nomAffiche}
      className="isolate"
    >
      <Loader
        key={cle}
        form={forme as never}
        /* `null` : le rideau doit rejouer à chaque clic sur « rejouer ». En
           production il ne rejoue pas dans la même session. */
        sessionKey={null}
        holdMs={1600}
        exitMs={700}
        skippable={false}
        className="!absolute inset-0 !z-10 bg-surface"
      >
        {forme === "greetings" ? null : (
          <p className="valeur text-sm tracking-[0.16em] text-sourdine">NOVA</p>
        )}
      </Loader>
      {/* Un rideau qui se lève sur un mot ne démontre pas un rideau : il faut
          que la page découverte VAILLE d'être découverte, sinon on ne sait pas
          si quelque chose s'est passé. */}
      <div className="w-full max-w-sm">
        <p className="titre text-2xl leading-tight">Bâtir en verre</p>
        <p className="mt-2 text-sm leading-relaxed text-prose">
          Le rideau vient de se retirer sur cette page. C&apos;est ce
          qu&apos;elle cachait.
        </p>
        <div className="mt-4 flex gap-2">
          <span className="h-1 flex-1 bg-encre/25" />
          <span className="h-1 flex-1 bg-encre/15" />
          <span className="h-1 flex-1 bg-encre/10" />
        </div>
      </div>
    </Scene>
  );
}

export function DemoFlight({ compact, geometrie, nomAffiche, reglages }: PropsDemo) {
  const voler = useFlight({ duration: 800 });
  const source = useRef<HTMLButtonElement>(null);
  const cible = useRef<HTMLSpanElement>(null);
  const [recus, setRecus] = useState(0);

  async function envoyer() {
    if (!source.current || !cible.current) return;
    const { flew } = await voler(source.current, cible.current, {
      onArrive: () => setRecus((n) => n + 1),
    });
    // `flew: false` — source hors écran ou mouvement réduit. Le compteur a
    // quand même bougé : c'est tout l'intérêt du repli.
    if (!flew) return;
  }

  return (
    <Scene compact={compact} geometrie={geometrie} nom={nomAffiche}>
      <div className="flex w-full items-center justify-between gap-6">
        <button
          ref={source}
          type="button"
          onClick={envoyer}
          className="rounded-presse border border-filet bg-banc-haut px-4 py-2 font-mono text-xs tracking-wider text-sourdine transition-colors hover:border-encre hover:text-encre"
        >
          Ajouter au panier
        </button>
        <span className="cote">vole vers</span>
        <span
          ref={cible}
          className="flex size-10 items-center justify-center rounded-presse border border-signal font-mono text-sm text-signal"
        >
          {recus}
        </span>
      </div>
    </Scene>
  );
}

/**
 * Le geste d'Expand, sur la vraie structure attendue par le moteur : un voile,
 * des pièces appariées par `data-nova-flip-id`, des lignes qui n'existent que
 * dépliées, un chevron qui se retourne.
 */
export function DemoExpand({ compact, geometrie, nomAffiche, reglages }: PropsDemo) {
  const [ouvert, setOuvert] = useState(false);
  const { ref, capture, shown } = useExpand<HTMLDivElement>(ouvert);

  function basculer() {
    // Relevé AVANT la bascule : c'est le seul moment où l'état de départ est
    // encore rendu, donc mesurable.
    capture();
    setOuvert((v) => !v);
  }

  return (
    <Scene compact={compact} geometrie={geometrie} nom={nomAffiche}>
      <div className="w-full max-w-sm">
        <div
          ref={ref}
          className={cn(
            "relative overflow-hidden rounded-plan border",
            shown ? "bg-foreground text-background" : "bg-card text-foreground",
          )}
        >
          <header className="relative">
            {shown ? (
              <span data-nova-veil className="bg-card" aria-hidden />
            ) : null}
            <button
              type="button"
              onClick={basculer}
              aria-expanded={ouvert}
              className="relative flex w-full items-center gap-3 px-4 py-3 text-left"
            >
              <span
                data-nova-flip-id="titre"
                className="text-sm font-medium tracking-tight"
              >
                Relancer Dupont — 12 jours
              </span>
              <span
                data-nova-spin
                className="ml-auto inline-flex"
                aria-hidden
              >
                <ChevronDown className="size-4" />
              </span>
            </button>
            {shown ? (
              <p
                data-nova-reveal
                className="relative px-4 pb-3 text-xs opacity-80"
              >
                Dernier échange il y a douze jours.
              </p>
            ) : null}
          </header>

          {shown ? (
            <div data-nova-reveal className="border-t border-white/15 p-4 text-xs">
              Le panneau. Le voile s&apos;est retiré, et chaque pièce a changé
              d&apos;encre au moment où son bord l&apos;a dépassée. La ligne
              n&apos;a pas été remplacée : c&apos;est le MÊME nœud, mesuré avant
              et replacé après.
            </div>
          ) : null}
        </div>
        <span className="cote mt-4 block text-center">
          cliquez la ligne — GSAP Flip
        </span>
      </div>
    </Scene>
  );
}

/**
 * Le défilement lissé n'a rien à montrer dans un encadré : il agit sur la
 * page. La démonstration dit donc ce qu'il fait et ce qu'il ne fait pas,
 * plutôt que de simuler un effet dans une boîte de deux cents pixels.
 */
export function DemoSmoothScroll({ compact, geometrie, nomAffiche, reglages }: PropsDemo) {
  const [actif, setActif] = useState(false);
  return (
    <Scene compact={compact} geometrie={geometrie} nom={nomAffiche}>
      {/* Ce composant agit sur la PAGE, pas dans un encadré : le montrer dans
          une boîte serait mentir. On le monte donc pour de vrai, comme le
          curseur, et on le dit. C'est la seule démonstration honnête. */}
      {actif ? <SmoothScroll /> : null}
      <div className="text-center">
        <button
          type="button"
          onClick={() => setActif((v) => !v)}
          aria-pressed={actif}
          className={[
            "rounded-presse border px-5 py-2 font-mono text-sm tracking-wider transition-colors",
            actif
              ? "border-filet-vif text-encre"
              : "border-filet text-second hover:border-filet-vif hover:text-encre",
          ].join(" ")}
        >
          {actif ? "Désactiver" : "Activer sur cette page"}
        </button>
        <p className="cote mt-4">
          {actif
            ? "défilez la page — la molette est lissée"
            : "boucle partagée · tactile natif · absent en mouvement réduit"}
        </p>
      </div>
    </Scene>
  );
}

/**
 * La scène ne peut pas se démontrer dans un encadré : elle a besoin de trois
 * hauteurs d'écran. On montre donc ce qu'elle PRODUIT — la progression et les
 * temps nommés — pilotés par un curseur. C'est exactement ce que le moteur
 * publie, à ceci près que c'est la molette qui le fournit en production.
 */
export function DemoScrollScene({ compact, geometrie, nomAffiche, reglages }: PropsDemo) {
  const [t, setT] = useState(0.5);
  const segment = (a: number, b: number) =>
    Math.min(1, Math.max(0, (t - a) / (b - a)));
  const pulse = (a: number, p: number, b: number) =>
    t <= a || t >= b ? 0 : t < p ? (t - a) / (p - a) : (b - t) / (b - p);

  const temps = [
    { nom: "arrivee", valeur: segment(0.05, 0.4) },
    { nom: "stockage", valeur: segment(0.35, 0.75) },
    { nom: "paquet", valeur: pulse(0.2, 0.5, 0.8) },
  ];

  return (
    <Scene compact={compact} geometrie={geometrie} nom={nomAffiche}>
      <div className="w-full max-w-sm">
        <div className="flex items-baseline justify-between">
          <span className="cote">--nova-t</span>
          <span className="font-mono text-sm tabular-nums">{t.toFixed(3)}</span>
        </div>
        <input
          type="range"
          min={0}
          max={1}
          step={0.001}
          value={t}
          onChange={(e) => setT(Number(e.target.value))}
          aria-label="Progression de la scène"
          className="nova-curseur mt-2 w-full"
        />
        {/* LA SCÈNE, au-dessus de ses temps.

            Trois barres nommées `arrivee`, `stockage`, `paquet` montraient des
            nombres bouger — pas une scène. Or c'est tout le sujet du
            composant : le défilement fournit `t`, et des éléments réels s'en
            servent. Sans quelque chose qui bouge, la démonstration expliquait
            le mécanisme en cachant son résultat. */}
        <div className="relative mt-4 h-20 overflow-hidden rounded-presse border border-filet bg-banc-haut">
          {/* arrivee — un bloc qui traverse */}
          <span
            className="absolute top-3 size-6 rounded-presse bg-encre"
            style={{ left: `calc(${temps[0]!.valeur * 100}% - ${temps[0]!.valeur * 24}px)` }}
            aria-hidden
          />
          {/* stockage — une pile qui se remplit */}
          <span
            className="absolute bottom-3 left-3 h-6 bg-encre/45"
            style={{ width: `${temps[1]!.valeur * 60}%` }}
            aria-hidden
          />
          {/* paquet — une impulsion qui monte puis redescend */}
          <span
            className="absolute bottom-3 right-3 size-6 rounded-full bg-signal"
            style={{ opacity: temps[2]!.valeur, transform: `scale(${0.4 + temps[2]!.valeur * 0.6})` }}
            aria-hidden
          />
        </div>

        <ul className="mt-3 space-y-2">
          {temps.map((temp) => (
            <li key={temp.nom} className="flex items-center gap-3">
              <span className="cote w-20 shrink-0">{temp.nom}</span>
              <span className="h-1 flex-1 overflow-hidden rounded-full bg-filet">
                <span
                  className="block h-full bg-encre transition-none"
                  style={{ width: `${temp.valeur * 100}%` }}
                />
              </span>
            </li>
          ))}
        </ul>
        {!compact ? (
          <span className="cote mt-4 block">
            en production, c&apos;est la molette qui fournit t
          </span>
        ) : null}
      </div>
    </Scene>
  );
}

export function DemoTextHighlight({ compact, geometrie, nomAffiche, reglages }: PropsDemo) {
  const { cle, rejouer } = useRejeu();
  return (
    <Scene onRejouer={rejouer} compact={compact} geometrie={geometrie} nom={nomAffiche}>
      <TextHighlight
        key={cle}
        text="nous le pratiquons d'abord sur nous-mêmes"
        trigger="mount"
        {...reglages}
        className="bg-signal/20"
        as="p"
      >
        <span
          className={cn(
            "relative block max-w-[30ch] text-center leading-relaxed",
            compact ? "text-sm" : "text-base",
          )}
        >
          Le conseil que nous vendons, nous le pratiquons d&apos;abord sur
          nous-mêmes.
        </span>
      </TextHighlight>
    </Scene>
  );
}

/* Des MOTIFS, pas des aplats. Un dégradé gris qu'on agrandit reste un dégradé
   gris : rien ne prouve que la bulle a grandi. Un pas de trame qui s'écarte,
   si. */
const VIGNETTES = [
  { id: "verriere", motif: "grille" as const, titre: "Verrière" },
  { id: "claustra", motif: "rayures" as const, titre: "Claustra" },
  { id: "plancher", motif: "trame" as const, titre: "Plancher" },
];

export function DemoLightbox({ compact, geometrie, nomAffiche, reglages }: PropsDemo) {
  const [ouvert, setOuvert] = useState(false);
  const [point, setPoint] = useState<{ x: number; y: number } | null>(null);
  const [choix, setChoix] = useState(VIGNETTES[0]!);

  function ouvrir(event: React.MouseEvent, vignette: (typeof VIGNETTES)[number]) {
    // Le point du CLIC, pas le centre de la vignette : c'est de là que la
    // bulle doit naître.
    setPoint({ x: event.clientX, y: event.clientY });
    setChoix(vignette);
    setOuvert(true);
  }

  return (
    <Scene compact={compact} geometrie={geometrie} nom={nomAffiche}>
      <div className="w-full">
        <div className="grid grid-cols-3 gap-2">
          {VIGNETTES.map((vignette) => (
            <button
              key={vignette.id}
              type="button"
              onClick={(event) => ouvrir(event, vignette)}
              className="aspect-[3/2] overflow-hidden rounded-plan border border-filet bg-banc-haut transition-colors hover:border-filet-vif"
              aria-label={`Ouvrir ${vignette.titre}`}
            >
              <Mire motif={vignette.motif} className="h-full w-full" />
            </button>
          ))}
        </div>
        <span className="cote mt-4 block text-center">
          cliquez — la bulle naît sous le curseur
        </span>

        <Lightbox
          open={ouvert}
          onOpenChange={setOuvert}
          origin={point}
          aspect={3 / 2}
          title={choix.titre}
          overlayClassName="bg-foreground/70"
          className="overflow-hidden shadow-2xl"
        >
          <div
            data-nova-bloom-media
            className="h-full w-full bg-banc-haut"
          >
            {/* Le même motif que la vignette, agrandi : c'est le pas de trame
                qui s'écarte qui rend la croissance de la bulle visible. */}
            <Mire motif={choix.motif} className="h-full w-full" />
          </div>
          <figcaption
            data-nova-bloom-late
            className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-4 bg-foreground/80 px-5 py-3 text-background"
          >
            <span className="font-mono text-xs tracking-[0.14em] uppercase">
              {choix.titre}
            </span>
            <button
              type="button"
              onClick={() => setOuvert(false)}
              className="font-mono text-xs underline-offset-4 hover:underline"
            >
              fermer
            </button>
          </figcaption>
        </Lightbox>
      </div>
    </Scene>
  );
}

const demos: Record<string, (props: PropsDemo) => React.ReactElement> = {
  reveal: DemoReveal,
  blinds: DemoBlinds,
  "scramble-text": DemoScrambleText,
  counter: DemoCounter,
  "text-effect": DemoTextEffect,
  marquee: DemoMarquee,
  "scroll-marquee": DemoScrollMarquee,
  "scroll-scene": DemoScrollScene,
  "roll-text": DemoRollText,
  "brush-underline": DemoBrushUnderline,
  "text-highlight": DemoTextHighlight,
  spotlight: DemoSpotlight,
  cursor: DemoCursor,
  halftone: DemoHalftone,
  graph: DemoGraph,
  confetti: DemoConfetti,
  loader: DemoLoader,
  flight: DemoFlight,
  expand: DemoExpand,
  lightbox: DemoLightbox,
  "smooth-scroll": DemoSmoothScroll,
};

/**
 * Point d'entrée unique des démos, appelé depuis les pages serveur.
 *
 * La table de correspondance reste DANS ce module client. Un objet exporté
 * depuis un module `"use client"` ne franchit pas la frontière serveur : il
 * arrive côté serveur sous forme de référence opaque, et l'indexer renvoie
 * `undefined`. C'est donc ici, côté client, que le nom se résout en composant.
 */
export function Demo({
  nom,
  forme,
  compact,
  geometrie,
  nomAffiche,
  reglages,
}: {
  nom: string;
  forme?: string;
  compact?: boolean;
  geometrie?: Geometrie;
  nomAffiche?: string;
  reglages?: Record<string, unknown>;
}) {
  const Composant = demos[nom];
  if (!Composant) return null;
  return (
    <Composant
      forme={forme}
      compact={compact}
      geometrie={geometrie}
      nomAffiche={nomAffiche}
      reglages={reglages}
    />
  );
}
