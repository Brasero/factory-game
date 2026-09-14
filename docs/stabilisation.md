# Stabilisation et performances

## Vérification du projet

Depuis la racine :

- `npm run check` : lint, tests, compilation TypeScript et build Vite.
- `npm test` : tests exécutés une fois.
- `npm run test:watch` : tests en mode interactif.

Le contrôle TypeScript inclut le moteur et les tests. Les règles strictes restent activées. Le workflow GitHub Actions exécute `npm ci` puis `npm run check` avec Node 22.

Les tests métier utilisent une petite carte fixe, créée pour chaque scénario. Le contrôleur est testé avec le vrai moteur : seuls le rendu Canvas et la génération du terrain sont remplacés. Un test distinct exerce la vraie génération avec un aléatoire fixé. Ces tests ne constituent pas une validation visuelle dans le navigateur.

## Plan proposé, par ordre de priorité

### 1. Sécuriser les règles de simulation

- Centraliser la validation du placement pour machines, convoyeurs et coffres : mêmes règles pour l'aperçu et la commande, terrain interdit, décorations, limites et occupation.
- Corriger la sortie de la pompe (`!carrying` ne peut pas être vrai pour un tableau).
- Définir explicitement les capacités : quantité totale ou par ressource ; appliquer la même règle à la production et aux transferts.
- Faire les transferts en deux phases : calcul des intentions depuis l'état initial du tick, puis application avec réservation des capacités. Définir les priorités entre plusieurs entrées et conserver le blocage volontaire des jonctions entre convoyeurs simples. Les fusions et répartitions nécessiteront de futurs mergers/splitters.
- Calculer les compteurs du HUD après les transferts, pour représenter le même tick que le monde.

Validation : tests de chaîne pour chaque ressource, réseau saturé puis débloqué, boucles de convoyeurs, entrées concurrentes, transfert partiel, destruction et conservation des quantités. Permuter l'ordre interne des convoyeurs doit conserver le résultat, avec une règle de priorité explicite et stable.

### 2. Fiabiliser le cycle de vie et les interactions

- Rendre le démarrage de TickLoop idempotent et libérer la boucle au démontage ; tester démarrage répété, pause et reprise avec de fausses horloges.
- Donner au rendu un propriétaire unique : supprimer le dessin direct depuis le contrôleur.
- Séparer les ticks de simulation à pas fixe du rendu par requestAnimationFrame ; prévoir une limite de rattrapage après un onglet inactif.
- Vérifier les placements pendant la pause, la caméra après reprise, le redimensionnement et les relâchements de souris hors du canvas.
- Gérer les erreurs de chargement des assets avec un état d'erreur visible.

Validation : tests du cycle de vie et scénarios navigateur couvrant construction, destruction, zoom, déplacement, pause et reprise. Aucun timer supplémentaire après un second démarrage.

### 3. Établir une référence de performance

Avant toute optimisation, préparer des scènes reproductibles avec 100, 1 000 et 5 000 convoyeurs, vides et chargés. Mesurer séparément : simulation, création des snapshots, rendu, allocations mémoire et démarrage.

Relever médiane et p95 sur un navigateur et une machine de référence. Les chiffres ne doivent pas devenir des seuils de CI sur des machines non comparables. Budget indicatif à confirmer : frame de 16,7 ms pour viser 60 images/s et simulation nettement sous son pas de 100 ms.

### 4. Réduire le coût du terrain et des snapshots

- Conserver les données statiques du terrain entre les snapshots ; utiliser une révision pour invalider les portions modifiées. Empêcher le partage de références mutables avec le moteur.
- Dessiner uniquement les cellules visibles, avec une marge pour les sprites débordants.
- Mettre en cache les couches statiques par blocs de carte, avec invalidation locale et limite mémoire, plutôt qu'un immense canvas pour toute la carte.
- Réduire la recréation des abonnements et gestionnaires d'événements liée aux ticks React.

Validation : comparaison visuelle aux frontières des blocs et aux différents zooms ; mesures avant/après. Le déplacement d'un item ne doit pas reconstruire 47 500 cases de terrain.

### 5. Réduire le coût des réseaux

- Indexer les entités par cellule pour remplacer les recherches linéaires répétées.
- Recalculer les voisinages et connexions lors des constructions, destructions et rotations plutôt qu'à chaque tick.
- Mesurer ensuite l'intérêt des buffers réutilisables et des mises à jour partielles des snapshots.
- Envisager un Web Worker uniquement si les mesures montrent encore une contention de la simulation sur le thread principal.

Validation : résultats identiques aux tests de simulation, croissance du coût proche du nombre d'entités traitées, absence d'index périmés après édition du réseau et comparaison des p95 et allocations avec la référence.

## Premier lot implémenté

- Placement sur terrain valide pour coffres et convoyeurs, rejet des coordonnées non entières.
- Pompe opérationnelle en sortie droite ; capacités des machines/coffres définies comme quantités totales, tous types confondus. La capacité d'un convoyeur reste un nombre de lots transportés.
- Transferts de tapis fondés sur leur état au début de la phase de transport : les nouveaux arrivants attendent le tick suivant. Les places libérées pendant cette phase deviennent disponibles au prochain tick (choix conservateur qui peut réduire le débit d'un réseau saturé).
- Jonctions simples toujours bloquées, y compris si une branche entrante est vide. Pour des entrées concurrentes dans un coffre ou une machine, priorité spatiale stable par ligne puis colonne ; pas encore d'alternance équitable.
- Production plafonnée à la place disponible, transferts partiels conservés, compteurs recalculés après transport et destruction. Détruire un contenant supprime son contenu, comme auparavant.
- Index de positions construits à chaque phase pour éviter les recherches linéaires répétées. Le cache persistant des connexions reste à faire.
- Timer idempotent et libéré au démontage ; rendu exclusivement côté Canvas, regroupé par requestAnimationFrame sur les changements. Pas encore d'interpolation entre ticks ni de boucle avec rattrapage temporel.
- Caméra redessinée pendant la pause, resize pris en compte, relâchement hors canvas annulant le tracé ; erreur visible si les assets ne chargent pas.
- Terrain des snapshots mis en cache par grille/révision, copié et gelé récursivement. Les mutations de ressources invalident le cache ; occupation et simulation ne le reconstruisent pas.
- Dessin limité à la zone visible avec une marge de deux cases, pour terrain, ressources, décorations et entités.

### Mesures locales

`npm run benchmark` exécute un scénario dédié, exclu des tests ordinaires. Mesures Node locales, 10 passages d'échauffement et 50 échantillons, grille de 250 × 190 cases. Elles ne mesurent pas les FPS du navigateur et ne sont pas des seuils de CI.

| Convoyeurs chargés | Snapshot médian avant cache | Après cache | p95 avant | p95 après |
| --- | --- | --- | --- | --- |
| 100 | 1,939 ms | 0,008 ms | 3,602 ms | 0,014 ms |
| 1 000 | 1,785 ms | 0,050 ms | 2,598 ms | 0,083 ms |
| 5 000 | 1,915 ms | 0,188 ms | 4,194 ms | 0,225 ms |

La simulation de la scène chargée à 5 000 convoyeurs est mesurée à 4,094 ms médian / 8,013 ms p95 après cette intervention. Le premier snapshot inclut encore la copie et le gel du terrain ; ce coût est exclu des mesures après échauffement.

Le test de rendu d'une vue de 320 × 320 pixels sur mer dessine 576 sous-tuiles au lieu des 190 000 sous-tuiles de fond de la carte entière. Il vérifie la réduction du travail demandé, sans prétendre mesurer le temps GPU.

Vérification manuelle dans le navigateur : chargement, pause, déplacement de caméra, placement d'un coffre pendant la pause, zoom et reprise sans retour de caméra. La matrice complète des interactions et le redimensionnement restent à automatiser.

### Prochain lot

1. Compléter les tests navigateur (tracés, destruction, resize, glisser hors canvas) et les tests de régression des transferts vers les machines.
2. Mesurer le rendu réel et les allocations dans le navigateur avant de choisir un cache de terrain par blocs.
3. Mettre en cache les connexions et réduire les abonnements React recréés à chaque tick si le profil confirme leur coût.
4. Concevoir séparément les futurs splitter/merger avec alternance explicite et tests de saturation ; ne pas autoriser de fusion implicite des convoyeurs simples.
