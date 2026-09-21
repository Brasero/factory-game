import type {SelectedItem} from "@engine/api/types.ts";

export type TutorialStep = {
  eyebrow: string;
  title: string;
  description: string;
  tip?: string;
  target?: string;
  expectedSelection?: SelectedItem;
  expectedTool?: "build" | "destroy";
};

export const tutorialSteps: TutorialStep[] = [
  {
    eyebrow: "Bienvenue dans Factstories",
    title: "Construis une chaîne de production",
    description: "Extrais les ressources de chaque île, transporte-les et transforme-les pour atteindre son objectif. Termine les trois niveaux rapidement sans dépasser la limite de pollution.",
    tip: "Le tutoriel reste accessible à tout moment depuis le menu de pause."
  },
  {
    eyebrow: "Campagne",
    title: "Objectifs et pollution",
    description: "La progression du niveau et la pollution globale sont affichées en haut. Une machine pollue lorsqu’elle termine un cycle : les versions industrielles vont plus vite, tandis que les versions écologiques peuvent laisser la nature absorber progressivement la pollution.",
    tip: "Clique sur une machine pour la mettre en pause, même sur une île finalisée, et laisse la pollution redescendre. Si la jauge atteint sa limite, la campagne se termine."
  },
  {
    eyebrow: "Explorer",
    title: "Déplace-toi sur la carte",
    description: "Maintiens le clic gauche sur une zone vide pour déplacer la caméra. Utilise la molette pour zoomer ou dézoomer.",
    tip: "Un clic droit annule toujours l’outil sélectionné."
  },
  {
    eyebrow: "Extraction",
    title: "Le mineur",
    description: "Sélectionne le mineur, puis pose-le sur un gisement de fer ou de charbon. Il extrait automatiquement la ressource présente sous lui.",
    target: "miner",
    expectedSelection: "miner"
  },
  {
    eyebrow: "Extraction",
    title: "La pompe à eau",
    description: "La pompe se place sur une case d’eau. Comme un mineur, elle produit en continu et envoie sa ressource vers une sortie adjacente.",
    target: "water-pump",
    expectedSelection: "water-pump"
  },
  {
    eyebrow: "Transport",
    title: "Les tapis roulants",
    description: "Clique ou trace une ligne en maintenant le clic gauche pour relier tes bâtiments. Les flèches indiquent le sens de circulation.",
    tip: "R tourne le tapis dans le sens horaire. Maj + R le tourne dans l’autre sens.",
    target: "conveyor",
    expectedSelection: "conveyor"
  },
  {
    eyebrow: "Réseau logistique",
    title: "Le splitter",
    description: "Le splitter reçoit les ressources par l’arrière et les répartit entre ses trois sorties. Tourne-le avec R ou Maj + R avant de le poser.",
    target: "splitter",
    expectedSelection: "splitter"
  },
  {
    eyebrow: "Réseau logistique",
    title: "Le merger",
    description: "Le merger rassemble jusqu’à trois lignes vers une seule sortie. Les jonctions de tapis ordinaires restent volontairement bloquées : utilise ce bâtiment pour fusionner des flux.",
    target: "merger",
    expectedSelection: "merger"
  },
  {
    eyebrow: "Transformation",
    title: "La fonderie",
    description: "Place une fonderie près d’un coffre contenant du fer, ou alimente-la avec un tapis. Elle transforme le minerai de fer en lingots.",
    target: "iron-smelter",
    expectedSelection: "iron-smelter"
  },
  {
    eyebrow: "Stockage",
    title: "Le coffre",
    description: "Le coffre stocke ce qu’il reçoit. Une machine adjacente peut y prendre ses ingrédients et un tapis orienté vers l’extérieur peut en extraire les ressources.",
    target: "storage",
    expectedSelection: "storage"
  },
  {
    eyebrow: "Modifier l’usine",
    title: "Le mode destruction",
    description: "Active le mode destruction puis clique sur un bâtiment ou un tapis pour le retirer. Clique de nouveau sur le bouton pour revenir à la construction.",
    target: "destroy",
    expectedTool: "destroy"
  },
  {
    eyebrow: "Contrôle du temps",
    title: "Mettre la simulation en pause",
    description: "Le bouton lecture/pause arrête la production sans bloquer la construction. Le compteur à côté indique le temps écoulé dans la simulation.",
    target: "pause"
  },
  {
    eyebrow: "Prêt à construire",
    title: "Crée ta première usine",
    description: "Commence par un mineur, transporte le fer vers une fonderie, puis dirige les lingots vers le tunnel de sortie. Ils seront disponibles sur l’île suivante.",
    tip: "Échap ouvre le menu. Tu pourras relancer ce tutoriel quand tu veux."
  }
];
