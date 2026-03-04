# PixelMP3

A small desktop app that lets you browse your Spotify playlists and play music in a pixel-style MP3 player UI. Built with **Electron**, **React**, **Vite**, and the **Spotify Web API** + **Web Playback SDK**.

## Features

- Pixel-art style MP3 player interface (themes: Green, Blue, Amber, Purple)
- Log in with Spotify (OAuth in your browser, token stored securely in the app)
- Browse your playlists and pick one to play
- Playback via Spotify Web Playback SDK (requires **Spotify Premium**)
- Play/pause, next/previous, shuffle, repeat, volume
- Runs as a native desktop window (Electron)

## Prerequisites

- **Node.js** 18+
- **Spotify Premium** (required for Web Playback SDK)
- A **Spotify app** (Client ID) from the [Spotify Developer Dashboard](https://developer.spotify.com/dashboard)

## Setup

### 1. Spotify Developer App

1. Go to [Spotify for Developers](https://developer.spotify.com/dashboard) and log in.
2. Click **Create app** → name it (e.g. "PixelMP3") → accept terms.
3. Open your app → **Settings**.
4. Under **Redirect URIs** add (Spotify does not allow `localhost`; use `127.0.0.1`):
   ```text
   http://127.0.0.1:8888/callback
   ```
   Save.
5. Copy the **Client ID** (you’ll use it as `VITE_SPOTIFY_CLIENT_ID`).

### 2. Environment variable

In the project root, create a `.env` file (see `.env.example`):

```env
VITE_SPOTIFY_CLIENT_ID=your_client_id_here
```

Replace `your_client_id_here` with your app’s Client ID.

### 3. Install and run

```bash
npm install
npm run electron:dev
```

- **First run:** The app opens; click **Log in with Spotify**. Your browser opens the Spotify login; after authorizing, you’re redirected to a “Logged in!” page. Return to PixelMP3 and you should be logged in.
- **Playlists:** Use the **Playlist...** dropdown to choose a playlist. Tracks load; click a track to start playback.
- **Controls:** Use the pixel player buttons for play/pause, next/previous, shuffle, repeat, and volume.

### Scripts

| Script               | Description                                      |
|----------------------|--------------------------------------------------|
| `npm run dev`        | Web only: Vite dev server (no Spotify login)     |
| `npm run build`      | Build for web (output in `dist/`)                 |
| `npm run electron`   | Run Electron using built `dist/` (run `build` first) |
| `npm run electron:dev` | Vite + Electron with hot reload (recommended)  |

## How it works

- **Electron** provides the desktop window and a small local server on port **8888** for the OAuth redirect.
- **Spotify Authorization Code + PKCE** is used (no client secret); the app opens the Spotify login in your default browser and receives the callback on `http://localhost:8888/callback`.
- The **access token** (and refresh token) are stored in Electron’s user data directory and refreshed when needed.
- The **Spotify Web API** is used to list your playlists and playlist tracks.
- The **Spotify Web Playback SDK** runs inside the app window and acts as a Spotify Connect device so you can play and control playback from the pixel UI.

## Troubleshooting

- **“Missing Spotify Client ID”**  
  Add `VITE_SPOTIFY_CLIENT_ID` to `.env` and restart.

- **“Not logged in” / token errors**  
  Log out from the Spotify account in the browser and try **Log in with Spotify** again. Ensure `http://127.0.0.1:8888/callback` is in your Spotify app’s Redirect URIs (Spotify does not allow `localhost`).

- **Playback doesn’t start**  
  You need a **Spotify Premium** account. The Web Playback SDK does not work with free accounts.

- **Port 8888 in use**  
  Another app may be using 8888. Stop it or change `REDIRECT_PORT` in `electron/spotify-auth.js` and add the new callback URL in the Spotify Dashboard.

## License

See repository license.
