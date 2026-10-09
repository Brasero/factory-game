# Lot 3 — Stratégies de production et écologie

## Recettes alternatives

Les recettes de départ et leurs cadences ne changent pas. Les trois alternatives se débloquent avec les îles 2 et 3, dans les machines existantes. Aucun bâtiment supplémentaire n’est obligatoire.

Valeurs pour une machine standard ; les variantes conservent leurs facteurs de vitesse, rendement et émissions.

| Recette | Déblocage | Ingrédients par cycle | Sorties | Durée | Émissions par cycle | Compromis |
| --- | --- | --- | --- | --- | --- | --- |
| Fer refroidi à l’eau | Île 2, fonderie | 1 minerai de fer + 2 eau | 1 lingot de fer | 3 s | 0,8 | Moins d’émissions que la fonte classique (2), mais plus lent et raccordement liquide nécessaire |
| Acier direct | Île 2, fonderie | 2 minerai de fer + 2 charbon | 1 lingot d’acier | 4 s | 3,2 | Évite une étape de transformation et le transport des lingots de fer, mais consomme deux fois plus de minerai et de charbon |
| Étirage économe | Île 3, machine de production | 1 cuivre | 3 fils | 3,6 s | 2,25 | Rendement matière supérieur, mais débit inférieur aux 2 fils en 1,8 s de la recette classique |

Le panneau compare les quantités réellement produites, la durée, le débit et les émissions par cycle et seconde. La réduction de finalisation se cumule avec le facteur de recette et la variante. Les émissions réduites sont celles effectivement générées ; les budgets écologiques suivent ces émissions sans soustraire la dépollution.

Changer de recette remet le cycle à zéro sans supprimer les ingrédients ni les produits déjà présents. Les ingrédients inutilisés restent dans leur buffer, disponibles si la recette est resélectionnée. Une île finalisée refuse les changements de recette et de régulation ; la pause individuelle et les filtres des tunnels restent disponibles.

## Régulation des flux

Sans outil de construction sélectionné, cliquer sur un tapis ou un coffre ouvre ses réglages. Les outils essentiels sont accessibles dès la première île. Les splitters intelligents regroupent filtres et régulation dans leur panneau existant.

- **Limite de sortie** : de 0,1 à 10 unités par seconde de simulation, par paliers, par tapis ou routeur, ou sans limite. Le limiteur plafonne le total des sorties, toutes ressources et tous paquets confondus. Il n’accélère pas le tapis. Le crédit fractionnaire se conserve entre ticks et dans la sauvegarde ; une seule unité peut être prête après une longue saturation, sans rafale de rattrapage. Modifier la limite remet le crédit à zéro ; les produits restent sur place.
- **Réserve du coffre** : entre 0 et sa capacité totale, conservée séparément pour chaque ressource. Seul le surplus sort vers tapis, machines ou tuyaux. Un seuil excessif peut saturer le coffre, dont la capacité reste commune aux ressources. Les points d’expédition suivent leurs réservations de commande et n’utilisent pas ce seuil.
- **Priorité du splitter** : face, gauche ou droite, directions relatives à son orientation. Les filtres restent obligatoires. La sortie prioritaire est servie si elle accepte le produit et possède de la place ; sinon les autres sont parcourues selon le curseur circulaire habituel. La priorité est stricte : une branche toujours disponible peut affamer les autres. Le mode équilibré reste le défaut. Le merger garde sa rotation équitable des entrées.

Les jonctions implicites restent bloquées et les transferts en deux phases empêchent le franchissement de plusieurs tapis dans un tick. Les structures passent toujours par les commandes du moteur pour invalider la topologie. Une rotation conserve les paramètres de régulation. Les anciennes sauvegardes démarrent sans limite, avec seuil nul et répartition équilibrée.

## Écologie et restauration

Les différences d’espace et de terrain du lot 1 sont conservées : aucune régénération des sauvegardes ni déplacement des usines.

Les six îles contribuent à une seule absorption globale, y compris avant leur découverte. Les contributions initiales, par tick, sont respectivement **0,005 / 0,003 / 0,004 / 0,002 / 0,004 / 0,002**. Leur total conserve exactement l’équilibre initial de **0,02 par tick**. Il n’existe pas de second prélèvement par île : le total est soustrait une fois à la jauge globale, sans diminuer les émissions historiques.

Deux contrats facultatifs de restauration apparaissent dans le carnet existant :

| Contrat | Déblocage | Livraison consommée | Bénéfice permanent |
| --- | --- | --- | --- |
| Restaurer les berges | Île 2 | 20 lingots de fer + 30 eau | Île 1 : +0,003 absorption/tick (+0,03/s) |
| Restaurer le bosquet | Île 3 | 10 lingots d’acier + 40 eau | Île 3 : +0,003 absorption/tick (+0,03/s) |

Les coûts et bénéfices sont annoncés avant acceptation. Les matériaux arrivent par tapis, l’eau par tuyau au point d’expédition. Plusieurs points peuvent partager une restauration. Les entrées sont plafonnées au besoin restant global et à la capacité commune du point. Les produits réservés, y compris l’eau, ne ressortent pas avant consommation ou libération.

L’annulation conserve les stocks : un tapis restitue les solides et un tuyau orienté vers l’extérieur restitue l’eau. Après réussite, seul un éventuel surplus reste. Le contrat terminé ne peut pas être repris ; son état sauvegardé constitue l’unique source du bonus, sans versement de matériaux de construction et sans cumul infini. Les deux restaurations portent l’absorption globale à 0,026/tick. Le bonus commence au cycle suivant la réussite, se conserve après finalisation et ne s’applique pas rétroactivement aux budgets des défis.

Le HUD affiche l’absorption globale et celle de l’île active, le bilan détaille chaque contribution et une notification annonce la restauration. La restauration ne détruit aucun bâtiment et n’ajoute aucune surface constructible.

## Validation et essais

Tests déterministes : limites fractionnaires, transferts partiels, saturation, crédit commun aux paquets, mouvement en deux phases, priorité et filtres, inversion des tableaux, réserves solides/liquides, commandes invalides, rotation avec topologie en cache, sauvegarde/reprise, recettes et déblocages, conservation lors d’un changement, réservation et restitution d’eau, restauration répartie, consommation unique et absorption sans double comptage.

Les chiffres sont une première proposition d’équilibrage. Les essais joueurs restent à faire : intérêt des circuits alternatifs, risque de famine d’une sortie secondaire, lisibilité des réserves et utilité des restaurations sur un parcours complet.

Validation Node 22 : `npm run check` et `npm test -- --sequence.shuffle --sequence.seed=42`, **310 tests réussis**, deux benchmarks opt-in exclus. Contrôle visuel des panneaux sur une scène séparée de la sauvegarde de campagne.
