# Campagne, objectifs et pollution

La campagne forme un archipel persistant. Les trois îles sont générées dans le même monde et continuent à être simulées après leur déblocage. Une île verrouillée reste visible sous la brume, mais le moteur refuse toute construction ou destruction dans sa zone.

## Cycle d’un niveau

Un niveau passe par les états suivants :

- `locked` : île inaccessible ;
- `active` : objectif en cours ;
- `completed` : objectif atteint, île suivante débloquée ;
- `finalized` : configuration verrouillée, production et export maintenus.

La finalisation est facultative. Le joueur peut ouvrir l’île suivante tout en continuant à optimiser une île réussie. La campagne se termine lorsque l’objectif de la troisième île est atteint.

Les objectifs utilisent des statistiques cumulatives (`extracted`, `produced`, `exported`) plutôt que le contenu courant des coffres. Déplacer ou consommer une ressource déjà produite ne fait donc pas régresser un objectif.

## Pollution

La pollution est ajoutée uniquement lorsqu’une machine termine un cycle réel. Une machine inactive, saturée ou privée d’ingrédients ne pollue pas. Chaque cycle augmente la pollution de l’île et la pollution globale. La nature absorbe `0,02` point par tick tant que la simulation tourne. Le joueur peut donc ralentir ou saturer une chaîne, ou employer des variantes écologiques, pour faire redescendre la pollution. À 900 points, la campagne se termine immédiatement.

La pollution d’une île reste une mesure brute des émissions produites pour le score. Seule la jauge globale courante bénéficie de l’absorption naturelle et des machines de dépollution. Une brume apparaît après 10 % du seuil et s’épaissit progressivement jusqu’au Game Over.

Le boiler est débloqué au niveau 2. Alimenté par un tapis ou un coffre, il consomme une unité d’eau toutes les 20 unités de progression et retire immédiatement 12 points de pollution globale. Il ne produit aucune ressource, n’émet pas de pollution et s’arrête automatiquement lorsque la jauge atteint zéro. La pollution brute attribuée aux îles reste inchangée afin de conserver un score représentatif des émissions.

Chaque machine peut être mise en pause depuis son menu contextuel. La pause arrête la production et les émissions sans vider les buffers ; les produits déjà fabriqués peuvent encore sortir. Cette commande reste disponible après la finalisation de l’île afin que le joueur conserve le contrôle de la pollution globale.

Les variantes suivent un compromis commun :

| Variante | Vitesse | Production | Pollution par cycle |
| --- | ---: | ---: | ---: |
| Écologique | 0,6× | 1× | 0,3× |
| Standard | 1× | 1× | 1× |
| Industrielle | 1,8× | 2× | 2,6× |

Les valeurs de base sont définies dans `machineConfig.ts`. Les recettes à plusieurs ingrédients sont déclaratives dans `recipeConfig.ts`.

## Tunnels

Un tunnel de sortie accepte les ressources d’un tapis sans aucune limite de stockage et les transfère vers le tunnel d’entrée lié. Une ressource est comptée comme exportée dès son entrée dans le tunnel de sortie. Si le tunnel d’entrée est saturé, les ressources restent en attente dans le tunnel de sortie sans bloquer la production de l’île précédente et sans être comptées une seconde fois. Le transfert conserve les quantités et respecte la capacité du tunnel d’entrée. Un tunnel d’entrée distribue ensuite une unité par tick au tapis placé devant lui.

## Ajouter un niveau

Ajouter sa définition dans `campaignConfig.ts`, son île et ses ressources dans `LevelConfig.ts`, puis déclarer les nouvelles machines, recettes et assets. Chaque nouvelle mécanique doit tester au minimum le déblocage, la conservation des ressources, le calcul de pollution et la reprise après sauvegarde.
