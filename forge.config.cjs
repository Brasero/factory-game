module.exports = {
  packagerConfig: {
    asar: true,
    executableName: "Factstories",
    appBundleId: "com.factstories.game",
    appCategoryType: "public.app-category.games",
    icon: "build/icons/icon",
    ignore: [
      /^\/(?:apps|packages|docs|\.github)(?:\/|$)/,
      /^\/(?:coverage|dist-ssr)(?:\/|$)/,
      /^\/(?:eslint\.config\.js|vite\.config\.ts|vitest\.config\.ts)$/,
      /^\/tsconfig(?:\.[^.]+)?\.json$/,
      /\.test\.[cm]?[jt]sx?$/
    ]
  },
  rebuildConfig: {},
  makers: [
    {
      name: "@electron-forge/maker-squirrel",
      config: {
        name: "factstories",
        setupIcon: "build/icons/icon.ico"
      }
    },
    {
      name: "@electron-forge/maker-dmg",
      config: {name: "Factstories"}
    },
    {
      name: "@electron-forge/maker-deb",
      config: {
        options: {
          name: "factstories",
          productName: "Factstories",
          genericName: "Factory game",
          categories: ["Game"],
          icon: "build/icons/icon.png"
        }
      }
    }
  ]
};
