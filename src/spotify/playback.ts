/**
 * Spotify Web Playback SDK wrapper.
 * Load the SDK script and create a player that uses the current access token.
 * Requires Spotify Premium. Playback happens in this browser (Electron) as a Spotify Connect device.
 */

declare global {
  interface Window {
    onSpotifyWebPlaybackSDKReady?: () => void;
    Spotify?: {
      Player: new (options: {
        name: string;
        getOAuthToken: (cb: (token: string) => void) => void;
        volume?: number;
      }) => SpotifyPlayer;
    };
  }
}

export interface SpotifyPlayer {
  connect: () => Promise<boolean>;
  disconnect: () => void;
  addListener: (event: string, callback: (payload?: unknown) => void) => void;
  removeListener: (event: string, callback?: (payload?: unknown) => void) => void;
  getCurrentState: () => Promise<{ position: number; duration: number; paused: boolean } | null>;
  getVolume: () => Promise<number>;
  setVolume: (volume: number) => Promise<void>;
  nextTrack: () => Promise<void>;
  previousTrack: () => Promise<void>;
  resume: () => Promise<void>;
  pause: () => Promise<void>;
  togglePlay: () => Promise<void>;
  seek: (position_ms: number) => Promise<void>;
  activateElement: () => Promise<void>;
  device_id: string | null;
}

const SDK_URL = 'https://sdk.scdn.co/spotify-player.js';

function loadSpotifySDK(): Promise<void> {
  if (window.Spotify) return Promise.resolve();
  return new Promise((resolve) => {
    window.onSpotifyWebPlaybackSDKReady = () => resolve();
    const script = document.createElement('script');
    script.src = SDK_URL;
    script.async = true;
    document.head.appendChild(script);
  });
}

export async function createSpotifyPlayer(
  getToken: () => Promise<string>,
  options: { name?: string; volume?: number } = {}
): Promise<SpotifyPlayer> {
  await loadSpotifySDK();
  if (!window.Spotify) throw new Error('Spotify SDK failed to load');

  const player = new window.Spotify.Player({
    name: options.name ?? 'PixelMP3',
    getOAuthToken: (cb) => {
      getToken().then(cb).catch(() => cb(''));
    },
    volume: options.volume ?? 0.7,
  });

  return player;
}
