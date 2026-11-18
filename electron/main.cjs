const { app, BrowserWindow, WebContentsView, ipcMain, session } = require("electron");
const path = require("node:path");
const { URL } = require("node:url");

let mainWindow;
const isDev = !app.isPackaged;
const views = new Map();
let activeTabId = null;
let allowedHosts = new Set();

function hostAllowed(rawUrl) {
  try {
    const u = new URL(rawUrl);
    if (u.protocol !== "https:" && !(isDev && u.protocol === "http:" && u.hostname === "localhost")) return false;
    const host = u.hostname.toLowerCase();
    return [...allowedHosts].some(rule => host === rule || host.endsWith("." + rule));
  } catch { return false; }
}

function sendState() {
  if (!mainWindow || mainWindow.isDestroyed()) return;
  mainWindow.webContents.send("browser:tabs", {
    activeTabId,
    tabs: [...views.entries()].map(([id, item]) => ({ id, url: item.url, title: item.title }))
  });
}

function setActive(id) {
  if (!mainWindow || mainWindow.isDestroyed()) return;
  const item = id ? views.get(id) : null;
  if (id && !item) return;
  activeTabId = id || null;
  for (const value of views.values()) {
    try { mainWindow.contentView.removeChildView(value.view); } catch {}
  }
  if (item) {
    mainWindow.contentView.addChildView(item.view);
    if (item.bounds) item.view.setBounds(item.bounds);
  }
  sendState();
}

function createBrowserTab(rawUrl, requestedId) {
  if (!hostAllowed(rawUrl)) return { ok: false, reason: "Bu adres Park Dedeman izin listesinde değil." };
  const id = requestedId || `tab-${Date.now()}-${Math.random().toString(36).slice(2,8)}`;
  if (views.has(id)) { setActive(id); return { ok: true, id }; }

  const view = new WebContentsView({
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      webSecurity: true,
      partition: "persist:park-dedeman"
    }
  });
  const item = { view, url: rawUrl, title: new URL(rawUrl).hostname, bounds: { x: 0, y: 120, width: 1200, height: 700 } };
  views.set(id, item);

  view.webContents.setWindowOpenHandler(({ url }) => {
    if (hostAllowed(url)) {
      const newId = createBrowserTab(url);
      if (newId.ok) return { action: "deny" };
    }
    return { action: "deny" };
  });
  view.webContents.on("will-navigate", (event, url) => {
    if (!hostAllowed(url)) event.preventDefault();
  });
  view.webContents.on("will-redirect", (event, url) => {
    if (!hostAllowed(url)) event.preventDefault();
  });
  view.webContents.on("page-title-updated", (_event, title) => {
    item.title = title || item.title;
    sendState();
  });
  view.webContents.on("did-navigate", (_event, url) => {
    item.url = url;
    sendState();
  });
  view.webContents.on("did-navigate-in-page", (_event, url) => {
    item.url = url;
    sendState();
  });
  view.webContents.on("render-process-gone", () => {
    mainWindow?.webContents.send("browser:error", { id, message: "Sayfa işlemi beklenmedik şekilde durdu." });
  });

  setActive(id);
  view.webContents.loadURL(rawUrl);
  sendState();
  return { ok: true, id };
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1440, height: 920, minWidth: 980, minHeight: 650,
    title: "Park Dedeman Browser", backgroundColor: "#101114",
    autoHideMenuBar: true, kiosk: !isDev,
    webPreferences: {
      preload: path.join(__dirname, "preload.cjs"),
      contextIsolation: true, nodeIntegration: false, sandbox: true, webSecurity: true
    }
  });
  mainWindow.webContents.setWindowOpenHandler(() => ({ action: "deny" }));
  mainWindow.webContents.on("will-navigate", (event, url) => {
    if (isDev && url.startsWith("http://localhost:")) return;
    if (url.startsWith("file://")) return;
    event.preventDefault();
  });
  mainWindow.on("resize", () => mainWindow?.webContents.send("browser:resize"));
  mainWindow.on("maximize", () => mainWindow?.webContents.send("browser:resize"));
  mainWindow.on("unmaximize", () => mainWindow?.webContents.send("browser:resize"));
  mainWindow.on("closed", () => { mainWindow = null; for (const x of views.values()) x.view.webContents.close(); views.clear(); });
  if (isDev) mainWindow.loadURL("http://localhost:5173");
  else mainWindow.loadFile(path.join(__dirname, "..", "dist", "index.html"));
}

ipcMain.handle("browser:set-allowlist", (_event, domains) => {
  if (!Array.isArray(domains)) return false;
  allowedHosts = new Set(domains.filter(x => typeof x === "string" && /^[a-z0-9.-]+$/i.test(x)).map(x => x.toLowerCase()));
  for (const [id, item] of views) {
    if (!hostAllowed(item.url)) closeTab(id);
  }
  return true;
});
ipcMain.handle("browser:open", (_event, url, id) => createBrowserTab(url, id));
ipcMain.handle("browser:activate", (_event, id) => { setActive(id); return true; });
ipcMain.handle("browser:hide", () => { setActive(null); return true; });
ipcMain.handle("browser:close", (_event, id) => { closeTab(id); return true; });
ipcMain.handle("browser:bounds", (_event, rect) => {
  if (!rect || ![rect.x,rect.y,rect.width,rect.height].every(Number.isFinite)) return false;
  const item = views.get(activeTabId);
  if (item) {
    const safe = { x: Math.max(0, Math.round(rect.x)), y: Math.max(0, Math.round(rect.y)), width: Math.max(0, Math.round(rect.width)), height: Math.max(0, Math.round(rect.height)) };
    item.bounds = safe;
    item.view.setBounds(safe);
  }
  return true;
});
ipcMain.handle("browser:back", () => { const v=views.get(activeTabId)?.view.webContents; if(v?.canGoBack())v.goBack(); });
ipcMain.handle("browser:forward", () => { const v=views.get(activeTabId)?.view.webContents; if(v?.canGoForward())v.goForward(); });
ipcMain.handle("browser:reload", () => views.get(activeTabId)?.view.webContents.reload());
function closeTab(id) {
  const item=views.get(id); if(!item)return;
  if(mainWindow && !mainWindow.isDestroyed())mainWindow.contentView.removeChildView(item.view);
  item.view.webContents.close(); views.delete(id);
  if(activeTabId===id){activeTabId=views.keys().next().value||null;if(activeTabId)setActive(activeTabId);}
  sendState();
}

app.whenReady().then(() => {
  session.defaultSession.setPermissionRequestHandler((_wc, _permission, callback) => callback(false));
  createWindow();
  app.on("activate", () => { if(BrowserWindow.getAllWindows().length===0)createWindow(); });
});
app.on("window-all-closed", () => { if(process.platform!=="darwin")app.quit(); });
