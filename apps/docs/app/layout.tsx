import type { Metadata } from "next";
import Link from "next/link";
import { Cursor } from "@nova-ui/react";
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
      <body className="min-h-dvh antialiased">
        <Cursor />
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
        <Link href="/" className="flex items-baseline gap-2.5">
          <span className="font-mono text-sm font-semibold tracking-[0.2em]">
            NOVA
          </span>
          <span className="cote">v0.1.0</span>
        </Link>

        <nav className="flex items-center gap-7 text-sm">
          <Link href="/" className="lien text-sourdine hover:text-encre">
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
