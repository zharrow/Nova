import { cn } from "@/lib/utils";
import { Marque } from "./marque";

/**
 * La planche — ce qu'une démonstration découvre.
 *
 * Plusieurs familles ont besoin de « quelque chose à révéler » : un rideau qui
 * se lève sur du vide ne démontre rien, une visionneuse qui agrandit un aplat
 * gris non plus. Trois fonds ont échoué avant celui-ci, et les trois échecs
 * sont de natures différentes — ils valent d'être écrits.
 *
 *  1. **Un faux titre d'article.** Du remplissage muet que DESIGN.md interdit,
 *     et qui se fait hacher en plein passage : on lisait « Bâti… ».
 *  2. **Une mire de réglage d'imprimeur.** Techniquement juste, conforme au
 *     budget de contraste, et banale : équerres et cible sont des objets
 *     trouvés, et elle aurait illustré n'importe quelle librairie.
 *  3. **Le tracé de la courbe signature.** Il passait les trois tests de la
 *     barre de qualité, mais il répondait à la mauvaise question. Un rideau
 *     d'ouverture ne se lève pas sur un diagramme : il se lève sur une
 *     MARQUE. C'est ce que fait tout site qui en pose un, et c'est le seul
 *     usage réel que le composant ait jamais.
 *
 * Ce qui restait juste dans la version précédente et qu'on garde : les
 * réglettes graduées en marge. Sans elles la scène devient un écran de
 * démarrage, et la vitrine est un banc d'essai, pas une page de lancement.
 * Elles tiennent le cadre autour de la marque au lieu de la mettre sur un
 * piédestal.
 *
 * Le tracé de courbe, lui, n'est pas perdu : il est passé dans le sélecteur
 * de courbe des réglages, où il fait un travail — voir `components/courbe.tsx`.
 */
export function Plaque({
  className,
  /**
   * Mode dense : la vignette de catalogue.
   *
   * Les réglettes partent. À 215 px elles bordent la case sans qu'on les lise,
   * et deux bandes de bruit autour d'une marque de 90 px, c'est le contraire
   * d'un cadre.
   */
  dense = false,
}: {
  className?: string;
  dense?: boolean;
}) {
  return (
    <div
      aria-hidden
      className={cn(
        "pointer-events-none absolute inset-0 grid place-items-center overflow-hidden",
        className,
      )}
    >
      {/* Le quadrillage. C'est le PAPIER, pas le dessin — et ce n'est pas
          décoratif : sans lui, une marque seule au centre ne dit plus où en
          est un rideau qui se retire par les bords. On lisait le passage sur
          les lignes coupées ; il fallait le rendre. À 0,07 il ne gagne contre
          rien, y compris contre une lame de --banc-haut. */}
      <div
        className="absolute inset-0 opacity-[0.07]"
        style={{
          backgroundImage:
            "linear-gradient(var(--encre) 1px, transparent 1px), linear-gradient(90deg, var(--encre) 1px, transparent 1px)",
          backgroundSize: "16px 16px",
        }}
      />

      {/* Les réglettes de marge. Deux trames superposées : un pas de 12 px, et
          un repère long tous les 60. C'est ce CHANGEMENT DE PAS qui fait lire
          une graduation là où une trame régulière ne fait qu'une rayure. */}
      {!dense
        ? (["haut", "bas"] as const).map((bord) => (
            <div
              key={bord}
              className={cn(
                "absolute inset-x-0 h-[9px] opacity-[0.22]",
                bord === "haut" ? "top-0" : "bottom-0",
              )}
              style={{
                backgroundImage:
                  "repeating-linear-gradient(90deg, var(--encre) 0 1px, transparent 1px 12px), repeating-linear-gradient(90deg, var(--encre) 0 1px, transparent 1px 60px)",
                backgroundSize: "100% 4px, 100% 9px",
                backgroundPosition:
                  bord === "haut" ? "0 0, 0 0" : "0 100%, 0 100%",
                backgroundRepeat: "repeat-x",
              }}
            />
          ))
        : null}

      {/* La marque. Dimensionnée par la HAUTEUR : les scènes de Nova sont
          larges et basses, et une largeur en pourcentage débordait du champ
          d'une fiche avant d'avoir rempli sa vignette.

          À `--prose` et non à `--encre` : c'est ce qu'on DÉCOUVRE, pas ce
          qu'on regarde. Le sujet de la scène reste le rideau qui se retire —
          une marque à pleine encre lui volerait la vedette, ce qui est
          exactement l'inverse de « le mouvement est l'objet ». */}
      <Marque
        className={cn(
          "aspect-square text-prose",
          dense ? "h-[clamp(56px,44%,104px)]" : "h-[clamp(72px,46%,168px)]",
        )}
      />
    </div>
  );
}

/**
 * Le repère du voile — la marque que porte le rideau lui-même.
 *
 * Un voile nu ne dit pas s'il est opaque ou si la scène est vide. Celui-ci
 * porte la même marque, plus petite et plus sourde : le rideau se retire, et
 * la marque grandit et s'affirme. C'est le geste d'ouverture d'un vrai site,
 * réduit à une scène de démonstration.
 *
 * Ce que ce n'est PAS : une barre de progression. Le rideau de Nova ne mesure
 * aucun chargement, et lui prêter une jauge serait mentir sur ce qu'il fait.
 */
export function Repere({
  className,
  ref,
}: {
  className?: string;
  ref?: React.Ref<HTMLSpanElement>;
}) {
  return (
    <Marque
      ref={ref}
      className={cn(
        "mx-auto aspect-square h-[clamp(28px,32%,64px)] text-second",
        className,
      )}
    />
  );
}
