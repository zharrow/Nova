import Link from "next/link";
import { TextEffect, Marquee } from "@nova-ui/react";
import { catalogue, TOTAL_FORMES, libelleCategorie } from "@/lib/catalogue";
import { Demo } from "@/components/demos";

/** Les trois qu'on montre en premier : les plus démonstratives. */
const EN_TETE = ["text-effect", "halftone", "scroll-marquee"];

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

function Heros() {
  return (
    <section className="relative overflow-hidden border-b border-filet">
      <div className="trame pointer-events-none absolute inset-0" aria-hidden />
      <div className="relative mx-auto max-w-6xl px-6 py-24 sm:py-32">
        <p className="cote">Librairie de composants · TypeScript</p>

        <h1 className="mt-6 max-w-3xl text-5xl font-medium leading-[1.05] tracking-tight sm:text-7xl">
          <TextEffect as="span" text="Des composants" effect="line" trigger="mount" />
          <br />
          <TextEffect
            as="span"
            text="extraits du réel."
            effect="line"
            trigger="mount"
            className="text-sourdine"
          />
        </h1>

        <p className="mt-8 max-w-xl text-lg leading-relaxed text-sourdine">
          {catalogue.length} familles, {TOTAL_FORMES} formes, tirées de projets
          en production et réécrites sur un moteur sans dépendance. Vous copiez
          la source dans votre projet — elle vous appartient.
        </p>

        <div className="mt-10 flex flex-wrap items-center gap-4">
          <Link
            href="/composants"
            className="rounded-nova bg-encre px-6 py-3 text-sm font-medium text-fond transition-opacity hover:opacity-90"
          >
            Parcourir le catalogue
          </Link>
          <Link
            href="/installation"
            className="rounded-nova border border-filet px-6 py-3 text-sm text-sourdine transition-colors hover:border-encre hover:text-encre"
          >
            Installer
          </Link>
        </div>
      </div>
    </section>
  );
}

function BandeauSignature() {
  const mots = [
    "SANS DÉPENDANCE",
    "SSR",
    "MOUVEMENT RÉDUIT RESPECTÉ",
    "UN SEUL RAF",
    "VOUS POSSÉDEZ LE CODE",
  ];
  return (
    <section className="border-b border-filet py-4">
      <Marquee speed={45} pauseOnHover>
        {mots.map((mot) => (
          <span
            key={mot}
            className="mr-8 flex items-center gap-8 font-mono text-xs tracking-[0.2em] text-sourdine"
          >
            {mot}
            <span className="text-signal" aria-hidden>
              ◆
            </span>
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
    <section className="mx-auto max-w-6xl px-6 py-20">
      <div className="grid gap-10 lg:grid-cols-3">
        {fiches.map((fiche) => (
          <article key={fiche.nom} className="group">
            <Demo nom={fiche.nom} compact />
            <Link
              href={`/composants/${fiche.nom}`}
              className="mt-4 block rounded-nova py-1 transition-colors hover:bg-surface/40"
            >
              <span className="flex items-baseline justify-between gap-3">
                <span className="text-lg font-medium tracking-tight">
                  {fiche.titre}
                </span>
                {fiche.formes && fiche.formes.length > 1 ? (
                  <span className="cote shrink-0 text-signal">
                    {fiche.formes.length} formes
                  </span>
                ) : null}
              </span>
              <span className="mt-1.5 block text-sm leading-relaxed text-sourdine">
                {fiche.accroche}
              </span>
            </Link>
          </article>
        ))}
      </div>
    </section>
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
      <div className="mx-auto max-w-6xl px-6 py-20">
        <div className="grid gap-12 lg:grid-cols-[minmax(0,26rem)_minmax(0,1fr)]">
          <div>
            <p className="cote">Le principe</p>
            <h2 className="mt-4 text-3xl font-medium leading-tight tracking-tight">
              Une entrée du catalogue est une famille, pas une pièce.
            </h2>
            <p className="mt-5 text-[15px] leading-relaxed text-sourdine">
              Nova est né en récoltant des composants dans des projets
              existants. Cette récolte fait apparaître ce qu&apos;on ne voit pas
              en partant d&apos;une page blanche : le même composant existe
              déjà en plusieurs exemplaires, et ces exemplaires ne sont pas des
              doublons.
            </p>
            <p className="mt-4 text-[15px] leading-relaxed text-sourdine">
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
          <ul className="grid gap-px overflow-hidden rounded-nova border border-filet bg-filet sm:grid-cols-2">
            {declinees.map((fiche) => (
              <li key={fiche.nom} className="bg-fond p-5">
                <div className="flex items-baseline justify-between gap-3">
                  <Link
                    href={`/composants/${fiche.nom}`}
                    className="lien font-medium tracking-tight"
                  >
                    {fiche.titre}
                  </Link>
                  <span className="cote shrink-0 text-signal">
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
      </div>
    </section>
  );
}

function voieLabel(voie?: string): string {
  if (voie === "usage") return "usage";
  if (voie === "frere") return "composant frère";
  return "option";
}
