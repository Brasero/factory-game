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

## Deuxième lot implémenté

- Connexions du réseau calculées à la demande puis conservées entre ticks. Construction, rotation et destruction invalident le cache. Les index lisent les inventaires et capacités courants ; aucune copie d'inventaire n'est conservée dans la topologie.
- Les modifications structurelles doivent passer par les commandes de `GameEngine`. Le troisième lot ci-dessous ferme les accès directs qui contournaient cette invalidation.
- Ordre spatial stable et blocage volontaire des jonctions simples conservés. Tests de reconstruction du réseau et de transfert partiel vers une machine pleine puis libérée.
- Gestionnaires globaux du Canvas stables entre ticks ; caméra et glissement conservés dans des références. Annulation sur perte de focus, clic droit ou relâchement hors canvas.
- Correction du tracé restant sur sa case initiale : l'aperçu ne plante plus ; un convoyeur isolé est orienté à droite par défaut.
- Six tests DOM avec React et happy-dom couvrent placement/destruction sans tick, tracé, annulation, caméra, zoom et redimensionnement. Le contrôleur et le rendu y sont simulés : ce ne sont pas des tests navigateur de bout en bout.
- Réutilisation de l'index des prédécesseurs dans le rendu, y compris pour les convoyeurs sans prédécesseur, pour supprimer les recherches linéaires répétées. Un test protège ce comportement.

### Mesures comparatives locales

Comparaisons réalisées avant/après pendant la même session de développement sur une scène de 5 000 convoyeurs chargés, avec 10 passages d'échauffement et 50 échantillons :

| Mesure | Médiane avant | Médiane après | p95 avant | p95 après |
| --- | --- | --- | --- | --- |
| Simulation Node | 3,123 ms | 0,801 ms | 5,932 ms | 1,433 ms |
| Appels de rendu Canvas | 11,000 ms | 2,300 ms | 12,800 ms | 2,600 ms |

Pour reproduire la mesure Canvas, lancer `npm run dev` puis ouvrir `/render-benchmark.html` sur le serveur annoncé par Vite. Cette entrée de développement n'est pas incluse dans le build de production. Elle utilise les vrais assets, un terrain herbeux fixe de 250 × 190 cases et une vue de 1 280 × 720 pixels ; seule la partie visible des convoyeurs est dessinée. Le temps mesuré est celui des appels CPU, hors chargement des assets et exécution GPU. Ces chiffres ne mesurent ni les FPS ni les allocations mémoire et ne constituent pas des seuils CI.

La baisse du coût CPU ne justifie pas encore un cache de terrain par blocs : cette décision attend un profil sur des scènes plus représentatives et une mesure mémoire/GPU.

Vérification manuelle dans le navigateur : construction d'une ligne de convoyeurs pendant la pause, destruction d'un convoyeur central, déplacement, zoom et reprise. Le redimensionnement est couvert par le test DOM.

Validation du lot : `npm run check` et tests avec `--sequence.shuffle --sequence.seed=42` ; 44 tests ordinaires, plus un benchmark activé séparément.

## Troisième lot : propriété du monde

L'encapsulation est traitée avant le profil mémoire/GPU pour fermer un risque de connexions périmées identifié au lot précédent.

- `GameEngine` conserve le monde dans un champ JavaScript privé `#world`. Le constructeur copie les entités, inventaires et la grille (terrain, ressources et occupation) pour isoler les références fournies par l'appelant.
- `getWorld()` renvoie désormais une copie indépendante destinée aux exports et aux fixtures. Modifier cette copie ne modifie plus la simulation. C'est un changement de contrat pour les consommateurs directs du moteur.
- `getSnapshot()` reste la lecture fréquente : seules les données dynamiques sont copiées, le terrain immuable reste partagé via son cache. `GameSession` utilise cette méthode et délègue la validation du placement au moteur sans exporter le monde.
- Les tests préparent leurs inventaires avant la construction du moteur, ou exercent directement les systèmes sur un monde de test. Aucun accès mutable de test n'est ajouté à l'API de production.
- Deux nouveaux tests vérifient l'isolation des entrées, exports et snapshots, y compris les inventaires imbriqués, l'occupation et les modifications tentées après calcul des connexions.

Validation : `npm run check` et ordre aléatoire (seed 42) réussis, **46 tests** ; benchmark séparé réussi. Référence locale actuelle à 5 000 convoyeurs chargés : simulation médiane 0,884 ms, snapshot médian 0,187 ms. Ces valeurs ne constituent pas une comparaison contrôlée avec le lot précédent. La copie initiale et les exports complets ont un coût proportionnel à la taille du monde ; ils ne sont pas mesurés par ce benchmark et ne doivent pas être appelés dans la boucle de rendu.

### Suite du plan

1. Mesurer allocations, démarrage et coût GPU sur des scènes comprenant machines, ressources et décorations ; décider ensuite d'un éventuel cache par blocs.
2. Compléter la couverture navigateur de bout en bout et préciser le comportement temporel après un onglet inactif ; l'interpolation et le rattrapage restent à faire.
3. Concevoir séparément les futurs splitter/merger avec alternance explicite et tests de saturation ; ne pas autoriser de fusion implicite des convoyeurs simples.

## Quatrième lot : scènes mixtes et démarrage

`/render-benchmark.html` mesure désormais des scènes fixes comprenant 100, 1 000 ou 5 000 convoyeurs chargés, 1/5/25 mines et autant de coffres, des ressources et des arbres. La grille reste de 250 × 190 cases. Les rangées de production sont synthétiques, pas une sauvegarde de joueur ni une mesure du générateur procédural. La fixture est partagée dans `packages/engine/test/createBenchmarkWorld.ts`.

Chaque scène passe successivement aux zooms 0,5, 1 et 2, avec déplacement horizontal de caméra. Chaque passage exécute un tick, un snapshot et un rendu par frame (charge de stress, différente de la cadence normale du jeu). Le monde continue d'évoluer entre les zooms. Les résultats incluent 10 frames d'échauffement et 50 échantillons par zoom, les intervalles requestAnimationFrame, les durées de création/copie/premier snapshot et les relevés du tas JS disponibles. L'export JSON contient le navigateur et les paramètres ; toute perte de visibilité invalide le passage.

### Référence locale du 15 septembre 2026

Navigateur intégré Chrome 152 annoncé par le user-agent, macOS, Canvas 1 280 × 720, DPR 1, onglet visible. Un passage, cache des assets non contrôlé ; ce n'est pas une comparaison avant/après.

| Convoyeurs | Rendu médian zoom 0,5 | Zoom 1 | Zoom 2 |
| --- | --- | --- | --- |
| 100 | 14,4 ms | 1,6 ms | 1,2 ms |
| 1 000 | 14,9 ms | 1,8 ms | 1,2 ms |
| 5 000 | 15,8 ms | 2,2 ms | 1,8 ms |

À 5 000 convoyeurs, le p95 du rendu au zoom 0,5 atteint 17,5 ms et celui des intervalles entre frames 33,4 ms. La création de scène prend 10,1 ms, la copie du moteur 62,7 ms et le premier snapshot 7,9 ms. Le chargement des assets est mesuré une fois à 14,6 ms, sans garantie de cache froid. Ces mesures excluent le chargement initial des modules Vite/React.

Le tas JS relevé après les passages de cette scène varie entre 33,9 et 49,4 Mo décimaux. Le GC n'est pas contrôlé et les anciennes scènes peuvent attendre leur collecte : ces valeurs ne représentent ni les allocations totales ni une preuve de fuite. L'échantillonnage `HeapProfiler.startSampling` a été refusé par l'outil du navigateur intégré. Le profil détaillé des allocations et le coût GPU restent donc **non mesurés**.

Pour compléter ces mesures dans Chrome DevTools : lancer un passage dédié avec l'enregistrement Memory « Allocation sampling », puis un autre avec le panneau Performance, en conservant navigateur, viewport et scène. Garder ces passages instrumentés séparés des références de temps ordinaires. Le protocole de profilage mémoire est décrit dans la [documentation officielle HeapProfiler](https://chromedevtools.github.io/devtools-protocol/tot/HeapProfiler/). Un intervalle entre frames n'est jamais présenté comme un temps GPU.

### Décision pour le prochain lot

Prioriser le travail de dessin au dézoom : son coût est déjà élevé avec seulement 100 convoyeurs, ce qui oriente l'enquête vers le terrain et les décorations plutôt que vers la taille du réseau. Mesurer ces couches séparément avant d'introduire un cache par blocs avec limite mémoire et invalidation. Examiner ensuite la copie initiale de la grille (en conservant son isolation). Le profil GPU/allocation reste à compléter dans un outil le permettant ; aucun Web Worker n'est justifié par ces seuls résultats.

## Cinquième lot : coût du fond marin

Le benchmark relève maintenant séparément terrain, ressources, entités et décorations via un observateur optionnel du rendu. Les appels à l'horloge par couche sont désactivés dans le jeu normal.

Le profil de la scène mixte à 5 000 convoyeurs, zoom 0,5, attribue environ 15 ms au terrain, 1,7 ms aux entités et 0,1 ms aux décorations. Le fond marin dessinait quatre fois la même sous-tuile par case visible, y compris sous les terres. Il est désormais rempli avec un `CanvasPattern` construit depuis la première sous-tuile de l'asset existant.

Le cache conserve un motif de 16 × 16 pixels par contexte Canvas, via une WeakMap, et le remplace si l'image source change. Il ne dépend pas des données du terrain : les autres couches continuent à lire le snapshot courant. Aucun cache de blocs de carte n'est introduit.

### Fidélité et repli

La comparaison navigateur a révélé que les motifs et les sprites individuels ne sont pas rasterisés de façon identique à toutes les transformations. Le chemin optimisé est donc limité aux échelles 0,5 / 1 / 2, sans rotation et avec translation entière. Les autres transformations, ainsi que l'absence d'OffscreenCanvas ou de motif disponible, utilisent le dessin original. Les gains ci-dessous ne s'appliquent donc pas aux caméras fractionnaires ou aux zooms intermédiaires.

Le benchmark compare les pixels sur des Canvas séparés avant ses mesures : zooms 0,5 / 0,75 / 1 / 2 et translations 0 / −33,5 / 47, sur le terrain et les décorations de la fixture. Les **12 comparaisons sont identiques** dans le navigateur testé, y compris les chemins de repli. Ces contrôles ne constituent pas une preuve universelle pour tous les navigateurs, assets ou transformations. Les lectures de pixels ne touchent pas le Canvas chronométré.

### Comparaison locale

Même session, scène et protocole que le lot précédent, avec instrumentation des couches activée des deux côtés ; Chrome 152 annoncé, Canvas 1 280 × 720, DPR 1, onglet visible, 50 échantillons après 10 frames d'échauffement.

| 5 000 convoyeurs, zoom 0,5 | Avant | Après |
| --- | --- | --- |
| Rendu CPU médian | 16,9 ms | 2,2 ms |
| Rendu CPU p95 | 18,7 ms | 2,5 ms |
| Terrain médian | 15,0 ms | 0,1 ms |
| Intervalle entre frames p95 | 33,4 ms | 17,7 ms |

Un test unitaire protège la réutilisation du motif, son remplacement au changement d'asset, la restauration de l'état de remplissage et les replis fractionnaires. `npm run check` : **48 tests réussis**, benchmark Node exclu des tests ordinaires, lint et build réussis.

Prochain travail : réduire le coût de copie initiale de la grille sans affaiblir l'isolation du moteur, puis étendre les profils aux terrains procéduraux et aux zooms intermédiaires avant de décider d'un cache plus général. Les limites de profilage GPU et allocations détaillées restent inchangées.


### Merger et splitter

Les outils `merger` et `splitter` occupent une case, avec une orientation commune aux tapis (`R` horaire, `Maj+R` antihoraire). Un clic sur un élément du même type ajuste sa direction en conservant son inventaire ; changer de type exige une destruction préalable.

- Splitter : une entrée arrière, trois sorties (avant, droite, gauche). Distribution circulaire des paquets entre les sorties disponibles ; une sortie pleine ou absente est ignorée.
- Merger : entrées arrière et latérales, sortie avant. Priorité circulaire entre les convoyeurs entrants pour éviter la famine sous saturation.
- Les stocks restent bornés et les arrivées attendent le prochain tick avant un nouveau transfert. Les tapis ordinaires refusent toujours les jonctions implicites.
- Les sprites existants `splitter.png` et `combiner.png` sont animés et orientés au rendu. Les snapshots transportent le curseur de distribution ; les rotations et destructions invalident le cache de connexions.

Les mergers et splitters utilisent les lignes directionnelles natives de leurs spritesheets : huit frames jaunes lorsqu'un convoyeur est connecté à un port, quatre frames rouges sinon. Les ressources contenues restent simulées mais sont masquées dans le boîtier. La connexion est recalculée au rendu après placement, rotation et destruction ; un stock vide ou une saturation ne signifie pas une déconnexion.

## Sixième lot : corrections issues du bug bounty

Six défauts reproduits ont été corrigés, chacun protégé par un test qui échoue sur l'ancien code.

- **Assets embarqués dans le build.** Le registre référençait les images par leur chemin source (`/apps/web/src/assets/...`). Vite ne les copiait pas dans `dist/` et le build de production ne démarrait pas. Les images utilisées sont désormais importées. Les plus lourdes sont copiées dans `dist/assets`, celles de moins de 4 Ko sont intégrées au JS (bundle de 267 à 305 Ko, 115 Ko gzip).
- **Casse des noms de fichiers.** `Water_Pump_running.png` ne correspondait pas au fichier `Water_Pump_Running.png` : macOS et Vite tolèrent l'écart, Linux non. Un test compare chaque import, segment par segment, à la casse exacte du disque ; le build Linux de la CI échoue aussi sur un import introuvable.
- **Aucune entrée par la sortie avant.** Tapis, splitters et mergers refusent désormais un objet venant de la case vers laquelle ils pointent. Deux tapis face à face ne s'échangent plus le même objet, et un routeur ne pousse plus dans un tapis qui lui fait face. Les sorties de machines et de coffres utilisent la même règle (`acceptsInput`).
- **Jonctions implicites.** Seules les entrées acceptées comptent : un tapis refusé par son voisin ne bloque plus l'entrée légitime de ce voisin.
- **Rendu des tapis face à face.** Le rendu ne considère plus un tapis refusé comme prédécesseur. Il ne demande donc plus de sprite de demi-tour inexistant, dont l'absence interrompait tout le dessin à chaque frame.
- **Entrées des machines.** Une machine n'accepte que l'ingrédient de sa recette ; les extracteurs n'acceptent rien. Du charbon ne peut plus bloquer une fonderie, ni ressortir d'une mine de fer. Un splitter envoie un paquet refusé vers sa sortie suivante.
- **Cuisson sans ingrédient (régression de `6c36fc5`).** La fonderie vérifie de nouveau la présence de minerai et la place en sortie avant d'avancer. Elle ne s'affiche plus active à vide et ne produit plus sa première plaque en un tick. La capacité ne compte toujours que la sortie (`e0bd751`) : un tampon rempli de minerai reste transformable.

Le test de topologie qui envoyait de l'eau dans une mine utilise maintenant du fer vers une fonderie, sans changer ce qu'il vérifie.

Validation : `npm run check` et ordre aléatoire (seed 42) réussis, **103 tests**. Vérification manuelle dans le navigateur sur `npm run preview` : chargement du jeu, puis deux tapis face à face sans erreur ni disparition des décors.
