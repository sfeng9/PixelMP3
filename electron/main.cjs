const { app, BrowserWindow, shell, ipcMain } = require('electron');
const path = require('path');
const { createAuthServer, loadToken, saveToken, deleteToken, getValidToken } = require('./spotify-auth.cjs');

const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;
let mainWindow = null;
let authServer = null;

function createWindow() {
  const win = new BrowserWindow({
    width: 380,
    height: 620,
    minWidth: 320,
    minHeight: 500,
    titleBarStyle: 'hiddenInset',
    backgroundColor: '#2d3f2d',
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
    icon: path.join(__dirname, '../public/icon.png'),
  });

  if (isDev) {
    win.loadURL('http://localhost:5173');
    win.webContents.openDevTools({ mode: 'detach' });
  } else {
    win.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  win.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });

  mainWindow = win;
}

// Spotify: get auth URL and open in browser
ipcMain.handle('spotify-get-auth-url', (_, clientId) => {
  if (!clientId) return { error: 'Missing Spotify Client ID' };
  const userDataPath = app.getPath('userData');
  if (!authServer) {
    authServer = createAuthServer(mainWindow, clientId, (token) => {
      saveToken(userDataPath, token);
    });
  }
  const authUrl = authServer.getAuthUrl();
  shell.openExternal(authUrl);
  return { ok: true };
});

// Spotify: get current valid access token (from storage or refresh)
ipcMain.handle('spotify-get-token', async (_, clientId) => {
  if (!clientId) return { error: 'Missing Spotify Client ID' };
  const userDataPath = app.getPath('userData');
  const token = await getValidToken(userDataPath, clientId);
  return token ? { access_token: token } : { error: 'Not logged in' };
});

// Spotify: check if we have a stored token
ipcMain.handle('spotify-has-token', () => {
  const userDataPath = app.getPath('userData');
  const token = loadToken(userDataPath);
  return { hasToken: !!(token && token.access_token) };
});

// Spotify: log out (clear stored token)
ipcMain.handle('spotify-logout', () => {
  const userDataPath = app.getPath('userData');
  deleteToken(userDataPath);
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send('spotify-logged-out');
  }
  return { ok: true };
});

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  const userDataPath = app.getPath('userData');
  deleteToken(userDataPath); // Wipes the session when you close the app
  if (process.platform !== 'darwin') app.quit();
});
