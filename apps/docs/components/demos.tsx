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
   * dans une carte de largeur imposée.
   */
  compact?: boolean;
}

function Scene({
  children,
  onRejouer,
  compact,
  className,
}: {
  children: React.ReactNode;
  onRejouer?: () => void;
  compact?: boolean;
  className?: string;
}) {
  return (
    <div
      className={[
        "relative flex items-center justify-center overflow-hidden rounded-nova border border-filet bg-surface",
        // Hauteur FIXE en grille : sans elle, les rangées deviennent
        // dentelées et l'œil ne peut plus balayer le catalogue.
        compact ? "h-52 p-5" : "min-h-52 p-8",
        className ?? "",
      ].join(" ")}
    >
      {children}
      {onRejouer ? (
        <button
          type="button"
          onClick={onRejouer}
          className="cote absolute bottom-3 right-4 transition-colors hover:text-encre"
        >
          rejouer
        </button>
      ) : null}
    </div>
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

export function DemoReveal({ forme = "slide-up", compact }: PropsDemo) {
  const { cle, rejouer } = useRejeu(forme);
  return (
    <Scene onRejouer={rejouer} compact={compact}>
      <RevealGroup
        key={cle}
        repeat
        stagger={110}
        variant={forme as never}
        className="grid w-full max-w-sm grid-cols-3 gap-3"
      >
        {[0, 1, 2, 3, 4, 5].map((index) => (
          <div
            key={index}
            className="aspect-square rounded-nova border border-filet bg-surface-haute"
          />
        ))}
      </RevealGroup>
    </Scene>
  );
}

export function DemoScrambleText({ forme = "interval", compact }: PropsDemo) {
  const boucle = forme === "interval";
  const { cle, rejouer } = useRejeu(forme);
  return (
    <Scene onRejouer={rejouer} compact={compact}>
      <p className="text-center">
        <ScrambleText
          key={cle}
          text="INCANDESCENCE"
          trigger={boucle ? "view" : "hover"}
          interval={boucle ? 5000 : 0}
          replayOnHover
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

export function DemoCounter({ forme = "localise", compact }: PropsDemo) {
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
    <Scene onRejouer={rejouer} compact={compact}>
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

export function DemoTextEffect({ forme = "line", compact }: PropsDemo) {
  const { cle, rejouer } = useRejeu(forme);
  const defilement = DEFILEMENT.has(forme);

  return (
    <Scene onRejouer={defilement ? undefined : rejouer} compact={compact}>
      <div className="w-full text-center">
        <TextEffect
          key={cle}
          as="p"
          text={
            defilement
              ? "Le conseil que nous vendons, nous le pratiquons d'abord sur nous-mêmes."
              : "Bâtir en verre"
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
        {defilement ? (
          <span className="cote mt-4 block">
            effet de défilement — descendez la page pour le lire
          </span>
        ) : null}
      </div>
    </Scene>
  );
}

export function DemoMarquee({ forme = "left", compact }: PropsDemo) {
  const vertical = forme === "up" || forme === "down";
  const { cle, rejouer } = useRejeu(forme);

  return (
    <Scene onRejouer={rejouer} compact={compact}>
      {vertical ? (
        <Marquee
          key={cle}
          direction={forme as never}
          speed={38}
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

export function DemoScrollMarquee({ compact }: PropsDemo) {
  const { cle, rejouer } = useRejeu();
  return (
    <Scene onRejouer={rejouer} compact={compact}>
      <div className="w-full">
        <ScrollMarquee key={cle} drift={40} gap="1.5rem" className="py-2">
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

export function DemoRollText({ compact }: PropsDemo) {
  return (
    <Scene compact={compact}>
      <div className="flex flex-col items-center gap-5">
        <button
          type="button"
          className="rounded-nova border border-filet px-6 py-2.5 font-mono text-sm tracking-wider text-sourdine transition-colors hover:border-encre hover:text-encre"
        >
          <RollText text="Nous écrire" />
        </button>
        <span className="cote">survolez le bouton, pas le mot</span>
      </div>
    </Scene>
  );
}

export function DemoSpotlight({ compact }: PropsDemo) {
  return (
    <div
      className={[
        "relative flex items-center justify-center overflow-hidden rounded-nova border border-filet bg-surface",
        compact ? "h-52 p-5" : "min-h-52 p-8",
      ].join(" ")}
    >
      <Spotlight radius="13rem" />
      <div className="relative text-center">
        <p className="text-sourdine">Promenez le curseur dans ce panneau.</p>
        <span className="cote mt-4 block">
          inactif au tactile et en mouvement réduit
        </span>
      </div>
    </div>
  );
}

/**
 * Le curseur n'est pas monté sur le site : c'est un composant de la
 * librairie, pas une signature imposée à toutes les pages. La démonstration
 * le met donc en marche à la demande, et le retire quand on la quitte.
 */
export function DemoCursor({ forme = "blob", compact }: PropsDemo) {
  const [actif, setActif] = useState(false);
  return (
    <Scene compact={compact}>
      <div className="text-center">
        {actif ? <Cursor key={forme} variant={forme as never} /> : null}
        <button
          type="button"
          onClick={() => setActif((v) => !v)}
          aria-pressed={actif}
          className={[
            "rounded-nova border px-5 py-2 font-mono text-sm tracking-wider transition-colors",
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
 * à charger, et elle montre le cas qui reproduit l'œil de KaopyX.
 */
function couvertureAnneau(x: number, y: number): number {
  const dx = x - 0.5;
  const dy = (y - 0.5) * 1.15;
  const anneau = 1 - Math.abs(Math.hypot(dx, dy) - 0.3) / 0.16;
  return Math.max(0, Math.min(1, anneau));
}

export function DemoHalftone({ forme = "square", compact }: PropsDemo) {
  return (
    <Scene compact={compact}>
      <div className="text-center">
        <Halftone
          alt=""
          source={couvertureAnneau}
          cols={40}
          steps={4}
          shape={forme as never}
          pointerBoost={0.5}
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

export function DemoGraph({ compact }: PropsDemo) {
  const { cle, rejouer } = useRejeu();
  return (
    <div className="relative">
      <Graph
        key={cle}
        nodes={NOEUDS}
        edges={ARETES}
        colors={{ scroll: "#c93c08", texte: "#101013", pointeur: "#8b8b95" }}
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
        edgeColor="#d4d4da"
        labelColor="#62626c"
        autoCycle={1900}
        settleVisible={70}
        padding={56}
        canvasClassName={[
          compact ? "h-52" : "h-56",
          "w-full rounded-nova border border-filet bg-surface",
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

export function DemoConfetti({ forme = "mixed", compact }: PropsDemo) {
  const tirer = useConfetti({
    // Sur fond blanc, une palette claire disparaît : on assombrit.
    colors: ["#c93c08", "#101013", "#8b8b95"],
    count: 70,
  });
  return (
    <Scene compact={compact}>
      <button
        type="button"
        onClick={() => tirer({ shape: forme as never })}
        className="rounded-nova border border-signal px-6 py-2.5 font-mono text-sm tracking-wider text-signal transition-colors hover:bg-signal hover:text-fond"
      >
        TIRER
      </button>
    </Scene>
  );
}

export function DemoBlinds({ forme = "vertical", compact }: PropsDemo) {
  const { cle, rejouer } = useRejeu(forme);
  return (
    <Scene onRejouer={rejouer} compact={compact}>
      <Blinds
        key={cle}
        trigger="mount"
        orientation={forme as never}
        count={forme === "vertical" ? 7 : 5}
        color="var(--color-surface)"
        className={[
          compact ? "h-32 w-48" : "h-40 w-64",
          "overflow-hidden rounded-nova",
        ].join(" ")}
      >
        {/* Une mire plutôt qu'une image : la démo ne charge aucune ressource,
            et le motif rend le passage des lames lisible. */}
        <div className="h-full w-full bg-[repeating-linear-gradient(135deg,var(--color-encre)_0_10px,var(--color-surface-haute)_10px_20px)]" />
      </Blinds>
    </Scene>
  );
}

export function DemoBrushUnderline({ compact }: PropsDemo) {
  const { cle, rejouer } = useRejeu();
  return (
    <Scene onRejouer={rejouer} compact={compact}>
      <p
        key={cle}
        className={[
          "text-center font-medium tracking-tight",
          compact ? "text-lg" : "text-2xl sm:text-3xl",
        ].join(" ")}
      >
        Rendre lisible{" "}
        <BrushUnderline seed={3} trigger="mount" delay={260}>
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
export function DemoLoader({ forme = "blades", compact }: PropsDemo) {
  const { cle, rejouer } = useRejeu(forme);
  return (
    <Scene onRejouer={rejouer} compact={compact} className="isolate">
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
          <p className="font-mono text-sm tracking-[0.16em] text-sourdine">
            NOVA
          </p>
        )}
      </Loader>
      <p className="cote">le rideau se lève</p>
    </Scene>
  );
}

export function DemoFlight({ compact }: PropsDemo) {
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
    <Scene compact={compact}>
      <div className="flex w-full items-center justify-between gap-6">
        <button
          ref={source}
          type="button"
          onClick={envoyer}
          className="rounded-nova border border-filet bg-surface-haute px-4 py-2 font-mono text-xs tracking-wider text-sourdine transition-colors hover:border-encre hover:text-encre"
        >
          preuve
        </button>
        <span className="cote">→</span>
        <span
          ref={cible}
          className="flex size-10 items-center justify-center rounded-nova border border-signal font-mono text-sm text-signal"
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
export function DemoExpand({ compact }: PropsDemo) {
  const [ouvert, setOuvert] = useState(false);
  const { ref, capture, shown } = useExpand<HTMLDivElement>(ouvert);

  function basculer() {
    // Relevé AVANT la bascule : c'est le seul moment où l'état de départ est
    // encore rendu, donc mesurable.
    capture();
    setOuvert((v) => !v);
  }

  return (
    <Scene compact={compact}>
      <div className="w-full max-w-sm">
        <div
          ref={ref}
          className={cn(
            "relative overflow-hidden rounded-nova border",
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
                Relancer Dupont
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
              d&apos;encre au moment où son bord l&apos;a dépassée.
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
export function DemoSmoothScroll({ compact }: PropsDemo) {
  return (
    <Scene compact={compact}>
      <div className="text-center">
        <p className="text-sm text-muted-foreground">
          Il agit sur la page entière, pas dans un encadré.
        </p>
        <span className="cote mt-4 block">
          boucle partagée · tactile natif · absent en mouvement réduit
        </span>
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
  "roll-text": DemoRollText,
  "brush-underline": DemoBrushUnderline,
  spotlight: DemoSpotlight,
  cursor: DemoCursor,
  halftone: DemoHalftone,
  graph: DemoGraph,
  confetti: DemoConfetti,
  loader: DemoLoader,
  flight: DemoFlight,
  expand: DemoExpand,
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
}: {
  nom: string;
  forme?: string;
  compact?: boolean;
}) {
  const Composant = demos[nom];
  if (!Composant) return null;
  return <Composant forme={forme} compact={compact} />;
}
