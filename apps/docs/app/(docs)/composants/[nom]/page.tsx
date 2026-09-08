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
import { Separator } from "@/components/ui/separator";

/** Ce que la CLI installe en plus, par composant. Voir DEPENDANCES.md. */
const DEPENDANCES: Record<string, string[]> = {
  expand: ["gsap"],
  lightbox: ["gsap", "radix-ui"],
  "smooth-scroll": ["lenis"],
};

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

/**
 * Fiche d'un composant. Trois zones, dans cet ordre : la scène, la prose, la
 * référence. Un plan surélevé, puis du texte, puis un plan enfoncé — l'objet,
 * son commentaire, sa référence.
 *
 * L'ordre compte, et il est INVERSÉ par rapport à la version précédente, qui
 * plaçait quatre éléments de texte au-dessus d'une démonstration de 208 px.
 * Voir DESIGN.md.
 */
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
  const deps = DEPENDANCES[fiche.nom] ?? [];

  return (
    <article>
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 pb-4">
        <Link href="/composants" className="cote lien">
          Composants
        </Link>
        <span className="cote">/</span>
        <span className="cote">{libelleCategorie(fiche.categorie)}</span>
      </div>

      {/* ZONE 1 — la scène. Premier et plus grand élément de la page, sur
          toute la largeur de la colonne de contenu. */}
      <Apercu
        nom={fiche.nom}
        titre={fiche.titre}
        voie={fiche.voie}
        formes={fiche.formes}
      />

      {/* ZONE 2 — la prose. Jamais plus de 62 caractères. */}
      <div className="mt-12 gap-12 xl:flex">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="titre text-[clamp(1.9rem,4vw,2.6rem)] leading-[1.03]">
              {fiche.titre}
            </h1>
            {formes > 1 ? (
              <span className="cote">{formes} formes</span>
            ) : null}
          </div>
          <p className="mt-3 max-w-[58ch] text-xl leading-[1.45] text-prose">
            {fiche.accroche}
          </p>
          <p className="mt-4 max-w-[62ch] leading-relaxed text-prose">
            {fiche.apport}
          </p>

          {/* ZONE 3 — la référence, sur le plan ENFONCÉ. */}
          <div className="mt-10 rounded-plan border border-filet bg-plan p-5 sm:p-7">
            <p className="cote">Installation</p>
            <div className="mt-3">
              <CommandeInstall nom={fiche.nom} />
            </div>
            <p className="mt-3 max-w-[62ch] text-sm leading-relaxed text-second">
              La commande copie la <b className="text-encre">famille entière</b>,
              jamais une forme isolée — la source atterrit dans votre projet, et
              vous la modifiez.
            </p>

            <p className="cote mt-9">Usage</p>
            <div className="mt-3">
              <BlocCode code={fiche.usage} />
            </div>

            <p className="cote mt-9" id="options">
              Options
            </p>
            {/* Le tableau déborde sur mobile : il défile dans son propre
                conteneur plutôt que d'élargir la page. */}
            <div className="mt-3 overflow-x-auto">
              <table className="w-full min-w-[34rem] border-collapse text-sm">
                <thead>
                  <tr>
                    {["Option", "Type", "Défaut", "Rôle"].map((entete) => (
                      <th
                        key={entete}
                        scope="col"
                        className="cote border-b border-filet px-4 py-2.5 text-left font-medium"
                      >
                        {entete}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {fiche.options.map((option) => (
                    <tr key={option.nom} className="border-b border-filet last:border-0">
                      <td className="valeur px-4 py-3 text-[13px] text-encre">
                        {option.nom}
                      </td>
                      <td className="valeur px-4 py-3 text-[12px] text-sourdine">
                        {option.type}
                      </td>
                      <td className="valeur px-4 py-3 text-[12px] text-sourdine">
                        {option.defaut}
                      </td>
                      <td className="px-4 py-3 text-[13px] leading-relaxed text-prose">
                        {option.role}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Le rail droit. La colonne de 296 px qui restait vide sur chaque
            fiche porte maintenant ce qu'on cherche vraiment en arrivant : ce
            que ça installe, et combien il y a de formes. */}
        <aside className="mt-10 shrink-0 xl:mt-0 xl:w-[200px]">
          <div className="xl:sticky xl:top-20">
            <p className="cote">Sur cette fiche</p>
            <ul className="mt-3 space-y-1.5 text-[13px]">
              <li>
                <a href="#options" className="lien text-second hover:text-encre">
                  {fiche.options.length} options
                </a>
              </li>
              {formes > 1 ? (
                <li className="text-second">{formes} formes</li>
              ) : null}
            </ul>

            <p className="cote mt-7">Dépendances</p>
            {deps.length > 0 ? (
              <ul className="mt-3 space-y-1.5">
                {deps.map((dep) => (
                  <li key={dep} className="valeur text-[12px] text-encre">
                    {dep}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-3 text-[13px] text-second">
                Aucune. Le moteur suffit.
              </p>
            )}
          </div>
        </aside>
      </div>

      <Separator className="mt-16" />
      <nav className="flex justify-between gap-6 pt-6 text-sm">
        <Link
          href={`/composants/${precedente.nom}`}
          className="lien text-second hover:text-encre"
        >
          ← {precedente.titre}
        </Link>
        <Link
          href={`/composants/${suivante.nom}`}
          className="lien text-second hover:text-encre"
        >
          {suivante.titre} →
        </Link>
      </nav>
    </article>
  );
}
