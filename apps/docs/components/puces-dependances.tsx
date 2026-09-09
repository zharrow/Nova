/**
 * Ce qu'une famille embarque, dit en tête de fiche.
 *
 * L'information existait déjà, dans le rail droit, sous la ligne de
 * flottaison. Or « on ne réinvente rien » est un argument du dépôt — Radix
 * pour la sémantique, GSAP quand il faut mesurer, rien du tout quand le CSS
 * suffit — et la question qu'un visiteur se pose en arrivant sur une fiche est
 * exactement celle-là : qu'est-ce que ça tire dans mon paquet. Elle se lit
 * donc sous l'accroche.
 *
 * Les puces portent le nom du paquet, pas son logo : DESIGN.md limite
 * l'iconographie du site à quatre icônes fonctionnelles, et une rangée de
 * marques colorées ferait entrer trois palettes étrangères dans une direction
 * qui en tient une seule.
 *
 * Le cas « aucune » est affiché, pas tu. C'est le cas le plus fréquent du
 * catalogue et le plus favorable : le taire reviendrait à ne rien dire là où
 * il y a quelque chose de bon à dire.
 */
const SITES: Record<string, string> = {
  gsap: "https://gsap.com",
  lenis: "https://lenis.darkroom.engineering",
  "radix-ui": "https://www.radix-ui.com",
  "react-day-picker": "https://daypicker.dev",
};

export function PucesDependances({ deps }: { deps: string[] }) {
  if (deps.length === 0) {
    return (
      <p className="cote mt-5">
        Aucune dépendance · le moteur suffit
      </p>
    );
  }

  return (
    <div className="mt-5 flex flex-wrap items-center gap-1.5">
      <span className="cote mr-1">Installe aussi</span>
      {deps.map((dep) => {
        const site = SITES[dep];
        const contenu = (
          <>
            {dep}
            {site ? (
              <span className="text-sourdine" aria-hidden>
                ↗
              </span>
            ) : null}
          </>
        );
        const classe =
          "valeur flex items-center gap-1.5 rounded-presse border border-filet px-2.5 py-1 text-[11px] text-second transition-colors hover:border-filet-vif hover:text-encre";

        return site ? (
          <a
            key={dep}
            href={site}
            target="_blank"
            rel="noreferrer"
            className={classe}
          >
            {contenu}
          </a>
        ) : (
          <span key={dep} className={classe}>
            {contenu}
          </span>
        );
      })}
    </div>
  );
}
