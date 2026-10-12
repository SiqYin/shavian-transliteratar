/* Shavian Transliteratar — Windows desktop shell (Electron).
 * Loads the exact same web app over file://, so the responsive desktop
 * layout applies and language detection treats it as an installed app. */
"use strict";
const { app, BrowserWindow, Menu, shell } = require("electron");
const path = require("path");

function createWindow() {
  const win = new BrowserWindow({
    width: 1280,
    height: 860,
    minWidth: 980,
    minHeight: 620,
    autoHideMenuBar: true,
    backgroundColor: "#fbfaf6",
    icon: path.join(__dirname, "icon-256.png"),
    show: false
  });

  win.once("ready-to-show", () => win.show());
  win.loadFile(path.join(__dirname, "index.html"));

  // keep external links in the user's browser
  win.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith("http")) { shell.openExternal(url); }
    return { action: "deny" };
  });
}

// quiet desktop-app menu
const menu = Menu.buildFromTemplate([
  {
    label: "Shavian Transliteratar",
    submenu: [
      { role: "about" },
      { type: "separator" },
      { role: "quit" }
    ]
  },
  { role: "editMenu" },
  { role: "viewMenu" },
  { role: "windowMenu" }
]);
Menu.setApplicationMenu(menu);

app.whenReady().then(() => {
  createWindow();
  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) { createWindow(); }
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") { app.quit(); }
});
