const { contextBridge } = require("electron");

contextBridge.exposeInMainWorld("parkDedemanDesktop", Object.freeze({
  isDesktop: true,
  version: process.versions.electron
}));
