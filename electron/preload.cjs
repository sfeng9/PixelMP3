const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  platform: process.platform,
  spotify: {
    getAuthUrl: (clientId) => ipcRenderer.invoke('spotify-get-auth-url', clientId),
    getToken: (clientId) => ipcRenderer.invoke('spotify-get-token', clientId),
    hasToken: () => ipcRenderer.invoke('spotify-has-token'),
    onToken: (fn) => {
      const sub = (_, token) => fn(token);
      ipcRenderer.on('spotify-token', sub);
      return () => ipcRenderer.removeListener('spotify-token', sub);
    },
    onAuthError: (fn) => {
      const sub = (_, message) => fn(message);
      ipcRenderer.on('spotify-auth-error', sub);
      return () => ipcRenderer.removeListener('spotify-auth-error', sub);
    },
    logout: () => ipcRenderer.invoke('spotify-logout'),
    onLoggedOut: (fn) => {
      const sub = () => fn();
      ipcRenderer.on('spotify-logged-out', sub);
      return () => ipcRenderer.removeListener('spotify-logged-out', sub);
    },
  },
});
