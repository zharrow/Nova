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

/** Le rayon de l'orbite, dans le repère du disque : entre les deux coquilles. */
const ORBITE = 0.335;
/** Sa cadence. Un tour en une trentaine de secondes — on doit pouvoir l'oublier. */
const CADENCE_ORBITE = 0.21;

/**
 * La couverture du rémanent à l'instant `t` de son éclosion, entre 0 et 1.
 *
 * `ratio` corrige l'anisotropie de la grille : les cellules ne sont carrées
 * que si l'on compense le rapport largeur/hauteur du canevas, sans quoi un
 * disque rond sort ovale — et ici l'ovale doit venir de la PERSPECTIVE, pas
 * d'un accident de grille.
 */
function novaA(
  t: number,
  ratio: number,
  temps: number,
  regard: { angle: number; force: number },
) {
  /* UNE SEULE ÉCHELLE pour toute la figure : tout part à 9 % et grandit
     ensemble, donc les premières images sont un point et c'est ce point qui
     explose. Des rayons aux départs séparés donnaient un fondu. */
  const echelle = 0.09 + 0.91 * t;
  const rayonCoeur = 0.078 * echelle * (1 + 0.5 * (1 - t));

  const ca = Math.cos(AZIMUT);
  const sa = Math.sin(AZIMUT);

  /* LA PLANÈTE, et son orbite.
  
     Sa position se calcule dans le repère du DISQUE — elle tourne donc dans le
     plan des coquilles, et son orbite se dessine à l'écran comme une ellipse
     vue sous la même inclinaison. C'est ce qui la fait appartenir à la scène
     plutôt que passer devant : une orbite circulaire à l'écran l'aurait posée
     sur l'image, pas dedans.
  
     On ramène ensuite sa position dans le repère de l'écran, en inversant la
     rotation et l'étirement, parce que le CORPS lui-même doit rester rond :
     une planète ne s'aplatit pas avec la perspective, seule sa trajectoire le
     fait. */
  const angleOrbite = temps * CADENCE_ORBITE;
  const orbiteRayon = ORBITE * echelle;
  const ox = orbiteRayon * Math.cos(angleOrbite);
  const oyDisque = orbiteRayon * Math.sin(angleOrbite) * INCLINAISON;
  const planeteX = ox * ca - oyDisque * sa;
  const planeteY = ox * sa + oyDisque * ca;
  const rayonPlanete = 0.048 * echelle;

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
    /* CHAQUE COQUILLE TOURNE À SA CADENCE.
    
       C'est ce qui distingue une rotation d'une image qui pivote : deux
       parois qui tournent du même pas restent solidaires, et l'objet se lit
       comme un dessin qu'on fait tourner. Des cadences différentes — et de
       sens opposé — donnent du VOLUME : on voit deux surfaces glisser l'une
       sur l'autre, donc on voit qu'il y en a deux.
    
       La rotation ne se voit que parce que la paroi n'est pas lisse. Le
       filament, presque nul jusqu'ici, est ce qui rend le mouvement visible :
       une ellipse parfaite qui tourne ne montre rien. Il reste faible — au-delà
       de quelques pour cent, l'ellipse cesse d'être une ellipse.
    
       L'ORIENTATION DU POINTEUR éclaire le secteur qu'elle vise. Ce n'est pas
       un survol de proximité — le moteur en propose un, `pointerBoost`, qui
       gonfle les modules SOUS le curseur — mais un survol de DIRECTION : la
       paroi s'allume du côté d'où l'on regarde, comme une lumière rasante. Sur
       un objet en perspective, c'est la réponse qui dit qu'il est dans
       l'espace et pas sur le papier. */
    const coquille = (
      rayon: number,
      epaisseur: number,
      force: number,
      cadence: number,
    ) => {
      const phase = theta - temps * cadence;
      const filament = 1 + 0.075 * bruitAngulaire(phase);
      const e = (rd - rayon * echelle * filament) / (epaisseur * echelle);
      /* Modulation angulaire propre à la coquille : c'est elle qu'on voit
         défiler. Elle reste au-dessus de zéro, sinon la paroi se coupe en
         morceaux au lieu de tourner. */
      const densite = 0.72 + 0.28 * Math.cos(3 * phase);
      /* DEUX SOURCES DE LUMIÈRE RASANTE, et une seule mécanique.
      
         Le pointeur allume la paroi du côté d'où l'on regarde ; `force` tombe
         à zéro quand il quitte la scène, et la lumière s'éteint avec lui.
      
         La planète fait EXACTEMENT la même chose, depuis sa position sur
         l'orbite. C'était la demande, et c'est aussi ce qui la rend crédible :
         un corps qui passe sans rien éclairer se lit comme une vignette collée
         par-dessus. Elle éclaire un peu moins fort que le pointeur — le geste
         du visiteur doit rester le plus fort des deux. */
      const eclaire =
        1 +
        regard.force * 0.42 * Math.cos(theta - regard.angle) +
        0.30 * Math.cos(theta - angleOrbite);
      return force * densite * eclaire * Math.exp(-(e * e));
    };
    /* Sens opposés, rapports non entiers : les deux parois ne se retrouvent
       jamais dans la même position, donc le motif ne se répète pas. */
    v += coquille(0.235, 0.024, 0.66, 0.19);
    v += coquille(0.445, 0.014, 1.05, -0.11) * t;

    /* PAS DE BRAS SPIRAUX ici, et c'est une soustraction délibérée.
    
       Une première version en avait, empruntés à la galaxie : ils remplissaient
       l'intérieur des coquilles, et la figure redevenait une masse. Un rémanent
       de supernova est une BULLE — de la matière sur une paroi mince, et du
       vide dedans. C'est ce vide qui fait lire les ellipses ; le remplir, c'est
       les effacer. */

    /* LE CORPS. Rond dans le repère de l'écran, à sommet plat comme le cœur :
       c'est une masse, elle doit saturer. Elle porte son propre halo, qui la
       détache du fond quand elle passe devant une paroi. */
    const dPlanete = Math.hypot(dx - planeteX, dy - planeteY);
    v += 1.30 * Math.exp(-((dPlanete / rayonPlanete) ** 2.4)) * t;
    v += 0.46 * Math.exp(-((dPlanete / (rayonPlanete * 2.4)) ** 1.6)) * t;

    /* UN VIDE AUTOUR D'ELLE, et c'est ce qui la fait exister.
    
       Sans lui, le corps se pose sur une paroi déjà dense et se confond avec
       elle : on voit un renflement, pas une planète. Un anneau soustrait juste
       après le halo la détache de tout ce qu'elle croise — c'est le geste du
       graveur, qui creuse autour d'une forme pour la faire avancer. */
    const anneauVide = (dPlanete - rayonPlanete * 2.9) / (rayonPlanete * 1.1);
    v -= 0.60 * Math.exp(-(anneauVide * anneauVide)) * t;

    /* Le grain. Multiplicatif et léger : il creuse la matière sans la trouer,
       et c'est ce qui empêche les coquilles de se lire comme des aplats. */
    v *= 0.90 + 0.16 * grain(x * 61, y * 61);

    return Math.max(0, Math.min(1, v));
  };
}

/**
 * Le nombre de colonnes de la trame.
 *
 * IL SE LIT COMME UNE TAILLE DE MODULE, pas comme un compte. Le module vaut
 * largeur de boîte / colonnes, et c'est LUI qui fait la matière : à 7,6 px on
 * voit une trame d'imprimeur, à 6 px une photo tramée. Le jour où la boîte est
 * passée du rapport 4/3 (791 px de large) au carré (695), 104 colonnes
 * l'auraient fait tomber à 6,7 — l'objet aurait grandi en changeant de
 * matière, ce qui n'est pas grandir. 92 tient le module à 7,6 px.
 *
 * Il était exporté pour la légende de planche, qui l'affichait plutôt que de
 * le citer à la main — la page avait déjà menti d'un « 84 colonnes » figé le
 * jour où la grille était passée à 104. La légende retirée, plus personne ne
 * l'annonce, et il redevient ce qu'il est : un réglage.
 */
const COLONNES = 92;

/** Durée de l'éclosion. Assez longue pour se voir, assez courte pour ne pas attendre. */
const ECLOSION = 1600;

export function Supernova({ className }: { className?: string }) {
  const [canvas, setCanvas] = useState<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (!canvas) return;

    /* LE RAPPORT DE LA BOÎTE SE REMESURE.

       Il corrige l'anisotropie de la grille, et il n'est plus constant : sur un
       portable, l'affiche plafonne la HAUTEUR de la planche pour garder la
       légende au-dessus du pli, donc la boîte s'aplatit quand l'écran est bas.
       Lu une seule fois au montage, un redimensionnement laissait le disque
       ovale — pour un accident de grille, alors que son ovale doit venir de la
       perspective. */
    let ratio = canvas.clientWidth / Math.max(1, canvas.clientHeight);
    const reduit = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    /* LE REGARD — l'orientation du pointeur autour du centre, lissée.
    
       `cible` est ce que le pointeur demande, `regard` ce que la figure a
       rejoint. Sans ce lissage, la lumière saute d'un secteur à l'autre dès
       que la souris traverse le centre, où l'angle est instable. */
    const cible = { angle: 0, force: 0 };
    const regard = { angle: 0, force: 0 };

    function surPointeur(evenement: PointerEvent) {
      const boite = canvas!.getBoundingClientRect();
      const px = (evenement.clientX - boite.left) / boite.width - 0.5;
      const py = (evenement.clientY - boite.top) / boite.height - 0.5;
      cible.angle = Math.atan2(py, px * ratio);
      cible.force = 1;
    }
    function surSortie() {
      cible.force = 0;
    }

    const instance = createHalftone(canvas, {
      /* En mouvement réduit, la figure naît finie et ne tourne pas : c'est la
         règle du dépôt, l'état par défaut est visible et aucune animation ne
         s'arme. */
      source: novaA(reduit ? 1 : 0, ratio, 0, regard),
      cols: COLONNES,
      /* `rows` n'est PAS donné, et c'est voulu : sans lui le moteur déduit les
         lignes du rapport du canevas — même formule — et les redéduit à chaque
         redimensionnement depuis son propre observateur. Le fixer ici
         neutralisait ce calcul, et la grille restait celle du premier rendu. */
      steps: 6,
      bleed: 1,
      gamma: 0.85,
      floor: 0.05,
      shape: "circle",
      /* `pointerBoost` du moteur est laissé à zéro : il gonfle les modules
         SOUS le curseur, et cette figure répond autrement — par la DIRECTION
         d'où on la regarde. Deux réponses au même geste se disputeraient la
         lecture. */
      pointerBoost: 0,
    });

    /* Le rapport se relit ICI et non dans l'image d'animation : il ne bouge
       qu'au redimensionnement, et le relire soixante fois par seconde forcerait
       autant de calculs de mise en page pour une valeur immobile.
       En mouvement réduit il n'y a pas d'image d'animation du tout, donc c'est
       l'observateur qui repousse la couverture ; sinon la prochaine image s'en
       charge, vingt-quatre millisecondes plus tard. */
    const surTaille = new ResizeObserver(() => {
      ratio = canvas.clientWidth / Math.max(1, canvas.clientHeight);
      if (reduit) instance.update({ source: novaA(1, ratio, 0, regard) });
    });
    surTaille.observe(canvas);

    if (reduit)
      return () => {
        surTaille.disconnect();
        instance.destroy();
      };

    canvas.addEventListener("pointermove", surPointeur, { passive: true });
    canvas.addEventListener("pointerleave", surSortie, { passive: true });

    const depart = performance.now();
    let derniere = 0;

    const stop = onTick(() => {
      const maintenant = performance.now();

      /* LA TRAME EST RÉÉCHANTILLONNÉE À CHAQUE IMAGE — huit mille cellules.
         On plafonne donc à ~40 images par seconde : la rotation est lente, la
         différence ne se voit pas, et le coût baisse d'un tiers. Le moteur
         suspend déjà tout quand la scène sort de l'écran. */
      if (maintenant - derniere < 24) return;
      derniere = maintenant;

      const t = Math.min(1, (maintenant - depart) / ECLOSION);
      /* La courbe signature en sortie : l'onde part vite et se pose. Une
         éclosion linéaire donne un ballon qui se gonfle. */
      const e = 1 - Math.pow(1 - t, 3);

      /* Rattrapage du regard. L'angle se rejoint par le PLUS COURT CHEMIN,
         sinon la lumière fait le tour du disque quand le pointeur passe de
         +179° à −179°. */
      let ecart = cible.angle - regard.angle;
      while (ecart > Math.PI) ecart -= 2 * Math.PI;
      while (ecart < -Math.PI) ecart += 2 * Math.PI;
      regard.angle += ecart * 0.16;
      regard.force += (cible.force - regard.force) * 0.09;

      instance.update({
        source: novaA(e, ratio, maintenant / 1000, regard),
      });
    });

    return () => {
      stop();
      surTaille.disconnect();
      canvas.removeEventListener("pointermove", surPointeur);
      canvas.removeEventListener("pointerleave", surSortie);
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
