import Link from "next/link";
import { TextEffect, ScrambleText, Marquee } from "@nova-ui/react";
import { catalogue } from "@/lib/catalogue";
import { Demo } from "@/components/demos";

export default function Accueil() {
  return (
    <>
      <Heros />
      <BandeauSignature />
      <Catalogue />
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
          Sept composants animés, tirés de projets en production et réécrits
          sur un moteur sans dépendance. Vous copiez la source dans votre
          projet — elle vous appartient.
        </p>

        <div className="mt-10 flex flex-wrap items-center gap-4">
          <Link
            href="/installation"
            className="rounded-nova bg-encre px-6 py-3 text-sm font-medium text-fond transition-opacity hover:opacity-90"
          >
            Installer
          </Link>
          <code className="rounded-nova border border-filet bg-surface px-4 py-3 font-mono text-sm text-sourdine">
            npx novaui add{" "}
            <ScrambleText text="reveal" trigger="hover" className="text-encre" />
          </code>
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

function Catalogue() {
  return (
    <section className="mx-auto max-w-6xl px-6 py-20">
      <div className="flex items-baseline justify-between border-b border-filet pb-4">
        <h2 className="text-2xl font-medium tracking-tight">Composants</h2>
        <span className="cote">{catalogue.length} disponibles</span>
      </div>

      <div className="mt-10 grid gap-10 sm:grid-cols-2">
        {catalogue.map((fiche) => {
          return (
            <article key={fiche.nom} className="group">
              <Demo nom={fiche.nom} />
              <div className="mt-4 flex items-baseline justify-between gap-4">
                <Link
                  href={`/composants/${fiche.nom}`}
                  className="lien text-lg font-medium tracking-tight"
                >
                  {fiche.titre}
                </Link>
                <span className="cote shrink-0">{fiche.nom}</span>
              </div>
              <p className="mt-1.5 text-sm leading-relaxed text-sourdine">
                {fiche.accroche}
              </p>
            </article>
          );
        })}
      </div>
    </section>
  );
}
