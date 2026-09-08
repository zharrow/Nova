## Ce que change cette PR

<!-- Ce que le changement corrige ou apporte, et POURQUOI cette voie plutôt
     qu'une autre. Le « quoi » se lit dans le diff ; le « pourquoi » non. -->

Ferme #

## Type

- [ ] Correctif
- [ ] Nouveau composant ou nouvelle forme
- [ ] Nouvelle option d'un composant existant
- [ ] Documentation
- [ ] Vitrine
- [ ] Outillage — CLI, registry, intégration continue

## Si c'est un composant ou une forme

<!-- Voir VARIANTES.md. Sinon, supprimez cette section. -->

- **Famille** :
- **Voie** : option · usage · frère · famille nouvelle
- **Pourquoi cette voie** :
- **Dépendance ajoutée** : aucune · gsap · lenis · radix-ui · autre — et pourquoi,
  selon DEPENDANCES.md

## Vérifications

- [ ] `pnpm test` passe
- [ ] `pnpm typecheck` passe
- [ ] `pnpm registry:build` puis `pnpm --filter novaui build` ont été rejoués
      si `packages/core` ou `packages/react` a bougé — sinon la CLI distribue
      l'ancienne version
- [ ] Le code copié par la CLI a été vérifié dans un projet test
      (`novaui init` + `novaui add` + `tsc --noEmit`), si la surface d'un moteur
      a changé

## Les règles non négociables

- [ ] **L'état par défaut reste visible** — aucun `opacity: 0`, `transform` ou
      `clip-path` masquant qui ne saurait pas être retiré. En
      `prefers-reduced-motion`, en rendu serveur, et pour un élément déjà à
      l'écran au montage, rien ne s'arme.
- [ ] **`destroy()` rend l'élément à son état de départ** — listeners retirés,
      observers détachés, ticker désabonné, DOM injecté retiré, attributs et
      variables CSS supprimés. Un test le vérifie.
- [ ] **Aucun `requestAnimationFrame` propre** — tout passe par
      `internal/ticker.ts`, et tout `IntersectionObserver` par
      `internal/in-view.ts`.
- [ ] **`packages/core` n'importe aucun framework**, et GSAP ou Lenis n'y
      entrent que par une entrée séparée.
- [ ] **Les options sont fusionnées avec `mergeOptions`**, jamais par un spread.

## Captures

<!-- Pour tout changement visible : une capture, ou mieux, un court
     enregistrement. Une animation ne se relit pas dans un diff. -->
