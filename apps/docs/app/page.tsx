import Link from "next/link";
import { Marquee } from "@nova-ui/react";
import { catalogue, libelleCategorie } from "@/lib/catalogue";
import { CarteFamille, carteDe } from "@/components/carte-famille";
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
  numero: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={["mx-auto max-w-[1440px] px-6", className ?? ""].join(" ")}>
      <div className="md:grid md:grid-cols-[96px_minmax(0,1fr)]">
        <div className="md:border-r md:border-filet">
          {/* Le numéro est bleu. C'est l'ossature de l'affiche — 00, 01, 02 —
              et la seule chose qui se répète d'une section à l'autre : lui
              donner la couleur de la marque fait que le bleu scande la page
              au lieu d'y apparaître deux fois. */}
          <span className="cote block pb-2 text-signal md:pb-0 md:pt-1">
            {numero}
          </span>
        </div>
        <div className="md:pl-10">{children}</div>
      </div>
    </div>
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
  /* Halftone est la pièce de l'affiche : elle RAYONNE au lieu de se lire, donc
     elle ne concurrence pas le titre posé juste à côté. */
  const affiche = catalogue.find((fiche) => fiche.nom === "halftone");

  return (
    <section className="relative overflow-hidden border-b border-filet">
      {/* Asymétrique 5/7, rien de centré. Le banc de droite occupait, avant,
          la moitié vide de l'écran : une affiche a besoin d'un poids en face
          de son texte, et ici ce poids est une démonstration. */}
      <Section numero="00" className="relative py-16 sm:py-28">
      <div className="grid items-start gap-12 lg:grid-cols-[5fr_7fr] lg:gap-16">
        <div className="min-w-0">
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

            Son filet de tête tombe sur la PREMIÈRE LIGNE DE BASE du titre, et
            traverse l'écran entier en passant derrière le panneau. C'est ce
            qui fait de l'écran une affiche et non deux colonnes juxtaposées.

            Le décalage est calculé, pas mesuré en JavaScript : hauteur de la
            cote, plus sa marge, plus la hauteur d'œil du titre. Le 0.78em est
            la distance du haut de la ligne à la ligne de base pour Instrument
            Sans — une approximation, assumée, qui suit le `clamp` du titre à
            toutes les largeurs. */}
        <div
          className="relative min-w-0 lg:mt-[var(--pose-banc)]"
          style={
            {
              "--pose-banc":
                "calc(0.825rem + 1.5rem + 0.80 * clamp(2rem, 3.4vw, 3rem))",
            } as React.CSSProperties
          }
        >
          {/* Le filet part du bord du banc et file jusqu'au bord de l'écran.
              Il ne remonte PAS jusqu'à la colonne de texte : tiré sur toute la
              largeur, il barrait le titre comme un texte rayé, et un geste
              d'affiche qui abîme la ligne qu'il aligne ne vaut rien.

              La section porte `overflow-hidden` : ce filet de 100 vw est donc
              découpé et ne peut pas créer de barre de défilement. */}
          <span
            className="pointer-events-none absolute left-0 top-0 hidden h-px w-screen bg-filet lg:block"
            aria-hidden
          />
          {/* EXACTEMENT la carte du catalogue, pas une variante. Trois
              traitements pour le même objet à trois endroits du site
              apprendraient au visiteur qu'il regarde trois choses
              différentes. */}
          {affiche ? (
            <CarteFamille
              carte={carteDe(affiche, { legende: libelleCategorie(affiche.categorie) })}
            />
          ) : null}
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
