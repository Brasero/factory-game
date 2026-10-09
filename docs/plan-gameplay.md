# Plan d’évolution du gameplay de Factstories

## Intention

Conserver le cœur du jeu : construire, automatiser, observer les flux et optimiser un archipel persistant. Diversifier les problèmes à résoudre avant de multiplier les machines. Les anciennes îles continuent à alimenter les suivantes. Les nouvelles mécaniques doivent rester lisibles et accepter plusieurs solutions.

Statuts : `[ ]` à faire, `[~]` en cours, `[x]` terminé et vérifié. Chaque lot doit mentionner sa validation et les observations des essais joueurs. Les lots 0 à 3 sont actifs ; leurs chiffres restent à équilibrer avec les essais joueurs.

## Lot 0 — Peaufiner l’existant

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

Essais joueurs du lot 1 : [x] premier parcours complet reçu le 9 octobre 2026 ; six niveaux terminés en environ deux heures, plaisir confirmé et pollution jugée équilibrée malgré un game over. D’autres essais permettront d’affiner les cadences, le budget d’uranium et la commande composée. Les tailles et découpes sont configurées dans le générateur ; les anciennes sauvegardes conservent leur terrain.

## Lot 2 — Contrats et rythme de session

- [x] Proposer quelques commandes facultatives issues des communautés de l’archipel.
- [x] Permettre de choisir et accepter une commande lorsque l’usine est prête.
- [x] Ajouter un point d’expédition raccordé au réseau ; affecter une commande sans livraison manuelle.
- [x] Définir réservation, consommation, annulation et réaffectation des produits pour éviter tout double comptage.
- [x] Réserver les délais aux commandes explicitement signalées ; les mesurer en temps de simulation.
- [x] Récompenser par matériaux et distinctions, sans bloquer la campagne principale.
- [x] Exemples : réparer le port (fer + acier), équiper un atelier (circuits en maintenant l’acier).
- [x] Sauvegarder les contrats et leur progression.

Dépendances : lot 1.2 et indicateurs de débit. Critères : conservation, commandes simultanées, priorité entre campagne et contrats, pause/reprise, équilibre des récompenses. Essais joueurs : les contrats offrent un choix utile sans interrompre constamment le niveau principal.

Essais joueurs du lot 2 : [x] intérêt des contrats et défis confirmé le 9 octobre 2026, avec envie d’optimiser chaque île. Le délai et les récompenses restent à comparer sur d’autres parcours. Plusieurs points peuvent être affectés à une commande ; plusieurs commandes peuvent avancer simultanément. Les commandes consomment leurs produits à la réussite et ne comptent pas comme exports de campagne. Annulation et échec libèrent le stock sans déplacement gratuit ; un tapis sortant le restitue.

## Lot 3 — Approfondir les stratégies

### 3.1 Recettes alternatives

- [x] Définir deux ou trois alternatives seulement pour une première version.
- [x] Explorer matière supplémentaire contre moins de machines, eau contre émissions réduites, valorisation d’un surplus, lenteur contre rendement matière.
- [x] Chaque alternative doit changer un choix de réseau ou d’implantation ; éviter une recette supérieure dans tous les cas.
- [x] Comparer ingrédients, rendement, cadence et pollution dans le panneau existant.
- [x] Déblocages, conservation, changement de recette et sauvegarde testés.

### 3.2 Outils de régulation

- [x] Limiteur de débit pour réserver une part de production.
- [x] Stockage avec seuil de sortie pour constituer une réserve.
- [x] Priorités configurables pour servir une chaîne essentielle avant une commande secondaire.
- [x] Définir unités, plages, famine éventuelle et comportement des routeurs avant implémentation.
- [x] Donner accès aux outils essentiels dans la campagne principale.

Critères : déterminisme, conservation, saturation, transferts partiels, modifications de réseau et reprise après sauvegarde ; aucune jonction implicite.

### 3.3 Écologie et restauration

- [x] Configurer des différences d’absorption naturelle et d’espace entre îles.
- [x] Mesurer les défis écologiques sur les émissions brutes pendant leur réalisation, distinctes de la pollution globale courante.
- [x] Introduire des demandes facultatives de restauration alimentées en matériaux/eau.
- [x] Définir leurs bénéfices durables et empêcher une récupération gratuite ou infinie.
- [x] Afficher les conséquences avant les décisions ; conserver une tension anticipable sans destruction aléatoire d’usines.

Critères : bilan global cohérent, absorption sans double comptage, budgets indépendants de la dépollution, pause et sauvegarde. Essais joueurs : variantes écologiques et dépollution offrent des usages complémentaires.

Décisions de première version : trois recettes (fer refroidi à l’eau, acier direct, étirage économe), régulation dans les tapis/coffres/splitters existants, deux contrats de restauration consommant solides et eau. Le limiteur propose des paliers de 0,1 à 10 unités/s simulées ; les priorités sont strictes avec relais en cas de saturation. Les différences de terrain du lot 1 restent en place. L’absorption initiale globale reste 0,02/tick, avec deux bonus uniques de 0,003/tick. Voir [les règles détaillées](strategies.md).

Validation Node 22 : `npm run check` et tests mélangés avec graine 42, **310 tests réussis** ; deux benchmarks opt-in exclus. Inspection visuelle des recettes, des réglages de régulation et des bénéfices annoncés des restaurations sur une scène isolée, sans modifier la sauvegarde du joueur. Essais joueurs du lot 3 : [ ] à recueillir, notamment sur l’équilibre des alternatives, les réserves et les bénéfices écologiques.

## Propositions futures — À arbitrer

Propositions ajoutées le 9 octobre 2026. Elles ne constituent pas encore des lots approuvés : leur sélection et leur ordre seront décidés après les essais du lot 3. Les ampleurs sont des estimations relatives, à préciser avant implémentation. Certaines prolongent les diagnostics, défis et contrats existants ; leur périmètre devra éviter les doublons.

| N° | Proposition | Contenu envisagé | Intérêt pour le joueur | Ampleur estimée | Statut |
| --- | --- | --- | --- | --- | --- |
| 1 | Statistiques de production | Quantités produites et consommées par minute, évolution de la pollution et machines bloquées. | Comprendre les déséquilibres et mesurer les effets d’une optimisation. | Moyenne | À arbitrer |
| 2 | Copier une configuration de machine | Reproduire une recette, des filtres, une priorité et un débit sur une entité compatible. | Réduire les manipulations répétitives lors de l’agrandissement d’une usine. | Petite | À arbitrer |
| 3 | Plans de construction | Sélectionner un groupe de machines et le reproduire, avec rotation et aperçu du coût. | Construire des modules réutilisables et faciliter les grandes installations. | Grande | À arbitrer |
| 4 | Spécialisation des îles | Choisir un bonus accompagné d’une contrainte, par exemple une métallurgie accélérée contre davantage de pollution. | Donner une identité à chaque île et encourager les échanges entre elles. | Moyenne | À arbitrer |
| 5 | Contrats de débit régulier | Fournir une quantité par minute pendant une durée donnée, sans interruption prolongée. | Récompenser une chaîne stable, en complément des livraisons ponctuelles. | Moyenne | À arbitrer |
| 6 | Contrats entre plusieurs îles | Livrer différents produits à plusieurs destinations dans un même contrat. | Renforcer l’intérêt des tunnels et de l’organisation du réseau global. | Moyenne | À arbitrer |
| 7 | Sous-produits industriels | Certaines recettes alternatives génèrent des résidus réutilisables ou recyclables. | Créer des boucles de production et de nouveaux compromis écologiques. | Grande | À arbitrer |
| 8 | Deuxième usage des matériaux existants | Ajouter quelques produits intermédiaires et contrats utilisant les ressources actuellement peu sollicitées. | Diversifier les chaînes sans multiplier immédiatement les machines. | Moyenne | À arbitrer |
| 9 | Aménagements écologiques visibles | Végétation restaurée ou berges assainies après certains contrats. | Rendre les progrès écologiques perceptibles directement sur la carte. | Moyenne | À arbitrer |
| 10 | Objectifs de maîtrise par île | Objectifs facultatifs : terminer avec peu de machines, une pollution limitée ou une bonne régularité de production. | Prolonger l’intérêt des six niveaux avec des distinctions. | Petite à moyenne | À arbitrer |
| 11 | Mode libre après la campagne | Poursuivre l’usine, recevoir des contrats supplémentaires et suivre des records personnels. | Donner une raison de conserver et perfectionner sa partie terminée. | Moyenne | À arbitrer |
| 12 | Parties personnalisées | Graine de carte, taille des îles, abondance des ressources et difficulté écologique. | Renforcer la rejouabilité et permettre de partager un même défi. | Moyenne à grande | À arbitrer |

Ordre de priorité proposé, non validé : **1 → 2 → 5 → 4 → 9**. Apporter d’abord du confort et de la lisibilité, puis de nouveaux objectifs et une identité plus forte aux îles. Les sous-produits et les plans de construction demandent un lot plus conséquent, notamment pour l’équilibrage et les interactions.

Pour chaque proposition retenue : préciser le périmètre, les interactions avec les mécaniques existantes, les règles de sauvegarde, les critères de validation et les retours joueurs attendus avant de l’intégrer à un lot.

## Suivi des livraisons

| Lot | État | Preuves / observations |
| --- | --- | --- |
| 0 — Finition | Validé, retour joueur positif sur la fluidité | Node 22 : lint, 220 tests (dont ordre mélangé, graine 42) et build réussis ; contrôle visuel des masques/zooms et comparaison locale du rendu |
| 1 — Campagne | Implémenté et vérifié ; premier parcours joueur positif | Node 22 : check et ordre mélangé (graine 42), 233 tests réussis ; contrôle visuel du bilan et des six îles ; voir campagne.md |
| 2 — Contrats | Implémenté et vérifié ; premier parcours joueur positif | Quatre commandes, points d’expédition, réservations et restitution, délai simulé et distinctions ; Node 22 : check + graine 42, 253 tests ; inspection du panneau et des affectations |
| 3 — Stratégies | Implémenté et vérifié ; essais joueurs à faire | Trois recettes, régulation des tapis/coffres/splitters, deux restaurations ; check + graine 42, 310 tests ; inspection visuelle ; voir strategies.md |

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


### Corrections du compte rendu joueur — 9 octobre 2026

- [x] 1. Filtres indépendants sur les quatre côtés du tunnel d’entrée, comme le splitter intelligent, avec sauvegarde et migration du précédent filtre global.
- [x] 2. Noms explicites : lingots de fer et lingots d’acier dans le HUD, les recettes et panneaux.
- [x] 3. Numéros permanents des points d’expédition, affichés dans le panneau et le badge de la carte.
- [x] 4. Plusieurs points par contrat, affectation possible sur les îles finalisées ; réservation globale, conservation et consommation exacte.
- [x] 5. Panneaux plus espacés, rubriques Commandes / Points d’expédition, bilan repliable et un seul panneau ouvert à la fois.
- [x] 6. Contrats terminés regroupés dans un historique fermé par défaut.
- [x] 7. Notifications de réussite visibles pendant huit secondes avec récompense, distinction et gain cumulé près du compteur de matériaux.
- [x] 8. Habillage industriel des contrats et défis, cohérent avec le HUD.
- [x] 9. Conversion unique des coordonnées de souris, zoom ancré sous le pointeur et survol immédiatement actualisé.
- [x] 10. Recentrage sur la bonne île à tout zoom, y compris l’île déjà sélectionnée et une nouvelle campagne.
- [x] 11. Synchronisation du HUD avec l’île au centre de la vue lors des déplacements, sans recentrage automatique.
- [x] 12. Clic molette maintenu expliqué dans le tutoriel et le menu de pause.

Décision : conserver les cadences et l’équilibre pollution/dépollution validés par ce premier essai. Ces corrections précèdent le démarrage du lot 3.

Validation : Node 22, `npm run check` (lint, **273 tests**, build) et tests mélangés avec graine 42 ; deux benchmarks opt-in exclus. Inspection visuelle des rubriques, des points numérotés, du tunnel filtré, des défis et du gain de matériaux sur une scène isolée ; sauvegarde de campagne préservée.

### Ajustement des tunnels — 9 octobre 2026

- [x] Un filtre par sortie (haut, droite, bas, gauche), pour servir plusieurs productions simultanément.
- [x] Options : ressource précise, toutes les ressources, ressources non filtrées ailleurs et sortie fermée.
- [x] Application aux tapis et machines voisins, stocks conservés, eau inchangée, sauvegardes migrées.

Validation : `npm run check` et tests mélangés avec graine 42, **277 tests réussis** ; deux benchmarks opt-in exclus. Inspection visuelle des quatre commandes de sortie sur une scène isolée.

### Mise en service des îles — 9 octobre 2026

- [x] Prime unique de 30 matériaux lors de la finalisation.
- [x] Réduction permanente de 10 % des émissions futures sur l’île finalisée ; production et dépollution inchangées.
- [x] Avantages affichés avant verrouillage, notification avec gain de matériaux, rappel permanent dans le HUD et explication au tutoriel.
- [x] Sauvegarde du versement, sans prime rétroactive pour les anciennes îles finalisées.

Validation Node 22 : `npm run check` et tests mélangés avec graine 42, **283 tests réussis** ; deux benchmarks opt-in exclus. Contrôle visuel du dialogue sur une scène isolée.
