import Link from "next/link";
import { notFound } from "next/navigation";
import {
  catalogue,
  trouverFiche,
  libelleCategorie,
  nombreDeFormes,
  dependancesDe,
} from "@/lib/catalogue";
import { Apercu } from "@/components/apercu";
import { SceneFiche } from "@/components/scene-fiche";
import { UsageVivant } from "@/components/usage-vivant";
import { MenuCopier } from "@/components/menu-copier";
import { BasculeThemeScene } from "@/components/bascule-theme-scene";
import { PucesDependances } from "@/components/puces-dependances";
import { CommandeInstall } from "@/components/commande-install";
import { Separator } from "@/components/ui/separator";

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
  const deps = dependancesDe(fiche.nom);

  return (
    <SceneFiche fiche={fiche}>
    <article>
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 pb-4">
        <Link href="/composants" className="cote lien">
          Composants
        </Link>
        <span className="cote">/</span>
        <span className="cote">{libelleCategorie(fiche.categorie)}</span>
        {/* Le menu pousse à droite : c est un outil, pas une étape du fil.
            Mais seulement quand il tient sur la MÊME ligne que le fil : sous
            640 px il passe à la ligne, et l'y pousser à droite lui donnait un
            bord gauche en escalier qui se lit comme un défaut de gabarit. À la
            ligne, il s'aligne donc sur le fil. */}
        <div className="flex items-center gap-1 sm:ml-auto">
          <BasculeThemeScene />
          <MenuCopier nom={fiche.nom} titre={fiche.titre} />
        </div>
      </div>

      {/* ZONE 1 — la scène. Premier et plus grand élément de la page, sur
          toute la largeur de la colonne de contenu. */}
      <Apercu />

      {/* ZONE 2 — la prose. Jamais plus de 62 caractères. */}
      <div className="mt-12 gap-12 xl:flex">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="titre text-[clamp(1.5rem,2.4vw,1.875rem)] leading-[1.15]">
              {fiche.titre}
            </h1>
            {formes > 1 ? (
              <span className="cote">{formes} formes</span>
            ) : null}
          </div>
          <p className="mt-3 max-w-[58ch] text-xl leading-[1.45] text-prose">
            {fiche.accroche}
          </p>
          {/* Ce que la famille embarque, AVANT la prose et non dans le rail :
              « on ne réinvente rien » est un argument du dépôt, et il se lisait
              sous la ligne de flottaison. La question « qu est-ce que ça tire
              dans mon paquet » se pose en arrivant, pas après trois écrans. */}
          <PucesDependances deps={deps} />

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

            <div className="mt-9 flex items-baseline justify-between gap-4">
              <p className="cote">Usage</p>
              {/* Dire que le code suit la scène, sinon personne ne le
                  remarque : un bloc qui bouge tout seul passe pour un rendu
                  instable si rien ne l annonce. */}
              <p className="cote">réglé sur la scène</p>
            </div>
            <div className="mt-3">
              <UsageVivant />
            </div>

            <p className="cote mt-9" id="options">
              Options
            </p>
            {/* DEUX RENDUS DE LA MÊME DONNÉE, et c'est délibéré.

                Le tableau qui défile dans son conteneur tenait la page droite
                mais perdait ce qu'il devait dire : dans 300 px, « défaut » se
                coupait au milieu d'un mot (`fals`, `1.5r`) et la colonne
                « rôle » — la seule qui explique à quoi sert l'option — restait
                hors du champ, sans rien pour signaler qu'on pouvait la
                chercher du doigt. Une référence qu'il faut deviner ne
                référence rien.

                Sous 640 px, chaque option devient donc un BLOC : le nom, puis
                type et défaut sur une ligne, puis le rôle en pleine largeur.
                C'est l'ordre dans lequel on lit une option quand on ne compare
                pas — et sur un téléphone, on ne compare pas.

                Le tableau reste au-dessus de 640 px, où comparer une colonne
                d'un bout à l'autre est justement ce qu'on vient y faire. */}
            <dl className="mt-3 sm:hidden">
              {fiche.options.map((option) => (
                <div
                  key={option.nom}
                  className="border-b border-filet py-3.5 last:border-0"
                >
                  <dt className="valeur text-[13px] text-encre">
                    {option.nom}
                  </dt>
                  <dd className="mt-1.5 space-y-1.5">
                    <p className="valeur text-[12px] text-sourdine">
                      {option.type}
                    </p>
                    {/* Le défaut porte son étiquette, il n'est pas séparé du
                        type par un point médian : le type d'une famille à
                        formes EST une liste de valeurs séparées par des points
                        médians, et « scale · slide-up » se lisait comme une
                        huitième forme au lieu d'une valeur par défaut. */}
                    <p className="flex items-baseline gap-2">
                      <span className="cote">défaut</span>
                      <span className="valeur text-[12px] text-second">
                        {option.defaut}
                      </span>
                    </p>
                    <p className="text-[13px] leading-relaxed text-prose">
                      {option.role}
                    </p>
                  </dd>
                </div>
              ))}
            </dl>

            <div className="mt-3 hidden overflow-x-auto sm:block">
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
    </SceneFiche>
  );
}
