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

Les fenêtres couvrent 100 ticks, soit 10 secondes simulées. Elles doivent être complètes avant de compter l’effort de débit. Une interruption suspend l’effort acquis ; une pause générale ne consomme aucun temps. Une commande composée exige toutes ses ressources. Les livraisons sont cumulatives et ne retirent aucun produit des tunnels : les contrats avec réservation ou consommation appartiennent au lot 2.

Le budget écologique mesure les émissions brutes locales depuis le début de l’essai. Un dépassement remet sa progression à zéro et démarre un nouvel essai ; aucune construction ni ressource n’est détruite. Le cumul des exports et des émissions historiques reste visible dans le bilan. La dépollution globale ne réduit pas ce budget brut.

## Cycle d’un niveau

- `locked` : construction et destruction refusées dans sa zone ;
- `active` : objectif principal en cours ;
- `completed` : île suivante débloquée, configuration encore modifiable ;
- `finalized` : configuration verrouillée, production et exports maintenus.

La finalisation est facultative. Les défis restent suivis après réussite, même sur une île finalisée, mais celle-ci ne permet plus de modifier les réseaux ou recettes ; les pauses individuelles restent disponibles. Les défis ne sont jamais obligatoires pour finaliser. Après la victoire de la sixième île, le bouton de continuation relance le monde et permet de poursuivre les défis en jeu libre.

Les objectifs simples historiques restent fondés sur les statistiques cumulatives globales. Les nouveaux objectifs de débit, de budget et de commande composée utilisent les exports du tunnel de sortie de leur île.

## Pollution et recettes

Une machine ne pollue que lorsqu’elle termine un cycle réel. Une machine inactive, saturée ou privée d’ingrédients ne pollue pas. La nature absorbe 0,02 point par tick. À 900 points de pollution globale, la partie se termine. La pollution attribuée à chaque île mesure les émissions brutes ; seule la jauge globale bénéficie de l’absorption et de la dépollution.

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

Les valeurs de cette première version demandent encore des essais joueurs : vérifier particulièrement le budget d’uranium et le partage des ingrédients sur l’île 5 avant de passer aux contrats.

## Paramètres et tutoriels

La vue **Paramètres** est accessible depuis le menu principal et le menu de pause. « Désactiver les tutoriels » supprime toutes les ouvertures, au début d’une campagne comme aux nouveaux déblocages. Le bouton Tutoriel reste désactivé tant que l’option est cochée. Décoche-la pour rendre les tutoriels disponibles à nouveau. La préférence est mémorisée localement et reste valable lors d’une nouvelle campagne. Retour ou Échap revient au menu d’origine ; une partie en pause reste arrêtée.
