# Construire Factstories pour ordinateur

Ce guide décrit la création d'une version installable de Factstories sur macOS, Windows et Linux. Le renderer React est compilé par Vite, puis Electron Forge emballe le jeu et produit l'installateur natif configuré dans `forge.config.cjs`.

## 1. Préparer le poste de build

Chaque installateur doit de préférence être produit sur son système cible : macOS pour le DMG, Windows pour Squirrel et Linux pour le paquet DEB.

1. Installer Git et Node.js 22.
2. Cloner le dépôt et ouvrir un terminal à sa racine.
3. Installer exactement les dépendances du lockfile :

   ```bash
   npm ci
   ```

4. Vérifier le projet avant tout packaging :

   ```bash
   npm run check
   ```

   Cette commande exécute ESLint, les tests Vitest, TypeScript et le build Vite. Ne distribuer aucun build si elle échoue.

5. Pour contrôler le jeu dans Electron pendant le développement :

   ```bash
   npm run desktop:dev
   ```

   Le script choisit automatiquement un port local disponible, démarre Vite, puis ouvre la fenêtre Electron. Il lance directement les points d'entrée JavaScript avec Node afin de fonctionner de la même manière sous macOS, Windows et Linux, sans dépendre des shims `.cmd` de Windows.

## 2. Choisir la version et l'architecture

Avant une release, mettre à jour `version` dans `package.json` selon SemVer, par exemple `0.2.0`. Le nom public, l'identifiant et les makers se trouvent dans `forge.config.cjs`. Les icônes sources sont dans `build/icons/`.

Sans option, Forge cible l'architecture du poste. Pour en choisir une :

```bash
npm run desktop:make -- --arch=x64
npm run desktop:make -- --arch=arm64
```

Forge accepte aussi `--arch=universal` sur macOS. Tester chaque architecture réellement distribuée.

## 3. Créer une application locale

Pour obtenir seulement l'application emballée, sans installateur :

```bash
npm run desktop:package
```

Le résultat apparaît dans `out/`, par exemple `out/Factstories-darwin-arm64/Factstories.app`. Cette étape sert à tester rapidement le bundle final. `desktop:make` la relance automatiquement avant de créer l'installateur.

## 4. Construire sur macOS

Prérequis : macOS et, pour une diffusion publique, Xcode ainsi qu'un compte Apple Developer.

1. Installer les dépendances et lancer `npm run check`.
2. Générer le DMG :

   ```bash
   npm run desktop:make
   ```

3. Récupérer `out/make/dmg/<architecture>/Factstories.dmg`.
4. Ouvrir le DMG, glisser Factstories dans Applications, puis lancer le jeu et tester une nouvelle partie ainsi que le chargement d'une sauvegarde.
5. Contrôler l'image avant publication :

   ```bash
   hdiutil verify out/make/dmg/arm64/Factstories.dmg
   ```

Le maker DMG ne fonctionne que sur macOS. Un build public doit être signé avec un certificat **Developer ID Application**, puis notarié par Apple. Forge utilise pour cela `packagerConfig.osxSign` et `packagerConfig.osxNotarize`. Conserver les identifiants Apple dans le trousseau ou dans les secrets de CI, jamais dans Git.

## 5. Construire sur Windows

Prérequis : Windows x64 ou ARM64. Visual Studio est également nécessaire lorsque la signature utilise `signtool.exe`.

1. Ouvrir PowerShell à la racine du dépôt.
2. Exécuter :

   ```powershell
   npm ci
   npm run check
   npm run desktop:make
   ```

3. Dans `out/make/squirrel.windows/<architecture>/`, récupérer :
   - `Factstories Setup.exe`, l'installateur à fournir au joueur ;
   - le paquet `.nupkg` et `RELEASES`, utiles pour de futures mises à jour automatiques.
4. Exécuter `Factstories Setup.exe`, vérifier la création de l'application, son icône, son lancement et sa désinstallation depuis les paramètres Windows.

Pour une diffusion publique, signer l'application et l'installateur avec un certificat Authenticode ou un service de signature compatible. Le mot de passe ou les jetons de signature doivent provenir de variables d'environnement ou des secrets de CI.

## 6. Construire sur Linux

La configuration actuelle produit un paquet `.deb`, destiné à Debian, Ubuntu et leurs dérivés.

1. Installer Node.js 22, puis les outils Debian requis. Sur Ubuntu :

   ```bash
   sudo apt update
   sudo apt install fakeroot dpkg
   ```

2. Depuis la racine du dépôt :

   ```bash
   npm ci
   npm run check
   npm run desktop:make
   ```

3. Récupérer le `.deb` dans `out/make/deb/<architecture>/`.
4. Installer et tester le paquet :

   ```bash
   sudo apt install ./out/make/deb/x64/*.deb
   ```

5. Vérifier le lancement depuis le menu des applications, l'icône, la sauvegarde et la suppression du paquet.

Un `.deb` ne couvre pas toutes les distributions Linux. Ajouter plus tard un maker AppImage, RPM ou Flatpak si ces plateformes doivent être officiellement prises en charge.

## 7. Contrôles avant publication

Pour chaque système et architecture :

- partir d'un checkout propre et utiliser `npm ci` ;
- confirmer que `npm run check` réussit ;
- installer l'artefact sur une machine propre ou une VM ;
- vérifier nouvelle partie, sauvegarde, reprise, audio, affichage plein écran et redimensionnement ;
- contrôler le nom, l'icône et le numéro de version ;
- signer macOS et Windows avant une diffusion publique ;
- calculer et publier une somme SHA-256 de chaque installateur ;
- conserver tous les artefacts d'une même version dans une release unique.

Les artefacts de `out/` sont ignorés par Git et doivent être régénérés à chaque release. Voir la documentation officielle sur le [cycle de build Electron Forge](https://www.electronforge.io/core-concepts/build-lifecycle), les [makers](https://www.electronforge.io/config/makers), les [icônes](https://www.electronforge.io/guides/create-and-add-icons) et la [signature du code Electron](https://www.electronjs.org/docs/latest/tutorial/code-signing).
