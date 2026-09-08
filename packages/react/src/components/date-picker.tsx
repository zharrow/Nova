"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { Popover } from "radix-ui";
import { DayPicker } from "react-day-picker";
import { createDial } from "@nova-ui/core";
import type { DialInstance } from "@nova-ui/core";
import { cn } from "../cn";

type Locale = React.ComponentProps<typeof DayPicker>["locale"];

/**
 * Les deux formes de la famille. Voir VARIANTES.md — c'est une OPTION et non
 * un frère : les deux partagent le même panneau, les mêmes cadrans et le même
 * modèle de valeur, et `month` ne fait que ne pas rendre la grille des jours.
 * Personne ne paie pour la forme qu'il ne prend pas.
 */
export type DatePickerGranularity = "day" | "month";

export interface DatePickerLabels {
  /** Bouton qui referme les cadrans sur le mois choisi. */
  apply: string;
  /** Bouton qui vide le champ. */
  clear: string;
  /** Nom accessible du cadran des mois. */
  months: string;
  /** Nom accessible du cadran des années. */
  years: string;
  /** Nom accessible du bouton qui déplie les cadrans. */
  changeMonth: string;
  /** Jeton du jour dans le gabarit de saisie affiché à vide. */
  day: string;
  /** Jeton du mois. */
  month: string;
  /** Jeton de l'année. */
  year: string;
}

const LABELS: DatePickerLabels = {
  apply: "Apply",
  clear: "Clear",
  months: "Month",
  years: "Year",
  changeMonth: "Choose month and year",
  day: "DD",
  month: "MM",
  year: "YYYY",
};

export interface DatePickerProps {
  /** Valeur contrôlée. `null` pour un champ vide. */
  value?: Date | null;
  /** Valeur de départ en mode non contrôlé. */
  defaultValue?: Date | null;
  onValueChange?: (value: Date | null) => void;
  /** `day` choisit un jour, `month` s'arrête au mois. */
  granularity?: DatePickerGranularity;
  /**
   * Par où le panneau commence, en `granularity="day"`.
   *
   * - `"day"` (défaut) — la grille, et l'en-tête déplie les cadrans au besoin.
   *   C'est le geste de qui connaît déjà son mois.
   * - `"month"` — les cadrans d'abord, et « appliquer » mène à la grille. Le
   *   geste des dates lointaines, une naissance par exemple : personne ne
   *   feuillette quatre cents mois pour arriver à 1995.
   *
   * Sans effet en `granularity="month"` : il n'y a rien après les cadrans.
   */
  startWith?: DatePickerGranularity;
  /** Première année du cadran. Défaut : cent ans en arrière, ou `min`. */
  startYear?: number;
  /** Dernière année du cadran. Défaut : dix ans en avant, ou `max`. */
  endYear?: number;
  /** Bornes de la valeur. Les jours hors bornes sont désactivés. */
  min?: Date;
  max?: Date;
  /** Locale de `react-day-picker` — celle de `date-fns`. */
  locale?: Locale;
  /** Texte du déclencheur à vide. Défaut : le gabarit de la locale, `MM/DD/YYYY`. */
  placeholder?: string;
  /** Rendu de la valeur dans le déclencheur. */
  formatValue?: (value: Date, granularity: DatePickerGranularity) => string;
  /** Champ caché pour les formulaires qui lisent un `FormData`. Valeur ISO. */
  name?: string;
  required?: boolean;
  disabled?: boolean;
  /** Affiche « vider ». Ignoré si `required`. */
  clearable?: boolean;
  /** Ouverture contrôlée du panneau. */
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  defaultOpen?: boolean;
  /** Libellés de l'interface. L'API est en anglais, la traduction se passe ici. */
  labels?: Partial<DatePickerLabels>;
  /** Durée d'une course de cadran, en ms. */
  dialDuration?: number;
  /** Nombre d'items sur lequel le fondu du cadran s'épuise. */
  dialFalloff?: number;
  align?: "start" | "center" | "end";
  sideOffset?: number;
  /**
   * Où le panneau est porté. Défaut : le `body`.
   *
   * L'échappatoire de Radix, et elle sert vraiment : un sélecteur posé dans
   * une boîte défilante ou dans une modale doit être porté DANS elle, sinon
   * le panneau reste en place quand le reste défile.
   */
  container?: HTMLElement | null;
  id?: string;
  /** Classes du déclencheur. */
  className?: string;
  /** Classes du panneau. */
  panelClassName?: string;
}

/**
 * Sélecteur de date — la grille de shadcn, le cadran de Nova.
 *
 * La division est celle du dépôt, la même que pour `Lightbox` : **on ne
 * réimplémente que le geste.**
 *
 * - **Radix** tient le `Popover` — l'ancrage, le portail, le piège de focus,
 *   Échap, le clic au-dehors, le retour du focus au déclencheur.
 * - **`react-day-picker`** tient la grille des jours, c'est-à-dire ce sur quoi
 *   la `Calendar` de shadcn est elle-même bâtie : la grille ARIA, la
 *   navigation au clavier, les locales, les bornes. Un projet qui a déjà
 *   `components/ui/calendar.tsx` a donc déjà cette dépendance.
 * - **Nova** apporte le cadran : les deux colonnes qui roulent sous une ligne
 *   de sélection, où ce qui s'éloigne du centre s'efface et rapetisse. C'est
 *   le seul endroit où ce composant écrit du mouvement.
 *
 * Trois gestes, deux props. La grille et les cadrans sont les mêmes pièces ;
 * ce qui change est PAR OÙ l'on commence et où l'on s'arrête.
 *
 * | | `startWith="day"` | `startWith="month"` |
 * |---|---|---|
 * | `granularity="day"` | la grille, cadrans dépliables | mois et année, puis le jour |
 * | `granularity="month"` | mois et année, et c'est fini | — identique |
 *
 * L'en-tête est un bouton : il déplie les cadrans par-dessus la grille, et
 * « appliquer » les referme sur le mois choisi. En `granularity="month"` les
 * cadrans SONT le panneau, la grille n'est jamais rendue, et « appliquer »
 * valide directement la valeur.
 *
 * ```tsx
 * // Une date de naissance : personne ne feuillette quatre cents mois.
 * <DatePicker
 *   value={naissance}
 *   onValueChange={setNaissance}
 *   startWith="month"
 *   startYear={1940}
 *   endYear={2012}
 * />
 * ```
 */
export function DatePicker({
  value: valeurControlee,
  defaultValue = null,
  onValueChange,
  granularity = "day",
  startWith = "day",
  startYear,
  endYear,
  min,
  max,
  locale,
  placeholder,
  formatValue,
  name,
  required,
  disabled,
  clearable = true,
  open: ouvertControle,
  onOpenChange,
  defaultOpen = false,
  labels,
  dialDuration,
  dialFalloff,
  align = "start",
  sideOffset = 6,
  container,
  id,
  className,
  panelClassName,
}: DatePickerProps) {
  const mots = { ...LABELS, ...labels };
  const parJour = granularity === "day";

  const [valeurInterne, setValeurInterne] = useState<Date | null>(defaultValue);
  const valeur = valeurControlee !== undefined ? valeurControlee : valeurInterne;

  const [ouvertInterne, setOuvertInterne] = useState(defaultOpen);
  const ouvert = ouvertControle !== undefined ? ouvertControle : ouvertInterne;

  /* La locale de `date-fns` porte son propre code BCP-47. Il suffit à `Intl`
     pour les noms de mois et le format d'affichage : pas d'import de plus, et
     un seul endroit qui décide de la langue. */
  const langue = (locale as { code?: string } | undefined)?.code;

  const aujourdhui = useMemo(() => new Date(), []);

  const premiereAnnee =
    startYear ?? (min ? min.getFullYear() : aujourdhui.getFullYear() - 100);
  const derniereAnnee = Math.max(
    premiereAnnee,
    endYear ?? (max ? max.getFullYear() : aujourdhui.getFullYear() + 10),
  );

  const annees = useMemo(
    () =>
      Array.from(
        { length: derniereAnnee - premiereAnnee + 1 },
        (_, i) => premiereAnnee + i,
      ),
    [premiereAnnee, derniereAnnee],
  );

  /**
   * Le mois sur lequel le panneau s'ouvre, RAMENÉ dans le cadran.
   *
   * Sans ce rabattement, un sélecteur borné à 1940-2012 ouvert sans valeur
   * affichait l'année courante dans l'en-tête pendant que la colonne se calait
   * sur 1940 : deux réponses différentes à la même question, à trois
   * centimètres l'une de l'autre.
   */
  function ancrer(date: Date): Date {
    const annee = Math.min(
      derniereAnnee,
      Math.max(premiereAnnee, date.getFullYear()),
    );
    return new Date(annee, date.getMonth(), 1);
  }

  /* Le mois AFFICHÉ par la grille. Distinct de la valeur : on feuillette sans
     rien choisir, et refermer le panneau sans cliquer ne doit rien changer. */
  const [mois, setMois] = useState<Date>(() => ancrer(valeur ?? aujourdhui));
  /**
   * La vue sur laquelle le panneau s'ouvre.
   *
   * Un seul endroit décide, parce que deux endroits en décidaient et qu'ils
   * doivent rester d'accord : le premier rendu, et chaque réouverture.
   */
  function vueInitiale(): "grid" | "dials" {
    return parJour && startWith === "day" ? "grid" : "dials";
  }

  /* La grille ou les cadrans. En `month`, il n'y a jamais de grille. */
  const [vue, setVue] = useState<"grid" | "dials">(vueInitiale);

  /* Position des deux cadrans — PROVISOIRE tant qu'« appliquer » n'a pas été
     pressé. C'est ce qui rend le geste réversible : on roule, on regarde
     l'en-tête suivre, et on referme sans rien valider. */
  const [moisCadran, setMoisCadran] = useState(mois.getMonth());
  const [anneeCadran, setAnneeCadran] = useState(mois.getFullYear());

  const nomsDeMois = useMemo(() => {
    const format = new Intl.DateTimeFormat(langue, { month: "long" });
    return Array.from({ length: 12 }, (_, i) =>
      format.format(new Date(2000, i, 1)),
    );
  }, [langue]);

  const rendu = useMemo(() => {
    if (formatValue) return valeur ? formatValue(valeur, granularity) : "";
    if (!valeur) return "";
    return new Intl.DateTimeFormat(
      langue,
      parJour
        ? { day: "2-digit", month: "2-digit", year: "numeric" }
        : { month: "long", year: "numeric" },
    ).format(valeur);
  }, [valeur, formatValue, granularity, langue, parJour]);

  /* Le gabarit affiché à vide est celui de la LOCALE, reconstitué depuis
     `Intl` : `MM/DD/YYYY` en anglais, `DD/MM/YYYY` en français. L'écrire en
     dur aurait annoncé le mauvais ordre à la moitié des visiteurs. */
  const gabarit = useMemo(() => {
    if (placeholder !== undefined) return placeholder;
    const jetons: Record<string, string> = {
      day: mots.day,
      month: mots.month,
      year: mots.year,
    };
    return new Intl.DateTimeFormat(
      langue,
      parJour
        ? { day: "2-digit", month: "2-digit", year: "numeric" }
        : { month: "2-digit", year: "numeric" },
    )
      .formatToParts(new Date(2000, 0, 2))
      .map((part) => jetons[part.type] ?? part.value)
      .join("");
  }, [placeholder, langue, parJour, mots.day, mots.month, mots.year]);

  /**
   * L'en-tête nomme LE MOIS REGARDÉ, et `mois` en est la seule source.
   *
   * Les cadrans n'en sont qu'un éditeur provisoire : ils ne parlent que tant
   * qu'ils sont dépliés. Les lire en permanence faisait mentir l'en-tête dès
   * qu'on feuilletait aux flèches — la grille passait à octobre, l'en-tête
   * restait à septembre, et seul le jour choisi révélait lequel des deux
   * disait vrai.
   */
  const enTete = useMemo(
    () =>
      new Intl.DateTimeFormat(langue, {
        month: "short",
        year: "numeric",
      }).format(vue === "dials" ? new Date(anneeCadran, moisCadran, 1) : mois),
    [langue, vue, anneeCadran, moisCadran, mois],
  );

  function poser(prochaine: Date | null): void {
    if (valeurControlee === undefined) setValeurInterne(prochaine);
    onValueChange?.(prochaine);
  }

  function basculer(prochain: boolean): void {
    if (prochain) {
      // Les cadrans et la grille repartent TOUJOURS de la valeur : rouvrir
      // après avoir feuilleté sans choisir ne doit pas rouvrir sur le mois
      // qu'on avait quitté.
      const depart = ancrer(valeur ?? aujourdhui);
      setMois(depart);
      setMoisCadran(depart.getMonth());
      setAnneeCadran(depart.getFullYear());
      setVue(vueInitiale());
    }
    if (ouvertControle === undefined) setOuvertInterne(prochain);
    onOpenChange?.(prochain);
  }

  /**
   * Ramène une date dans les bornes.
   *
   * Le cadran, lui, ne désactive pas les mois hors bornes : sur une colonne
   * qui roule, un item mort est plus déroutant qu'utile — il se cale sous la
   * ligne comme les autres et ne répond pas. On laisse donc rouler, et on
   * corrige à la validation.
   */
  function borner(date: Date): Date {
    if (min && date < min) return new Date(min);
    if (max && date > max) return new Date(max);
    return date;
  }

  /**
   * Déplie les cadrans SUR le mois regardé.
   *
   * Le réamorçage est ici et pas seulement à l'ouverture du panneau : entre
   * les deux, les flèches ont pu déplacer `mois`, et des cadrans restés sur
   * leur ancienne position auraient proposé de « revenir » là d'où l'on vient.
   */
  function deplierCadrans(): void {
    setMoisCadran(mois.getMonth());
    setAnneeCadran(mois.getFullYear());
    setVue("dials");
  }

  function appliquer(): void {
    const choisi = new Date(anneeCadran, moisCadran, 1);
    if (parJour) {
      setMois(choisi);
      setVue("grid");
      return;
    }
    poser(borner(choisi));
    basculer(false);
  }

  const cadrans = (
    <div
      key="dials"
      data-nova-date-view
      className="flex h-60 flex-col justify-between gap-3 px-1"
    >
      {/* Hauteur DÉFINIE, et pas un `h-full` : un `height: 100%` posé sur un
          élément de grille se replie sur la taille du contenu quand la piste
          n'est pas définie, et la colonne cesse alors de défiler — c'est tout
          le mécanisme qui tombe. */}
      <div className="grid h-48 grid-cols-2 gap-1">
        <Cadran
          label={mots.months}
          items={nomsDeMois}
          index={moisCadran}
          onIndexChange={setMoisCadran}
          duration={dialDuration}
          falloff={dialFalloff}
        />
        <Cadran
          label={mots.years}
          items={annees.map(String)}
          index={Math.max(0, annees.indexOf(anneeCadran))}
          onIndexChange={(i) => setAnneeCadran(annees[i] ?? anneeCadran)}
          duration={dialDuration}
          falloff={dialFalloff}
        />
      </div>
      <button
        type="button"
        onClick={appliquer}
        className="w-full rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground transition-colors hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
      >
        {mots.apply}
      </button>
    </div>
  );

  return (
    <>
      {name ? (
        <input
          type="hidden"
          name={name}
          value={valeur ? isoDe(valeur, granularity) : ""}
          required={required}
        />
      ) : null}

      <Popover.Root open={ouvert} onOpenChange={basculer}>
        <Popover.Trigger asChild>
          <button
            type="button"
            id={id}
            disabled={disabled}
            data-empty={valeur ? undefined : ""}
            className={cn(
              "flex h-10 w-full items-center justify-between gap-2 rounded-lg border border-input bg-background px-3 text-left text-sm transition-colors",
              "hover:border-ring/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              "disabled:cursor-not-allowed disabled:opacity-50",
              valeur ? "text-foreground" : "text-muted-foreground",
              className,
            )}
          >
            <span className="truncate">{rendu || gabarit}</span>
            <IconeCalendrier />
          </button>
        </Popover.Trigger>

        <Popover.Portal container={container ?? undefined}>
          <Popover.Content
            align={align}
            sideOffset={sideOffset}
            className={cn(
              "z-50 w-[17.5rem] rounded-xl border border-border bg-popover p-3 text-popover-foreground shadow-lg",
              panelClassName,
            )}
          >
            <div className="mb-2 flex items-center justify-between gap-1">
              <button
                type="button"
                aria-expanded={vue === "dials"}
                aria-label={mots.changeMonth}
                onClick={() => {
                  if (!parJour) return;
                  if (vue === "dials") setVue("grid");
                  else deplierCadrans();
                }}
                /* En `month`, l'en-tête n'a rien à déplier : il est déjà
                   déplié. Le rendre inerte plutôt que le retirer garde le
                   panneau à la même hauteur d'une forme à l'autre. */
                disabled={!parJour}
                className={cn(
                  "flex items-center gap-1.5 rounded-md px-2 py-1 text-sm font-medium transition-colors",
                  parJour &&
                    "hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  !parJour && "cursor-default",
                )}
              >
                {enTete}
                {parJour ? <Chevron ouvert={vue === "dials"} /> : null}
              </button>

              {vue === "grid" ? (
                <span className="flex items-center gap-0.5">
                  <BoutonMois
                    sens={-1}
                    label={mots.months}
                    onClick={() => setMois(decale(mois, -1))}
                  />
                  <BoutonMois
                    sens={1}
                    label={mots.months}
                    onClick={() => setMois(decale(mois, 1))}
                  />
                </span>
              ) : null}
            </div>

            {vue === "dials" ? (
              cadrans
            ) : (
              <div key="grid" data-nova-date-view className="h-60">
                <DayPicker
                  mode="single"
                  selected={valeur ?? undefined}
                  onSelect={(prochaine) => {
                    poser(prochaine ?? null);
                    if (prochaine) basculer(false);
                  }}
                  month={mois}
                  onMonthChange={setMois}
                  startMonth={new Date(premiereAnnee, 0, 1)}
                  endMonth={new Date(derniereAnnee, 11, 31)}
                  disabled={[
                    ...(min ? [{ before: min }] : []),
                    ...(max ? [{ after: max }] : []),
                  ]}
                  locale={locale}
                  showOutsideDays
                  hideNavigation
                  autoFocus
                  className="text-sm"
                  classNames={GRILLE}
                />
              </div>
            )}

            {clearable && !required && valeur ? (
              <button
                type="button"
                onClick={() => {
                  poser(null);
                  basculer(false);
                }}
                className="mt-2 w-full rounded-md py-1 text-center text-xs text-muted-foreground transition-colors hover:text-foreground"
              >
                {mots.clear}
              </button>
            ) : null}
          </Popover.Content>
        </Popover.Portal>
      </Popover.Root>
    </>
  );
}

/**
 * Une colonne qui roule.
 *
 * Le motif de la liste déroulante ARIA : le focus reste sur le CONTENEUR, et
 * `aria-activedescendant` désigne l'option courante. C'est ce qui permet aux
 * flèches de faire tourner la colonne sans imposer cent vingt arrêts de
 * tabulation, et c'est aussi ce que le moteur attend — il écoute le clavier
 * sur le conteneur, pas sur les items.
 */
function Cadran({
  items,
  index,
  onIndexChange,
  label,
  duration,
  falloff,
}: {
  items: string[];
  index: number;
  onIndexChange: (index: number) => void;
  label: string;
  duration?: number;
  falloff?: number;
}) {
  const identifiant = useId();
  /* Le nœud est tenu dans un ÉTAT, pas dans une ref : il arrive au commit du
     portail de Radix, et une ref ne provoquerait aucun rendu — l'effet ne se
     rejouerait jamais. Même piège que dans `lightbox.tsx`. */
  const [colonne, setColonne] = useState<HTMLDivElement | null>(null);
  const moteur = useRef<DialInstance | null>(null);
  const rappel = useRef(onIndexChange);
  rappel.current = onIndexChange;
  const indexInitial = useRef(index);
  indexInitial.current = index;

  /* La liste est une DONNÉE, pas une option : `useNovaEngine` compare les
     options et ne verrait pas un cadran passer de douze mois à cent vingt
     années. On reconstruit donc sur son identité. */
  /* Le NUL comme séparateur : aucun libellé ne peut le contenir, donc deux
     listes différentes ne peuvent pas produire la même clé. Écrit en
     ÉCHAPPEMENT, jamais en octet brut — un NUL dans la source rend le fichier
     binaire pour `git diff`, `grep` et `file`. */
  const identite = items.join("\u0000");

  useEffect(() => {
    if (!colonne) return;
    const cree = createDial(colonne, {
      index: indexInitial.current,
      duration,
      falloff,
      onChange: (i) => rappel.current(i),
      onScrub: (i) => rappel.current(i),
    });
    moteur.current = cree;
    return () => {
      cree.destroy();
      moteur.current = null;
    };
  }, [colonne, identite, duration, falloff]);

  useEffect(() => {
    const courant = moteur.current;
    if (courant && courant.index !== index) courant.select(index);
  }, [index]);

  return (
    <div
      ref={setColonne}
      role="listbox"
      tabIndex={0}
      aria-label={label}
      aria-activedescendant={`${identifiant}-${index}`}
      className="h-full min-h-0 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      {items.map((item, i) => (
        <div
          key={item}
          id={`${identifiant}-${i}`}
          role="option"
          aria-selected={i === index}
          data-nova-dial-item
          onClick={() => onIndexChange(i)}
          className={cn(
            "flex h-9 cursor-pointer items-center justify-center rounded-md px-2 text-sm tabular-nums",
            i === index
              ? "bg-accent font-medium text-accent-foreground"
              : "text-foreground",
          )}
        >
          {item}
        </div>
      ))}
    </div>
  );
}

/**
 * Classes de la grille, dans le vocabulaire de jetons de shadcn.
 *
 * Elles sont volontairement écrites ici plutôt que dans `nova.css` : la mise
 * en forme passe par Tailwind, la feuille de Nova ne décrit que du mouvement.
 * Un projet qui a déjà `components/ui/calendar.tsx` peut remplacer cette table
 * par la sienne — c'est la même API `classNames` de `react-day-picker`.
 */
const GRILLE = {
  months: "flex flex-col",
  month: "space-y-2",
  month_caption: "hidden",
  month_grid: "w-full border-collapse",
  weekdays: "flex",
  weekday:
    "w-9 text-[0.7rem] font-normal uppercase tracking-wide text-muted-foreground",
  week: "mt-1 flex w-full",
  day: "h-9 w-9 p-0 text-center",
  day_button:
    "h-9 w-9 rounded-md font-normal transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring aria-selected:bg-primary aria-selected:text-primary-foreground",
  selected: "[&>button]:bg-primary [&>button]:text-primary-foreground",
  today: "[&>button]:font-semibold [&>button]:underline [&>button]:underline-offset-4",
  outside: "[&>button]:text-muted-foreground/50",
  disabled: "[&>button]:pointer-events-none [&>button]:opacity-35",
  hidden: "invisible",
} as const;

/** Le premier du mois, décalé de `pas` mois. */
function decale(mois: Date, pas: number): Date {
  return new Date(mois.getFullYear(), mois.getMonth() + pas, 1);
}

/** `YYYY-MM-DD`, ou `YYYY-MM` — ce que lit un `FormData`. */
function isoDe(date: Date, granularity: DatePickerGranularity): string {
  const annee = String(date.getFullYear()).padStart(4, "0");
  const mois = String(date.getMonth() + 1).padStart(2, "0");
  if (granularity === "month") return `${annee}-${mois}`;
  return `${annee}-${mois}-${String(date.getDate()).padStart(2, "0")}`;
}

function BoutonMois({
  sens,
  label,
  onClick,
}: {
  sens: 1 | -1;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={`${label} ${sens > 0 ? "+1" : "-1"}`}
      className="inline-flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <svg
        width="14"
        height="14"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden
      >
        <path d={sens > 0 ? "m9 18 6-6-6-6" : "m15 18-6-6 6-6"} />
      </svg>
    </button>
  );
}

function Chevron({ ouvert }: { ouvert: boolean }) {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      style={{
        transform: ouvert ? "rotate(180deg)" : undefined,
        transition: "transform 220ms cubic-bezier(0.16, 1, 0.3, 1)",
      }}
    >
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}

function IconeCalendrier() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      className="shrink-0 opacity-60"
    >
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <path d="M16 2v4M8 2v4M3 10h18" />
    </svg>
  );
}
