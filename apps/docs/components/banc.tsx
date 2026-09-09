"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Demo, type Geometrie } from "./demos";
import { Telemetrie } from "./telemetrie";
import { Reglages, valeursParDefaut, type Valeurs } from "./reglages";
import { useRaccourciRejeu } from "./raccourci-rejeu";
import { familles, reglagesDe } from "@/lib/catalogue";
import { BROUILLONS } from "@/brouillons";

type Plan = "nuit" | "plan" | "banc" | "banc-haut";
type Cadre = "pleine" | "colonne" | "etroit";

const PLANS: Record<Plan, string> = {
  nuit: "bg-fond",
  plan: "bg-plan",
  banc: "bg-banc",
  "banc-haut": "bg-banc-haut",
};

const HAUTEURS: Record<Geometrie, string> = {
  bande: "min-h-[180px]",
  bloc: "min-h-[250px]",
  carre: "min-h-[250px]",
  champ: "min-h-[clamp(300px,52vh,560px)]",
};

const CADRES: Record<Cadre, string> = {
  pleine: "w-full",
  colonne: "w-full max-w-[62ch]",
  etroit: "w-full max-w-[400px]",
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
 * 2. **Voir le composant dans son contexte.** Un effet lisible sur le plan
 *    surélevé peut disparaître sur le plan enfoncé, et une bande n'a rien à
 *    voir avec un champ. Le banc fait varier le plan, la hauteur,
 *    l'alignement et la largeur sans toucher au code.
 * 3. **Accueillir un brouillon.** Un candidat qui n'est pas encore dans
 *    `packages/core` s'essaie ici avant qu'on lui écrive un moteur, une
 *    entrée de registry et une fiche. Voir `brouillons/index.tsx`.
 *
 * C'est aussi le seul endroit où l'on voit une famille NON VALIDÉE. Le site et
 * la CLI ne servent que ce qui porte `valide: true` dans `lib/catalogue.ts` ;
 * le banc, lui, rend `familles` — sans quoi il faudrait valider pour juger,
 * c'est-à-dire décider avant d'avoir regardé.
 *
 * Ce n'est PAS une page de la vitrine : elle n'est liée depuis aucune
 * navigation et porte `noindex`. Elle suit quand même DESIGN.md — un outil
 * qu'on regarde tous les jours mérite le même soin.
 */
export function Banc() {
  const sujets = useMemo(
    () => [
      /* `familles`, et non `catalogue` : le banc montre AUSSI ce qui n'est pas
         validé — c'est ici qu'on juge un candidat avant de le laisser sortir.
         La page est absente de la production, donc rien n'en fuit. */
      ...familles.map((f) => ({
        genre: "famille" as const,
        nom: f.nom,
        titre: f.titre,
        note: f.accroche,
        geometrie: (f.geometrie ?? "carre") as Geometrie,
        valide: f.valide === true,
      })),
      ...BROUILLONS.map((b) => ({
        genre: "brouillon" as const,
        nom: b.nom,
        titre: b.titre,
        note: b.note,
        geometrie: "carre" as Geometrie,
        valide: false,
      })),
    ],
    [],
  );

  const [nom, setNom] = useState(sujets[0]!.nom);
  const sujet = sujets.find((s) => s.nom === nom)!;
  const brouillon = BROUILLONS.find((b) => b.nom === nom);

  const [plan, setPlan] = useState<Plan>("banc");
  const [hauteur, setHauteur] = useState<Geometrie>("champ");
  const [centre, setCentre] = useState(true);
  const [cadre, setCadre] = useState<Cadre>("pleine");
  const [scene, setScene] = useState<HTMLDivElement | null>(null);
  const [tour, setTour] = useState(0);

  /* La démonstration est montée en mode `nu` : elle n'apporte donc pas son
     plancher, et c'est le banc qui inscrit sa propre scène au raccourci. */
  const remonter = useCallback(() => setTour((n) => n + 1), []);
  useRaccourciRejeu(scene, remonter);

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

  return (
    <div className="mx-auto max-w-[1440px] px-6 py-10">
      <div className="flex flex-wrap items-baseline justify-between gap-4">
        <h1 className="titre text-3xl">Banc de test</h1>
        <p className="cote">
          {BROUILLONS.length} brouillon{BROUILLONS.length > 1 ? "s" : ""}
        </p>
      </div>
      <p className="mt-3 max-w-[62ch] leading-relaxed text-prose">
        Hors vitrine. On y règle un composant au-delà des options de sa fiche,
        on le regarde changer de plan et de format, et on y essaie un brouillon
        avant de lui écrire un moteur.
      </p>

      {/* ── Le sujet ─────────────────────────────────────────────────── */}
      <div className="mt-8">
        <p className="cote mb-2.5">Sujet</p>
        <div className="flex flex-wrap gap-1.5">
          {sujets.map((s) => (
            <button
              key={s.nom}
              type="button"
              onClick={() => changerSujet(s.nom)}
              aria-pressed={s.nom === nom}
              className={[
                "valeur rounded-presse border px-2.5 py-1.5 text-[11px] transition-colors",
                s.nom === nom
                  ? "border-filet-vif text-encre"
                  : "border-filet text-second hover:border-filet-vif hover:text-encre",
                // Le trait discontinu dit « ne sort pas ». Un brouillon n'est
                // pas encore un composant de la librairie ; une famille non
                // validée en est un, mais que personne ne peut installer. Les
                // confondre avec le reste ferait écrire une documentation pour
                // quelque chose qui n'existe pas encore pour le visiteur.
                s.valide ? "" : "border-dashed",
              ].join(" ")}
            >
              {s.nom}
              {s.genre === "brouillon" ? (
                <span className="ml-1.5 text-sourdine">brouillon</span>
              ) : !s.valide ? (
                <span className="ml-1.5 text-sourdine">en attente</span>
              ) : null}
            </button>
          ))}
        </div>
        <p className="mt-3 max-w-[62ch] text-[13px] leading-relaxed text-second">
          {sujet.note}
        </p>
      </div>

      {/* ── La scène ─────────────────────────────────────────────────── */}
      <div className="mt-8">
        <div
          ref={setScene}
          className={[
            "relative flex overflow-hidden border-t border-b border-filet",
            PLANS[plan],
            HAUTEURS[hauteur],
            centre ? "items-center justify-center" : "items-center justify-start",
            "px-6 sm:px-10",
          ].join(" ")}
        >
          <div className={[CADRES[cadre], centre ? "flex justify-center" : ""].join(" ")}>
            {brouillon ? (
              <brouillon.Composant
                key={tour}
                {...brouillon.defauts}
                {...propsLibres}
              />
            ) : (
              <Demo key={tour} nom={nom} reglages={finales} nu />
            )}
          </div>
          <Telemetrie cible={scene} />
        </div>

        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-filet px-4 py-2.5">
          <span className="titre text-[1.05rem] text-second">{sujet.titre}</span>
          <button
            type="button"
            onClick={remonter}
            className="cote flex items-center gap-1.5 hover:text-encre"
          >
            <span className="lien">remonter</span>
            <kbd
              aria-hidden
              className="rounded-[3px] border border-filet px-1 py-px font-mono text-[9px] leading-none text-sourdine"
            >
              F
            </kbd>
          </button>
        </div>
      </div>

      {/* ── Le contexte ──────────────────────────────────────────────── */}
      <div className="mt-6 grid gap-4 rounded-plan border border-filet bg-plan p-5 sm:grid-cols-2 lg:grid-cols-4">
        <Groupe titre="Plan" valeur={plan} choix={Object.keys(PLANS)} onChoix={(v) => setPlan(v as Plan)} />
        <Groupe
          titre="Hauteur"
          valeur={hauteur}
          choix={Object.keys(HAUTEURS)}
          onChoix={(v) => setHauteur(v as Geometrie)}
        />
        <Groupe
          titre="Largeur"
          valeur={cadre}
          choix={Object.keys(CADRES)}
          onChoix={(v) => setCadre(v as Cadre)}
        />
        <Groupe
          titre="Alignement"
          valeur={centre ? "centre" : "gauche"}
          choix={["centre", "gauche"]}
          onChoix={(v) => setCentre(v === "centre")}
        />
      </div>

      {/* ── Les réglages curés, quand la famille en déclare ──────────── */}
      {reglages.length > 0 ? (
        <Reglages
          reglages={reglages}
          valeurs={valeurs}
          onChange={(cle, valeur) =>
            setValeurs((p) => ({ ...p, [cle]: valeur }))
          }
          onReinit={() => setValeurs(valeursParDefaut(reglages))}
        />
      ) : null}

      {/* ── Les props libres ─────────────────────────────────────────── */}
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
        Le mouvement réduit ne se simule pas depuis la page : il se bascule dans
        les outils du navigateur, section rendu, « émuler prefers-reduced-motion ».
      </p>
    </div>
  );
}

function Groupe({
  titre,
  valeur,
  choix,
  onChoix,
}: {
  titre: string;
  valeur: string;
  choix: string[];
  onChoix: (v: string) => void;
}) {
  return (
    <div className="min-w-0">
      <p className="cote mb-2">{titre}</p>
      <div className="flex flex-wrap gap-1.5">
        {choix.map((c) => (
          <button
            key={c}
            type="button"
            onClick={() => onChoix(c)}
            aria-pressed={valeur === c}
            className={[
              "valeur rounded-presse border px-2.5 py-1 text-[11px] transition-colors",
              valeur === c
                ? "border-filet-vif text-encre"
                : "border-filet text-second hover:border-filet-vif hover:text-encre",
            ].join(" ")}
          >
            {c}
          </button>
        ))}
      </div>
    </div>
  );
}
