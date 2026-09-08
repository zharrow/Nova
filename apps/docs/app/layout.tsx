import type { Metadata } from "next";
import Link from "next/link";
import {
  Bricolage_Grotesque,
  Instrument_Sans,
  Spline_Sans_Mono,
} from "next/font/google";
import { BasculeTheme } from "@/components/bascule-theme";
import "./globals.css";

/**
 * Trois familles, trois registres qui ne se croisent jamais — voir DESIGN.md.
 * Un titre est TOUJOURS en Bricolage Grotesque, une phrase TOUJOURS en
 * Instrument Sans, un chiffre TOUJOURS en Spline Sans Mono.
 *
 * `latin-ext` n'est pas décoratif : « œil », « nœud » et « cœur » vivent
 * en U+0153, hors du sous-ensemble latin de base.
 */
const policeTitre = Bricolage_Grotesque({
  subsets: ["latin", "latin-ext"],
  axes: ["opsz", "wdth"],
  variable: "--police-titre",
  display: "swap",
});

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
};

/**
 * Pose le thème AVANT la première peinture.
 *
 * Sans ce script, une page dont le visiteur a choisi le clair s'afficherait
 * d'abord en sombre — le mode canonique — puis basculerait à l'hydratation.
 * Il tourne en synchrone dans le `head`, donc avant tout rendu.
 */
const SCRIPT_THEME = `try{if(localStorage.getItem("nova-theme")==="clair")document.documentElement.setAttribute("data-theme","clair")}catch(e){}`;

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="fr"
      className={`${policeTitre.variable} ${policeSans.variable} ${policeMono.variable}`}
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
        <Link href="/" className="flex shrink-0 items-baseline gap-2.5">
          <span
            className="titre text-[1.05rem] font-bold text-encre"
            style={{ fontVariationSettings: '"opsz" 40, "wdth" 92' }}
          >
            Nova
          </span>
          {/* La version disparaît sous 640 px : sur un téléphone elle pousse
              la navigation contre le nom de marque. */}
          <span className="cote hidden sm:inline">v0.1.0</span>
        </Link>

        <nav className="flex items-center gap-4 text-sm sm:gap-7">
          <Link href="/composants" className="lien text-second hover:text-encre">
            Composants
          </Link>
          <Link
            href="/installation"
            className="lien text-second hover:text-encre"
          >
            Installation
          </Link>
          <a
            href="https://github.com/Zharrow/nova-ui"
            className="lien text-second hover:text-encre"
          >
            Source
          </a>
          <BasculeTheme />
        </nav>
      </div>
    </header>
  );
}

function PiedDePage() {
  return (
    <footer className="border-t border-filet">
      <div className="mx-auto flex max-w-[1440px] flex-col gap-3 px-6 py-10 sm:flex-row sm:items-center sm:justify-between">
        <p className="cote">Nova — le mouvement est l&apos;objet.</p>
        <p className="cote">MIT</p>
      </div>
    </footer>
  );
}
