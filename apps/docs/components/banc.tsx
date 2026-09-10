"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Demo, type Geometrie } from "./demos";
import { Telemetrie } from "./telemetrie";
import { Reglages, valeursParDefaut, type Valeurs } from "./reglages";
import { saisieEnCours, useRaccourciRejeu } from "./raccourci-rejeu";
import { familles, reglagesDe, type Forme } from "@/lib/catalogue";
import { BROUILLONS } from "@/brouillons";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

/**
 * Ce qu'on regarde, et à quel titre.
 *
 * Trois états, et ce sont les trois seules distinctions qui comptent sur un
 * établi : ce qui SORT, ce qui est écrit mais que personne n'a encore validé,
 * et ce qui n'a pas encore de moteur. La vitrine, elle, ne connaît que le
 * premier.
 */
type Etat = "publiee" | "attente" | "brouillon";

interface Sujet {
  nom: string;
  titre: string;
  /** Ce qu'on cherche à regarder. Accroche d'une famille, note d'un brouillon. */
  note: string;
  etat: Etat;
  geometrie: Geometrie;
  /** Les formes déclarées. Vide pour une famille unique et pour un brouillon. */
  formes: Forme[];
  voie?: "option" | "usage" | "frere";
}

/**
 * Les groupes du rail, du plus brut au plus avancé.
 *
 * L'ordre inverse était le premier écrit, et il enterrait sous vingt-trois
 * familles publiées les deux groupes pour lesquels le banc existe : ceux qu'il
 * faut juger. On ne descend pas un rail de vingt-six entrées pour aller voir
 * ce qui attend son tour — on ne se souvient même pas que ça attend.
 *
 * `un` porte le singulier : « 1 brouillons » dans l'en-tête est le genre de
 * détail qui fait passer un outil pour un gabarit.
 */
const GROUPES: Array<{ etat: Etat; label: string; un: string }> = [
  { etat: "brouillon", label: "Brouillons", un: "brouillon" },
  { etat: "attente", label: "En attente", un: "en attente" },
  { etat: "publiee", label: "Publiées", un: "publiée" },
];

/** Le mot qui coiffe le sélecteur, selon la voie de déclinaison. */
const VOIES: Record<string, string> = {
  option: "Formes",
  usage: "Usages",
  frere: "Composants frères",
};

/** Ce qu'un état ajoute au plancher de la scène, quand il n'est pas publié. */
const MENTIONS: Partial<Record<Etat, string>> = {
  attente: "en attente",
  brouillon: "brouillon",
};

/**
 * Le banc de test.
 *
 * Trois besoins, qu'une fiche ne couvre pas :
 *
 * 1. **Régler au-delà des options curées.** Une fiche n'expose que les
 *    réglages qui changent visiblement le mouvement — c'est volontaire, un
 *    panneau de vingt curseurs n'apprend rien. Le banc, lui, accepte
 *    n'importe quelle prop par un éditeur JSON : c'est là qu'on essaie une
 *    option obscure avant de décider si elle mérite un curseur.
 * 2. **Comparer les formes d'une famille.** Une fiche en montre une à la fois,
 *    et c'est le bon régime pour lire. Sur un établi on veut l'inverse : les
 *    quatorze rideaux de `Loader` côte à côte, sous une seule horloge, parce
 *    qu'un geste d'une seconde ne se juge pas de mémoire contre le souvenir du
 *    précédent. C'est ce que faisait le brouillon `lames` avant que ses dix
 *    chorégraphies deviennent des formes ; la planche le rend à toutes les
 *    familles, et sans dupliquer une ligne de moteur.
 * 3. **Accueillir un brouillon.** Un candidat qui n'est pas encore dans
 *    `packages/core` s'essaie ici avant qu'on lui écrive un moteur, une
 *    entrée de registry et une fiche. Voir `brouillons/index.tsx`.
 *
 * C'est aussi le seul endroit où l'on voit une famille NON VALIDÉE. Le site et
 * la CLI ne servent que ce qui porte `valide: true` dans `lib/catalogue.ts` ;
 * le banc, lui, rend `familles` — sans quoi il faudrait valider pour juger,
 * c'est-à-dire décider avant d'avoir regardé.
 *
 * CE QUI A ÉTÉ RETIRÉ, et pourquoi. Le banc faisait varier le plan, la hauteur,
 * la largeur et l'alignement de la scène : quatre groupes de boutons, seize
 * jetons, en travers du chemin entre le sujet et ses réglages. Ils répondaient
 * à une question qu'on ne se pose pas ici — « de quoi cet effet a-t-il l'air
 * dans une autre boîte ? » — pendant que celle qu'on se pose vraiment, « à quoi
 * ressemblent ses autres formes ? », n'avait aucune commande. La scène garde
 * donc les valeurs qui servaient dans quatre-vingt-dix-neuf cas sur cent :
 * plan surélevé, hauteur de champ, pleine largeur, centrée.
 *
 * Ce n'est PAS une page de la vitrine : elle n'est liée depuis aucune
 * navigation et porte `noindex`. Elle suit quand même DESIGN.md — un outil
 * qu'on regarde tous les jours mérite le même soin.
 */
export function Banc() {
  const sujets = useMemo<Sujet[]>(
    () => [
      /* `familles`, et non `catalogue` : le banc montre AUSSI ce qui n'est pas
         validé — c'est ici qu'on juge un candidat avant de le laisser sortir. */
      ...familles.map((famille) => ({
        nom: famille.nom,
        titre: famille.titre,
        note: famille.accroche,
        etat: (famille.valide === true ? "publiee" : "attente") as Etat,
        geometrie: (famille.geometrie ?? "carre") as Geometrie,
        formes: famille.formes ?? [],
        voie: famille.voie,
      })),
      ...BROUILLONS.map((candidat) => ({
        nom: candidat.nom,
        titre: candidat.titre,
        note: candidat.note,
        etat: "brouillon" as Etat,
        geometrie: "carre" as Geometrie,
        formes: [] as Forme[],
      })),
    ],
    [],
  );

  const [nom, setNom] = useState(sujets[0]!.nom);
  const sujet = sujets.find((s) => s.nom === nom)!;
  const brouillon = BROUILLONS.find((b) => b.nom === nom);
  const formes = sujet.formes;

  const [forme, setForme] = useState<string | undefined>(formes[0]?.id);
  /** La planche : toutes les formes en même temps, sous la même horloge. */
  const [planche, setPlanche] = useState(false);
  const [aire, setAire] = useState<HTMLDivElement | null>(null);
  const [tour, setTour] = useState(0);

  /* La démonstration est montée en mode `nu` : elle n'apporte donc pas son
     plancher, et c'est le banc qui inscrit sa propre scène au raccourci. */
  const remonter = useCallback(() => setTour((n) => n + 1), []);
  useRaccourciRejeu(aire, remonter);

  const reglages = brouillon ? [] : reglagesDe(nom);
  const [valeurs, setValeurs] = useState<Valeurs>(() =>
    valeursParDefaut(reglagesDe(sujets[0]!.nom)),
  );

  /* L'éditeur JSON est la vraie puissance du banc : il accepte n'importe
     quelle prop, y compris celles qu'aucun curseur n'expose. On garde le
     texte ET l'objet analysé séparément — sinon une frappe intermédiaire
     invalide effacerait ce que l'utilisateur est en train d'écrire. */
  const [texteProps, setTexteProps] = useState("{}");
  const { props: propsLibres, erreur } = useMemo(() => {
    if (!texteProps.trim()) return { props: {}, erreur: null };
    try {
      const lu = JSON.parse(texteProps) as unknown;
      if (typeof lu !== "object" || lu === null || Array.isArray(lu)) {
        return { props: {}, erreur: "Il faut un objet JSON." };
      }
      return { props: lu as Record<string, unknown>, erreur: null };
    } catch (e) {
      return { props: {}, erreur: (e as Error).message };
    }
  }, [texteProps]);

  function changerSujet(suivant: string) {
    setNom(suivant);
    setForme(sujets.find((s) => s.nom === suivant)?.formes[0]?.id);
    setValeurs(valeursParDefaut(reglagesDe(suivant)));
    /* Pour un brouillon, on pré-remplit avec ses défauts : un `{}` vide
       n'apprend pas quelles props existent, et c'est justement ce qu'on vient
       chercher en essayant un candidat. Une famille du catalogue a déjà ses
       curseurs et son tableau d'options, elle n'en a pas besoin. */
    const candidat = BROUILLONS.find((b) => b.nom === suivant);
    setTexteProps(candidat ? JSON.stringify(candidat.defauts, null, 2) : "{}");
    setTour((n) => n + 1);
  }

  const finales = useMemo(
    () => ({ ...valeurs, ...propsLibres }),
    [valeurs, propsLibres],
  );

  /**
   * `←` et `→` passent d'une forme à l'autre.
   *
   * C'est LA commande de l'établi. Quatorze rideaux se comparent en tenant une
   * flèche, sans quitter la scène des yeux pour aller viser un jeton à quinze
   * centimètres de là — et c'est justement en ne quittant pas la scène des yeux
   * qu'on voit lequel démarre trop tard.
   *
   * Deux gardes, les mêmes que la touche `F` : rien depuis un champ de saisie,
   * rien avec une touche morte. La première n'est pas théorique — les curseurs
   * de réglage se règlent AUX FLÈCHES une fois qu'ils ont le focus, et sans la
   * garde, ajuster une durée au clavier changerait de forme à chaque cran.
   */
  useEffect(() => {
    if (formes.length < 2) return;
    function surTouche(event: KeyboardEvent) {
      if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
      if (event.metaKey || event.ctrlKey || event.altKey) return;
      if (saisieEnCours(event.target)) return;
      event.preventDefault();
      setForme((actuelle) => {
        const index = formes.findIndex((f) => f.id === actuelle);
        const pas = event.key === "ArrowRight" ? 1 : -1;
        /* Modulo POSITIF : `-1 % 14` vaut `-1` en JavaScript, et la première
           forme n'aurait alors pas de précédente. */
        return formes[(index + pas + formes.length) % formes.length]!.id;
      });
    }
    window.addEventListener("keydown", surTouche);
    return () => window.removeEventListener("keydown", surTouche);
  }, [formes]);

  /**
   * Rejeu différé, même mécanique que sur une fiche.
   *
   * Sans lui, le banc affichait « 2 props appliquées » alors que rien ne
   * bougeait : les moteurs qui ont déjà joué leur entrée ne réécrivent pas
   * leurs variables sur un simple `update()`, seul un remontage les rejoue.
   * 220 ms après la dernière frappe — taper du JSON à la main produit des
   * dizaines d'états intermédiaires, et remonter à chacun serait illisible.
   */
  const premierRendu = useRef(true);
  useEffect(() => {
    if (premierRendu.current) {
      premierRendu.current = false;
      return;
    }
    const minuteur = setTimeout(() => setTour((n) => n + 1), 220);
    return () => clearTimeout(minuteur);
  }, [finales]);

  /* Une forme changée EST un remontage : la clé la porte, et aucun effet n'a
     à la déclencher à la main. */
  const cle = `${forme ?? ""}-${tour}`;
  const courante = formes.find((f) => f.id === forme);
  const mention = MENTIONS[sujet.etat];

  return (
    <div className="mx-auto max-w-[1440px] px-6 py-10">
      <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2">
        <h1 className="titre text-3xl">Banc de test</h1>
        {/* Les comptes sont CALCULÉS, jamais écrits : ils changent à chaque
            récolte, et une phrase qui les cite se périme à la ligne suivante. */}
        <p className="cote">
          {GROUPES.map(({ etat, label, un }) => {
            const combien = sujets.filter((s) => s.etat === etat).length;
            if (combien === 0) return null;
            return `${combien} ${combien > 1 ? label.toLowerCase() : un}`;
          })
            .filter(Boolean)
            .join(" · ")}
        </p>
      </div>
      <p className="mt-3 max-w-[62ch] leading-relaxed text-prose">
        Hors vitrine. On y règle un composant au-delà des options de sa fiche,
        on compare ses formes sous une seule horloge, et on y essaie un
        brouillon avant de lui écrire un moteur. Aucune navigation ne mène ici,
        et la page n&apos;est pas indexée.
      </p>

      <div className="mt-8 grid gap-8 lg:grid-cols-[224px_minmax(0,1fr)] lg:gap-10">
        <Rail sujets={sujets} nom={nom} onChoix={changerSujet} />

        <div className="min-w-0">
          {/* ── La scène ───────────────────────────────────────────────── */}
          <div className="banc">
            <div
              ref={setAire}
              className={cn(
                "relative overflow-hidden",
                planche
                  ? "p-3"
                  /* UNE GRILLE, PAS UN CENTRAGE FLEX. La démonstration montée
                     en mode `nu` se dit `h-full w-full`, et une hauteur en
                     pourcentage ne résout rien sous un parent qui n'a qu'un
                     `min-height` et qui centre : la scène tombait à zéro, et
                     tout ce qui s'y pose en `absolute inset-0` — le rideau du
                     Loader, sa planche — n'avait plus de boîte. Un item de
                     grille, lui, s'étire sur une piste dont la hauteur est
                     définie. */
                  : "grid min-h-[clamp(300px,52vh,560px)]",
              )}
            >
              {planche ? (
                <Planche
                  nom={nom}
                  formes={formes}
                  geometrie={sujet.geometrie}
                  reglages={finales}
                  cle={cle}
                  active={forme}
                  onChoix={(id) => {
                    setForme(id);
                    setPlanche(false);
                  }}
                />
              ) : brouillon ? (
                <brouillon.Composant
                  key={cle}
                  {...brouillon.defauts}
                  {...propsLibres}
                />
              ) : (
                <Demo key={cle} nom={nom} forme={forme} reglages={finales} nu />
              )}
              {/* La télémétrie mesure UNE scène. Sur la planche elle relèverait
                  les attributs de la première vignette venue et les
                  présenterait comme ceux de l'ensemble : un relevé faux est
                  pire que pas de relevé.

                  DÉMONTÉE, et pas seulement privée de cible : un `cible={null}`
                  fait sortir son effet sans vider ses lignes, et le dernier
                  relevé de la scène précédente restait affiché par-dessus la
                  quatrième vignette. */}
              {planche ? null : <Telemetrie cible={aire} />}
            </div>

            {/* Le plancher : ce qu'on regarde, et à quel titre. */}
            <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 border-t border-filet px-4 py-2.5">
              <span className="flex items-baseline gap-2.5 truncate">
                <span className="titre text-[1.05rem] text-second">
                  {sujet.titre}
                </span>
                {courante && !planche ? (
                  <span className="valeur text-[11px] text-sourdine">
                    {courante.id}
                  </span>
                ) : null}
                {/* Le trait discontinu dit « ne sort pas ». Il voyage avec ce
                    qu'on regarde plutôt que de rester dans la liste : c'est ici
                    qu'on oublierait qu'une famille n'est pas publiée. */}
                {mention ? (
                  <span className="valeur rounded-presse border border-dashed border-filet-vif px-1.5 py-px text-[10px] text-sourdine">
                    {mention}
                  </span>
                ) : null}
              </span>
              <button
                type="button"
                onClick={remonter}
                className="cote flex shrink-0 items-center gap-1.5 hover:text-encre"
              >
                <span className="lien">remonter</span>
                <Touche>F</Touche>
              </button>
            </div>
          </div>

          <p className="mt-4 max-w-[62ch] text-[13px] leading-relaxed text-second">
            {sujet.note}
          </p>

          {/* ── Les formes ─────────────────────────────────────────────── */}
          {formes.length > 1 ? (
            <div className="mt-6">
              <div className="mb-3 flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
                <p className="cote flex items-center gap-2">
                  <span>
                    {VOIES[sujet.voie ?? "option"]} · {formes.length}
                  </span>
                  {/* Un raccourci qu'on ne peut pas deviner n'existe pas — et
                      au doigt, il n'existe pas du tout. */}
                  <span className="sans-doigt flex items-center gap-1">
                    <Touche>←</Touche>
                    <Touche>→</Touche>
                  </span>
                </p>
                <button
                  type="button"
                  onClick={() => setPlanche((v) => !v)}
                  aria-pressed={planche}
                  className="cote lien hover:text-encre"
                >
                  {planche ? "revenir à une seule" : "toutes à la fois"}
                </button>
              </div>

              <div className="flex flex-wrap gap-1.5">
                {formes.map((f) => (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => {
                      setForme(f.id);
                      setPlanche(false);
                    }}
                    aria-pressed={!planche && forme === f.id}
                    className={cn(
                      "valeur rounded-presse border px-2.5 py-1.5 text-[11px] transition-colors",
                      !planche && forme === f.id
                        ? "border-filet-vif text-encre"
                        : "border-filet text-second hover:border-filet-vif hover:text-encre",
                    )}
                  >
                    {f.nom}
                  </button>
                ))}
              </div>

              {courante && !planche ? (
                <p className="mt-3 max-w-[62ch] text-[13px] leading-relaxed text-prose">
                  {courante.note}
                </p>
              ) : null}
            </div>
          ) : null}

          {/* ── Les réglages curés, quand la famille en déclare ─────────── */}
          {reglages.length > 0 ? (
            <Reglages
              reglages={reglages}
              valeurs={valeurs}
              onChange={(cleReglage, valeur) =>
                setValeurs((p) => ({ ...p, [cleReglage]: valeur }))
              }
              onReinit={() => setValeurs(valeursParDefaut(reglages))}
            />
          ) : null}

          {/* ── Les props libres ───────────────────────────────────────── */}
          <div className="mt-5 rounded-plan border border-filet bg-plan p-5">
            <div className="mb-3 flex flex-wrap items-baseline justify-between gap-3">
              <p className="cote">Props libres · JSON</p>
              <p className="cote">écrasent les réglages ci-dessus</p>
            </div>
            <textarea
              value={texteProps}
              onChange={(e) => setTexteProps(e.target.value)}
              spellCheck={false}
              rows={5}
              aria-label="Props libres au format JSON"
              className="w-full resize-y rounded-presse border border-filet bg-fond px-3 py-2 font-mono text-[13px] leading-relaxed text-prose outline-none focus-visible:border-filet-vif"
            />
            {/* L'erreur est affichée, jamais avalée : une frappe intermédiaire
                invalide est le cas NORMAL quand on écrit du JSON à la main, et
                faire disparaître le composant sans rien dire serait pire. */}
            <p className="cote mt-2">
              {erreur ? (
                <span className="text-destructive">JSON invalide — {erreur}</span>
              ) : (
                `${Object.keys(propsLibres).length} prop${Object.keys(propsLibres).length > 1 ? "s" : ""} appliquée${Object.keys(propsLibres).length > 1 ? "s" : ""}`
              )}
            </p>
          </div>

          <p className="cote mt-6 max-w-[62ch] leading-relaxed">
            Le mouvement réduit ne se simule pas depuis la page : il se bascule
            dans les outils du navigateur, section rendu, « émuler
            prefers-reduced-motion ».
          </p>
        </div>
      </div>
    </div>
  );
}

/**
 * Le rail des sujets.
 *
 * Il remplace un mur de vingt-six jetons où rien ne distinguait une famille
 * publiée d'un brouillon, et où trouver un nom demandait de lire la ligne
 * entière. Une colonne se descend du regard ; une nappe de jetons se fouille.
 *
 * Deux choses qu'un jeton ne portait pas et qui décident du clic : le GROUPE,
 * qui dit à quel titre le sujet est là, et le COMPTE DE FORMES, qui dit ce
 * qu'il y a à voir derrière le nom. Une entrée du catalogue est une famille,
 * pas une pièce — c'est le plus tôt qu'on puisse le dire. Voir VARIANTES.md.
 *
 * Le filtre porte sur le titre ET sur le nom technique, comme celui de la
 * barre latérale : on cherche « Text Effect » autant que `text-effect`.
 */
function Rail({
  sujets,
  nom,
  onChoix,
}: {
  sujets: Sujet[];
  nom: string;
  onChoix: (nom: string) => void;
}) {
  const [filtre, setFiltre] = useState("");

  const visibles = useMemo(() => {
    const requete = filtre.trim().toLowerCase();
    if (!requete) return sujets;
    return sujets.filter(
      (sujet) =>
        sujet.titre.toLowerCase().includes(requete) ||
        sujet.nom.includes(requete),
    );
  }, [sujets, filtre]);

  return (
    /* Sur grand écran, un rail qui suit ; en dessous, une liste plafonnée à
       40 % de la hauteur. Vingt-six entrées déroulées au-dessus de la scène
       repousseraient l'objet de la page hors de l'écran, ce qui est exactement
       ce que le banc ne doit pas faire. */
    <div className="lg:sticky lg:top-[4.5rem] lg:max-h-[calc(100dvh-6rem)] lg:overflow-y-auto lg:pr-2">
      <label className="sr-only" htmlFor="filtre-banc">
        Filtrer les sujets
      </label>
      <Input
        id="filtre-banc"
        type="search"
        value={filtre}
        onChange={(event) => setFiltre(event.target.value)}
        placeholder="Filtrer…"
        className="h-9 text-[13px]"
      />

      <div className="mt-5 max-h-[40vh] space-y-5 overflow-y-auto lg:max-h-none lg:overflow-visible">
        {GROUPES.map(({ etat, label }) => {
          const entrees = visibles.filter((sujet) => sujet.etat === etat);
          if (entrees.length === 0) return null;
          return (
            <div key={etat}>
              <p className="cote cote-signal mb-2">
                {label} · {entrees.length}
              </p>
              <ul className="space-y-0.5">
                {entrees.map((sujet) => (
                  <li key={sujet.nom}>
                    <button
                      type="button"
                      onClick={() => onChoix(sujet.nom)}
                      aria-current={sujet.nom === nom ? "true" : undefined}
                      className={cn(
                        "flex w-full items-center gap-1 rounded-presse px-2 py-1.5 text-left text-[13.5px] transition-colors",
                        /* Le même traitement que la page courante de la barre
                           latérale : le fond, le mot en bleu, et le filet du
                           bord gauche. Trois marques dont aucune ne déplace le
                           texte — dans une colonne, un fond seul se cherche. */
                        sujet.nom === nom
                          ? "page-courante bg-accent font-medium text-signal"
                          : "text-muted-foreground hover:bg-accent/60 hover:text-foreground",
                      )}
                    >
                      <span className="truncate">{sujet.titre}</span>
                      {sujet.formes.length > 1 ? (
                        <span
                          className="ml-auto font-mono text-[10px] text-sourdine/70"
                          title={`${sujet.formes.length} formes`}
                        >
                          {sujet.formes.length}
                        </span>
                      ) : null}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          );
        })}

        {visibles.length === 0 ? (
          <p className="text-[13px] text-sourdine">Rien sous ce nom.</p>
        ) : null}
      </div>
    </div>
  );
}

/**
 * La planche : toutes les formes d'une famille, en même temps.
 *
 * UNE SEULE HORLOGE POUR CE QU'ON VOIT ENSEMBLE, et c'est tout l'intérêt. Les
 * vignettes partagent la clé de remontage : « remonter » — ou `F` — les relance
 * toutes à la même image. Des cycles indépendants dériveraient en quelques
 * secondes, et on comparerait des instants différents en croyant comparer des
 * gestes. C'est la décision de méthode du brouillon `lames`, rendue ici par
 * construction plutôt que par un jeu de minuteries à tenir.
 *
 * La rangée hors écran, elle, s'arme quand on arrive dessus : `DemoLoader`
 * attend d'être REGARDÉ. C'est le bon comportement et non une entorse — un
 * rideau joué pendant qu'on regarde ailleurs est un rideau dépensé, et deux
 * gestes qu'on ne peut pas voir en même temps ne se comparent de toute façon
 * pas. D'où les quatre colonnes plus bas : la comparaison utile est celle qui
 * tient dans un écran.
 *
 * Et pas une ligne de moteur dupliquée : chaque vignette est le VRAI composant,
 * monté sur sa forme réelle. Le brouillon avait dû réécrire ses dix
 * chorégraphies parce qu'aucune n'existait encore ; les garder après coup
 * aurait fait deux implémentations des mêmes gestes, qui auraient divergé à la
 * première retouche.
 *
 * Les vignettes sont INERTES et cliquables — le régime des cases du catalogue.
 * Une démonstration manipulable dans un bouton imbriquerait deux éléments
 * interactifs, ce que HTML interdit ; et sur une planche on ne règle pas, on
 * compare, puis on clique celle qu'on veut regarder en grand.
 */
function Planche({
  nom,
  formes,
  geometrie,
  reglages,
  cle,
  active,
  onChoix,
}: {
  nom: string;
  formes: Forme[];
  geometrie: Geometrie;
  reglages: Record<string, unknown>;
  cle: string;
  active: string | undefined;
  onChoix: (id: string) => void;
}) {
  return (
    /* Quatre colonnes dès qu'il y a la largeur, et non trois : quatorze
         vignettes sur cinq rangées ne tiennent dans aucun écran, et deux gestes
         qu'on ne peut pas voir ensemble ne se comparent pas. */
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {formes.map((forme) => (
        <button
          key={forme.id}
          type="button"
          onClick={() => onChoix(forme.id)}
          className={cn(
            "group block min-w-0 rounded-[12px] bg-banc text-left ring-1 ring-inset transition-colors duration-100 hover:bg-banc-haut focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-signal",
            forme.id === active ? "ring-filet-vif" : "ring-filet",
          )}
        >
          <div className="px-1 pt-1">
            <div className="relative aspect-[1.92] w-full overflow-hidden rounded-[8px] bg-banc outline-1 -outline-offset-1 outline-filet">
              {/* La MÊME clé pour toutes : c'est elle, l'horloge unique. */}
              <Demo
                key={cle}
                nom={nom}
                forme={forme.id}
                geometrie={geometrie}
                reglages={reglages}
                compact
                inerte
              />
            </div>
          </div>
          <div className="flex items-baseline justify-between gap-2 px-3 py-2">
            <span className="truncate text-xs font-semibold text-encre">
              {forme.nom}
            </span>
            <span className="valeur shrink-0 text-[10px] text-sourdine">
              {forme.id}
            </span>
          </div>
        </button>
      ))}
    </div>
  );
}

/** Le badge d'une touche. Écrit à côté de sa commande, jamais tout seul. */
function Touche({ children }: { children: React.ReactNode }) {
  return (
    <kbd
      aria-hidden
      className="rounded-[3px] border border-filet px-1 py-px font-mono text-[9px] leading-none text-sourdine"
    >
      {children}
    </kbd>
  );
}
