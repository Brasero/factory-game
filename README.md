# Jeu vidéo – Factory Type

## 🎮 Présentation

Ce projet est un **jeu de gestion / factory game** inspiré de titres comme *Factorio* ou *Satisfactory*, développé principalement en **React + TypeScript**.

Le joueur exploite des ressources (fer, charbon, eau…), construit des machines, automatise des chaînes de production et optimise les flux via convoyeurs, séparateurs et groupeurs.

L’objectif est de poser des bases **simples, modulaires et évolutives** pour un jeu de simulation industrielle jouable dans un navigateur.

---

## 🧠 Concepts clés

* Monde composé de **nœuds de ressources**
* Extraction automatique (miners)
* Transformation des ressources (machines)
* Chaînes de production automatisées
* Tick système (boucle de simulation)
* Séparation claire entre **logique métier** et **UI**

---

### 🏗️ Architecture

- Le projet est organisé en monorepo, avec une séparation claire entre :

- une application web (UI, rendu, interaction)

- un moteur de jeu indépendant (logique métier pure)

```
factory-game/
├── apps/
│   └── web/
│       └── src/
│           ├── assets/      # Assets statiques (images, icônes, styles)
│           ├── game/        # Adaptateurs côté app (liaison moteur ↔ UI)
│           ├── render/      # Rendu du monde de jeu (canvas, scène, visualisation)
│           ├── store/       # État global, tick, synchronisation React
│           ├── ui/          # Composants UI (HUD, panels, menus)
│           ├── App.tsx      # Composant racine
│           ├── main.tsx     # Point d’entrée React
│           └── *.css        # Styles globaux
│
├── packages/
│   └── engine/
│       ├── core/           # Mécaniques centrales (tick, règles globales)
│       ├── models/         # Modèles de données (World, Node, Machine, Resource)
│       ├── systems/        # Systèmes exécutés à chaque tick (production, flux…)
│       └── world/          # Création et gestion de l’état du monde

```


### Principes

* ❌ Pas de logique métier dans les composants React
* ✅ Les `systems` modifient le monde à chaque tick
* ✅ Le `World` est la source de vérité
* ✅ React sert uniquement à l’affichage et aux interactions

---

## ⏱️ Tick System

Le jeu fonctionne sur un **tick global** (ex: 1 tick = 1 seconde).

À chaque tick :

1. Les systèmes sont exécutés dans un ordre défini
2. Les ressources sont produites / consommées
3. L’état du monde est mis à jour
4. L’UI se re-render automatiquement

---

## ⚙️ Technologies utilisées

* **React**
* **TypeScript**
* **Vite** (ou équivalent)
* **Redux Toolkit** pour les commandes et `useSyncExternalStore` pour les instantanés du monde

---

## 🚀 Lancer le projet

```bash
npm install
npm run dev
```

Puis ouvrir :

```
http://localhost:5173
```

---

## 🧪 État du projet

* [x] Création du monde
* [x] Tick system
* [x] Production de ressources
* [x] Convoyeurs (première implémentation)
* [x] UI de placement des machines
* [ ] Sauvegarde / chargement

---

## 📌 Objectifs à moyen terme

* Visualisation graphique des flux
* Éditeur de carte
* Optimisation des performances
* Système de recherche / upgrades

---

## 👤 Auteur

Projet développé par **Brandon Ricci**.

---

## 📄 Licence

Projet personnel – libre d’expérimentation.

## Vérifications et plan technique

`npm run check` exécute le lint, les tests et le build. `npm test` lance les tests une fois ; `npm run test:watch` les relance pendant le développement.

Voir [le plan de stabilisation et de performances](docs/stabilisation.md) pour la couverture actuelle, ses limites et les prochaines étapes.
