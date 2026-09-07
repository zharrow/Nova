import Link from "next/link";
import { notFound } from "next/navigation";
import {
  catalogue,
  trouverFiche,
  libelleCategorie,
  nombreDeFormes,
} from "@/lib/catalogue";
import { Apercu } from "@/components/apercu";
import { BlocCode } from "@/components/bloc-code";
import { CommandeInstall } from "@/components/commande-install";

export function generateStaticParams() {
  return catalogue.map((fiche) => ({ nom: fiche.nom }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ nom: string }>;
}) {
  const { nom } = await params;
  const fiche = trouverFiche(nom);
  if (!fiche) return {};
  return { title: `${fiche.titre} — Nova`, description: fiche.accroche };
}

export default async function PageComposant({
  params,
}: {
  params: Promise<{ nom: string }>;
}) {
  const { nom } = await params;
  const fiche = trouverFiche(nom);
  if (!fiche) notFound();

  const index = catalogue.findIndex((f) => f.nom === fiche.nom);
  const precedente = catalogue[(index - 1 + catalogue.length) % catalogue.length]!;
  const suivante = catalogue[(index + 1) % catalogue.length]!;
  const formes = nombreDeFormes(fiche);

  return (
    <article className="max-w-3xl">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
        <Link href="/composants" className="cote lien">
          Composants
        </Link>
        <span className="cote">/</span>
        <span className="cote">{libelleCategorie(fiche.categorie)}</span>
      </div>

      <header className="mt-6">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-4xl font-medium tracking-tight">{fiche.titre}</h1>
          {fiche.nouveau ? (
            <span className="rounded-[2px] bg-signal px-2 py-0.5 font-mono text-[9px] uppercase tracking-wider text-fond">
              New
            </span>
          ) : null}
          {formes > 1 ? (
            <span className="cote text-signal">{formes} formes</span>
          ) : null}
        </div>
        <p className="mt-3 text-lg text-sourdine">{fiche.accroche}</p>
      </header>

      <div className="mt-10">
        <Apercu nom={fiche.nom} voie={fiche.voie} formes={fiche.formes} />
      </div>

      <Section titre="Installation">
        <CommandeInstall nom={fiche.nom} />
        <p className="mt-3 text-sm leading-relaxed text-sourdine">
          La commande copie la <b className="text-encre">famille entière</b>,
          jamais une forme isolée — la source atterrit dans votre projet, et
          vous la modifiez.
        </p>
      </Section>

      <Section titre="Usage">
        <BlocCode code={fiche.usage} />
      </Section>

      <Section titre="Options">
        {/* Le tableau déborde sur mobile : il défile dans son propre conteneur
            plutôt que d'élargir la page. */}
        <div className="overflow-x-auto rounded-nova border border-filet">
          <table className="w-full min-w-[34rem] border-collapse text-sm">
            <thead>
              <tr className="border-b border-filet bg-surface">
                {["Option", "Type", "Défaut", "Rôle"].map((entete) => (
                  <th
                    key={entete}
                    scope="col"
                    className="cote px-4 py-2.5 text-left font-normal"
                  >
                    {entete}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {fiche.options.map((option) => (
                <tr key={option.nom} className="border-b border-filet last:border-0">
                  <td className="px-4 py-3 font-mono text-[13px] text-encre">
                    {option.nom}
                  </td>
                  <td className="px-4 py-3 font-mono text-[12px] text-sourdine">
                    {option.type}
                  </td>
                  <td className="px-4 py-3 font-mono text-[12px] text-sourdine">
                    {option.defaut}
                  </td>
                  <td className="px-4 py-3 text-[13px] leading-relaxed text-sourdine">
                    {option.role}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>

      <Section titre="Provenance">
        <div className="rounded-nova border border-filet bg-surface p-5">
          <p className="cote">{fiche.provenance}</p>
          <p className="mt-3 text-sm leading-relaxed text-sourdine">
            {fiche.apport}
          </p>
        </div>
      </Section>

      <nav className="mt-16 flex justify-between gap-6 border-t border-filet pt-6 text-sm">
        <Link
          href={`/composants/${precedente.nom}`}
          className="lien text-sourdine hover:text-encre"
        >
          ← {precedente.titre}
        </Link>
        <Link
          href={`/composants/${suivante.nom}`}
          className="lien text-sourdine hover:text-encre"
        >
          {suivante.titre} →
        </Link>
      </nav>
    </article>
  );
}

function Section({
  titre,
  children,
}: {
  titre: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mt-14">
      <h2 className="cote mb-4 border-b border-filet pb-2">{titre}</h2>
      {children}
    </section>
  );
}
