import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "Nova — composants animés",
  description:
    "Une librairie de composants animés en TypeScript. Moteur framework-agnostique, composants React copiés dans votre projet.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr">
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
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-6">
        <Link href="/" className="flex shrink-0 items-baseline gap-2.5">
          <span className="font-mono text-sm font-semibold tracking-[0.2em]">
            NOVA
          </span>
          {/* La version disparaît sous 640 px : sur un téléphone elle pousse
              la navigation contre le nom de marque. */}
          <span className="cote hidden sm:inline">v0.1.0</span>
        </Link>

        <nav className="flex items-center gap-4 text-sm sm:gap-7">
          <Link
            href="/composants"
            className="lien text-sourdine hover:text-encre"
          >
            Composants
          </Link>
          <Link href="/installation" className="lien text-sourdine hover:text-encre">
            Installation
          </Link>
          <a
            href="https://github.com/Zharrow/nova-ui"
            className="lien text-sourdine hover:text-encre"
          >
            Source
          </a>
        </nav>
      </div>
    </header>
  );
}

function PiedDePage() {
  return (
    <footer className="border-t border-filet">
      <div className="mx-auto flex max-w-6xl flex-col gap-3 px-6 py-10 sm:flex-row sm:items-center sm:justify-between">
        <p className="cote">
          Nova — extrait de projets réels, pas d&apos;une page blanche.
        </p>
        <p className="cote">MIT</p>
      </div>
    </footer>
  );
}
