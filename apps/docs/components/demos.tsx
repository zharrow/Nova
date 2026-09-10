"use client";

import { createContext, useContext, useEffect, useRef, useState } from "react";
import { useRaccourciRejeu } from "./raccourci-rejeu";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  catalogue,
  familles,
  CATEGORIES,
  libelleCategorie,
  type CategorieId,
} from "@/lib/catalogue";
import { Plaque, Repere } from "./plaque";
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
  Magnet,
  Halftone,
  Graph,
  useConfetti,
  BrushUnderline,
  Blinds,
  Loader,
  Progress,
  useFlight,
  useExpand,
  ScrollScene,
  SmoothScroll,
  TextHighlight,
  Lightbox,
  DatePicker,
  useFlipList,
} from "@nova-ui/react";
import { fr } from "react-day-picker/locale";

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
  /**
   * Mode NU : ni plancher, ni hauteur imposée — c'est l'appelant qui cadre.
   *
   * Le banc de test fournit sa propre scène, sa propre hauteur et son propre
   * plancher. Sans ce mode, la démonstration en apportait un second et la
   * page affichait deux barres de légende l'une sous l'autre.
   */
  nu?: boolean;
}

/**
 * Géométrie d'une scène. Elle vient du MOUVEMENT, pas de l'importance de la
 * famille : un marquee est une bande, un halftone est un carré. Enfermer les
 * toutes dans le même rectangle de 208 px effaçait précisément ce qui
 * les distingue. Voir DESIGN.md.
 */
export type Geometrie = "bande" | "bloc" | "carre" | "champ";

/**
 * En grille, les trois géométries partagent la MÊME hauteur.
 *
 * Elles ne la partageaient pas, et le relevé au navigateur a tranché : une
 * bande de 180 px à côté d'un bloc de 250 px fait remonter son étiquette, et la
 * rangée se lit en dents de scie. Sur une grille régulière — celle qu'on
 * parcourt — l'alignement des légendes vaut plus que l'annonce de la géométrie
 * par la forme du cadre.
 *
 * La géométrie du mouvement n'est pas perdue : elle vit à l'INTÉRIEUR du cadre,
 * où une bande reste basse et large et un carré reste centré. Ce qui change est
 * qu'elle ne déforme plus la grille qui l'entoure.
 */
const HAUTEUR_GRILLE = "h-[224px]";

const HAUTEURS: Record<Geometrie, string> = {
  bande: HAUTEUR_GRILLE,
  bloc: HAUTEUR_GRILLE,
  carre: HAUTEUR_GRILLE,
  champ: "min-h-[clamp(300px,52vh,560px)]",
};

/**
 * Une démonstration INERTE : présentée, pas manipulable.
 *
 * C'est le régime des cases du catalogue depuis que la carte entière est un
 * lien. Une carte cliquable et une démonstration interactive s'excluent : une
 * ancre qui enveloppe un bouton imbrique deux éléments interactifs, ce que HTML
 * interdit et qui rend le bouton inatteignable au clavier.
 *
 * Plutôt qu'une image figée — une capture par famille, à produire et à regénérer à
 * chaque retouche — la démonstration reste MONTÉE et perd seulement ses prises :
 * plus de rejeu, plus de raccourci `F`, plus de pointeur. Ce qui bouge tout seul
 * continue de bouger, ce qui répondait au geste montre son état de repos — qui
 * est exactement ce qu'il montrerait sans curseur dessus.
 *
 * Une vitrine d'animation dont le catalogue serait immobile se priverait de son
 * seul argument. La vraie démonstration, manipulable et réglable, reste sur la
 * fiche.
 *
 * Les légendes des scènes disparaissent avec l'interaction, et il le faut : la
 * moitié sont des INVITATIONS — « survolez pour suspendre », « promenez le
 * curseur » — qui mentiraient sur une case qui ne répond plus. Le cadre ne
 * montre alors que le composant, ce qui est aussi la bonne réponse visuelle :
 * une légende sous chaque cadre redoublerait l'étiquette qui
 * se trouve déjà juste en dessous.
 *
 * Un contexte plutôt qu'une prop : la faire traverser toutes les fonctions de
 * démonstration pour n'être lue que par `Scene` serait autant de signatures
 * modifiées pour un seul lecteur.
 */
const ContexteInerte = createContext(false);

/**
 * Le banc : la mise en scène d'une démonstration.
 *
 * UN PLAN, PAS UNE BOÎTE. Filet haut, filet bas, aucun filet vertical, aucun
 * rayon — les bords verticaux fabriquent une carte, les retirer fabrique une
 * bande. C'est l'écart principal de la direction, et le seul geste qui retire
 * l'apparence de carte à toutes les scènes d'un coup.
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
  nu,
  className,
}: {
  children: React.ReactNode;
  onRejouer?: () => void;
  compact?: boolean;
  geometrie?: Geometrie;
  /** Nom de la famille, posé sur le plancher de la scène. Fiches seulement. */
  nom?: string;
  /** Ni plancher ni hauteur : le banc de test cadre lui-même. */
  nu?: boolean;
  className?: string;
}) {
  /* Le nœud est tenu dans un ÉTAT, pas dans une ref : l'inscription au
     raccourci doit se refaire quand le nœud arrive, et une `useRef` ne
     provoque aucun rendu. Même mécanique que la télémétrie. */
  const [noeud, setNoeud] = useState<HTMLDivElement | null>(null);
  const inerte = useContext(ContexteInerte);
  /* En mode `nu`, c'est l'appelant qui possède le rejeu — le banc remonte la
     démonstration entière par sa clé. S'inscrire quand même ferait DEUX
     scènes inscrites sur le banc : aucune ne serait unique, et la touche ne
     viserait plus rien.

     En mode inerte, la scène n'a plus de rejeu à offrir : l'inscrire ferait
     répondre la touche `F` à une commande que la case n'affiche pas. */
  useRaccourciRejeu(nu || inerte ? null : noeud, onRejouer);

  const aire = (
    <div
      ref={compact || nu ? setNoeud : undefined}
      className={[
        "relative flex items-center overflow-hidden",
        // On centre ce qui rayonne, on aligne à gauche ce qui se lit — le
        // choix est fait par chaque démo via `className`, le défaut est le
        // centrage parce que la majorité des scènes sont des figures.
        "justify-center",
        nu
          ? // Le banc cadre la HAUTEUR, la scène garde ses marges latérales :
            // ce qui s'écrit dans le flux respire, ce qui se pose en
            // `absolute inset-0` — le rideau du Loader, sa planche — couvre
            // quand même la boîte entière. La marge posée par le banc, elle,
            // aurait rentré le rideau de 24 px et laissé un liseré de scène
            // tout autour.
            "h-full w-full px-6 sm:px-10"
          : compact
            ? // Une case du catalogue est INERTE, et c'est sa carte qui donne
              // la hauteur : l'aperçu y est un rectangle de proportion fixe.
              // Une hauteur en pixels ici entrerait en conflit avec elle. Le
              // mode compact NON inerte — la palette ⌘K — n'a pas de conteneur
              // dimensionné et garde donc la hauteur déclarée.
              `${inerte ? "h-full" : HAUTEURS[geometrie]} p-5`
            : `${HAUTEURS.champ} px-6 sm:px-12`,
        className ?? "",
      ].join(" ")}
    >
      {children}
      {/* En grille, le rejeu n'a pas de plancher où se poser : il flotte au
          coin, mais reste un mot souligné et non un bouton encadré. Il
          disparaît quand la case est inerte : un mot « rejouer » qui ne
          répond pas est pire que pas de rejeu du tout. */}
      {compact && onRejouer && !inerte ? (
        <button
          type="button"
          onClick={onRejouer}
          className="cote absolute bottom-2 right-3 flex items-center gap-1.5 bg-banc px-1.5 opacity-0 transition-opacity hover:text-encre focus-visible:opacity-100 group-hover:opacity-100"
        >
          <span className="lien">rejouer</span>
          <Touche />
        </button>
      ) : null}
    </div>
  );

  if (compact || nu) return aire;

  return (
    <div className="banc" ref={setNoeud}>
      {aire}
      {/* Le plancher : la légende est DANS la scène, sur son filet du bas. */}
      <div className="flex items-baseline justify-between gap-4 border-t border-filet px-4 py-2.5 sm:px-6">
        <span className="titre text-[1.05rem] text-second transition-colors">
          {nom ?? ""}
        </span>
        {onRejouer ? (
          /* Un BOUTON ENCADRÉ, et non plus un mot souligné.

             C'est la seule commande de la scène, et elle se tenait au même
             rang typographique qu'une légende. Le cadre bleu lui donne le rang
             de ce qu'elle est. Plus grande d'un cran aussi — 12 px au lieu de
             11 — parce qu'elle fait désormais face au nom de la famille, qui
             est à 17.

             La typographie est écrite en utilitaires plutôt qu'avec `.cote` :
             cette classe fixe la taille ET la couleur hors de toute couche, et
             ni l'une ni l'autre n'aurait cédé à une surcharge. */
          <button
            type="button"
            onClick={onRejouer}
            className="flex shrink-0 items-center gap-2 rounded-presse border border-signal px-3 py-1.5 font-mono text-[0.75rem] font-medium uppercase leading-none tracking-[0.09em] text-signal transition-colors hover:bg-signal/10"
          >
            rejouer
            <Touche />
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
 * Le badge de touche. Un raccourci qu'on ne peut pas deviner n'existe pas :
 * il est écrit à côté de la commande qu'il double, pas dans une aide.
 *
 * `sans-doigt` en retire l'affichage au doigt : sur un téléphone, ce badge
 * annonçait une touche que personne ne peut taper, à côté d'un bouton qui
 * marche. Voir `globals.css`.
 */
function Touche() {
  return (
    <kbd
      aria-hidden
      className="sans-doigt rounded-[3px] border border-signal/45 px-1.5 py-0.5 font-mono text-[10px] leading-none text-signal"
    >
      F
    </kbd>
  );
}

/**
 * La consigne d'une scène, dite dans la langue du pointeur qui la lit.
 *
 * La moitié des légendes de ce site sont des INVITATIONS — « survolez le
 * mot », « promenez le curseur ». Au doigt, elles demandent un geste qui
 * n'existe pas, à côté d'une scène qui ne répondra pas : le visiteur en
 * conclut que le composant est cassé, ce qui est exactement le contraire de
 * ce qu'une vitrine doit prouver.
 *
 * Les deux textes sont RENDUS TOUS LES DEUX et c'est le CSS qui en cache un.
 * Lire `matchMedia` en JavaScript demanderait un état, donc un second rendu,
 * donc un texte qui change sous les yeux après l'hydratation — pour une
 * ligne de onze mots.
 *
 * `doigt` absent veut dire : au doigt, cette scène n'a rien à dire. C'est le
 * cas d'un bandeau qui défile tout seul — la consigne « survolez pour
 * suspendre » n'a pas d'équivalent tactile, et son absence ne manque à
 * personne puisque la scène bouge déjà.
 */
function Consigne({
  souris,
  doigt,
  className,
}: {
  souris: string;
  doigt?: string;
  className?: string;
}) {
  const classes = ["cote", className ?? ""].join(" ");
  return (
    <>
      <span className={`sans-doigt ${classes}`}>{souris}</span>
      {doigt ? (
        <span className={`doigt-seul ${classes}`}>{doigt}</span>
      ) : null}
    </>
  );
}

/**
 * Vrai dès que le nœud est entré dans la vue, et le reste.
 *
 * Le rideau d'ouverture est la seule famille dont la démonstration ne peut pas
 * jouer au montage. Sur la grille, toutes les démos sont montées d'un
 * coup : le rideau faisait sa seconde et demie pendant que le visiteur était
 * encore en haut de page, et on n'arrivait jamais que sur l'APRÈS — une scène
 * découverte, sans avoir vu ce qui la couvrait. C'était le premier symptôme
 * de « ils passent trop vite ».
 *
 * L'attente vit dans la DÉMONSTRATION, pas dans le moteur : en production un
 * rideau couvre au montage, c'est tout son intérêt.
 */
function useEnVue<T extends HTMLElement>() {
  const [noeud, setNoeud] = useState<T | null>(null);
  const [enVue, setEnVue] = useState(false);

  useEffect(() => {
    if (!noeud || enVue) return;
    const observateur = new IntersectionObserver(
      ([entree]) => {
        if (!entree?.isIntersecting) return;
        setEnVue(true);
        observateur.disconnect();
      },
      // Plus de la moitié de la scène : un rideau aperçu par le bord de
      // l'écran serait fini avant d'être lisible.
      { threshold: 0.55 },
    );
    observateur.observe(noeud);
    return () => observateur.disconnect();
  }, [noeud, enVue]);

  return { ref: setNoeud, enVue };
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

export function DemoReveal({ forme = "slide-up", compact, geometrie, nomAffiche, reglages, nu }: PropsDemo) {
  const { cle, rejouer } = useRejeu(forme);
  return (
    <Scene onRejouer={rejouer} compact={compact} geometrie={geometrie} nom={nomAffiche} nu={nu}>
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
        {/* Un rang en aperçu, deux sur la fiche : six pastilles sur deux
            rangs ne tiennent pas dans un cadre de proportion 1,92, et trois
            suffisent à montrer le DÉCALAGE, qui est tout le sujet. */}
        {(compact ? [1, 2, 3] : [1, 2, 3, 4, 5, 6]).map((index) => (
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

export function DemoScrambleText({ forme = "interval", compact, geometrie, nomAffiche, reglages, nu }: PropsDemo) {
  const boucle = forme === "interval";
  const { cle, rejouer } = useRejeu(forme);
  return (
    <Scene onRejouer={rejouer} compact={compact} geometrie={geometrie} nom={nomAffiche} nu={nu}>
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
        <Consigne
          className="mt-4 block"
          souris={
            boucle
              ? "il se rejoue seul — et le survol le relance"
              : "survolez le mot"
          }
          /* Une tape émet l'événement `mouseenter` de compatibilité, que le
             moteur écoute : le décodage part donc bien au doigt. */
          doigt={
            boucle ? "il se rejoue seul — et la tape le relance" : "touchez le mot"
          }
        />
      </p>
    </Scene>
  );
}

export function DemoCounter({ forme = "localise", compact, geometrie, nomAffiche, reglages, nu }: PropsDemo) {
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
    <Scene onRejouer={rejouer} compact={compact} geometrie={geometrie} nom={nomAffiche} nu={nu}>
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

export function DemoTextEffect({ forme = "line", compact, geometrie, nomAffiche, reglages, nu }: PropsDemo) {
  const { cle, rejouer } = useRejeu(forme);
  const defilement = DEFILEMENT.has(forme);

  return (
    <Scene onRejouer={defilement ? undefined : rejouer} compact={compact} geometrie={geometrie} nom={nomAffiche} nu={nu}>
      <div className="w-full text-center">
        <TextEffect
          key={cle}
          as="p"
          {...reglages}
          /* UNE PHRASE, PAS TROIS MOTS. Sur un effet dont la matière EST le
             décalage entre les grains, trois mots ne montrent rien : il faut
             assez de mots pour que le `stagger` se lise et que la différence
             entre grain mot et grain lettre devienne visible.

             La phrase dit la doctrine du dépôt et rien d'autre. Aucune ne doit
             parler d'un métier, d'une marque ou d'un client — c'est de la
             provenance, et DESIGN.md dit que la vitrine n'en parle pas.

             Le texte du visiteur gagne, s'il y en a un. L'étalement des
             réglages est AVANT cette ligne : sans le `??`, la phrase codée en
             dur écraserait le champ et il ne servirait à rien. Les formes de
             défilement gardent leur paragraphe — une phrase de titre ne
             démontre pas un effet qui se joue sur toute une hauteur. */
          text={
            defilement
              ? "Un mouvement réussi ne se remarque pas : on sent le geste, jamais l'effet."
              : ((reglages?.text as string) ??
                "Le texte reste lisible, puis il s'anime")
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

export function DemoMarquee({ forme = "left", compact, geometrie, nomAffiche, reglages, nu }: PropsDemo) {
  const vertical = forme === "up" || forme === "down";
  const { cle, rejouer } = useRejeu(forme);

  return (
    <Scene onRejouer={rejouer} compact={compact} geometrie={geometrie} nom={nomAffiche} nu={nu}>
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
            {["MOUVEMENT", "MESURE", "RYTHME", "MATIÈRE", "REPOS"].map((mot) => (
              <span
                key={mot}
                className="mr-10 font-mono text-lg tracking-[0.18em] text-sourdine"
              >
                {mot}
              </span>
            ))}
          </Marquee>
          <Consigne
            className="mt-5 block text-center"
            souris="survolez pour suspendre"
          />
        </div>
      )}
    </Scene>
  );
}

export function DemoScrollMarquee({ compact, geometrie, nomAffiche, reglages, nu }: PropsDemo) {
  const { cle, rejouer } = useRejeu();
  return (
    <Scene onRejouer={rejouer} compact={compact} geometrie={geometrie} nom={nomAffiche} nu={nu}>
      <div className="w-full">
        <ScrollMarquee key={cle} drift={40} gap="1.5rem" className="py-2" {...reglages}>
          {["OBSERVER", "MESURER", "RÉGLER"].map((mot) => (
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

export function DemoRollText({ compact, geometrie, nomAffiche, reglages, nu }: PropsDemo) {
  return (
    <Scene compact={compact} geometrie={geometrie} nom={nomAffiche} nu={nu}>
      <div className="flex flex-col items-center gap-5">
        <button
          type="button"
          className="rounded-presse border border-filet px-6 py-2.5 font-mono text-sm tracking-wider text-sourdine transition-colors hover:border-encre hover:text-encre"
        >
          <RollText text="Nous écrire" />
        </button>
        <Consigne
          souris="survolez le bouton, pas le mot"
          doigt="appuyez sur le bouton, pas sur le mot"
        />
      </div>
    </Scene>
  );
}

/**
 * L'aimant se démontre à PLUSIEURS, jamais seul.
 *
 * Un bouton isolé qui penche vers le curseur ne montre rien qu'on n'ait vu
 * cent fois — et surtout, il ne montre pas ce que ce moteur fait de différent.
 * Ce qui se voit ici est l'ARBITRAGE : trois aimants dont les champs se
 * recouvrent largement, et un seul tenu à la fois. Le curseur posé entre deux
 * d'entre eux ne les fait pas pencher ensemble ; le plus proche gagne, et les
 * autres se rangent.
 *
 * L'anneau du tenu vient de `data-nova-magnet-state`, et le halo de
 * `--nova-magnet-pull` : le moteur ne dessine rien, il publie. C'est la
 * doctrine du dépôt rendue littérale sur la seule famille où le mouvement, lui,
 * ne peut pas être du CSS.
 *
 * Pas de bouton « rejouer » : l'effet EST le geste du visiteur. Une commande
 * de rejeu serait morte.
 */
export function DemoMagnet({ compact, geometrie, nomAffiche, reglages, nu }: PropsDemo) {
  return (
    <Scene compact={compact} geometrie={geometrie} nom={nomAffiche} nu={nu}>
      <div className="flex w-full flex-col items-center gap-6">
        {/* Serrés VOLONTAIREMENT : à cet écart, les rayons se recouvrent, et
            c'est exactement le cas qu'une barre de navigation produit. C'est
            là que les implémentations sans arbitre font gondoler la rangée. */}
        <div className="flex flex-wrap items-center justify-center gap-3">
          {["Travaux", "Atelier", "Contact"].map((mot) => (
            <Magnet
              key={mot}
              as="button"
              type="button"
              {...reglages}
              className={cn(
                "rounded-presse border border-filet bg-banc-haut px-5 py-2.5",
                "text-sm font-semibold text-encre",
                // Le liseré du tenu, et son halo. Deux règles de CSS branchées
                // sur ce que le moteur publie — rien à demander au moteur.
                "transition-[border-color,box-shadow] duration-150",
                "data-[nova-magnet-state=held]:border-filet-vif",
              )}
              style={{
                boxShadow:
                  "0 0 calc(var(--nova-magnet-pull, 0) * 20px) rgb(0 0 0 / 0.07)",
              }}
            >
              {mot}
            </Magnet>
          ))}
        </div>
        {compact ? null : (
          <Consigne
            souris="approchez le curseur — un seul aimant tient à la fois"
            /* Au doigt il n'y a pas d'approche, seulement un contact : l'effet
               ne se déclencherait qu'au moment d'appuyer, et déplacerait la
               cible sous le pouce. Le moteur ne monte donc rien. */
            doigt="l'aimant répond à une souris — inactif au doigt"
          />
        )}
      </div>
    </Scene>
  );
}

export function DemoSpotlight({ compact, geometrie, nomAffiche, reglages, nu }: PropsDemo) {
  return (
    <Scene compact={compact} geometrie={geometrie} nom={nomAffiche} nu={nu}>
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
      <Consigne
        className="absolute bottom-3 left-4"
        souris="promenez le curseur"
        /* Le moteur refuse le doigt par décision, pas par oubli : au tactile,
           `pointerenter` reste armé après le relâchement et le halo se fige au
           milieu du panneau. Voir `engines/spotlight.ts`. */
        doigt="le halo suit une souris — inactif au doigt"
      />
    </Scene>
  );
}

/**
 * Le curseur n'est pas monté sur le site : c'est un composant de la
 * librairie, pas une signature imposée à toutes les pages. La démonstration
 * le met donc en marche à la demande, et le retire quand on la quitte.
 */
export function DemoCursor({ forme = "blob", compact, geometrie, nomAffiche, reglages, nu }: PropsDemo) {
  const [actif, setActif] = useState(false);
  return (
    <Scene compact={compact} geometrie={geometrie} nom={nomAffiche} nu={nu}>
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
        <p className="mt-4">
          <Consigne
            souris={
              actif
                ? "survolez un lien — le disque grossit"
                : "il n'est pas monté par défaut sur ce site"
            }
            doigt="un curseur additif suppose une souris"
          />
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

export function DemoHalftone({ forme = "square", compact, geometrie, nomAffiche, reglages, nu }: PropsDemo) {
  return (
    <Scene compact={compact} geometrie={geometrie} nom={nomAffiche} nu={nu}>
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

export function DemoGraph({ compact, geometrie, nomAffiche, reglages, nu }: PropsDemo) {
  const { cle, rejouer } = useRejeu();
  return (
    /* `h-full` : Graph est la seule démonstration qui ne passe pas par
       `Scene`, donc rien ne lui transmet la hauteur du cadre. Sans elle, son
       canevas gardait ses 208 px et débordait de l'aperçu de la carte. */
    <div className="relative h-full">
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
          compact ? "h-full" : "h-56",
          "w-full rounded-plan border border-filet bg-banc",
        ].join(" ")}
        className="h-full [&_[data-nova-graph-legend]]:mt-5 [&_[data-nova-graph-legend]]:grid [&_[data-nova-graph-legend]]:grid-cols-3 [&_[data-nova-graph-legend]]:gap-5 [&_h4]:mb-2 [&_h4]:font-mono [&_h4]:text-[10px] [&_h4]:uppercase [&_h4]:tracking-[0.14em] [&_h4]:text-sourdine [&_button]:text-[13px] [&_button]:text-sourdine hover:[&_button]:text-encre [&_[data-nova-graph-degree]]:font-mono [&_[data-nova-graph-degree]]:text-[11px] [&_[data-nova-graph-degree]]:opacity-60"
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

export function DemoConfetti({ forme = "mixed", compact, geometrie, nomAffiche, reglages, nu }: PropsDemo) {
  const tirer = useConfetti({
    // Sur fond blanc, une palette claire disparaît : on assombrit.
    colors: ["#c93c08", "#101013", "#8b8b95"],
    count: 70,
  });
  return (
    <Scene compact={compact} geometrie={geometrie} nom={nomAffiche} nu={nu}>
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

export function DemoBlinds({ forme = "vertical", compact, geometrie, nomAffiche, reglages, nu }: PropsDemo) {
  const { cle, rejouer } = useRejeu(forme);
  return (
    <Scene onRejouer={rejouer} compact={compact} geometrie={geometrie} nom={nomAffiche} nu={nu}>
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

export function DemoBrushUnderline({ compact, geometrie, nomAffiche, reglages, nu }: PropsDemo) {
  const { cle, rejouer } = useRejeu();
  return (
    <Scene onRejouer={rejouer} compact={compact} geometrie={geometrie} nom={nomAffiche} nu={nu}>
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
 * La jauge — six formes, et une valeur qu'on scrube à la main.
 *
 * Le curseur `value` de la fiche EST la démonstration : on tire la valeur et
 * on voit ce que chaque forme en fait. Un bouton « rejouer » ne montrerait
 * qu'une course, toujours la même, et ne dirait rien de ce qui distingue une
 * règle graduée d'un filet.
 *
 * D'où l'absence de `onRejouer` : ce serait une commande morte, au même titre
 * que sur `Spotlight` ou `Cursor` dont l'effet EST le geste du visiteur.
 *
 * Le bouton « inconnue », lui, est la seule façon de montrer la propriété la
 * plus distinctive de la famille : une valeur qu'on ne sait pas compter est
 * MARQUÉE, pas feinte.
 */
export function DemoProgress({ forme = "bar", compact, geometrie, nomAffiche, reglages, nu }: PropsDemo) {
  const [inconnue, setInconnue] = useState(false);
  /* `?? 0.62` ne convient PAS : `null` est nullish, et un `value: null` écrit
     dans le JSON du banc redevenait 0,62 — la démonstration ne savait pas
     exprimer la propriété la plus distinctive de la famille. On distingue donc
     « absent » de « explicitement inconnu » par la présence de la clé. */
  const fourni =
    reglages && "value" in reglages ? (reglages.value as number | null) : 0.62;
  const valeur = fourni ?? 0.62;
  const compte = !inconnue && fourni !== null;

  return (
    <Scene compact={compact} geometrie={geometrie} nom={nomAffiche} nu={nu}>
      <div className="flex w-full flex-col items-center gap-5">
        <Progress
          /* `reglages` AVANT les props calculées, et après `form` : c'est la
             convention du dépôt — le JSON libre du banc écrase la forme, mais
             `value` reste calculée puisqu'elle lit déjà le réglage. */
          form={forme as never}
          {...reglages}
          value={compte ? valeur : null}
          label={compte ? undefined : "Avancement inconnu"}
          className={cn(
            "text-encre",
            forme === "ring" ? "shrink-0" : "w-full max-w-[34rem]",
          )}
        />
        {compact ? null : (
          <div className="flex items-center gap-4">
            <p className="cote tabular-nums">
              {compte ? `${Math.round(valeur * 100)} %` : "valeur inconnue"}
            </p>
            <button
              type="button"
              onClick={() => setInconnue((v) => !v)}
              aria-pressed={inconnue}
              className="cote lien hover:text-encre"
            >
              {inconnue ? "revenir au compté" : "je ne sais pas compter"}
            </button>
          </div>
        )}
      </div>
    </Scene>
  );
}

/**
 * Le rideau est monté DANS la scène, pas sur la page : `position: fixed` le
 * sortirait de son encadré et couvrirait tout le site. Une démonstration ne
 * doit pas faire ce que le composant ferait en production.
 *
 * Deux réglages qui n'en ont pas l'air.
 *
 * LE FOND EST PORTÉ PAR LA FORME, pas par la scène. Pour `blades`, ce sont les
 * LAMES le rideau : un fond opaque sur la racine les rendait décoratives — on
 * les voyait se retirer sur un panneau qui, lui, restait plein jusqu'au
 * `display: none` final. Le retrait ne découvrait rien, et la scène
 * réapparaissait d'un saut. Les trois autres formes n'ont pas de rideau propre
 * et ont donc besoin de ce fond.
 *
 * LE RIDEAU ATTEND D'ÊTRE REGARDÉ. Voir `useEnVue`.
 */
/** Les dix formes qui portent leur propre rideau de lames. */
const FORMES_A_LAMES = new Set([
  "blades", "alternate", "center", "accordion", "slats",
  "shutter", "slide", "diagonal", "checker", "edge",
]);

/**
 * La jauge d'avancement.
 *
 * Le moteur ne DESSINE rien : il pose `--nova-loader-progress` de 0 à 1, et
 * c'est au projet consommateur de décider ce qu'il en fait. La vitrine est ce
 * consommateur, et cette barre est la démonstration littérale de la division
 * du travail — trois lignes de CSS, aucune ligne de moteur.
 *
 * Neutre, et pas bleue : le bleu marque ce qui agit ou ce qui identifie, et une
 * jauge ne fait ni l'un ni l'autre — elle rend compte. Voir DESIGN.md.
 *
 * POURQUOI PAS `<Progress>` ICI. La famille `Progress` prend une valeur en
 * prop, donc un état React ; branchée sur le rideau, elle ferait rendre la
 * scène soixante fois par seconde pendant toute l'attente. Le rideau publie
 * son avancement en VARIABLE CSS précisément pour que personne n'ait à payer
 * ça — et cette barre-ci est la démonstration littérale de ce que la variable
 * permet. Sur une page qui tient déjà la valeur en état, `<Progress>` est le
 * bon choix ; ici, non.
 *
 * La valeur est écrite EN CLAIR dans le `transform`. Une classe construite à
 * l'exécution produirait un nom correct auquel ne correspondrait aucune règle,
 * et rien ne préviendrait.
 */
function JaugeLoader() {
  return (
    <span
      aria-hidden
      className="mx-auto mt-4 block h-px w-24 overflow-hidden bg-filet"
    >
      <span
        className="block h-full w-full origin-left bg-second"
        style={{ transform: "scaleX(var(--nova-loader-progress, 0))" }}
      />
    </span>
  );
}

export function DemoLoader({ forme = "blades", compact, geometrie, nomAffiche, reglages, nu }: PropsDemo) {
  const { cle, rejouer } = useRejeu(forme);
  const { ref, enVue } = useEnVue<HTMLDivElement>();
  const lames = FORMES_A_LAMES.has(forme);
  const miseEnPlace = forme === "settle";
  /* La place, tenue dans un ÉTAT et non dans une ref : le nœud n'existe pas au
     premier rendu, et une ref ne provoque aucun re-rendu quand il arrive. Voir
     le piège du portail dans CLAUDE.md — même cause, même remède. */
  const [place, setPlace] = useState<HTMLElement | null>(null);

  return (
    <Scene
      onRejouer={rejouer}
      compact={compact}
      geometrie={geometrie}
      nom={nomAffiche}
      nu={nu}
      className="isolate"
    >
      {/* L'EN-TÊTE DE LA SCÈNE, et la place que la marque doit rejoindre.
          `settleTo` reçoit ce nœud-ci et non le sélecteur par défaut : à
          l'échelle du site, la démonstration d'une fiche irait se poser dans la
          barre de navigation, ce qui est exactement le geste — mais au mauvais
          endroit. Le bleu est admis ici : la marque est ce qui IDENTIFIE. */}
      {miseEnPlace ? (
        <div className="absolute inset-x-0 top-0 z-20 flex items-center gap-2 border-b border-filet px-4 py-2.5">
          <Repere
            ref={setPlace}
            className="mx-0 h-5 text-signal"
          />
          <span className="valeur text-[11px] text-encre">Nova</span>
        </div>
      ) : null}
      {enVue ? (
        <Loader
          key={cle}
          form={forme as never}
          settleTo={place ?? undefined}
          /* `null` : le rideau doit rejouer à chaque clic sur « rejouer ». En
             production il ne rejoue pas dans la même session. */
          sessionKey={null}
          /* Ce rideau ne couvre que son encadré. En `page` — le défaut, et le
             bon en production — il retiendrait les animations d'entrée de TOUT
             le document jusqu'à sa sortie : sur une fiche, la moitié du site
             attendrait qu'une démonstration ait fini de jouer. */
          covers="element"
          /* Plus lent que le défaut de la librairie, et volontairement : sur
             une vraie page on traverse un rideau, sur une fiche on le REGARDE.
             Les curseurs de la fiche passent après et gagnent. */
          holdMs={1800}
          exitMs={1000}
          stepMs={340}
          skippable={false}
          className={cn(
            "!absolute inset-0 !z-10",
            /* Le fond appartient à la FORME, pas à la scène. Les lames sont le
               rideau, et `settle` a son propre panneau — c'est lui qui se
               rétracte. Un fond posé sur la racine ne serait jamais découpé :
               il resterait opaque pendant que le disque se referme dessous, et
               la scène ne se découvrirait pas. Les autres formes n'ont pas de
               rideau propre et ont besoin de ce fond. */
            lames || miseEnPlace ? "bg-transparent" : "bg-banc-haut",
          )}
          /* Les lames prennent le plan interne d'une scène : assez proche du
             banc pour rester du décor, assez distinct pour qu'on voie les
             joints filer l'un après l'autre. */
          style={{ ["--nova-loader-color" as string]: "var(--banc-haut)" }}
          {...reglages}
        >
          {/* Le voile porte un repère, pas un mot. La forme `greetings`
              apporte elle-même son texte et n'en veut pas un second — mais la
              jauge, elle, vaut pour toutes : c'est la seule surface du site où
              l'on voit que le rideau REND COMPTE de son attente. */}
          {/* HAUTEUR EXPLICITE. `Repere` se dimensionne en `clamp(28px, 32%,
              64px)`, et `.nova-loader__content` n'a pas de hauteur définie :
              le pourcentage ne résout rien, la déclaration tombe, et le
              repère mesurait 0 × 0 — invisible depuis toujours sur cette
              démonstration, sans que rien ne le signale. Ailleurs il vit dans
              une boîte en `inset: 0`, où les 32 % ont un référent. */}
          {forme === "greetings" ? null : (
            <Repere className={cn("h-12", miseEnPlace && "text-second")} />
          )}
          {/* La forme `settle` ne rend pas compte d'une attente : elle DÉPLACE
              la marque. Une jauge y serait un second sujet, et le geste n'en a
              qu'un. */}
          {miseEnPlace ? null : <JaugeLoader />}
        </Loader>
      ) : null}
      {/* Un rideau qui se lève sur du vide ne démontre pas un rideau : il faut
          que ce qu'on découvre VAILLE d'être découvert. La planche trace la
          courbe qui fait bouger le rideau lui-même — le seul fond qui ne
          pouvait venir que d'ici — et se laisse lire à moitié couverte, ce
          qu'un titre ne fait pas : il se fait hacher et on lit « Bâti… ». */}
      <div className="absolute inset-0" ref={ref}>
        <Plaque dense={compact} />
      </div>
    </Scene>
  );
}

export function DemoFlight({ compact, geometrie, nomAffiche, reglages, nu }: PropsDemo) {
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
    <Scene compact={compact} geometrie={geometrie} nom={nomAffiche} nu={nu}>
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
export function DemoExpand({ compact, geometrie, nomAffiche, reglages, nu }: PropsDemo) {
  const [ouvert, setOuvert] = useState(false);
  const { ref, capture, shown } = useExpand<HTMLDivElement>(ouvert);

  function basculer() {
    // Relevé AVANT la bascule : c'est le seul moment où l'état de départ est
    // encore rendu, donc mesurable.
    capture();
    setOuvert((v) => !v);
  }

  return (
    <Scene compact={compact} geometrie={geometrie} nom={nomAffiche} nu={nu}>
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
export function DemoSmoothScroll({ compact, geometrie, nomAffiche, reglages, nu }: PropsDemo) {
  const [actif, setActif] = useState(false);
  return (
    <Scene compact={compact} geometrie={geometrie} nom={nomAffiche} nu={nu}>
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
export function DemoScrollScene({ compact, geometrie, nomAffiche, reglages, nu }: PropsDemo) {
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
    <Scene compact={compact} geometrie={geometrie} nom={nomAffiche} nu={nu}>
      <div className="w-full max-w-sm">
        {/* Le relevé de `t` est de la LECTURE, pas de la scène : en aperçu il
            prend vingt pixels sur les cent quatorze disponibles pour montrer
            un nombre que personne ne peut plus faire bouger. */}
        {!compact ? (
          <div className="flex items-baseline justify-between">
            <span className="cote">--nova-t</span>
            <span className="font-mono text-sm tabular-nums">{t.toFixed(3)}</span>
          </div>
        ) : null}
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

export function DemoTextHighlight({ compact, geometrie, nomAffiche, reglages, nu }: PropsDemo) {
  const { cle, rejouer } = useRejeu();
  return (
    <Scene onRejouer={rejouer} compact={compact} geometrie={geometrie} nom={nomAffiche} nu={nu}>
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
          Un mouvement réussi ne se remarque pas : on sent le geste, jamais
          l&apos;effet.
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

export function DemoLightbox({ compact, geometrie, nomAffiche, reglages, nu }: PropsDemo) {
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
    <Scene compact={compact} geometrie={geometrie} nom={nomAffiche} nu={nu}>
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

/**
 * Le sélecteur de date.
 *
 * Pas de bouton « rejouer », et c'est la même règle que pour RollText,
 * Spotlight et Cursor : l'effet EST le geste du visiteur. Une commande qui
 * ferait rouler les cadrans à sa place ne montrerait pas le mouvement, elle
 * montrerait une animation — or c'est justement ce que ce composant n'est pas.
 *
 * Le panneau est porté DANS la scène plutôt que dans le `body` : sur une fiche
 * il reste ainsi cadré avec ce qu'il démontre. En grille, la case est trop
 * basse pour l'accueillir, et il repart au `body` comme en production.
 */
/* Les trois formes tiennent en DEUX props, et la table le montre mieux qu'une
   cascade de ternaires : ce qui change d'une forme à l'autre est par où l'on
   commence et où l'on s'arrête, pas le composant. */
const FORMES_DATE: Record<string, { granularity: "day" | "month"; startWith: "day" | "month" }> = {
  day: { granularity: "day", startWith: "day" },
  "month-first": { granularity: "day", startWith: "month" },
  month: { granularity: "month", startWith: "month" },
};

export function DemoDatePicker({ forme = "day", compact, geometrie, nomAffiche, reglages, nu }: PropsDemo) {
  const [scene, setScene] = useState<HTMLDivElement | null>(null);
  const [valeur, setValeur] = useState<Date | null>(new Date(1995, 8, 12));
  const reglage = FORMES_DATE[forme] ?? FORMES_DATE.day!;

  return (
    <Scene
      compact={compact}
      geometrie={geometrie}
      nom={nomAffiche}
      nu={nu}
      /* En fiche, le déclencheur est en haut : le panneau s'ouvre dessous et
         doit tenir dans la scène. En grille, il n'y a pas de panneau ouvert,
         et le coller en haut laissait la case aux trois quarts vide. */
      className={compact ? undefined : "items-start"}
    >
      <div ref={setScene} className={cn("relative w-full max-w-[17.5rem]", !compact && "pt-4")}>
        <DatePicker
          key={forme}
          value={valeur}
          onValueChange={setValeur}
          granularity={reglage.granularity}
          startWith={reglage.startWith}
          locale={fr}
          startYear={1940}
          endYear={2012}
          container={compact ? undefined : scene}
          labels={{
            apply: "Appliquer",
            clear: "Vider",
            months: "Mois",
            years: "Année",
            changeMonth: "Choisir le mois et l'année",
            day: "JJ",
            month: "MM",
            year: "AAAA",
          }}
          {...reglages}
        />
        <span className="cote mt-3 block">
          {forme === "month"
            ? "deux colonnes, rien d'autre — roulez"
            : forme === "month-first"
              ? "le mois et l'année d'abord, le jour ensuite"
              : "l'en-tête déplie les cadrans"}
        </span>
      </div>
    </Scene>
  );
}


/**
 * Flip List — le reflux d'une liste, sur la matière du dépôt.
 *
 * Ce qu'on filtre ici est LE CATALOGUE LUI-MÊME, rangé par catégorie. C'est le seul contenu qui passe le test de la nécessité — une
 * grille de rectangles gris aurait illustré n'importe quelle librairie, et du
 * faux texte aurait illustré du faux texte. Ici, la démonstration montre
 * exactement le geste pour lequel le moteur existe, sur les données de la page
 * qui l'héberge.
 *
 * PAS DE BOUTON REJOUER, et c'est la même règle que RollText, Spotlight et
 * Cursor : l'effet EST le geste du visiteur. Rejouer un filtre qu'on vient de
 * choisir soi-même serait une commande morte.
 *
 * En grille, il n'y a la place ni pour les jetons ni pour la lecture : la
 * catégorie tourne alors toute seule, parce qu'une vignette de catalogue doit
 * bouger sans qu'on la vise.
 */
function DemoFlipList({ compact, geometrie, nomAffiche, reglages, nu }: PropsDemo) {
  const groupes = ["tout", ...CATEGORIES.map((c) => c.id)];
  const [actif, setActif] = useState<string>("tout");

  /* La matière est le catalogue PUBLIÉ. Tant que rien ne l'est, la liste
     serait vide et la démonstration ne montrerait pas le geste qu'elle existe
     pour montrer : on retombe alors sur les familles déclarées. Le cas ne se
     produit que sur le banc — une fiche en ligne suppose au moins une famille
     publiée, donc aucun nom en attente ne transparaît sur la vitrine. */
  const matiere = catalogue.length > 0 ? catalogue : familles;

  const visibles = matiere.filter(
    (fiche) => actif === "tout" || fiche.categorie === actif,
  );

  const { ref, capture } = useFlipList<HTMLUListElement>(actif, {
    duration: 0.45,
    stagger: 0.02,
    ...reglages,
  });

  /* En vignette, la catégorie tourne seule. La capture précède le changement
     d'état ici aussi : c'est le même contrat qu'au clic, et l'oublier
     supprimerait le mouvement que la vignette est censée montrer. */
  useEffect(() => {
    if (!compact) return;
    const minuteur = setInterval(() => {
      capture();
      setActif((courant) => {
        const rang = groupes.indexOf(courant);
        return groupes[(rang + 1) % groupes.length]!;
      });
    }, 1800);
    return () => clearInterval(minuteur);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [compact, capture]);

  function choisir(id: string) {
    capture();
    setActif(id);
  }

  const etiquette = (id: string) =>
    id === "tout" ? "tout" : libelleCategorie(id as CategorieId).toLowerCase();

  return (
    <Scene
      compact={compact}
      geometrie={geometrie}
      nom={nomAffiche}
      nu={nu}
      className="items-start"
    >
      <div className="w-full">
        {!compact ? (
          <div className="mb-4 flex flex-wrap gap-1.5">
            {groupes.map((id) => (
              <button
                key={id}
                type="button"
                onClick={() => choisir(id)}
                aria-pressed={actif === id}
                className={cn(
                  "valeur rounded-presse border px-2.5 py-1 text-[11px] transition-colors",
                  actif === id
                    ? "border-filet-vif text-encre"
                    : "border-filet text-second hover:border-filet-vif hover:text-encre",
                )}
              >
                {etiquette(id)}
              </button>
            ))}
          </div>
        ) : null}

        <ul
          ref={ref}
          className={cn(
            "grid gap-1.5",
            compact ? "grid-cols-3" : "grid-cols-2 sm:grid-cols-4",
          )}
        >
          {visibles.map((fiche) => (
            <li
              key={fiche.nom}
              className="truncate rounded-presse border border-filet bg-banc-haut px-2.5 py-2 text-[11px] text-second"
            >
              <span className="valeur">{fiche.titre}</span>
            </li>
          ))}
        </ul>

        {compact ? (
          <p className="cote mt-3">
            {etiquette(actif)} · {visibles.length}
          </p>
        ) : null}
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
  magnet: DemoMagnet,
  halftone: DemoHalftone,
  graph: DemoGraph,
  confetti: DemoConfetti,
  progress: DemoProgress,
  loader: DemoLoader,
  flight: DemoFlight,
  expand: DemoExpand,
  lightbox: DemoLightbox,
  "date-picker": DemoDatePicker,
  "smooth-scroll": DemoSmoothScroll,
  "flip-list": DemoFlipList,
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
  nu,
  inerte,
}: {
  nom: string;
  forme?: string;
  compact?: boolean;
  geometrie?: Geometrie;
  nomAffiche?: string;
  reglages?: Record<string, unknown>;
  nu?: boolean;
  /**
   * Présentée, pas manipulable — le régime des cases du catalogue, dont la
   * carte entière est un lien. Voir `ContexteInerte`.
   */
  inerte?: boolean;
}) {
  const Composant = demos[nom];
  if (!Composant) return null;

  const rendu = (
    <Composant
      forme={forme}
      compact={compact}
      geometrie={geometrie}
      nomAffiche={nomAffiche}
      reglages={reglages}
      nu={nu}
    />
  );

  if (!inerte) return rendu;

  return (
    <ContexteInerte.Provider value>
      {/* `pointer-events: none` sur le conteneur suffit à neutraliser tout ce
          qui est dedans, boutons compris — inutile de le répéter dans chaque
          démonstration. `aria-hidden` va avec : ce qui n'est pas atteignable
          au pointeur ne doit pas non plus l'être au lecteur d'écran, sinon la
          navigation clavier traverse autant de commandes mortes. */}
      <div className="demo-inerte h-full pointer-events-none select-none" aria-hidden>
        {rendu}
      </div>
    </ContexteInerte.Provider>
  );
}
