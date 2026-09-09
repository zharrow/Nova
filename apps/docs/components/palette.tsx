"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Dialog } from "radix-ui";
import { Search, ChevronDown, X } from "lucide-react";
import { Demo } from "./demos";
import {
  catalogue,
  CATEGORIES,
  libelleCategorie,
  type Fiche,
} from "@/lib/catalogue";
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
  const panneau = useRef<HTMLDivElement>(null);

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
            ref={panneau}
            onKeyDown={surClavier}
            /* AU DOIGT, ON N'OUVRE PAS LE CLAVIER.

               Radix donne le focus au premier élément focalisable, donc au
               champ de recherche, donc le clavier virtuel monte et recouvre la
               liste qu'on vient ouvrir pour la PARCOURIR. Sur un téléphone,
               c'est un menu qu'on demande, pas une requête.

               On ne se contente pas d'annuler : le focus va sur le panneau
               lui-même. L'annuler seul le laisserait sur le déclencheur, hors
               du dialogue — plus d'échappement au clavier, et un lecteur
               d'écran qui n'annonce rien. */
            onOpenAutoFocus={(evenement) => {
              if (!window.matchMedia("(pointer: coarse)").matches) return;
              evenement.preventDefault();
              panneau.current?.focus();
            }}
            className="fixed left-1/2 top-[5vh] z-[90] w-[min(48rem,calc(100vw-1.5rem))] -translate-x-1/2 overflow-hidden rounded-plan border border-filet bg-fond sm:top-[12vh] sm:w-[min(48rem,calc(100vw-2rem))]"
          >
            <Dialog.Title className="sr-only">Chercher un composant</Dialog.Title>
            <Dialog.Description className="sr-only">
              Tapez pour filtrer le catalogue. Les flèches parcourent les
              résultats, et le composant sélectionné joue à droite.
            </Dialog.Description>

            {/* L'index reste atteignable DEPUIS le menu.

                Sur téléphone, ce menu remplace le lien « Composants » de la
                barre, et la page d'index n'est pas un doublon de la liste : on
                y voit chaque famille EN MOUVEMENT, rangée par section. Sans
                cette ligne, elle n'aurait plus d'entrée depuis l'en-tête. */}
            <Link
              href="/composants"
              onClick={() => setOuverte(false)}
              className="cible-doigt flex items-center justify-between gap-3 border-b border-filet px-4 py-2.5 text-[13px] text-second transition-colors hover:text-encre sm:hidden"
            >
              Tout parcourir, avec les démonstrations
              <span aria-hidden>→</span>
            </Link>

            <div className="flex items-center gap-3 border-b border-filet px-4">
              <Search className="size-4 shrink-0 text-sourdine" aria-hidden />
              <input
                /* Pas d'`autoFocus` : il s'applique avant même que Radix
                   n'appelle `onOpenAutoFocus`, et rappellerait le clavier que
                   celui-ci vient d'écarter. À la souris, c'est Radix qui donne
                   le focus ici, ce qui revient au même. */
                value={requete}
                onChange={(e) => setRequete(e.target.value)}
                placeholder="Chercher un composant, une forme, un effet…"
                className="w-full bg-transparent py-3.5 text-[15px] text-encre outline-none placeholder:text-sourdine"
              />
              {/* Refermer, au doigt seulement.
                  À la souris et au clavier, `esc` est écrit en pied de
                  panneau et la tape à côté referme aussi. Au doigt, le pied
                  disparaît — il ne parle que de touches — et taper « à côté »
                  d'un panneau qui occupe presque tout l'écran suppose de viser
                  la bande sombre qui reste. Une croix vaut mieux qu'un geste
                  qu'il faut deviner. */}
              <Dialog.Close
                aria-label="Fermer le menu"
                className="doigt-seul cible-doigt -mr-1.5 flex shrink-0 items-center justify-center rounded-presse text-sourdine transition-colors hover:text-encre"
              >
                <X className="size-4" aria-hidden />
              </Dialog.Close>
            </div>

            {/* Plus haute au doigt : c'est le menu du site, et une fenêtre
                de 46 vh sur un téléphone montre six familles sur vingt-trois.
                Le clavier ne monte plus, donc la place est vraiment là. */}
            <div className="flex max-h-[70vh] min-h-[16rem] sm:max-h-[46vh]">
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
                  resultats.map((resultat, rang) => {
                    /* L'intertitre de section, calculé au rendu plutôt que
                       porté par la donnée : la liste reste un tableau plat,
                       donc les flèches continuent de la parcourir d'un bout à
                       l'autre sans avoir à sauter des en-têtes.

                       Il n'existe QUE sans requête. Un résultat de recherche
                       traverse les catégories — c'est même sa raison d'être —
                       et le ranger sous des intertitres ferait croire à un
                       classement là où il y a un score. La catégorie reste
                       alors écrite au bout de chaque rangée, comme avant. */
                    const section =
                      !requete.trim() &&
                      resultat.fiche.categorie !==
                        resultats[rang - 1]?.fiche.categorie
                        ? libelleCategorie(resultat.fiche.categorie)
                        : null;

                    return (
                      <div key={resultat.fiche.nom + resultat.forme}>
                        {section ? (
                          <p className="cote cote-separateur px-3 pb-1.5 pt-4 first:pt-1.5">
                            {section}
                          </p>
                        ) : null}
                        <button
                          type="button"
                          data-choisie={rang === index}
                          onMouseEnter={() => setIndex(rang)}
                          onClick={() => ouvrirFiche(resultat.fiche)}
                          className={cn(
                            "cible-doigt flex w-full items-center justify-between gap-3 rounded-presse px-3 py-2 text-left transition-colors",
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
                          {/* La catégorie ne se répète pas sous son propre
                              intertitre : elle n'apparaît qu'en recherche, où
                              elle est la seule à situer le résultat. */}
                          {requete.trim() ? (
                            <span className="cote shrink-0">
                              {libelleCategorie(resultat.fiche.categorie)}
                            </span>
                          ) : null}
                        </button>
                      </div>
                    );
                  })
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
 * Le déclencheur de l'en-tête. Il change de nature selon l'écran.
 *
 * Au-dessus de 640 px, c'est une LOUPE avec son raccourci écrit à côté, rendu
 * au bon symbole — `⌘K` sur Mac, `Ctrl K` ailleurs, parce qu'afficher `⌘` à un
 * utilisateur Windows revient à afficher un raccourci qui n'existe pas chez
 * lui. La barre latérale est là pour naviguer ; la palette n'est qu'un
 * raccourci vers ce qu'elle montre déjà.
 *
 * En dessous, la barre latérale N'EXISTE PAS : ce bouton est le menu du site,
 * et une loupe seule ne le dit pas. Une loupe annonce « cherchez », c'est-à-dire
 * « sachez d'abord ce que vous voulez » — précisément ce qu'un visiteur qui
 * découvre un catalogue ne sait pas. Il porte donc son nom, et le chevron dit
 * qu'il ouvre quelque chose au lieu d'emmener ailleurs. Derrière, la même
 * palette : la liste entière, rangée par catégorie, la recherche en tête pour
 * qui sait déjà.
 */
function DeclencheurPalette({ onOuvrir }: { onOuvrir: () => void }) {
  const [mac, setMac] = useState<boolean | null>(null);
  useEffect(() => setMac(/Mac|iPhone|iPad/.test(navigator.platform)), []);

  return (
    <button
      type="button"
      onClick={onOuvrir}
      aria-haspopup="dialog"
      aria-label="Composants — ouvrir le menu du catalogue"
      className="cible-doigt flex items-center justify-center gap-2 rounded-presse border border-filet px-3 py-1.5 text-sourdine transition-colors hover:border-filet-vif hover:text-encre sm:px-2.5"
    >
      <Search className="hidden size-3.5 sm:block" aria-hidden />
      <span className="text-sm text-second sm:hidden">Composants</span>
      <ChevronDown className="size-3.5 sm:hidden" aria-hidden />
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
 * Sans requête, on rend le catalogue plutôt qu'une liste vide : une palette
 * qui s'ouvre sur rien oblige à taper avant de pouvoir regarder, et le premier
 * service rendu ici est justement de regarder.
 *
 * Et on le rend RANGÉ PAR CATÉGORIE, pas dans l'ordre déclaré. C'est la règle
 * de l'index — vingt-trois noms d'affilée forment un mur qu'on parcourt sans
 * repère, six listes courtes se lisent d'un regard — et elle vaut ici plus
 * qu'ailleurs depuis que cette liste est LE MENU du téléphone. L'ordre rendu
 * est aussi l'ordre parcouru par les flèches : le tableau reste plat, ce sont
 * les intertitres qui sont calculés à l'affichage.
 */
function filtrer(requete: string): Resultat[] {
  const q = normaliser(requete.trim());
  if (!q) {
    return CATEGORIES.flatMap((categorie) =>
      catalogue
        .filter((fiche) => fiche.categorie === categorie.id)
        .map((fiche) => ({ fiche, forme: "" })),
    );
  }

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
