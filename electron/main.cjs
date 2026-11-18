const { app, BrowserWindow, shell } = require("electron");
const path = require("node:path");

let mainWindow;
const isDev = !app.isPackaged;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1440,
    height: 920,
    minWidth: 1080,
    minHeight: 700,
    title: "Park Dedeman Browser",
    backgroundColor: "#101114",
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, "preload.cjs"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      webSecurity: true
    }
  });

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    // The web MVP must not launch arbitrary external browser windows.
    // The secured embedded allowlist browser is a separate implementation phase.
    return { action: "deny" };
  });

  mainWindow.webContents.on("will-navigate", (event, targetUrl) => {
    const currentUrl = mainWindow.webContents.getURL();
    if (isDev && targetUrl.startsWith("http://localhost:")) return;
    if (targetUrl === currentUrl || targetUrl.startsWith("file://")) return;
    event.preventDefault();
  });

  if (isDev) mainWindow.loadURL("http://localhost:5173");
  else mainWindow.loadFile(path.join(__dirname, "..", "dist", "index.html"));
}

app.whenReady().then(() => {
  createWindow();
  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
