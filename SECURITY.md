# Politique de sécurité

## Versions suivies

Nova est en `0.x` : seule la dernière version publiée reçoit des correctifs.

| Version | Suivie |
|---|---|
| 0.1.x | ✅ |
| < 0.1 | ❌ |

## Signaler une faille

**N'ouvrez pas d'issue publique.** Une issue est visible de tous, y compris de
qui voudrait s'en servir avant le correctif.

Deux voies, dans cet ordre de préférence :

1. **[Signalement privé de GitHub](https://github.com/zharrow/Nova/security/advisories/new)**
   — onglet *Security*, « Report a vulnerability ». C'est la voie la plus
   simple : l'échange reste privé jusqu'à la publication de l'avis.
2. **Courriel** à florent.detres@protonmail.com, avec `[sécurité]` en objet.

Un signalement utile contient : la version concernée, le composant ou la
commande en cause, les étapes de reproduction, l'impact que vous voyez, et
votre appréciation de la gravité.

## Ce à quoi vous pouvez vous attendre

| Étape | Délai visé |
|---|---|
| Accusé de réception | 72 heures |
| Première évaluation | 7 jours |
| Correctif publié | selon la gravité, 30 jours au plus pour une faille critique |

Le projet est tenu sur du temps libre : ces délais sont un engagement de bonne
foi, pas un contrat de service. Vous serez tenu au courant de l'avancement, et
crédité dans l'avis de sécurité si vous le souhaitez.

Nous vous demandons de laisser le temps du correctif avant toute divulgation
publique.

## Périmètre

Une librairie d'animation n'a pas la surface d'attaque d'un serveur, mais elle
n'en a pas zéro. Entrent dans le périmètre :

- **injection dans le DOM** — un moteur qui écrirait du contenu contrôlé par
  l'utilisateur sans échappement. Les moteurs de Nova créent eux-mêmes les
  nœuds qu'ils animent : toute voie qui permettrait d'y faire passer du balisage
  arbitraire est une faille ;
- **pollution de prototype** par la fusion d'options (`mergeOptions`) ;
- **la CLI `novaui`** — écriture de fichiers hors du répertoire cible,
  traversée de chemin dans un nom de composant, exécution de code arrivant du
  registry ;
- **`NOVA_REGISTRY_URL`** — la bascule vers un registry distant. Tout ce qui
  permettrait à un registry hostile d'obtenir plus que l'écriture des fichiers
  demandés, ou de le faire sans que l'utilisateur le voie ;
- **déni de service côté client** — une boucle qui ne rendrait jamais la main,
  du type d'une division par une mesure nulle.

N'entrent pas dans le périmètre :

- les vulnérabilités des dépendances en amont (GSAP, Lenis, Radix, Next.js) —
  signalez-les à leurs mainteneurs ; nous relèverons la version ici ;
- les rapports d'un scanner automatique sans démonstration d'impact ;
- l'absence d'en-têtes de sécurité sur le site de démonstration, qui ne sert
  aucune donnée et n'a aucune authentification ;
- le fait qu'un développeur passe volontairement du HTML non fiable à un
  composant. Comme partout dans l'écosystème React, assainir l'entrée reste la
  responsabilité de l'appelant.

## Bonnes pratiques d'intégration

`novaui add` **copie du code source dans votre dépôt** — c'est le modèle de
shadcn, et il a une conséquence de sécurité : le code copié ne recevra pas les
correctifs automatiquement. Une mise à jour se refait à la main, en réappliquant
`novaui add`. Surveillez les avis de sécurité de ce dépôt pour savoir quand.
