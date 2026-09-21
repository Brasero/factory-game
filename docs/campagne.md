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

La pollution d’une île reste une mesure brute des émissions produites pour le score. Seule la jauge globale courante bénéficie de l’absorption naturelle. Une brume apparaît après 10 % du seuil et s’épaissit progressivement jusqu’au Game Over.

Chaque machine peut être mise en pause depuis son menu contextuel. La pause arrête la production et les émissions sans vider les buffers ; les produits déjà fabriqués peuvent encore sortir. Cette commande reste disponible après la finalisation de l’île afin que le joueur conserve le contrôle de la pollution globale.

Les variantes suivent un compromis commun :

| Variante | Vitesse | Production | Pollution par cycle |
| --- | ---: | ---: | ---: |
| Écologique | 0,6× | 1× | 0,3× |
| Standard | 1× | 1× | 1× |
| Industrielle | 1,8× | 2× | 2,6× |

Les valeurs de base sont définies dans `machineConfig.ts`. Les recettes à plusieurs ingrédients sont déclaratives dans `recipeConfig.ts`.

## Tunnels

Un tunnel de sortie accepte les ressources d’un tapis et les transfère vers le tunnel d’entrée lié. Le transfert conserve les quantités, respecte la capacité du tunnel destinataire et alimente la statistique d’export une seule fois. Un tunnel d’entrée distribue ensuite une unité par tick au tapis placé devant lui.

## Ajouter un niveau

Ajouter sa définition dans `campaignConfig.ts`, son île et ses ressources dans `LevelConfig.ts`, puis déclarer les nouvelles machines, recettes et assets. Chaque nouvelle mécanique doit tester au minimum le déblocage, la conservation des ressources, le calcul de pollution et la reprise après sauvegarde.
