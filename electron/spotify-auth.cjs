const http = require('http');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const { URL } = require('url');

const REDIRECT_PORT = 8888;
const REDIRECT_URI = `http://127.0.0.1:${REDIRECT_PORT}/callback`;
const TOKEN_FILE = 'spotify-token.json';
const SPOTIFY_AUTH_URL = 'https://accounts.spotify.com/authorize';
const SPOTIFY_TOKEN_URL = 'https://accounts.spotify.com/api/token';
const SCOPES = [
  'user-read-playback-state',
  'user-modify-playback-state',
  'user-read-currently-playing',
  'user-read-private',
  'playlist-read-private',
  'playlist-read-collaborative',
  'streaming',
].join(' ');

function generatePKCE() {
  const code_verifier = crypto.randomBytes(32).toString('base64url');
  const code_challenge = crypto.createHash('sha256').update(code_verifier).digest('base64url');
  const state = crypto.randomBytes(16).toString('hex');
  return { code_verifier, code_challenge, state };
}

function getAuthUrl(clientId, codeChallenge, state) {
  const params = new URLSearchParams({
    client_id: clientId,
    response_type: 'code',
    redirect_uri: REDIRECT_URI,
    scope: SCOPES,
    code_challenge_method: 'S256',
    code_challenge: codeChallenge,
    state,
  });
  return `${SPOTIFY_AUTH_URL}?${params}`;
}

async function exchangeCodeForToken(clientId, code, codeVerifier, redirectUri) {
  const body = new URLSearchParams({
    grant_type: 'authorization_code',
    code,
    redirect_uri: redirectUri,
    code_verifier: codeVerifier,
    client_id: clientId,
  });
  const res = await fetch(SPOTIFY_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString(),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Token exchange failed: ${res.status} ${text}`);
  }
  return res.json();
}

function createAuthServer(mainWindow, clientId, onToken) {
  let pending = null; // { code_verifier, state }

  const server = http.createServer(async (req, res) => {
    const url = new URL(req.url || '', `http://127.0.0.1:${REDIRECT_PORT}`);
    if (url.pathname !== '/callback' || !pending) {
      res.writeHead(404);
      res.end('Not found');
      return;
    }
    const code = url.searchParams.get('code');
    const state = url.searchParams.get('state');
    if (!code || state !== pending.state) {
      res.writeHead(400);
      res.end('Invalid callback');
      return;
    }
    const redirectUri = REDIRECT_URI;
    try {
      const token = await exchangeCodeForToken(
        clientId,
        code,
        pending.code_verifier,
        redirectUri
      );
      token.expires_at = Date.now() + token.expires_in * 1000;
      onToken(token);
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send('spotify-token', token);
      }
    } catch (err) {
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send('spotify-auth-error', err.message);
      }
    } finally {
      pending = null;
    }
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(
      '<!DOCTYPE html><html><head><title>PixelMP3</title></head><body style="font-family:sans-serif;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0;background:#2d3f2d;color:#9cb89c;"><p>Logged in! You can close this window and return to PixelMP3.</p></body></html>'
    );
  });

  server.listen(REDIRECT_PORT, '127.0.0.1', () => {});

  return {
    getAuthUrl() {
      const { code_verifier, code_challenge, state } = generatePKCE();
      pending = { code_verifier, state };
      return getAuthUrl(clientId, code_challenge, state);
    },
    close() {
      server.close();
    },
  };
}

function getTokenPath(userDataPath) {
  return path.join(userDataPath, TOKEN_FILE);
}

function loadToken(userDataPath) {
  try {
    const data = fs.readFileSync(getTokenPath(userDataPath), 'utf8');
    return JSON.parse(data);
  } catch {
    return null;
  }
}

function saveToken(userDataPath, token) {
  fs.writeFileSync(getTokenPath(userDataPath), JSON.stringify(token), 'utf8');
}

function deleteToken(userDataPath) {
  try {
    fs.unlinkSync(getTokenPath(userDataPath));
  } catch (_) {}
}

async function refreshAccessToken(clientId, refreshToken) {
  const body = new URLSearchParams({
    grant_type: 'refresh_token',
    refresh_token: refreshToken,
    client_id: clientId,
  });
  const res = await fetch(SPOTIFY_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString(),
  });
  if (!res.ok) throw new Error('Refresh failed');
  const data = await res.json();
  data.refresh_token = data.refresh_token || refreshToken;
  data.expires_at = Date.now() + (data.expires_in || 3600) * 1000;
  return data;
}

async function getValidToken(userDataPath, clientId) {
  const token = loadToken(userDataPath);
  if (!token || !token.access_token) return null;
  const bufferMs = 60 * 1000;
  if (token.expires_at && Date.now() < token.expires_at - bufferMs) {
    return token.access_token;
  }
  if (token.refresh_token) {
    const refreshed = await refreshAccessToken(clientId, token.refresh_token);
    saveToken(userDataPath, refreshed);
    return refreshed.access_token;
  }
  return null;
}

module.exports = {
  createAuthServer,
  REDIRECT_PORT,
  loadToken,
  saveToken,
  deleteToken,
  getTokenPath,
  getValidToken,
};
