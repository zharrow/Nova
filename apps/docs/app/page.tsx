import Link from "next/link";
import { Marquee } from "@nova-ui/react";
import { catalogue, TOTAL_FORMES, libelleCategorie } from "@/lib/catalogue";
import { Demo } from "@/components/demos";
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
          <span className="cote block pb-2 md:pb-0 md:pt-1">{numero}</span>
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
  return (
    <section className="relative overflow-hidden border-b border-filet">
      <div className="trame pointer-events-none absolute inset-0 opacity-60" aria-hidden />
      {/* Asymétrique 5/7, rien de centré. Le banc de droite occupait, avant,
          la moitié vide de l'écran : une affiche a besoin d'un poids en face
          de son texte, et ici ce poids est une démonstration. */}
      <Section numero="00" className="relative py-20 sm:py-24">
      <div className="grid items-start gap-12 lg:grid-cols-[5fr_7fr] lg:gap-16">
        <div className="min-w-0">
          <p className="cote">Librairie de composants · TypeScript</p>

          <h1 className="titre-affiche mt-6 text-[clamp(2.25rem,4.4vw,3.6rem)]">
            Des composants animés
            <br />
            <span className="text-second">qui se démontent proprement.</span>
          </h1>

          <p className="mt-7 max-w-[52ch] text-lg leading-[1.5] text-prose">
            {catalogue.length} familles, {TOTAL_FORMES} formes. Une seule boucle
            d&apos;animation pour toute la page, l&apos;état par défaut toujours
            visible, et un <code className="valeur text-encre">destroy()</code>{" "}
            qui rend l&apos;élément exactement comme il était.
          </p>

          {/* L'action principale est la COMMANDE, pas un bouton qui mène à une
              page : ce que le visiteur veut, c'est la ligne à coller. */}
          <div className="mt-9 max-w-md">
            <BlocCode langue="terminal" code="npx novaui init" />
          </div>

          <div className="mt-6 flex flex-wrap items-center gap-5">
            <Button asChild size="lg" className="rounded-presse">
              <Link href="/composants">
                Parcourir les {catalogue.length} familles
              </Link>
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
            la distance du haut de la ligne à la ligne de base pour Bricolage
            Grotesque — une approximation, assumée, qui suit le `clamp` du
            titre à toutes les largeurs. */}
        <div
          className="relative min-w-0 lg:mt-[var(--pose-banc)]"
          style={
            {
              "--pose-banc":
                "calc(0.825rem + 1.5rem + 0.78 * clamp(2.25rem, 4.4vw, 3.6rem))",
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
          <div className="overflow-hidden rounded-plan border border-filet bg-banc">
            <Demo nom="halftone" compact geometrie="bloc" />
            <div className="flex items-baseline justify-between gap-3 border-t border-filet px-4 py-2.5">
              <Link
                href="/composants/halftone"
                className="lien text-sm font-semibold text-second hover:text-encre"
              >
                Halftone
              </Link>
              <span className="cote">Rendu · 2 formes</span>
            </div>
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
            {/* Le losange est en SOURDINE, pas en signal : celui-ci est
                rationné à deux occurrences par écran, et cinq losanges par
                défilement en consommaient huit à eux seuls. */}
            <span aria-hidden>◆</span>
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

  return (
    <Section numero="01" className="py-20">
      <div className="grid gap-2.5 md:grid-cols-3">
        {fiches.map((fiche) => (
          // `min-w-0` : sans lui la colonne de grille prend la largeur
          // MIN-CONTENT de son contenu, et la piste d'un marquee (flex,
          // nowrap) n'en a pas de raisonnable. Elle pousse la colonne, le
          // moteur relit un conteneur plus large, duplique encore — la page
          // finissait à 33 000 px de large sous 1024 px.
          <article
            key={fiche.nom}
            className="group flex min-w-0 flex-col overflow-hidden rounded-plan border border-filet bg-banc transition-colors hover:border-filet-vif"
          >
            <div className="min-w-0 flex-1">
              <Demo nom={fiche.nom} compact geometrie={fiche.geometrie ?? "carre"} />
            </div>
            <Link
              href={`/composants/${fiche.nom}`}
              className="flex items-baseline justify-between gap-3 border-t border-filet px-4 py-2.5 transition-colors group-hover:border-filet-vif"
            >
              <span className="truncate text-sm font-semibold text-second transition-colors group-hover:text-encre">
                {fiche.titre}
              </span>
              <span className="cote shrink-0">
                {fiche.formes && fiche.formes.length > 1
                  ? `${fiche.formes.length} formes`
                  : libelleCategorie(fiche.categorie)}
              </span>
            </Link>
          </article>
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

  return (
    <section className="border-t border-filet">
      <Section numero="02" className="py-20">
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
              Voir les {TOTAL_FORMES} formes →
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
