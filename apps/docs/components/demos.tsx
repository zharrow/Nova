"use client";

import { useState } from "react";
import {
  Reveal,
  RevealGroup,
  ScrambleText,
  Counter,
  TextEffect,
  Marquee,
  useConfetti,
  ScrollMarquee,
  RollText,
  Spotlight,
  Halftone,
  Graph,
} from "@nova-ui/react";

/**
 * Démonstrations vivantes.
 *
 * Chaque démo utilise le vrai composant, avec les vraies options — rien n'est
 * simulé. Les démos qui s'animent à l'entrée en vue sont montées avec
 * `repeat`, sinon le garde-fou de Nova les laisserait affichées d'emblée :
 * dans un encadré déjà à l'écran, c'est le comportement correct en production,
 * mais on ne verrait jamais l'effet.
 */

function Scene({
  children,
  onRejouer,
}: {
  children: React.ReactNode;
  onRejouer?: () => void;
}) {
  return (
    <div className="relative flex min-h-52 items-center justify-center overflow-hidden rounded-nova border border-filet bg-surface p-8">
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

/** Remonte ses enfants à chaque appel de `rejouer`. */
function useRejeu() {
  const [cle, setCle] = useState(0);
  return { cle, rejouer: () => setCle((n) => n + 1) };
}

export function DemoReveal() {
  const { cle, rejouer } = useRejeu();
  return (
    <Scene onRejouer={rejouer}>
      <RevealGroup
        key={cle}
        repeat
        stagger={110}
        variant="slide-up"
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

export function DemoScrambleText() {
  return (
    <Scene>
      <p className="text-center">
        <ScrambleText
          text="INCANDESCENCE"
          trigger="view"
          interval={5000}
          replayOnHover
          className="font-mono text-2xl tracking-[0.12em] sm:text-3xl"
        />
        <span className="cote mt-4 block">
          il se rejoue seul — et le survol le relance
        </span>
      </p>
    </Scene>
  );
}

export function DemoCounter() {
  const { cle, rejouer } = useRejeu();
  return (
    <Scene onRejouer={rejouer}>
      <div key={cle} className="grid w-full grid-cols-3 gap-6 text-center">
        {[
          { valeur: 12480, suffixe: " €", legende: "chiffre d'affaires" },
          { valeur: 99.4, decimales: 1, suffixe: " %", legende: "disponibilité" },
          { valeur: 37, suffixe: "", legende: "projets" },
        ].map((cellule) => (
          <div key={cellule.legende}>
            <Counter
              to={cellule.valeur}
              decimals={cellule.decimales}
              suffix={cellule.suffixe}
              locale="fr-FR"
              duration={1800}
              trigger="mount"
              className="block font-mono text-xl tabular-nums sm:text-2xl"
            />
            <span className="cote mt-2 block">{cellule.legende}</span>
          </div>
        ))}
      </div>
    </Scene>
  );
}

/**
 * Les dix-sept traitements, avec leur famille et le mot d'ordre de chacun.
 * Reprend le classement du banc d'origine : ce qui se déclenche d'un côté, ce
 * qui se pilote au défilement de l'autre. Les deux ne se règlent pas pareil.
 */
const EFFETS = [
  { id: "line", nom: "Ligne", note: "Le geste fondateur. Si vous n'en gardez qu'un." },
  { id: "word", nom: "Mot", note: "Le même, décalé mot à mot. Décalage additif : ligne, puis rang." },
  { id: "letter", nom: "Lettre", note: "Le grain le plus fin. À réserver aux titres courts." },
  { id: "flip", nom: "Bascule", note: "La ligne arrive couchée et se redresse depuis son pied." },
  { id: "curtain", nom: "Rideau", note: "Rien ne se déplace : le texte se découvre par le bas." },
  { id: "blur", nom: "Flou", note: "Le texte se résout sur place, sans rien déplacer." },
  { id: "focus", nom: "Mise au point", note: "Le flou plus l'échelle — un objectif qui se règle." },
  { id: "center", nom: "Depuis le centre", note: "Le décalage suit la géométrie, pas l'ordre de lecture." },
  { id: "shear", nom: "Cisaille", note: "Le mot monte penché et se redresse : ce qui va vite se déforme." },
  { id: "wave", nom: "Vague", note: "Une course par lettre, décalée. L'onde naît du décalage." },
  { id: "tracking", nom: "Chasse", note: "L'approche s'ouvre. Le seul qui anime la typographie elle-même." },
  { id: "weight", nom: "Graisse", note: "Du trait fin au trait plein. Exige une police variable." },
  { id: "roll", nom: "Rouleau", note: "Le compteur kilométrique : deux exemplaires par lettre." },
  { id: "typewriter", nom: "Machine", note: "steps(), pas une courbe. Exige une chasse fixe." },
] as const;

const EFFETS_DEFILEMENT = [
  { id: "reading", nom: "Lecture", note: "Les mots s'allument au fil du défilement." },
  { id: "reading-blur", nom: "Lecture floue", note: "Le même, en netteté. Plus cher." },
  { id: "highlight", nom: "Surlignage", note: "Un dégradé balaie le texte. Le plus économe." },
] as const;

export function DemoTextEffect() {
  const [effet, setEffet] = useState<string>("line");
  const { cle, rejouer } = useRejeu();
  const courant =
    [...EFFETS, ...EFFETS_DEFILEMENT].find((e) => e.id === effet) ?? EFFETS[0];
  const defilement = EFFETS_DEFILEMENT.some((e) => e.id === effet);

  return (
    <div>
      <Scene onRejouer={defilement ? undefined : rejouer}>
        <TextEffect
          key={`${cle}-${effet}`}
          as="p"
          text={defilement ? "Le conseil que nous vendons, nous le pratiquons d'abord sur nous-mêmes." : "Bâtir en verre"}
          effect={effet as never}
          trigger={defilement ? undefined : "mount"}
          className={
            defilement
              ? "max-w-[22ch] text-center text-xl leading-snug sm:text-2xl"
              : "text-center text-3xl font-medium tracking-tight sm:text-4xl"
          }
        />
      </Scene>

      <div className="mt-4 flex flex-wrap gap-1.5">
        {[...EFFETS, ...EFFETS_DEFILEMENT].map((e) => (
          <button
            key={e.id}
            type="button"
            onClick={() => setEffet(e.id)}
            aria-pressed={effet === e.id}
            className={[
              "rounded-nova border px-2.5 py-1 font-mono text-[11px] transition-colors",
              effet === e.id
                ? "border-signal text-signal"
                : "border-filet text-sourdine hover:border-sourdine hover:text-encre",
            ].join(" ")}
          >
            {e.nom}
          </button>
        ))}
      </div>

      <p className="mt-3 text-[13px] leading-relaxed text-sourdine">
        <span className="text-encre">{courant.nom}.</span> {courant.note}
        {defilement ? (
          <span className="cote mt-2 block">
            effet de défilement — descendez la page pour le lire
          </span>
        ) : null}
      </p>
    </div>
  );
}

export function DemoMarquee() {
  const [axe, setAxe] = useState<"left" | "up">("left");
  return (
    <div>
      <Scene>
        {axe === "left" ? (
          <div className="w-full">
            <Marquee speed={70} gap="2.5rem" pauseOnHover className="py-2">
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
        ) : (
          <Marquee
            direction="up"
            speed={38}
            className="h-40 w-full max-w-xs [mask-image:linear-gradient(transparent,#000_22%,#000_78%,transparent)]"
          >
            {[
              "ISO 27001", "NIS 2", "DORA", "RGPD", "SOC 2",
              "PCI DSS", "HDS", "SecNumCloud",
            ].map((r) => (
              <span
                key={r}
                className="block py-2 text-center font-mono text-sm text-sourdine"
              >
                {r}
              </span>
            ))}
          </Marquee>
        )}
      </Scene>
      <div className="mt-4 flex gap-1.5">
        {(
          [
            ["left", "Horizontal"],
            ["up", "Vertical"],
          ] as const
        ).map(([valeur, libelle]) => (
          <button
            key={valeur}
            type="button"
            onClick={() => setAxe(valeur)}
            aria-pressed={axe === valeur}
            className={[
              "rounded-nova border px-2.5 py-1 font-mono text-[11px] transition-colors",
              axe === valeur
                ? "border-signal text-signal"
                : "border-filet text-sourdine hover:border-sourdine hover:text-encre",
            ].join(" ")}
          >
            {libelle}
          </button>
        ))}
      </div>
    </div>
  );
}

export function DemoScrollMarquee() {
  return (
    <div>
      <Scene>
        <div className="w-full">
          <ScrollMarquee drift={40} gap="1.5rem" className="py-2">
            {["PRÉVOIR", "SÉCURISER", "LIBÉRER"].map((mot) => (
              <span
                key={mot}
                className="mr-6 inline-flex items-center gap-6 font-mono text-lg tracking-[0.16em] text-sourdine"
              >
                {mot}
                <i
                  data-nova-marquee-arrow
                  className="not-italic text-signal transition-transform"
                >
                  →
                </i>
              </span>
            ))}
          </ScrollMarquee>
          <span className="cote mt-5 block text-center">
            faites défiler la page — la bande suit, et recule si vous remontez
          </span>
        </div>
      </Scene>
    </div>
  );
}

export function DemoRollText() {
  return (
    <Scene>
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

export function DemoSpotlight() {
  return (
    <div className="relative flex min-h-52 items-center justify-center overflow-hidden rounded-nova border border-filet bg-surface p-8">
      <Spotlight radius="13rem" />
      <div className="relative text-center">
        <p className="text-sourdine">
          Promenez le curseur dans ce panneau.
        </p>
        <span className="cote mt-4 block">
          inactif au tactile et en mouvement réduit
        </span>
      </div>
    </div>
  );
}

export function DemoCursor() {
  return (
    <Scene>
      <div className="text-center">
        <p className="text-sourdine">
          Le curseur est actif sur tout le site.
          <br />
          <span className="text-encre">Survolez un lien</span> — il grossit.
        </p>
        <span className="cote mt-5 block">
          inactif au tactile et en mouvement réduit
        </span>
      </div>
    </Scene>
  );
}

export function DemoConfetti() {
  const tirer = useConfetti({
    colors: ["#ff5b1f", "#e9e7e2", "#82868f"],
    count: 70,
  });
  return (
    <Scene>
      <button
        type="button"
        onClick={() => tirer()}
        className="rounded-nova border border-signal px-6 py-2.5 font-mono text-sm tracking-wider text-signal transition-colors hover:bg-signal hover:text-fond"
      >
        TIRER
      </button>
    </Scene>
  );
}

/**
 * Une forme calculée plutôt qu'une image : la démo n'a alors aucune ressource
 * à charger, et elle montre le cas qui reproduit l'œil de KaopyX.
 */
function couvertureNova(x: number, y: number): number {
  // Un anneau, plus dense en bas — assez de valeurs intermédiaires pour que
  // les paliers de la trame se lisent.
  const dx = x - 0.5;
  const dy = (y - 0.5) * 1.15;
  const r = Math.hypot(dx, dy);
  const anneau = 1 - Math.abs(r - 0.3) / 0.16;
  return Math.max(0, Math.min(1, anneau));
}

export function DemoHalftone() {
  const [forme, setForme] = useState<"square" | "circle">("square");
  return (
    <div>
      <Scene>
        <Halftone
          alt=""
          source={couvertureNova}
          cols={40}
          steps={4}
          shape={forme}
          pointerBoost={0.5}
          className="h-44 w-44 text-encre"
        />
      </Scene>
      <div className="mt-4 flex gap-1.5">
        {(
          [
            ["square", "Carré"],
            ["circle", "Rond"],
          ] as const
        ).map(([valeur, libelle]) => (
          <button
            key={valeur}
            type="button"
            onClick={() => setForme(valeur)}
            aria-pressed={forme === valeur}
            className={[
              "rounded-nova border px-2.5 py-1 font-mono text-[11px] transition-colors",
              forme === valeur
                ? "border-signal text-signal"
                : "border-filet text-sourdine hover:border-sourdine hover:text-encre",
            ].join(" ")}
          >
            {libelle}
          </button>
        ))}
      </div>
      <p className="mt-3 text-[13px] text-sourdine">
        Promenez le curseur : les modules grossissent sous lui, ils ne bougent
        pas. Une trame dont les modules se déplacent n&apos;est plus une trame.
      </p>
    </div>
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

export function DemoGraph() {
  return (
    <Graph
      nodes={NOEUDS}
      edges={ARETES}
      colors={{ scroll: "#ff5b1f", texte: "#e9e7e2", pointeur: "#82868f" }}
      groupLabels={{
        scroll: "Défilement",
        texte: "Texte",
        pointeur: "Pointeur",
      }}
      groupOrder={["scroll", "texte", "pointeur"]}
      edgeColor="#21252c"
      labelColor="#82868f"
      autoCycle={1900}
      settleVisible={70}
      padding={56}
      canvasClassName="h-56 w-full rounded-nova border border-filet bg-surface"
      className="[&_[data-nova-graph-legend]]:mt-5 [&_[data-nova-graph-legend]]:grid [&_[data-nova-graph-legend]]:grid-cols-3 [&_[data-nova-graph-legend]]:gap-5 [&_h4]:mb-2 [&_h4]:font-mono [&_h4]:text-[10px] [&_h4]:uppercase [&_h4]:tracking-[0.14em] [&_h4]:text-sourdine [&_button]:text-[13px] [&_button]:text-sourdine hover:[&_button]:text-encre [&_[data-nova-graph-degree]]:font-mono [&_[data-nova-graph-degree]]:text-[11px] [&_[data-nova-graph-degree]]:opacity-60"
    />
  );
}

const demos: Record<string, () => React.ReactElement> = {
  reveal: DemoReveal,
  "scramble-text": DemoScrambleText,
  counter: DemoCounter,
  "text-effect": DemoTextEffect,
  marquee: DemoMarquee,
  "scroll-marquee": DemoScrollMarquee,
  "roll-text": DemoRollText,
  spotlight: DemoSpotlight,
  cursor: DemoCursor,
  halftone: DemoHalftone,
  graph: DemoGraph,
  confetti: DemoConfetti,
};

/**
 * Point d'entrée unique des démos, appelé depuis les pages serveur.
 *
 * La table de correspondance reste DANS ce module client. Un objet exporté
 * depuis un module `"use client"` ne franchit pas la frontière serveur : il
 * arrive côté serveur sous forme de référence opaque, et l'indexer renvoie
 * `undefined`. C'est donc ici, côté client, que le nom se résout en composant.
 */
export function Demo({ nom }: { nom: string }) {
  const Composant = demos[nom];
  if (!Composant) return null;
  return <Composant />;
}
