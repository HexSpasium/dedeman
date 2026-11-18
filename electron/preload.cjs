const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("parkDedemanDesktop", Object.freeze({
  isDesktop: true,
  version: process.versions.electron,
  setAllowlist: domains => ipcRenderer.invoke("browser:set-allowlist", domains),
  openTab: (url, id) => ipcRenderer.invoke("browser:open", url, id),
  activateTab: id => ipcRenderer.invoke("browser:activate", id),
  hideBrowser: () => ipcRenderer.invoke("browser:hide"),
  closeTab: id => ipcRenderer.invoke("browser:close", id),
  setBrowserBounds: rect => ipcRenderer.invoke("browser:bounds", rect),
  back: () => ipcRenderer.invoke("browser:back"),
  forward: () => ipcRenderer.invoke("browser:forward"),
  reload: () => ipcRenderer.invoke("browser:reload"),
  onTabs: callback => { const fn=(_event,state)=>callback(state); ipcRenderer.on("browser:tabs",fn); return ()=>ipcRenderer.removeListener("browser:tabs",fn); },
  onResize: callback => { const fn=()=>callback(); ipcRenderer.on("browser:resize",fn); return ()=>ipcRenderer.removeListener("browser:resize",fn); },
  onError: callback => { const fn=(_event,error)=>callback(error); ipcRenderer.on("browser:error",fn); return ()=>ipcRenderer.removeListener("browser:error",fn); }
}));
