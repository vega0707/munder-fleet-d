// Preload kept minimal — local shell trusts loopback bridge only.
const { contextBridge } = require("electron");

contextBridge.exposeInMainWorld("munderShell", {
  platform: process.platform,
  local: true,
});
