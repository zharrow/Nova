"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Dialog } from "radix-ui";
import { Search } from "lucide-react";
import { Demo } from "./demos";
import { catalogue, libelleCategorie, type Fiche } from "@/lib/catalogue";
import { cn } from "@/lib/utils";

/**
 * La palette de commandes — ⌘K.
 *
 * Le catalogue tient mal dans une barre latérale :
 * le filtre y existe déjà, mais il faut d'abord ATTEINDRE la barre, donc être
 * sur une page de documentation, sur un écran large, et savoir que la famille
 * cherchée est rangée dans « Défilement » plutôt que dans « Effets ».
 *
 * Une palette est un trope — chaque documentation en a une — et DESIGN.md
 * demande qu'un objet ne puisse venir que d'ici. Sa torsion est donc celle-ci :
 * **le résultat sélectionné JOUE**. On ne parcourt pas une liste de noms, on
 * parcourt des mouvements, et le clavier suffit à les voir tous. C'est la
 * seule liste du site où descendre d'un cran change ce qu'on regarde, et c'est
 * exactement ce qu'un catalogue d'animations devrait faire.
 *
 * Le panneau de droite est une SCÈNE au sens de DESIGN.md : c'est donc le seul
 * endroit de la palette où quelque chose bouge, et le seul emploi autorisé du
 * signal en dehors de l'anneau de focus.
 */
export function Palette() {
  const [ouverte, setOuverte] = useState(false);
  const [requete, setRequete] = useState("");
  const [index, setIndex] = useState(0);
  const router = useRouter();
  const liste = useRef<HTMLDivElement>(null);

  const resultats = useMemo(() => filtrer(requete), [requete]);
  const choisie = resultats[Math.min(index, resultats.length - 1)];

  /**
   * Un seul écouteur pour toute la page, comme le raccourci de rejeu.
   *
   * `⌘K` porte un modificateur : contrairement à `F`, il n'a pas besoin d'une
   * garde contre les champs de saisie — c'est même dans un champ qu'on veut
   * pouvoir l'appeler. On garde en revanche `Ctrl+K` pour Windows et Linux, et
   * on ne vole rien d'autre.
   */
  useEffect(() => {
    function surTouche(event: KeyboardEvent) {
      if (event.key !== "k" && event.key !== "K") return;
      if (!event.metaKey && !event.ctrlKey) return;
      event.preventDefault();
      setOuverte((v) => !v);
    }
    window.addEventListener("keydown", surTouche);
    return () => window.removeEventListener("keydown", surTouche);
  }, []);

  // Repartir du haut à chaque frappe : garder le curseur au rang 7 pendant que
  // la liste se réduit à trois entrées le laisse pointer sur rien.
  useEffect(() => setIndex(0), [requete]);

  function ouvrirFiche(fiche: Fiche) {
    setOuverte(false);
    router.push(`/composants/${fiche.nom}`);
  }

  function surClavier(event: React.KeyboardEvent) {
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      const pas = event.key === "ArrowDown" ? 1 : -1;
      setIndex((n) => {
        // On boucle : arriver au bout de la liste et devoir
        // remonter à la main pour voir la première est du travail pour rien.
        const total = resultats.length;
        return total === 0 ? 0 : (n + pas + total) % total;
      });
      return;
    }
    if (event.key === "Enter" && choisie) {
      event.preventDefault();
      ouvrirFiche(choisie.fiche);
    }
  }

  // Garder la ligne choisie dans la fenêtre quand on descend au clavier.
  useEffect(() => {
    liste.current
      ?.querySelector('[data-choisie="true"]')
      ?.scrollIntoView({ block: "nearest" });
  }, [index, resultats]);

  return (
    <>
      <DeclencheurPalette onOuvrir={() => setOuverte(true)} />

      <Dialog.Root open={ouverte} onOpenChange={setOuverte}>
        <Dialog.Portal>
          {/* Opaque à 80 % et sans flou : DESIGN.md interdit le
              `backdrop-filter`, toutes les surfaces du site sont pleines. */}
          <Dialog.Overlay className="fixed inset-0 z-[80] bg-black/80" />
          <Dialog.Content
            onKeyDown={surClavier}
            className="fixed left-1/2 top-[12vh] z-[90] w-[min(48rem,calc(100vw-2rem))] -translate-x-1/2 overflow-hidden rounded-plan border border-filet bg-fond"
          >
            <Dialog.Title className="sr-only">Chercher un composant</Dialog.Title>
            <Dialog.Description className="sr-only">
              Tapez pour filtrer le catalogue. Les flèches parcourent les
              résultats, et le composant sélectionné joue à droite.
            </Dialog.Description>

            <div className="flex items-center gap-3 border-b border-filet px-4">
              <Search className="size-4 shrink-0 text-sourdine" aria-hidden />
              <input
                autoFocus
                value={requete}
                onChange={(e) => setRequete(e.target.value)}
                placeholder="Chercher un composant, une forme, un effet…"
                className="w-full bg-transparent py-3.5 text-[15px] text-encre outline-none placeholder:text-sourdine"
              />
            </div>

            <div className="flex max-h-[46vh] min-h-[16rem]">
              <div
                ref={liste}
                className="min-w-0 flex-1 overflow-y-auto p-1.5 sm:max-w-[22rem]"
              >
                {resultats.length === 0 ? (
                  /* Sans requête, la liste vide ne dit pas « rien trouvé »
                     mais « rien à trouver » : le catalogue n'a encore aucune
                     famille publiée. Citer une requête vide donnerait
                     « Rien pour «  » ». */
                  <p className="px-3 py-6 text-[13px] text-second">
                    {requete.trim()
                      ? `Rien pour « ${requete} ».`
                      : "Rien de publié pour l'instant."}
                  </p>
                ) : (
                  resultats.map((resultat, rang) => (
                    <button
                      key={resultat.fiche.nom + resultat.forme}
                      type="button"
                      data-choisie={rang === index}
                      onMouseEnter={() => setIndex(rang)}
                      onClick={() => ouvrirFiche(resultat.fiche)}
                      className={cn(
                        "flex w-full items-baseline justify-between gap-3 rounded-presse px-3 py-2 text-left transition-colors",
                        rang === index
                          ? "bg-banc text-encre"
                          : "text-second hover:text-encre",
                      )}
                    >
                      <span className="min-w-0 truncate text-[13px]">
                        {resultat.fiche.titre}
                        {resultat.forme ? (
                          <span className="valeur ml-2 text-[11px] text-sourdine">
                            {resultat.forme}
                          </span>
                        ) : null}
                      </span>
                      <span className="cote shrink-0">
                        {libelleCategorie(resultat.fiche.categorie)}
                      </span>
                    </button>
                  ))
                )}
              </div>

              {/* La scène. Sous 640 px elle disparaît : la liste y prend toute
                  la largeur, et une démonstration de 180 px sur un téléphone
                  mangerait les résultats qu'elle sert à choisir. */}
              {choisie ? (
                <div className="hidden min-w-0 flex-1 border-l border-filet sm:block">
                  <Demo
                    key={choisie.fiche.nom + choisie.forme}
                    nom={choisie.fiche.nom}
                    forme={choisie.forme || undefined}
                    compact
                    geometrie={choisie.fiche.geometrie ?? "carre"}
                  />
                  <p className="cote border-t border-filet px-4 py-2">
                    {choisie.fiche.accroche}
                  </p>
                </div>
              ) : null}
            </div>

            {/* Le pied de clavier. Un raccourci qu'on ne peut pas deviner
                n'existe pas — même règle que le badge `F` des scènes. Et il
                disparaît au doigt : trois touches qu'on ne peut pas taper au
                bas d'une liste qu'on fait défiler du pouce. La palette se
                referme alors d'une tape à côté, ce que Radix gère déjà. */}
            <div className="sans-doigt flex items-center gap-4 border-t border-filet px-4 py-2">
              <Aide touches={["↑", "↓"]}>parcourir</Aide>
              <Aide touches={["↵"]}>ouvrir</Aide>
              <Aide touches={["esc"]}>fermer</Aide>
              <span className="cote ml-auto hidden sm:inline">
                le composant choisi joue
              </span>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </>
  );
}

function Aide({
  touches,
  children,
}: {
  touches: string[];
  children: React.ReactNode;
}) {
  return (
    <span className="flex items-center gap-1.5">
      {touches.map((touche) => (
        <kbd
          key={touche}
          className="valeur rounded-[4px] border border-filet px-1.5 py-px text-[10px] text-sourdine"
        >
          {touche}
        </kbd>
      ))}
      <span className="cote">{children}</span>
    </span>
  );
}

/**
 * Le déclencheur de l'en-tête.
 *
 * Il porte son raccourci écrit à côté, et le rend au bon symbole : `⌘K` sur
 * Mac, `Ctrl K` ailleurs. Afficher `⌘` à un utilisateur Windows revient à
 * afficher un raccourci qui n'existe pas chez lui.
 */
function DeclencheurPalette({ onOuvrir }: { onOuvrir: () => void }) {
  const [mac, setMac] = useState<boolean | null>(null);
  useEffect(() => setMac(/Mac|iPhone|iPad/.test(navigator.platform)), []);

  return (
    <button
      type="button"
      onClick={onOuvrir}
      aria-label="Chercher un composant"
      className="cible-doigt flex items-center justify-center gap-2 rounded-presse border border-filet px-2.5 py-1.5 text-sourdine transition-colors hover:border-filet-vif hover:text-encre"
    >
      <Search className="size-3.5" aria-hidden />
      {/* Rendu vide tant que la plateforme n'est pas lue : choisir un symbole
          au hasard ferait un saut visible à l'hydratation, comme pour la
          bascule de thème. */}
      <span className="valeur hidden text-[11px] sm:inline">
        {mac === null ? " " : mac ? "⌘K" : "Ctrl K"}
      </span>
    </button>
  );
}

interface Resultat {
  fiche: Fiche;
  /** L'id de la forme, quand c'est elle qui a répondu à la requête. */
  forme: string;
}

/**
 * Le filtre.
 *
 * Il cherche dans les FORMES autant que dans les familles, et c'est ce qui le
 * rend utile : personne ne cherche « Text Effect », on cherche « machine à
 * écrire » ou « typewriter ». Une famille dont une forme répond apparaît donc
 * sous le nom de cette forme, avec l'aperçu réglé dessus.
 *
 * Sans requête, on rend le catalogue dans son ordre déclaré plutôt qu'une
 * liste vide : une palette qui s'ouvre sur rien oblige à taper avant de
 * pouvoir regarder, et le premier service rendu ici est justement de regarder.
 */
function filtrer(requete: string): Resultat[] {
  const q = normaliser(requete.trim());
  if (!q) return catalogue.map((fiche) => ({ fiche, forme: "" }));

  const sortie: Resultat[] = [];
  for (const fiche of catalogue) {
    const surLaFamille =
      normaliser(fiche.titre).includes(q) ||
      normaliser(fiche.nom).includes(q) ||
      normaliser(fiche.accroche).includes(q) ||
      normaliser(libelleCategorie(fiche.categorie)).includes(q);

    const formes = (fiche.formes ?? []).filter(
      (forme) =>
        normaliser(forme.nom).includes(q) || normaliser(forme.id).includes(q),
    );

    if (surLaFamille) sortie.push({ fiche, forme: "" });
    for (const forme of formes) {
      // Une famille déjà listée sous son propre nom ne se répète pas pour
      // autant : la forme reste une entrée à part, parce que c'est elle qu'on
      // cherchait et c'est elle qui doit jouer.
      sortie.push({ fiche, forme: forme.id });
    }
  }
  return sortie;
}

/** Sans accents ni casse : « decale » doit trouver « décalage ». */
function normaliser(texte: string): string {
  return texte
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "");
}
