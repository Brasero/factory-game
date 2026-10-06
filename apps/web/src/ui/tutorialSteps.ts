import type {SelectedItem} from "@engine/api/types.ts";

export type TutorialSequenceId = "basics" | "level-2" | "level-3";
export type TutorialStep = {
  eyebrow: string; title: string; description: string; tip?: string; target?: string;
  expectedSelection?: SelectedItem; expectedTool?: "build" | "destroy";
};

const basics: TutorialStep[] = [
  {eyebrow: "Bienvenue dans Factstories", title: "Construis ta première usine", description: "Extrais le fer, transforme-le en lingots et livre-les au tunnel de sortie pour terminer la première île.", tip: "Les nouveaux systèmes seront expliqués au moment où tu les débloqueras."},
  {eyebrow: "Explorer", title: "Déplace-toi sur la carte", description: "Maintiens le clic gauche sur une zone vide pour déplacer la caméra. Utilise la molette pour zoomer.", tip: "Un clic droit annule l’outil sélectionné."},
  {eyebrow: "Construction", title: "Le menu de construction", description: "Appuie sur A ou utilise le bouton Construction du HUD pour choisir un bâtiment. La construction active reste visible lorsque le menu est fermé.", target: "build-menu"},
  {eyebrow: "Économie", title: "Gère tes matériaux de construction", description: "Chaque bâtiment, tapis ou tuyau consomme des matériaux. Ton stock est affiché en haut de l’écran et le coût de l’élément choisi apparaît dans le HUD de construction.", tip: "Une pose est refusée si ton stock est insuffisant. La démolition rembourse 75 % du coût de la construction.", target: "construction-materials"},
  {eyebrow: "Extraction", title: "Le mineur", description: "Pose un mineur sur un gisement. Il extrait automatiquement la ressource présente sous lui.", target: "miner", expectedSelection: "miner"},
  {eyebrow: "Transport", title: "Les tapis roulants", description: "Clique ou maintiens le clic gauche pour tracer une ligne. R tourne la direction dans le sens horaire et Maj + R dans l’autre sens. Pendant un tracé avec un virage, R inverse l’angle du coude.", target: "conveyor", expectedSelection: "conveyor"},
  {eyebrow: "Réseau logistique", title: "Splitter et merger", description: "Les tapis ordinaires ne créent pas de jonction. Le splitter répartit un flux et le merger rassemble plusieurs entrées.", tip: "Le splitter intelligent permet de filtrer chaque sortie, dont une règle pour toute ressource non filtrée. Ces pièces se posent directement sur un tapis existant."},
  {eyebrow: "Transformation", title: "Choisis une recette", description: "Une machine de fabrication est posée sans recette. Clique dessus pour choisir sa recette, consulter ses buffers ou la mettre en pause.", target: "iron-smelter", expectedSelection: "iron-smelter"},
  {eyebrow: "Stockage", title: "Le coffre", description: "Le coffre stocke les objets reçus. Une machine adjacente peut prendre ses ingrédients et un tapis orienté vers l’extérieur peut les extraire.", target: "storage", expectedSelection: "storage"},
  {eyebrow: "Modifier l’usine", title: "Détruis rapidement", description: "Active la démolition puis clique ou glisse sur plusieurs constructions. La caméra reste verrouillée pendant cette opération.", target: "destroy", expectedTool: "destroy"},
  {eyebrow: "Progression", title: "Objectifs et tunnels", description: "L’objectif courant apparaît en haut. Relie ta production au tunnel de sortie : son contenu sera disponible sur l’île suivante après la validation du niveau.", tip: "Tu peux finaliser une île ou continuer à l’améliorer avant de passer à la suite.", target: "campaign-objective"},
  {eyebrow: "Prêt à construire", title: "Lance ta production", description: "Mine du fer, sélectionne la recette de lingot dans la fonderie et exporte la quantité demandée.", tip: "Échap ouvre le menu et permet de revoir le tutoriel."}
];

const level2: TutorialStep[] = [
  {eyebrow: "Niveau 2 débloqué", title: "Le réseau d’eau", description: "La pompe à eau et les tuyaux sont maintenant disponibles. L’eau circule exclusivement dans les tuyaux et ne peut jamais emprunter un tapis."},
  {eyebrow: "Nouvelles machines", title: "Choisis une variante", description: "Les variantes Écologique et Industrielle sont maintenant disponibles. Sélectionne une machine dans le menu de construction, puis compare les variantes dans l’encart affiché au-dessus de la construction active.", tip: "Écologique ralentit la cadence et réduit fortement la pollution. Industrielle produit plus et plus vite, mais pollue beaucoup plus.", target: "machine-variants"},
  {eyebrow: "Recycleur débloqué", title: "Transforme tes surplus en constructions", description: "Le recycleur accepte n’importe quelle ressource depuis un tapis ou un coffre et la convertit directement en matériaux de construction. Utilise-le pour valoriser un surplus et prolonger le développement de ton usine.", tip: "Pose le recycleur, clique dessus et sélectionne la recette Recyclage. Sa variante modifie sa cadence, comme pour les autres machines.", target: "recycler", expectedSelection: "recycler"},
  {eyebrow: "Extraction liquide", title: "La pompe à eau", description: "Pose la pompe sur une case d’eau. Sa sortie se trouve à droite : commence ton réseau de tuyaux sur cette case.", target: "water-pump", expectedSelection: "water-pump"},
  {eyebrow: "Transport liquide", title: "Les tuyaux", description: "Trace les tuyaux comme les tapis et tourne leur direction avec R ou Maj + R. Pendant un tracé avec un virage, R inverse l’angle du coude. Une prévisualisation montre les raccords avant la pose.", tip: "Le témoin coloré indique qu’une conduite contient de l’eau.", target: "pipe", expectedSelection: "pipe"},
  {eyebrow: "Pollution", title: "Équilibre production et environnement", description: "Chaque cycle de machine augmente la pollution globale. Les variantes industrielles produisent vite et polluent davantage ; les variantes écologiques favorisent la récupération naturelle.", tip: "La campagne se termine si la jauge mise en évidence atteint sa limite.", target: "campaign-pollution"},
  {eyebrow: "Dépollution", title: "Le boiler", description: "Choisis sa recette de dépollution, puis alimente-le en eau par un tuyau. Chaque cycle consomme une unité d’eau et réduit la pollution. Une grande usine peut nécessiter plusieurs boilers.", target: "boiler", expectedSelection: "boiler"},
  {eyebrow: "Pilotage", title: "Adapte la cadence", description: "Clique sur une machine pour la mettre en pause lorsque la pollution monte trop vite. Le bouton général mis en évidence suspend ou relance toute la simulation. Tu peux continuer à piloter les machines d’un niveau finalisé.", target: "pause"}
];

const level3: TutorialStep[] = [
  {eyebrow: "Niveau 3 débloqué", title: "Production avancée", description: "Le cuivre et l’assembleuse sont disponibles. Une même machine peut proposer plusieurs recettes et plusieurs cadences."},
  {eyebrow: "Aménagement", title: "Libère le terrain", description: "Le mode démolition peut maintenant retirer les arbres et les rochers. Clique ou glisse sur le décor pour dégager rapidement une zone de construction.", target: "destroy", expectedTool: "destroy"},
  {eyebrow: "Assemblage", title: "Plusieurs ingrédients", description: "La recette de circuit demande plusieurs ressources. Chaque ingrédient dispose de son propre buffer de 100 unités dans la machine.", target: "assembler", expectedSelection: "assembler"},
  {eyebrow: "Objectif final", title: "Optimise l’archipel", description: "Réutilise les productions exportées des îles précédentes, surveille la pollution globale et termine la campagne le plus vite possible avec une empreinte minimale."}
];

export const tutorialSequences: Record<TutorialSequenceId, TutorialStep[]> = {basics, "level-2": level2, "level-3": level3};
export const tutorialSteps = basics;
