import Link from "next/link";
import { Marquee } from "@nova-ui/react";
import { catalogue, libelleCategorie } from "@/lib/catalogue";
import { CarteFamille, carteDe } from "@/components/carte-famille";
import { Supernova } from "@/components/supernova";
import { BlocCode } from "@/components/bloc-code";
import { Button } from "@/components/ui/button";

/** Les trois qu'on montre en premier : les plus démonstratives. */
const EN_TETE = ["text-effect", "blinds", "scroll-marquee"];

/**
 * La marge de numérotation — 96 px à gauche, un filet vertical, un numéro en
 * chasse fixe.
 *
 * Elle n'existe QUE sur l'accueil. Une page d'affiche est un imprimé, une page
 * de documentation est un poste de travail : leur donner la même marge
 * effacerait la distinction. Voir DESIGN.md.
 *
 * Sous 768 px elle disparaît et le numéro remonte au-dessus du contenu :
 * quatre-vingt-seize pixels de gouttière sur un téléphone mangeraient la
 * colonne qu'ils servent à cadrer.
 *
 * Le souffle vertical suit la même logique : 96 px en haut et en bas d'une
 * section, c'est la respiration d'une affiche qu'on regarde à un mètre. Sur
 * un écran de 844 px, deux fois 96 px sont un quart de l'écran donné au vide
 * avant la première ligne. Il tombe à 64 px sous 640 px — la page reste aérée,
 * elle cesse d'être creuse.
 */
function Section({
  numero,
  children,
  className,
}: {
  /* Facultatif : une section dont le contenu ne commence PAS en haut de la
     grille pose son numéro elle-même, sur la ligne qu'il numérote. Voir
     `Numero` et l'affiche. La marge et son filet restent, eux, à la charge de
     `Section` : c'est l'ossature, et elle ne dépend d'aucun contenu. */
  numero?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={["mx-auto max-w-[1440px] px-6", className ?? ""].join(" ")}>
      <div className="md:grid md:grid-cols-[96px_minmax(0,1fr)]">
        <div className="md:border-r md:border-filet">
          {numero ? <Numero>{numero}</Numero> : null}
        </div>
        <div className="md:pl-10">{children}</div>
      </div>
    </div>
  );
}

/**
 * Le numéro de section.
 *
 * Il est bleu : c'est l'ossature de l'affiche — 00, 01, 02 — et la seule chose
 * qui se répète d'une section à l'autre. Lui donner la couleur de la marque
 * fait que le bleu scande la page au lieu d'y apparaître deux fois.
 *
 * `flottant` le sort du flux et le renvoie dans la marge, à hauteur de la
 * première ligne du bloc qui le contient. C'est ce qu'il faut dès que le
 * contenu ne commence plus en haut de la section : sur l'affiche, les deux
 * colonnes sont centrées l'une sur l'autre, et un numéro resté collé au haut
 * de la grille se retrouvait quatre-vingt-dix pixels au-dessus de la ligne
 * qu'il numérote. Sous 768 px il n'y a pas de marge : il repasse au-dessus du
 * contenu, comme partout ailleurs.
 *
 * Les 136 px sont écrits EN CLAIR, et pas construits depuis une constante :
 * Tailwind ne génère que les classes qu'il trouve littéralement dans la
 * source, et `-left-[${...}]` produirait à l'exécution une classe qui n'existe
 * dans aucune feuille. C'est la marge de 96 px plus la gouttière `pl-10` de
 * `Section` — les deux sont juste au-dessus, dans ce fichier.
 */
function Numero({
  children,
  flottant,
}: {
  children: React.ReactNode;
  flottant?: boolean;
}) {
  return (
    <span
      className={[
        "cote block pb-2 text-signal md:pb-0 md:pt-1",
        flottant ? "md:absolute md:-left-[136px] md:top-0" : "",
      ].join(" ")}
    >
      {children}
    </span>
  );
}

export default function Accueil() {
  return (
    <>
      <Heros />
      <BandeauSignature />
      <EnTete />
      <Familles />
    </>
  );
}

/**
 * Le premier écran est une AFFICHE, pas un document.
 *
 * Le titre ne s'anime pas, et c'est une décision, pas un oubli : une
 * librairie d'animation dont le chrome s'anime enseigne au visiteur que le
 * mouvement est de la décoration. Le seul mouvement hors scène est le bandeau
 * ci-dessous, qui est lui-même un composant du catalogue. Voir DESIGN.md.
 */
function Heros() {
  return (
    <section
      className="relative overflow-hidden border-b border-filet"
      style={
        {
          /* LE SOUFFLE DE L'AFFICHE EST UNE PART DE L'ÉCRAN, PAS UNE CONSTANTE.
             96 px en haut et en bas sont la respiration d'une affiche regardée
             à un mètre — sur un 13 pouces, 829 px de haut, deux fois 112 px
             donnaient un quart de l'écran au vide pendant que la planche
             sortait par le bas. La règle du dépôt ne se déclenchait pas : elle
             est indexée sur la LARGEUR (« 64 px sous 640 px »), et un portable
             est large et bas. Celle-ci est indexée sur la hauteur, donc elle
             tient les deux cas d'un seul chiffre. Le plancher de 4rem est la
             valeur mobile documentée, le plafond de 7rem l'affiche entière. */
          "--souffle": "clamp(4rem, 7.5svh, 7rem)",
          /* LA PLANCHE EST PLAFONNÉE PAR CE QUE L'ÉCRAN PEUT MONTRER.
             C'est la HAUTEUR qu'on plafonne, et la boîte garde toute sa
             largeur : l'étoile reste alors au milieu de sa colonne, à sa place
             dans la composition. Plafonner la largeur l'aurait fait fuir vers
             le coin droit en creusant un trou de trois cents pixels entre elle
             et le titre — la page tenait dans l'écran et ne tenait plus
             debout. La contrepartie est que le rapport de la boîte change avec
             l'écran, donc `Supernova` doit se remesurer : voir son observateur
             de taille.
             Ce qu'on retranche de l'écran : l'en-tête collant, le souffle du
             haut, et une marge de 24 px sous le disque. La division par 0,95
             est la clé du calcul — ce n'est pas la BOÎTE qui doit tenir sous
             le pli, c'est le DISQUE, et il n'occupe que 0,05 à 0,95 de la
             hauteur de boîte. Plafonner la boîte elle-même gaspillait la
             marge des deux côtés. */
          "--banc-haut": "calc((100svh - 5rem - var(--souffle)) / 0.95)",
        } as React.CSSProperties
      }
    >
      {/* Asymétrique 5/7 : rien n'est centré DANS LA LARGEUR, le texte n'a pas
          le même poids que la planche et ne prend pas la même place. Le banc de
          droite occupait, avant, la moitié vide de l'écran — une affiche a
          besoin d'un poids en face de son texte, et ici ce poids est une
          démonstration.

          En HAUTEUR, en revanche, les deux colonnes sont centrées l'une sur
          l'autre. La planche partait du haut, décalée d'une ligne de base, et
          descendait deux cents pixels plus bas que le dernier bouton : deux
          blocs posés à des profondeurs différentes, sans rien pour expliquer
          l'écart une fois le filet de tête retiré. Centrées, elles se
          répondent. */}
      <Section className="relative py-[var(--souffle)]">
      <div className="grid items-center gap-12 lg:grid-cols-[5fr_7fr] lg:gap-16">
        {/* `relative` porte le numéro flottant : c'est de CETTE colonne qu'il
            doit suivre la première ligne, puisque c'est elle qui descend quand
            la planche est plus haute qu'elle. */}
        <div className="relative min-w-0">
          <Numero flottant>00</Numero>
          <p className="cote">Librairie de composants · TypeScript</p>

          <h1 className="titre-affiche mt-6 text-[clamp(2rem,3.4vw,3rem)]">
            Des composants animés
            <br />
            <span className="text-second">qui se démontent proprement.</span>
          </h1>

          <p className="mt-7 max-w-[52ch] text-lg leading-[1.5] text-prose">
            Une seule boucle d&apos;animation pour toute la page, l&apos;état
            par défaut toujours visible, et un{" "}
            <code className="valeur text-encre">destroy()</code> qui rend
            l&apos;élément exactement comme il était.
          </p>

          {/* L'action principale est la COMMANDE, pas un bouton qui mène à une
              page : ce que le visiteur veut, c'est la ligne à coller. */}
          <div className="mt-9 max-w-md">
            <BlocCode langue="terminal" code="npx novaui init" />
          </div>

          <div className="mt-6 flex flex-wrap items-center gap-5">
            <Button asChild size="lg" className="rounded-presse">
              <Link href="/composants">Parcourir le catalogue</Link>
            </Button>
            <Link
              href="/installation"
              className="lien text-sm text-second hover:text-encre"
            >
              Comment ça s&apos;installe →
            </Link>
          </div>
        </div>

        {/* Le banc de l'affiche. Une seule pièce sous la lampe — celle-ci
            rayonne au lieu de se lire, donc elle ne concurrence pas le titre
            posé juste à côté.

            Il portait un FILET DE TÊTE, tombant sur la première ligne de base
            du titre et filant jusqu'au bord de l'écran, et un décalage calculé
            (`--pose-banc`) qui n'existait que pour l'y poser. Les deux sont
            partis ensemble : le filet parce qu'il a été jugé de trop, le
            décalage parce qu'un alignement sans rien à aligner n'est plus
            qu'un trou de soixante-seize pixels en haut de la colonne. Ces
            soixante-seize pixels reviennent à la planche, qui est d'autant
            plus grande sous le plafond de hauteur. */}
        <div className="relative min-w-0">
          {/* UNE SUPERNOVA, et non plus la case du catalogue.

              La case était juste — le même objet partout — mais elle faisait
              de l'affiche une vitrine de plus : un cadre, une étiquette, un
              lien. Une affiche n'expose pas une fiche produit, elle montre la
              chose elle-même, en grand, sans cadre, débordant du format.

              C'est le composant `Halftone` de la librairie, pris par sa porte
              la moins connue : une fonction de couverture. L'étoile est donc
              CALCULÉE, pas chargée — ce que la catégorie « Rendu » revendique,
              démontré à l'échelle de l'écran plutôt qu'affirmé dans une
              phrase. Voir `components/supernova.tsx`.

              LA BOÎTE EST CARRÉE, ET C'EST CE QUI AGRANDIT L'OBJET.

              La règle à connaître avant d'y retoucher : une trame est
              DIMENSIONNÉE par la hauteur de sa boîte — le disque vaut 0,9 de
              cette hauteur — mais PLACÉE par sa largeur, puisqu'elle y est
              centrée. Élargir la boîte n'agrandit donc pas l'objet, ça le
              pousse à droite ; c'est ainsi qu'un rapport 4/3 débordant de
              256 px portait son bord à 1503 px dans un écran de 1470. Les deux
              seuls leviers qui grandissent vraiment le disque sont la hauteur
              de la boîte et rien d'autre.

              D'où le carré : à largeur de colonne inchangée, il monte la
              hauteur de 594 à 695 px et le disque de 534 à 626. Il ne reste
              AUCUNE marge négative — la boîte tient dans sa colonne, l'objet
              garde le bord de la page à distance, et plus rien ne dépasse de
              l'écran. */}
          {/* Le `max-h` est ce qui garde la légende — et le bas de l'étoile —
              au-dessus du pli sur un portable. Sur un écran haut il ne mord
              pas, et la planche est exactement celle d'avant.

              Il ne vaut qu'à partir de `lg`, où l'affiche est en deux colonnes
              et où le pli est un enjeu. En dessous la page est empilée, on
              défile de toute façon, et le plafond n'aurait fait qu'un mal :
              sur un téléphone en paysage il aplatissait la planche en bandeau
              de cent cinquante pixels dans huit cents de large. */}
          <div className="relative">
            <Supernova className="block aspect-square w-full text-signal lg:max-h-[var(--banc-haut)]" />
          </div>
        </div>
      </div>
      </Section>
    </section>
  );
}

function BandeauSignature() {
  const mots = [
    "UNE SEULE BOUCLE rAF",
    "ÉTAT PAR DÉFAUT VISIBLE",
    "MOUVEMENT RÉDUIT RESPECTÉ",
    "SSR",
    "VOUS POSSÉDEZ LE CODE",
  ];
  return (
    <section className="border-b border-filet py-4">
      <Marquee speed={45} pauseOnHover>
        {mots.map((mot) => (
          <span
            key={mot}
            className="valeur mr-8 flex items-center gap-8 text-xs tracking-[0.16em] text-sourdine"
          >
            {mot}
            {/* Le losange est BLEU. Il l'était déjà, puis le rationnement du
                signal l'a éteint — cinq losanges par défilement consommaient
                huit occurrences à eux seuls. Le rationnement levé, c'est lui
                qui fait revenir la couleur de Nova à intervalle régulier sur
                toute la largeur : une identité se lit à sa récurrence, pas à
                sa surface. */}
            <span className="text-signal" aria-hidden>◆</span>
          </span>
        ))}
      </Marquee>
    </section>
  );
}

function EnTete() {
  const fiches = EN_TETE.map((nom) =>
    catalogue.find((fiche) => fiche.nom === nom),
  ).filter((fiche) => fiche !== undefined);

  /* Les trois de tête sont choisies à la main, et une famille non validée
     n'est pas dans `catalogue` : la section peut donc être vide. On la retire
     entièrement plutôt que de laisser son numéro et son filet orphelins —
     une marge de numérotation devant du rien se lit comme une page cassée. */
  if (fiches.length === 0) return null;

  return (
    <Section numero="01" className="py-16 sm:py-24">
      {/* La catégorie plutôt que le compte de formes : ces trois-là sont
          sorties de leur section, et c'est de savoir d'où elles viennent qu'on
          a besoin ici. */}
      <div className="grid gap-4 md:grid-cols-3">
        {fiches.map((fiche) => (
          <CarteFamille
            key={fiche.nom}
            carte={carteDe(fiche, {
              legende: `${libelleCategorie(fiche.categorie)}${
                fiche.formes && fiche.formes.length > 1
                  ? ` · ${fiche.formes.length} formes`
                  : ""
              }`,
            })}
          />
        ))}
      </div>
    </Section>
  );
}

/**
 * La section qui porte l'idée centrale du catalogue. Elle est sur l'accueil et
 * non enfouie dans la documentation : c'est ce qui distingue Nova d'une liste
 * de composants, et ça ne se découvre pas tout seul.
 */
function Familles() {
  const declinees = catalogue.filter(
    (fiche) => (fiche.formes?.length ?? 1) > 1,
  );

  /* Même raison qu'au-dessus : la liste est le sujet de la section, et une
     liste vide n'est qu'un rectangle gris — le fond de la grille est le
     filet, et ce sont les cellules qui le recouvrent. */
  if (declinees.length === 0) return null;

  return (
    <section className="border-t border-filet">
      <Section numero="02" className="py-16 sm:py-24">
        <div className="grid gap-12 lg:grid-cols-[minmax(0,26rem)_minmax(0,1fr)]">
          <div>
            <p className="cote">Le principe</p>
            <h2 className="titre mt-4 text-3xl leading-tight">
              Une entrée du catalogue est une famille, pas une pièce.
            </h2>
            <p className="mt-5 max-w-[62ch] leading-relaxed text-prose">
              Le même effet existe rarement en un seul exemplaire, et ses
              exemplaires ne sont pas des doublons. Un défilement qui masque
              n&apos;est pas un défilement qui décale ; un décodage qu&apos;on
              provoque n&apos;est pas un décodage qui pulse tout seul.
            </p>
            <p className="mt-4 max-w-[62ch] leading-relaxed text-prose">
              Trois voies, qui ne se valent pas. Une{" "}
              <b className="text-encre">option</b> bascule d&apos;une forme à
              l&apos;autre. Un <b className="text-encre">usage</b> sert le même
              code avec une autre intention. Un{" "}
              <b className="text-encre">frère</b> fait la même chose par un
              mécanisme incompatible.
            </p>
            <Link
              href="/composants"
              className="lien mt-6 inline-block text-sm text-encre"
            >
              Voir toutes les formes →
            </Link>
          </div>

          {/* Le fond de la liste est le filet, et chaque cellule le recouvre :
              c'est ce qui dessine les séparateurs. Une cellule manquante
              laisserait donc un rectangle gris — d'où le remplissage à un
              nombre pair. */}
          <ul className="grid gap-px overflow-hidden rounded-plan border border-filet bg-filet sm:grid-cols-2">
            {declinees.map((fiche) => (
              <li key={fiche.nom} className="bg-fond p-5">
                <div className="flex items-baseline justify-between gap-3">
                  <Link
                    href={`/composants/${fiche.nom}`}
                    className="lien font-semibold tracking-tight"
                  >
                    {fiche.titre}
                  </Link>
                  <span className="valeur shrink-0 text-xs text-second">
                    {fiche.formes!.length}
                  </span>
                </div>
                <p className="cote mt-1">
                  {libelleCategorie(fiche.categorie)} · par {voieLabel(fiche.voie)}
                </p>
              </li>
            ))}
            {declinees.length % 2 === 1 ? (
              <li className="hidden bg-fond sm:block" aria-hidden />
            ) : null}
          </ul>
        </div>
      </Section>
    </section>
  );
}

function voieLabel(voie?: string): string {
  if (voie === "usage") return "usage";
  if (voie === "frere") return "composant frère";
  return "option";
}
