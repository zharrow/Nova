# Nova — conventions du dépôt

Librairie de composants animés. Monorepo pnpm + Turborepo.

## Règles non négociables

**L'état par défaut est visible.** Aucun moteur ne pose d'`opacity: 0`, de
`transform` ou de `clip-path` masquant qu'il ne saurait pas retirer. Concrètement :
en `prefers-reduced-motion`, en SSR, et pour un élément déjà à l'écran au montage
(`isAlreadyInView`), aucune animation d'entrée ne s'arme. Toute modification qui
casse cette règle rend possible une section invisible en production.

**Un moteur ne connaît aucun framework.** `packages/core` n'importe rien d'autre
que lui-même. Pas de React, pas de GSAP, pas de framer-motion. Si une logique
d'animation arrive dans `packages/react`, elle est au mauvais endroit.

**Fusionner les options avec `mergeOptions`, jamais avec un spread.**
`{ ...defaults, ...options }` écrase une valeur par défaut avec `undefined` quand
la clé est présente mais vide — ce qui est le cas normal quand un adaptateur
construit ses options depuis des props. Voir `internal/options.ts`.

**Le JavaScript pose des attributs, le CSS anime.** Les moteurs écrivent
`data-nova-*` et des variables `--nova-*` ; `styles/nova.css` porte les
transitions. Cela garde l'apparence surchargeable sans forker le moteur.

**Tout moteur se démonte proprement.** `destroy()` rend l'élément à son état de
départ : listeners retirés, observers détachés, ticker désabonné, DOM injecté
retiré, attributs et variables CSS supprimés. Il existe un test par moteur pour ça.

## Après modification

Un changement dans `packages/core` ou `packages/react` ne suffit pas : le
registry distribue des copies figées.

```bash
pnpm test && pnpm typecheck   # `test` dépend du build du paquet lui-même,
                              # sinon le test du bundle lit un dist périmé
pnpm registry:build          # régénère registry/dist depuis les sources
pnpm --filter novaui build   # ré-embarque le registry dans la CLI
```

`scripts/build-registry.ts` échoue si un import vers `@nova-ui/*` subsiste après
réécriture — c'est voulu, ne pas contourner le garde-fou.

## Pièges connus

- **`"use client"` disparaît au bundling.** esbuild supprime le prologue de
  directive quand il fusionne des modules ; l'option `banner` de tsup n'y change
  rien. `packages/react/scripts/add-use-client.mjs` la repose après le build.
  Sans elle, importer le paquet depuis un Server Component casse le build
  consommateur. `test/bundle.test.ts` vérifie la directive dans le `dist` : ce
  test existe parce que l'étape a déjà été contournée en silence par un `dist`
  restauré du cache Turbo, et que l'erreur ne se voyait qu'au build du site.
- **Un objet exporté d'un module `"use client"` ne traverse pas la frontière
  serveur.** L'indexer côté serveur renvoie `undefined`. Voir `apps/docs/components/demos.tsx` :
  la table nom → composant reste dans le module client, exposée via `<Demo nom />`.
- **Un état de repos sous `animation-timeline` doit être sous `@supports`.**
  `animation-timeline: view()` n'existe pas partout (Firefox notamment). Poser
  `opacity: 0.17` en dehors de la garde laisse le texte illisible sur ces
  navigateurs, puisque rien ne vient jamais lever l'état de repos. C'est le
  défaut de l'implémentation d'origine des effets de lecture.
- **Une mesure de mise en page peut valoir zéro, et c'est un cas réel.**
  Conteneur en `display: none`, panneau replié, appel avant la première mise en
  page. Toute boucle du type `while (copies < ceil(taille / mesure))` doit
  renoncer quand la mesure est nulle : sinon la division vaut l'infini et le
  navigateur se fige. Voir la garde dans `engines/scroll-marquee.ts`.
- **La feuille de style de Nova est chargée APRÈS celle du projet.** À
  spécificité égale, elle gagne. Ne jamais y poser de dimension, de marge ou de
  couleur de fond sur un élément que l'appelant habille : `width: 100%` sur le
  canvas de la trame écrasait silencieusement les classes utilitaires. Le socle
  ne pose que ce qui est structurel — `display`, `overflow`, `position`.
- **Le pool d'`IntersectionObserver` est global au module** et survit d'un test à
  l'autre. Les doublures de test ne remettent pas `instances` à zéro, c'est
  volontaire.

## Vérifier ce que la CLI produit

Le typecheck du monorepo ne couvre pas le code copié. Pour le tester vraiment :

```bash
node packages/cli/dist/index.js init --yes --cwd <projet-test>
node packages/cli/dist/index.js add reveal --cwd <projet-test>
```

puis `tsc --noEmit` dans le projet cible. C'est ce passage qui a révélé l'erreur
de typage de `mergeOptions`, invisible autrement.

## Langue

Code, commentaires et documentation en français. Noms de symboles en anglais
pour l'API publique (`createReveal`, `RevealOptions`), en français pour le site
vitrine (`catalogue`, `Fiche`, `trouverFiche`).
