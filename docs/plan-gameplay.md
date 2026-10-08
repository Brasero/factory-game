# Plan d’évolution du gameplay de Factstories

## Intention

Conserver le cœur du jeu : construire, automatiser, observer les flux et optimiser un archipel persistant. Diversifier les problèmes à résoudre avant de multiplier les machines. Les anciennes îles continuent à alimenter les suivantes. Les nouvelles mécaniques doivent rester lisibles et accepter plusieurs solutions.

Statuts : `[ ]` à faire, `[~]` en cours, `[x]` terminé et vérifié. Chaque lot doit mentionner sa validation et les observations des essais joueurs. Les lots 0 et 1 sont actifs ; leurs chiffres restent à équilibrer avec les essais joueurs. Les lots suivants sont des propositions.

## Lot 0 — Peaufiner l’existant (priorité actuelle)

- [x] Afficher uniquement les ressources débloquées dans le HUD ; conserver les ressources des îles déjà ouvertes.
- [x] Rendre les bords des textures de pollution diffus et les mouvements continus.
- [x] Réduire les calculs et préparations graphiques répétés à chaque image.
- [x] Lisser le transport des ressources sur les tapis, y compris les files bloquées, les virages et les transferts.
- [x] Essai joueur : retour positif sur la fluidité reçu le 8 octobre 2026.

Contraintes : aucune modification des cadences, capacités, quantités ou priorités de transfert ; jonctions explicites et traitement en deux phases préservés. Rendu indépendant du moteur, sauvegardes compatibles.

Validation : tests HUD et rendu, `npm run check`, tests mélangés avec graine 42 ; inspection visuelle à plusieurs niveaux de pollution et zooms. Les performances mesurées restent des références locales.

## Lot 1 — Diversifier la campagne et ses objectifs

### 1.1 Identité des îles

- [x] Île 1 : chaîne simple et première livraison.
- [x] Île 2 : équilibre fer/charbon et débit d’acier.
- [x] Île 3 : convergence des flux sur un terrain compartimenté.
- [x] Île 4 : production d’uranium sous budget d’émissions.
- [x] Île 5 : partage d’ingrédients entre plusieurs commandes.
- [x] Île 6 : production finale régulière alimentée par les six îles.
- [x] Définir les contraintes spatiales dans les configurations de carte, avec plusieurs solutions constructibles.

Critères : pas de carte insoluble ; première île accueillante ; chaque île introduit un problème identifiable. Conserver les six îles et les ressources actuelles pour la première version.

### 1.2 Objectifs variés et défis facultatifs

- [x] Généraliser les objectifs : livraison cumulée, débit soutenu, commande composée, production sous contrainte.
- [x] Suivre les débits sur une fenêtre temporelle de simulation ; une interruption courte ralentit le défi plutôt que de tout annuler.
- [x] Ajouter un objectif principal et deux défis facultatifs par île.
- [x] Seul l’objectif principal débloque la suite ; les défis restent accessibles après réussite tant que leur configuration peut encore être modifiée.
- [x] Définir l’interaction avec la finalisation et le mode après victoire.
- [x] Afficher critères, progression, interruption et récompenses clairement.
- [x] Sauvegarder l’avancement et migrer les anciennes sauvegardes.

Critères : tests de cumul, fenêtres de débit, pause, reprise, contrats multiressources, progression et migration. Essais joueurs : intérêt à revenir sur une ancienne usine, difficulté compréhensible.

### 1.3 Lecture et satisfaction de l’usine

- [x] Enrichir les diagnostics existants : ingrédient absent, sortie pleine, pause et solution suggérée.
- [x] Afficher débits récents des lignes/tunnels et besoins/production des recettes.
- [x] Ajouter un bilan par île : exportations, émissions, chaînes bloquées.
- [x] Signaler première exportation, réussite et record de débit par des retours visuels/sonores brefs.
- [x] Prévoir désactivation des sons et réduction des animations.

Critères : mesures calculées par la simulation ou un suivi dédié, jamais à partir des images rendues ; HUD sans coût proportionnel à toute la carte à chaque image.

Essais joueurs du lot 1 : [ ] vérifier la difficulté des cadences, du budget d’uranium et de la commande composée. Les tailles et découpes sont configurées dans le générateur ; les anciennes sauvegardes conservent leur terrain.

## Lot 2 — Contrats et rythme de session

- [ ] Proposer quelques commandes facultatives issues des communautés de l’archipel.
- [ ] Permettre de choisir et accepter une commande lorsque l’usine est prête.
- [ ] Ajouter un point d’expédition raccordé au réseau ; affecter une commande sans livraison manuelle.
- [ ] Définir réservation, consommation, annulation et réaffectation des produits pour éviter tout double comptage.
- [ ] Réserver les délais aux commandes explicitement signalées ; les mesurer en temps de simulation.
- [ ] Récompenser par matériaux et distinctions, sans bloquer la campagne principale.
- [ ] Exemples : réparer le port (fer + acier), équiper un atelier (circuits en maintenant l’acier).
- [ ] Sauvegarder les contrats et leur progression.

Dépendances : lot 1.2 et indicateurs de débit. Critères : conservation, commandes simultanées, priorité entre campagne et contrats, pause/reprise, équilibre des récompenses. Essais joueurs : les contrats offrent un choix utile sans interrompre constamment le niveau principal.

## Lot 3 — Approfondir les stratégies

### 3.1 Recettes alternatives

- [ ] Définir deux ou trois alternatives seulement pour une première version.
- [ ] Explorer matière supplémentaire contre moins de machines, eau contre émissions réduites, valorisation d’un surplus, lenteur contre rendement matière.
- [ ] Chaque alternative doit changer un choix de réseau ou d’implantation ; éviter une recette supérieure dans tous les cas.
- [ ] Comparer ingrédients, rendement, cadence et pollution dans le panneau existant.
- [ ] Déblocages, conservation, changement de recette et sauvegarde testés.

### 3.2 Outils de régulation

- [ ] Limiteur de débit pour réserver une part de production.
- [ ] Stockage avec seuil de sortie pour constituer une réserve.
- [ ] Priorités configurables pour servir une chaîne essentielle avant une commande secondaire.
- [ ] Définir unités, plages, famine éventuelle et comportement des routeurs avant implémentation.
- [ ] Donner accès aux outils essentiels dans la campagne principale.

Critères : déterminisme, conservation, saturation, transferts partiels, modifications de réseau et reprise après sauvegarde ; aucune jonction implicite.

### 3.3 Écologie et restauration

- [ ] Configurer des différences d’absorption naturelle et d’espace entre îles.
- [ ] Mesurer les défis écologiques sur les émissions brutes pendant leur réalisation, distinctes de la pollution globale courante.
- [ ] Introduire des demandes facultatives de restauration alimentées en matériaux/eau.
- [ ] Définir leurs bénéfices durables et empêcher une récupération gratuite ou infinie.
- [ ] Afficher les conséquences avant les décisions ; conserver une tension anticipable sans destruction aléatoire d’usines.

Critères : bilan global cohérent, absorption sans double comptage, budgets indépendants de la dépollution, pause et sauvegarde. Essais joueurs : variantes écologiques et dépollution offrent des usages complémentaires.

## Suivi des livraisons

| Lot | État | Preuves / observations |
| --- | --- | --- |
| 0 — Finition | Validé, retour joueur positif sur la fluidité | Node 22 : lint, 220 tests (dont ordre mélangé, graine 42) et build réussis ; contrôle visuel des masques/zooms et comparaison locale du rendu |
| 1 — Campagne | Implémenté et vérifié ; équilibrage joueur à recueillir | Node 22 : check et ordre mélangé (graine 42), 233 tests réussis ; contrôle visuel du bilan et des six îles ; voir campagne.md |
| 2 — Contrats | À faire | Après validation des objectifs variés |
| 3 — Stratégies | À faire | Après essais des contrats |

Pour chaque livraison : préciser fichiers modifiés, validation automatisée, inspection visuelle, retours joueurs et décisions d’équilibrage. Ne cocher une mécanique que lorsqu’elle est implémentée et vérifiée ; conserver les essais joueurs comme étape distincte.

### Ajustements avant le lot 1 — 8 octobre 2026

- [x] Boiler : dépollution de 4 à 5 points par cycle.
- [x] Libellés de construction simplifiés dans le HUD.
- [x] Recette par défaut uniquement pour boiler et recycleur, y compris au chargement.

- [x] Tutoriel initial : accès aux défis, récompenses facultatives, cadence cumulée et budget d’émissions avec nouvel essai.

### Paramètres de jeu — 8 octobre 2026

- [x] Vue Paramètres accessible depuis le menu principal et le menu de pause.
- [x] Option « Désactiver les tutoriels » mémorisée localement, indépendante des sauvegardes de campagne.
- [x] Désactivation du tutoriel initial, des ouvertures manuelles et de tous les tutoriels de déblocage ; réactivation possible.
- [x] Retour et Échap restaurent le menu d’origine sans reprendre une partie en pause.

Validation : Node 22, `npm run check` et tests mélangés (graine 42), 237 tests réussis ; contrôle visuel du menu et de la vue Paramètres.

- [x] Paramètres : vue élargie avec sections défilantes et retour toujours accessible pour accueillir les futurs réglages.
