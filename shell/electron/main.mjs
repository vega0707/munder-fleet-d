import { app, BrowserWindow, shell } from "electron";
import { spawn } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");
const BRIDGE_URL = process.env.MUNDER_BRIDGE_URL || "http://127.0.0.1:3927";
const PORT = process.env.MUNDER_BRIDGE_PORT || "3927";

let bridgeProc = null;

function startBridge() {
  bridgeProc = spawn(process.execPath, [path.join(ROOT, "bridge.mjs")], {
    cwd: ROOT,
    env: { ...process.env, MUNDER_BRIDGE_PORT: PORT },
    stdio: "inherit",
  });
}

async function waitBridge(timeoutMs = 15000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const res = await fetch(`${BRIDGE_URL}/health`);
      if (res.ok) return;
    } catch {
      // retry
    }
    await new Promise((r) => setTimeout(r, 200));
  }
  throw new Error("Munder bridge did not become ready");
}

async function createWindow() {
  const win = new BrowserWindow({
    width: 1280,
    height: 840,
    title: "Munder",
    backgroundColor: "#07110c",
    webPreferences: {
      preload: path.join(__dirname, "preload.cjs"),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  win.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: "deny" };
  });

  await win.loadURL(BRIDGE_URL);
}

app.whenReady().then(async () => {
  startBridge();
  await waitBridge();
  await createWindow();
});

app.on("window-all-closed", () => {
  if (bridgeProc && !bridgeProc.killed) bridgeProc.kill();
  if (process.platform !== "darwin") app.quit();
});

app.on("before-quit", () => {
  if (bridgeProc && !bridgeProc.killed) bridgeProc.kill();
});
