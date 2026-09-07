import Link from "next/link";
import { notFound } from "next/navigation";
import { catalogue, trouverFiche } from "@/lib/catalogue";
import { Demo } from "@/components/demos";
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
  return {
    title: `${fiche.titre} — Nova`,
    description: fiche.accroche,
  };
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
  const suivante = catalogue[(index + 1) % catalogue.length]!;

  return (
    <article className="mx-auto max-w-3xl px-6 py-16">
      <Link href="/" className="cote lien">
        ← Composants
      </Link>

      <header className="mt-8">
        <h1 className="text-4xl font-medium tracking-tight">{fiche.titre}</h1>
        <p className="mt-3 text-lg text-sourdine">{fiche.accroche}</p>
      </header>

      <div className="mt-10">
        <Demo nom={fiche.nom} />
      </div>

      <Section titre="Installation">
        <CommandeInstall nom={fiche.nom} />
        <p className="mt-3 text-sm leading-relaxed text-sourdine">
          La source atterrit dans votre projet. Vous pouvez la modifier — c&apos;est
          le but.
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

      <nav className="mt-16 border-t border-filet pt-6">
        <Link
          href={`/composants/${suivante.nom}`}
          className="lien text-sm text-sourdine hover:text-encre"
        >
          Suivant — {suivante.titre} →
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
