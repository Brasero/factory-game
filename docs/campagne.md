# Campagne, objectifs et pollution

L’archipel comporte six îles persistantes. Les productions des îles ouvertes continuent à alimenter les suivantes. Leurs tailles, proportions, rotations et découpes sont configurées dans `LevelConfig.ts` ; le générateur conserve des zones constructibles autour des gisements et un corridor reliant les tunnels. La première île reste accueillante, la troisième comporte deux plateaux reliés par un passage étroit.

## Objectifs et défis

| Île | Objectif principal |
| --- | --- |
| 1 — Premiers lingots | Exporter 50 lingots de fer |
| 2 — L’acier | Exporter 40 aciers ; atteindre 2 aciers par fenêtre de 10 s pendant 10 s cumulées |
| 3 — Circuit propre | Exporter 30 circuits |
| 4 — Énergie instable | Exporter 25 cellules d’uranium sous un budget de 250 émissions brutes sur cette île |
| 5 — Calcul industriel | Exporter 18 unités de calcul, 6 circuits et 6 aciers |
| 6 — Cœur de l’archipel | Exporter 10 cœurs ; atteindre 1 cœur par fenêtre de 10 s pendant 10 s cumulées |

Chaque île propose deux défis facultatifs : cadence régulière et livraison propre. Chacun rapporte 15 matériaux de construction, une seule fois. Seul l’objectif principal débloque la suite et rapporte 50 matériaux. Le panneau **Bilan et défis** indique les critères, la progression, les émissions et les débits des îles ouvertes.

Les fenêtres couvrent 100 ticks, soit 10 secondes simulées. Elles doivent être complètes avant de compter l’effort de débit. Une interruption suspend l’effort acquis ; une pause générale ne consomme aucun temps. Une commande composée exige toutes ses ressources. Les livraisons sont cumulatives et ne retirent aucun produit des tunnels : les contrats du lot 2 utilisent leurs propres réservations et consomment les livraisons.

Le budget écologique mesure les émissions brutes locales depuis le début de l’essai. Un dépassement remet sa progression à zéro et démarre un nouvel essai ; aucune construction ni ressource n’est détruite. Le cumul des exports et des émissions historiques reste visible dans le bilan. La dépollution globale ne réduit pas ce budget brut.

## Cycle d’un niveau

- `locked` : construction et destruction refusées dans sa zone ;
- `active` : objectif principal en cours ;
- `completed` : île suivante débloquée, configuration encore modifiable ;
- `finalized` : configuration verrouillée, production et exports maintenus.

La finalisation est facultative. Les défis restent suivis après réussite, même sur une île finalisée, mais celle-ci ne permet plus de modifier les réseaux ou recettes ; les pauses individuelles restent disponibles. Les défis ne sont jamais obligatoires pour finaliser. Après la victoire de la sixième île, le bouton de continuation relance le monde et permet de poursuivre les défis en jeu libre.

Finaliser met l’usine en service : **30 matériaux de construction** sont versés immédiatement, une seule fois, en plus des 50 de l’objectif. Les émissions futures des machines de cette île sont réduites de **10 %**, après application de leur variante. Cadence, rendement, consommation et dépollution ne changent pas ; la pollution déjà accumulée ne baisse pas rétroactivement. Le bonus est visible avant confirmation, puis dans une notification et dans le HUD de l’île. Le versement est sauvegardé pour éviter les doublons. Les anciennes îles finalisées bénéficient du bonus d’émissions sans prime rétroactive.

Les objectifs simples historiques restent fondés sur les statistiques cumulatives globales. Les nouveaux objectifs de débit, de budget et de commande composée utilisent les exports du tunnel de sortie de leur île.

## Pollution et recettes

Une machine ne pollue que lorsqu’elle termine un cycle réel. Une machine inactive, saturée ou privée d’ingrédients ne pollue pas. La nature absorbe initialement 0,02 point par tick ; les restaurations facultatives peuvent porter ce total à 0,026. À 900 points de pollution globale, la partie se termine. La pollution attribuée à chaque île mesure les émissions brutes ; seule la jauge globale bénéficie de l’absorption et de la dépollution.

Le boiler, débloqué à l’île 2, reçoit l’eau par tuyau. Sa recette est sélectionnée à la pose : une unité d’eau par cycle de 30 unités de progression retire désormais **5 points** de pollution globale, contre 4 auparavant. Il s’arrête à pollution nulle. Le recycleur reçoit également sa recette automatiquement. La fonderie et les assembleuses demandent toujours un choix explicite.

Le panneau de machine indique les ingrédients, les sorties, la durée effective du cycle, la production théorique et une action suggérée en cas d’arrêt. Le survol d’un tapis affiche le débit de ses transferts sur la dernière tranche complète de 10 secondes simulées.

| Variante | Vitesse | Production | Pollution par cycle |
| --- | ---: | ---: | ---: |
| Écologique | 0,6× | 1× | 0,3× |
| Standard | 1× | 1× | 1× |
| Industrielle | 1,8× | 2× | 2,6× |

Les recettes et variantes restent définies dans `recipeConfig.ts` et `machineConfig.ts`. Les retours brefs signalent les premières exportations, réussites et records. Les sons sont désactivés par défaut ; leur activation et la réduction des animations sont mémorisées localement.

## Tunnels et sauvegardes

Une ressource compte comme exportée à son entrée dans le tunnel de sortie, une seule fois. Le tunnel d’entrée lié reçoit les ressources selon sa capacité ; les excédents restent en attente en sortie sans bloquer la production ni compter deux fois. Les jonctions des tapis restent explicites, avec transferts en deux phases et priorités spatiales stables.

Les sauvegardes stockent désormais la géométrie exacte, les ressources et les décors avec une palette compacte. Recharger ne régénère donc pas une autre île sous l’usine. Les anciennes sauvegardes sans terrain utilisent le générateur historique. Les îles déjà réussies restent réussies ; les nouveaux défis prennent les exports historiques comme référence et ne distribuent aucune récompense rétroactive. Les fenêtres de débit et les essais en cours sont sauvegardés.

Essai joueur reçu le 9 octobre 2026 : les six îles ont été terminées en environ deux heures, avec un redémarrage après un game over. L’équilibre pollution/dépollution semble satisfaisant ; les défis et contrats encouragent l’optimisation. Ce retour ne nécessite pas de modifier les valeurs actuelles ; plusieurs essais restent utiles pour affiner l’équilibrage.

## Paramètres et tutoriels

La vue **Paramètres** est accessible depuis le menu principal et le menu de pause. « Désactiver les tutoriels » supprime toutes les ouvertures, au début d’une campagne comme aux nouveaux déblocages. Le bouton Tutoriel reste désactivé tant que l’option est cochée. Décoche-la pour rendre les tutoriels disponibles à nouveau. La préférence est mémorisée localement et reste valable lors d’une nouvelle campagne. Retour ou Échap revient au menu d’origine ; une partie en pause reste arrêtée.


## Contrats des communautés — lot 2

Le panneau **Contrats** propose les commandes disponibles selon les îles débloquées. Elles sont facultatives et ne débloquent aucun niveau. Le joueur les accepte lorsque ses chaînes sont prêtes ; les commandes en cours apparaissent en premier.

| Commande | Déblocage | Livraison | Condition | Récompense |
| --- | --- | --- | --- | --- |
| Atelier des apprentis | Île 1 | 15 lingots | Sans délai | 20 matériaux et Premier mécène |
| Réparer le port | Île 2 | 20 lingots + 10 aciers | Sans délai | 35 matériaux et Bâtisseur du port |
| Le pont avant la marée | Île 2 | 12 aciers | 180 secondes simulées après acceptation | 40 matériaux et Livraison ponctuelle |
| Équiper un atelier | Île 3 | 8 circuits | Île 2 : 2 aciers exportés par fenêtre de 10 s pendant 10 s cumulées | 45 matériaux et Industrie solidaire |

Le **point d’expédition** se construit dès la première île pour 20 matériaux, occupe une case et contient jusqu’à 200 produits au total. Il réutilise le coffre existant avec un marquage cyan ; la bordure devient verte lorsqu’une commande lui est affectée. Dans Contrats, sélectionner la commande du point puis raccorder les tapis. Chaque point porte un numéro stable sur la carte et dans le panneau. Plusieurs points, y compris sur des îles finalisées, peuvent livrer une même commande ; un point ne sert qu’une commande à la fois. Les numéros sont sauvegardés et jamais réutilisés après démolition.

Les réservations additionnent les produits physiquement présents dans les points affectés. Une priorité spatiale stable (ligne, colonne, identifiant) répartit la réservation et la consommation exacte entre les points. Aucun stock distant n’est prélevé, et les anciennes statistiques d’exportation ne servent pas de livraison. Le point ne reçoit que les ressources encore nécessaires, dans la limite de sa capacité. Les produits réservés ne sortent pas vers les tapis ou machines voisins. Toutes les quantités demandées sont consommées ensemble, une fois les conditions remplies ; la récompense et la distinction sont attribuées une seule fois. Les surplus ne sont jamais consommés.

Un produit envoyé au contrat ne compte pas pour les objectifs ou défis d’exportation de campagne. Les tunnels conservent leur rôle et leurs règles. Le joueur règle la répartition avec les splitters et filtres existants ; aucun contrat ne détourne automatiquement un flux de campagne.

Une annulation ou un dépassement de délai détache le point et conserve le stock sur place. Un tapis orienté vers l’extérieur ou une machine voisine peut le récupérer. Réaffecter le point conserve également ses produits : les ingrédients utiles sont réservés pour la nouvelle commande, les autres peuvent sortir. Un point non vide refuse la démolition. Un nouvel essai est possible après annulation ou échec, avec délai et effort réinitialisés ; une commande réussie ne peut pas être répétée pour obtenir une nouvelle récompense.

Les délais utilisent les ticks de simulation, jamais le temps réel. Un tick à l’échéance est déjà trop tard. Une pause, le menu ou la sauvegarde n’entament pas le délai. Le contrat de l’atelier conserve les secondes de débit acquises lors des interruptions ; l’effort ne progresse que si un point est affecté. L’affectation des points reste modifiable sur les îles finalisées ; leurs bâtiments et réseaux restent verrouillés. Après victoire, continuer la campagne permet de poursuivre les contrats.

Progression, échéances, distinctions et affectations sont sauvegardées. Les anciennes parties démarrent sans contrat accepté et gardent leurs coffres ordinaires. Trois étapes du tutoriel présentent l’acceptation, les expéditions et la récupération ; l’option de désactivation des tutoriels continue à s’appliquer.


## Corrections après l’essai complet — 9 octobre 2026

Cliquer sur un **tunnel d’entrée** ouvre quatre filtres indépendants : haut, droite, bas et gauche, selon les directions de la carte. Chaque côté distribue aux tapis et machines voisins une ressource précise, toutes les ressources, les ressources non explicitement filtrées ailleurs, ou aucun produit si la sortie est fermée. Par exemple : lingots de fer à gauche et lingots d’acier à droite simultanément. Une ressource absente ou une sortie saturée ne détourne pas les autres produits. L’eau continue de circuler sans ces filtres. Les réglages sont sauvegardés et restent modifiables sur une île finalisée. Les anciennes sauvegardes sans filtre restent automatiques ; un ancien filtre global est repris sur les quatre côtés pour préserver la configuration.

Les contrats séparent maintenant **Commandes** et **Points d’expédition**. Leur historique livré reste fermé par défaut. Les défis et le bilan de production utilisent le même habillage industriel que le HUD ; le tableau de l’archipel est repliable. Les panneaux ne s’ouvrent pas simultanément. Une réussite affiche pendant huit secondes le nom, la récompense et la distinction éventuelle ; le compteur de construction montre le total des gains récents. Les réussites simultanées restent distinctes, sans répétition au chargement ni confusion avec les remboursements de démolition.

La caméra emploie les mêmes coordonnées pour le rendu, le zoom, le survol et les clics : client → taille réelle du Canvas → inverse translation/zoom → cases du monde. Le zoom conserve la position sous le pointeur et actualise le survol. Un bouton d’île recentre toujours, même si l’île est déjà sélectionnée, en conservant le zoom. Le centre de la vue met à jour l’île du HUD pendant un déplacement ; au-dessus de la mer ou d’une île verrouillée, la dernière île accessible reste sélectionnée. Cette mise à jour ne déclenche pas de recentrage. Le clic molette maintenu est expliqué dans le tutoriel et rappelé dans le menu de pause.


## Stratégies supplémentaires — lot 3

Les îles 2 et 3 débloquent trois recettes alternatives dans les machines existantes : fer refroidi à l’eau, acier direct et étirage économe. Le panneau compare les ingrédients, le rendement, le débit et les émissions. Changer de recette remet le cycle à zéro sans supprimer les stocks ; les ingrédients inutilisés attendent leur recette.

Sans outil sélectionné, cliquer sur un tapis ouvre le limiteur (paliers de 0,1 à 10 unités/s simulées), et cliquer sur un coffre règle une réserve minimale par ressource. Les splitters ordinaires et intelligents disposent d’une sortie prioritaire avec relais en cas de saturation ; leurs filtres et jonctions explicites restent respectés. Une île finalisée verrouille ces réglages.

Deux contrats facultatifs restaurent les berges et le bosquet, avec livraison de solides par tapis et d’eau par tuyau aux points d’expédition. Chaque réussite apporte un bonus unique de +0,003 absorption/tick. Le HUD et le bilan montrent les contributions des îles, dont le total initial reste inchangé. L’annulation conserve l’eau, récupérable par un tuyau sortant. Les budgets des défis suivent toujours les émissions brutes, indépendamment de cette absorption.

Voir [les règles et compromis du lot 3](strategies.md) pour les valeurs, réservations, sauvegardes et critères de validation.
