const {app, BrowserWindow, shell} = require("electron");
const path = require("node:path");

const developmentUrl = process.env.VITE_DEV_SERVER_URL;

function createWindow() {
  const window = new BrowserWindow({
    title: "Factstories",
    width: 1440,
    height: 900,
    minWidth: 960,
    minHeight: 640,
    icon: path.join(__dirname, "..", "build", "icons", "icon.png"),
    backgroundColor: "#111c28",
    show: false,
    autoHideMenuBar: true,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true
    }
  });

  window.once("ready-to-show", () => window.show());
  window.webContents.setWindowOpenHandler(({url}) => {
    void shell.openExternal(url);
    return {action: "deny"};
  });
  window.webContents.on("will-navigate", (event, url) => {
    const currentUrl = window.webContents.getURL();
    if (url === currentUrl || (developmentUrl && url.startsWith(developmentUrl))) return;
    event.preventDefault();
    void shell.openExternal(url);
  });

  if (developmentUrl) {
    void window.loadURL(developmentUrl);
  } else {
    void window.loadFile(path.join(__dirname, "..", "dist", "index.html"));
  }
}

app.setAppUserModelId("com.factstories.game");
app.whenReady().then(() => {
  createWindow();
  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
