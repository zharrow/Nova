"use client";

import { useEffect, useRef, useState } from "react";
import { createHalftone, onTick } from "@nova-ui/core";

/**
 * La supernova de l'affiche — le seul objet de la page d'accueil.
 *
 * C'est `Halftone` de la librairie, pris par sa porte la moins connue : une
 * FONCTION DE COUVERTURE. Le moteur accepte une image, un canvas peint, ou une
 * fonction `(x, y) → 0..1` échantillonnée au centre de chaque cellule. Rien
 * n'est donc chargé et rien n'est dessiné à la main : l'étoile est calculée,
 * ce qui est exactement ce que la catégorie « Rendu » revendique.
 *
 * Une nova, pas un mandala. Quatre choses la composent, et la dernière est
 * celle qui empêche la figure de devenir un flocon :
 *
 *  1. un CŒUR, gaussien serré, qui sature au centre ;
 *  2. une ONDE DE CHOC — la coquille qui s'éloigne du cœur, et le seul trait
 *     qui dise « explosion » plutôt que « soleil » ;
 *  3. quatre AIGRETTES de diffraction, comme celles qu'un miroir de télescope
 *     pose sur une étoile vive. Deux longues à l'horizontale, deux courtes ;
 *  4. des FILAMENTS : la coquille est modulée en angle par un bruit
 *     déterministe. Sans eux l'onde est un cercle parfait, et un cercle
 *     parfait ne ressemble à aucune explosion réelle.
 *
 * L'ÉCLOSION est une entrée, pas une boucle. Elle joue une fois à l'arrivée,
 * puis la page redevient immobile — « énergie : immobile, sauf un point », et
 * ce point est le bandeau, pas l'affiche. Ensuite l'étoile ne bouge plus : elle
 * RÉPOND, les modules gonflant sous le curseur.
 *
 * Elle passe par `onTick`, la boucle partagée de la librairie, et non par un
 * `requestAnimationFrame` à elle. En mouvement réduit, aucune éclosion : on
 * rend l'état final, qui est l'état par défaut visible du dépôt.
 */

/** Bruit déterministe, en fonction de l'angle. Sert les filaments. */
function bruitAngulaire(theta: number): number {
  return (
    Math.sin(theta * 7.0 + 1.3) * 0.5 +
    Math.sin(theta * 13.0 - 2.1) * 0.3 +
    Math.sin(theta * 23.0 + 0.7) * 0.2
  );
}

/**
 * Grain fin, déterministe, en fonction de la position.
 *
 * Un rémanent n'est pas une surface lisse : c'est de la poussière. Sans ce
 * grain, les coquilles sortent en aplats propres et l'objet ressemble à un
 * diagramme. Le hachage est stable d'un ré-échantillonnage à l'autre, sinon la
 * matière scintillerait pendant toute l'éclosion.
 */
function grain(x: number, y: number): number {
  const n = Math.sin(x * 127.1 + y * 311.7) * 43758.5453;
  return n - Math.floor(n);
}

/** L'inclinaison du disque : ce qui le fait voir de trois quarts. */
const INCLINAISON = 0.56;
/** Son azimut, en radians. Le disque penche vers la gauche, comme sur la référence. */
const AZIMUT = -0.52;

/**
 * La couverture du rémanent à l'instant `t` de son éclosion, entre 0 et 1.
 *
 * `ratio` corrige l'anisotropie de la grille : les cellules ne sont carrées
 * que si l'on compense le rapport largeur/hauteur du canevas, sans quoi un
 * disque rond sort ovale — et ici l'ovale doit venir de la PERSPECTIVE, pas
 * d'un accident de grille.
 */
function novaA(t: number, ratio: number) {
  /* UNE SEULE ÉCHELLE pour toute la figure : tout part à 9 % et grandit
     ensemble, donc les premières images sont un point et c'est ce point qui
     explose. Des rayons aux départs séparés donnaient un fondu. */
  const echelle = 0.09 + 0.91 * t;
  const rayonCoeur = 0.078 * echelle * (1 + 0.5 * (1 - t));

  const ca = Math.cos(AZIMUT);
  const sa = Math.sin(AZIMUT);

  return (x: number, y: number): number => {
    const dx = (x - 0.5) * ratio;
    const dy = y - 0.5;

    /* LE CHANGEMENT DE REPÈRE — c'est lui qui fait toute la figure.
    
       On tourne le plan, puis on ÉTIRE le petit axe. Une figure circulaire
       calculée dans ce repère se dessine donc à l'écran comme un disque
       incliné, vu de trois quarts. C'est ce que montre un rémanent réel : des
       coquilles emboîtées en perspective, jamais une rosace vue de face.
    
       Les branches de la version précédente étaient un ornement à symétrie
       parfaite ; ceci est un OBJET, il a une orientation dans l'espace. */
    const ux = dx * ca + dy * sa;
    const uy = (-dx * sa + dy * ca) / INCLINAISON;
    const rd = Math.hypot(ux, uy);
    const theta = Math.atan2(uy, ux);

    /* Le cœur se calcule dans le repère de l'ÉCRAN, pas dans celui du disque :
       le noyau d'un rémanent est une masse compacte, il ne s'aplatit pas avec
       la perspective. */
    const rEcran = Math.hypot(dx, dy);
    /* Exposant élevé : la gaussienne prend un SOMMET PLAT. Le cœur sature
       donc sur plusieurs cellules au lieu de culminer sur une seule, et c'est
       ce plateau qui se lit comme de l'incandescence — un pic ne fait qu'un
       point. */
    let v = 1.60 * Math.exp(-((rEcran / rayonCoeur) ** 2.6));

    /* Le halo du bulbe, dans le repère du disque : c'est la matière proche du
       centre, elle SUIT l'inclinaison. */
    /* La LUEUR autour du noyau. Elle décroît vite — elle éclaire le cœur,
       elle ne remplit pas la bulle — mais elle porte assez loin pour que le
       centre ait une masse et non un contour. */
    v += 0.72 * Math.exp(-((rd / (0.150 * echelle)) ** 1.5));

    /* La lueur LOINTAINE. Faible, très large, elle ne remplit pas la bulle —
       elle la baigne. C'est elle qui fait que le noyau paraît RAYONNER au lieu
       d'être posé : sans elle, le cœur est une masse dense sur du vide, et une
       masse dense ne brûle pas. */
    v += 0.30 * Math.exp(-((rd / (0.34 * echelle)) ** 1.8));

    /* TROIS COQUILLES EMBOÎTÉES, et non une seule onde. C'est le trait
       dominant de la référence : la matière est partie en plusieurs fois, et
       chaque front s'est figé à sa distance. La plus lointaine est la plus
       fine et la plus vive — c'est le bord qu'on voit briller. */
    /* La paroi n'est pas parfaitement lisse, mais à peine : au-delà de
       quelques pour cent, l'ellipse cesse d'être une ellipse et la figure
       redevient une tache. */
    const filament = 1 + 0.045 * bruitAngulaire(theta);
    const coquille = (rayon: number, epaisseur: number, force: number) => {
      const e = (rd - rayon * echelle * filament) / (epaisseur * echelle);
      return force * Math.exp(-(e * e));
    };
    v += coquille(0.235, 0.024, 0.66);
    v += coquille(0.445, 0.014, 1.05) * t;

    /* PAS DE BRAS SPIRAUX ici, et c'est une soustraction délibérée.
    
       Une première version en avait, empruntés à la galaxie : ils remplissaient
       l'intérieur des coquilles, et la figure redevenait une masse. Un rémanent
       de supernova est une BULLE — de la matière sur une paroi mince, et du
       vide dedans. C'est ce vide qui fait lire les ellipses ; le remplir, c'est
       les effacer. */

    /* Le grain. Multiplicatif et léger : il creuse la matière sans la trouer,
       et c'est ce qui empêche les coquilles de se lire comme des aplats. */
    v *= 0.90 + 0.16 * grain(x * 61, y * 61);

    return Math.max(0, Math.min(1, v));
  };
}

/**
 * Le nombre de colonnes de la trame, EXPORTÉ.
 *
 * La légende de l'affiche l'annonce au visiteur. Elle l'avait d'abord écrit à
 * la main — « 84 colonnes » — et le jour où la grille est passée à 104, la
 * page a menti sans que rien ne le signale. C'est précisément ce que le dépôt
 * interdit : un compte cité dans une phrase se périme à la ligne suivante, ce
 * qui est affiché se CALCULE.
 */
export const COLONNES = 104;

/** Durée de l'éclosion. Assez longue pour se voir, assez courte pour ne pas attendre. */
const ECLOSION = 1600;

export function Supernova({ className }: { className?: string }) {
  const [canvas, setCanvas] = useState<HTMLCanvasElement | null>(null);
  const moteur = useRef<ReturnType<typeof createHalftone> | null>(null);

  useEffect(() => {
    if (!canvas) return;

    const ratio = canvas.clientWidth / Math.max(1, canvas.clientHeight);
    const reduit = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const instance = createHalftone(canvas, {
      /* En mouvement réduit, l'étoile naît finie. C'est la règle du dépôt :
         l'état par défaut est visible, aucune animation d'entrée ne s'arme. */
      source: novaA(reduit ? 1 : 0, ratio),
      cols: COLONNES,
      /* La grille suit le rapport du canevas, sinon les cellules ne sont pas
         carrées et l'étoile sort ovale. */
      rows: Math.max(8, Math.round(COLONNES / ratio)),
      steps: 6,
      bleed: 1,
      gamma: 0.85,
      floor: 0.05,
      shape: "circle",
      /* Elle RÉPOND au curseur une fois posée. C'est le seul mouvement qui
         reste après l'éclosion, et il appartient au visiteur. */
      pointerBoost: 0.55,
      pointerRadius: 0.16,
    });
    moteur.current = instance;

    if (reduit) return () => instance.destroy();

    const depart = performance.now();
    const stop = onTick(() => {
      const t = Math.min(1, (performance.now() - depart) / ECLOSION);
      /* La courbe signature de Nova, en sortie : l'onde part vite et se pose.
         Une éclosion linéaire donne un ballon qui se gonfle. */
      const e = 1 - Math.pow(1 - t, 3);
      instance.update({ source: novaA(e, ratio) });
      if (t >= 1) stop();
    });

    return () => {
      stop();
      instance.destroy();
    };
  }, [canvas]);

  return (
    <canvas
      ref={setCanvas}
      aria-hidden
      className={className}
    />
  );
}
