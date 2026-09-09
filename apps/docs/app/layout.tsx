import type { Metadata } from "next";
import Link from "next/link";
import { Instrument_Sans, Spline_Sans_Mono } from "next/font/google";
import { BasculeTheme } from "@/components/bascule-theme";
import { Marque } from "@/components/marque";
import { Palette } from "@/components/palette";
import "./globals.css";

/**
 * DEUX familles, et une seule règle de partage : les mots d'un côté, les
 * nombres de l'autre — voir DESIGN.md.
 *
 * Bricolage Grotesque tenait les titres et a été retirée. Le « point de
 * vigilance » du document se vérifiait : un grotesque expressif à quelques
 * pixels d'une démonstration lui dispute l'écran, et le catalogue en aligne
 * une par case. Ce qui distingue un titre redevient sa taille et sa graisse.
 *
 * Instrument Sans porte donc aussi les titres : `--font-titre` pointe sur elle
 * dans `globals.css`, les classes du site continuent de nommer un rôle, et
 * l'écart entre titre et prose se joue sur la graisse, pas sur la famille.
 * Une seule fonte chargée pour deux rôles — deux appels à `next/font`
 * produiraient deux requêtes pour le même fichier.
 *
 * `latin-ext` n'est pas décoratif : « œil », « nœud » et « cœur » vivent
 * en U+0153, hors du sous-ensemble latin de base.
 */
const policeSans = Instrument_Sans({
  subsets: ["latin", "latin-ext"],
  axes: ["wdth"],
  variable: "--police-sans",
  display: "swap",
});

const policeMono = Spline_Sans_Mono({
  subsets: ["latin", "latin-ext"],
  variable: "--police-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Nova — composants animés",
  description:
    "Une librairie de composants animés en TypeScript. Moteur framework-agnostique, composants React copiés dans votre projet.",
  /* Déclarées à la main plutôt que par convention de fichier : le kit livre
     un `.ico` multi-tailles, et `app/icon.png` ne sait pas le remplacer. */
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/icon-192.png", type: "image/png", sizes: "192x192" },
      { url: "/icon-512.png", type: "image/png", sizes: "512x512" },
    ],
    apple: "/apple-touch-icon.png",
  },
};

/**
 * Pose le thème AVANT la première peinture.
 *
 * Sans ce script, une page dont le visiteur a choisi le sombre s'afficherait
 * d'abord en clair — le mode canonique — puis basculerait à l'hydratation.
 * Il tourne en synchrone dans le `head`, donc avant tout rendu.
 */
const SCRIPT_THEME = `try{if(localStorage.getItem("nova-theme")==="nuit")document.documentElement.setAttribute("data-theme","nuit")}catch(e){}`;

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="fr"
      className={`${policeSans.variable} ${policeMono.variable}`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: SCRIPT_THEME }} />
      </head>
      {/* Le curseur additif de Nova n'est volontairement pas monté ici : il
          reste un composant de la librairie, essayable sur sa fiche, pas une
          signature imposée à toutes les pages. */}
      <body className="min-h-dvh antialiased">
        <Entete />
        <main>{children}</main>
        <PiedDePage />
      </body>
    </html>
  );
}

function Entete() {
  return (
    <header className="sticky top-0 z-50 border-b border-filet bg-fond/85 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-[1440px] items-center justify-between px-6">
        <Link href="/" className="flex shrink-0 items-center gap-2.5 text-encre">
          {/* La marque, et le nom dans la police du site. Le lettrage du kit
              est un grotesque géométrique arrondi : posé ici, il mettrait une
              seconde voix typographique dans un bandeau qui n'en tient qu'une.
              Le symbole n'a pas ce problème — il n'a pas de voix. */}
          <Marque className="h-[27px] w-[27px]" />
          <span
            className="titre text-[1.05rem] font-bold"
            /* `opsz` appartenait à Bricolage Grotesque, qui a été retirée :
               Instrument Sans n'a que l'axe de chasse. Laisser l'ancien réglage
               serait silencieux — le navigateur ignore un axe absent — mais il
               ferait croire à une intention qui n'existe plus. */
            style={{ fontVariationSettings: '"wdth" 92' }}
          >
            Nova
          </span>
          {/* La version disparaît sous 640 px : sur un téléphone elle pousse
              la navigation contre le nom de marque. */}
          <span className="cote hidden translate-y-px sm:inline">v0.1.0</span>
        </Link>

        {/* Sous 640 px, la barre ne garde qu'UN lien de texte.

            Les trois plus la marque plus les deux boutons faisaient 426 px de
            contenu dans 390 px d'écran : la page entière défilait
            latéralement, et la bascule de thème sortait du champ — un réglage
            qu'on ne peut plus atteindre. Ce qui reste est le seul lien dont la
            page est le sujet du site ; « Installation » et « Source » passent
            au pied de page, qui n'avait rien à porter. La recherche, elle,
            reste : au doigt, c'est ELLE la navigation entre familles. */}
        <nav className="flex items-center gap-4 text-sm sm:gap-7">
          {/* Sous 640 px, c'est le déclencheur de la palette qui porte le mot
              « Composants » : il ouvre le menu du catalogue, là où ce lien ne
              mène qu'à son index. Deux commandes du même nom côte à côte
              feraient hésiter sans rien ajouter — et la barre n'a de toute
              façon pas la place des deux. Le menu, lui, garde un accès à
              l'index en tête de liste. */}
          <Link
            href="/composants"
            className="lien hidden text-second hover:text-encre sm:inline"
          >
            Composants
          </Link>
          <Link
            href="/installation"
            className="lien hidden text-second hover:text-encre sm:inline"
          >
            Installation
          </Link>
          <a
            href="https://github.com/zharrow/Nova"
            className="lien hidden text-second hover:text-encre sm:inline"
          >
            Source
          </a>
          <Palette />
          <BasculeTheme />
        </nav>
      </div>
    </header>
  );
}

function PiedDePage() {
  return (
    <footer className="border-t border-filet">
      <div className="mx-auto flex max-w-[1440px] flex-col gap-5 px-6 py-10 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
        <p className="cote">Nova — le mouvement est l&apos;objet.</p>
        {/* La navigation complète, ici et pas seulement en tête.

            Elle existe d'abord pour le téléphone, où la barre ne garde qu'un
            lien — sans ce pied, « Installation » et « Source » n'auraient plus
            d'adresse. Elle ne coûte rien au grand écran : un pied qui ne
            portait qu'une devise et une licence était de la place tenue pour
            rien. */}
        <nav className="flex flex-wrap items-center gap-x-5 gap-y-2">
          <Link href="/composants" className="lien cote hover:text-encre">
            Composants
          </Link>
          <Link href="/installation" className="lien cote hover:text-encre">
            Installation
          </Link>
          <a
            href="https://github.com/zharrow/Nova"
            className="lien cote hover:text-encre"
          >
            Source
          </a>
          <span className="cote">MIT</span>
        </nav>
      </div>
    </footer>
  );
}
