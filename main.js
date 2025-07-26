const { app, BrowserWindow, dialog } = require("electron");
const path = require("path");
const spawn = require("cross-spawn");

let n8nProcess;

function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, "preload.js"),
    },
  });

  win.loadFile("loading.html");

  // Spin up n8n
  n8nProcess = spawn("npx", ["n8n"], { stdio: ["ignore", "pipe", "pipe"] });

  n8nProcess.stdout.on("data", (data) => {
    const text = data.toString();
    win.webContents.send("n8n-log", text);
    // Detect ready message; tweak if n8n’s output changes
    if (text.includes("Editor is now accessible via")) {
      win.loadURL("http://localhost:5678");
    }
    console.log("n8n:", text.trim());
  });

  n8nProcess.stderr.on("data", (data) => {
    const text = data.toString();
    win.webContents.send("n8n-log", `ERROR: ${text}`);
    console.error("n8n error:", text);
  });

  n8nProcess.on("exit", (code) => {
    if (code !== 0) {
      dialog.showErrorBox("n8n exited", `Process exited with code ${code}`);
    }
    app.quit();
  });

  win.on("closed", () => {
    if (n8nProcess && !n8nProcess.killed) {
      n8nProcess.kill();
    }
  });
}

app.whenReady().then(createWindow);

// Mac cleanup
app.on("window-all-closed", () => app.quit());
