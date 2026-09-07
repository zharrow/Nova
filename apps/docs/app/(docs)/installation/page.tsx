import { BlocCode } from "@/components/bloc-code";

export const metadata = {
  title: "Installation — Nova",
  description: "Installer Nova dans un projet React ou Next.js.",
};

export default function Installation() {
  return (
    <article className="max-w-3xl">
      <h1 className=" text-4xl font-medium tracking-tight">Installation</h1>
      <p className="mt-3 text-lg text-sourdine">
        Nova ne s&apos;installe pas comme une dépendance : la CLI copie la source
        dans votre projet.
      </p>

      <Etape numero="01" titre="Préparer le projet">
        <BlocCode langue="terminal" code="npx novaui init" />
        <p className="mt-4 text-sm leading-relaxed text-sourdine">
          La commande détecte votre arborescence — dossier <code>src/</code>,
          alias <code>@/*</code> du tsconfig, feuille de style globale — puis
          installe le socle partagé et écrit <code>nova.json</code>. Ajoutez{" "}
          <code>--yes</code> pour accepter tout ce qui est détecté sans question.
        </p>
      </Etape>

      <Etape numero="02" titre="Ajouter des composants">
        <BlocCode langue="terminal" code="npx novaui add reveal marquee counter" />
        <p className="mt-4 text-sm leading-relaxed text-sourdine">
          Chaque composant apporte son moteur dans <code>lib/nova/engines/</code>{" "}
          et son composant React dans <code>components/nova/</code>. Un fichier
          déjà présent et modifié n&apos;est jamais écrasé sans confirmation.
        </p>
      </Etape>

      <Etape numero="03" titre="Utiliser">
        <BlocCode
          code={`import { Reveal } from "@/components/nova/reveal";

export default function Page() {
  return (
    <Reveal variant="mask">
      <h2>Ce titre se dévoile au scroll.</h2>
    </Reveal>
  );
}`}
        />
      </Etape>

      <section className="mt-16 border-t border-filet pt-10">
        <h2 className="text-xl font-medium tracking-tight">Ce qui est garanti</h2>
        <ul className="mt-5 space-y-4 text-sm leading-relaxed text-sourdine">
          <Garantie titre="Rien ne reste masqué">
            L&apos;état par défaut est visible. Sans JavaScript, en{" "}
            <code>prefers-reduced-motion</code>, ou si un bloc est déjà à
            l&apos;écran au montage, le contenu s&apos;affiche tel quel. Un
            observer qui ne tire pas ne peut pas faire disparaître une section.
          </Garantie>
          <Garantie titre="Une seule boucle d'animation">
            Tous les moteurs partagent un unique <code>requestAnimationFrame</code>,
            qui s&apos;arrête dès qu&apos;il n&apos;a plus d&apos;abonné.
          </Garantie>
          <Garantie titre="La facture est par composant">
            Une entrée déclare ses dépendances, et la CLI n&apos;installe que ce
            qui manque. <code>Expand</code> apporte GSAP,{" "}
            <code>SmoothScroll</code> apporte Lenis — les autres n&apos;ajoutent
            rien à votre <code>package.json</code>.
          </Garantie>
          <Garantie titre="Rien n'est réinventé">
            Les composants se branchent sur shadcn et Radix pour la sémantique,
            et sur Tailwind pour la mise en forme. Nova n&apos;apporte que le
            mouvement — c&apos;est la seule chose qui n&apos;existe pas déjà.
          </Garantie>
          <Garantie titre="Compatible App Router">
            Les composants portent <code>&quot;use client&quot;</code> et rendent
            leur contenu dès le serveur — pas de clignotement à l&apos;hydratation.
          </Garantie>
        </ul>
      </section>

      <section className="mt-14 border-t border-filet pt-10">
        <h2 className="text-xl font-medium tracking-tight">Et Angular ?</h2>
        <p className="mt-4 text-sm leading-relaxed text-sourdine">
          Toute la logique vit dans des moteurs sans framework : une fabrique{" "}
          <code>createX(element, options)</code> qui renvoie{" "}
          <code>{"{ update, destroy }"}</code>. Le paquet React ne fait que
          brancher ce contrat sur son cycle de vie. Un adaptateur Angular — une
          directive qui appelle la même fabrique dans <code>ngOnInit</code>,{" "}
          <code>ngOnChanges</code> et <code>ngOnDestroy</code> — n&apos;a rien à
          réécrire des animations.
        </p>
      </section>
    </article>
  );
}

function Etape({
  numero,
  titre,
  children,
}: {
  numero: string;
  titre: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mt-14">
      <div className="mb-4 flex items-baseline gap-3 border-b border-filet pb-2">
        <span className="cote text-signal">{numero}</span>
        <h2 className="text-base font-medium tracking-tight">{titre}</h2>
      </div>
      {children}
    </section>
  );
}

function Garantie({
  titre,
  children,
}: {
  titre: string;
  children: React.ReactNode;
}) {
  return (
    <li className="border-l border-filet pl-5">
      <strong className="font-medium text-encre">{titre}.</strong> {children}
    </li>
  );
}
