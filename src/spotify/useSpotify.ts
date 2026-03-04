import { useState, useEffect, useCallback } from 'react';
import * as api from './api';
import { createSpotifyPlayer, type SpotifyPlayer } from './playback';
import type { SpotifyPlaylist, SpotifyTrack } from './types';

const CLIENT_ID = import.meta.env.VITE_SPOTIFY_CLIENT_ID as string | undefined;

export function useSpotify() {
  const [isElectron, setIsElectron] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);
  const [playlists, setPlaylists] = useState<SpotifyPlaylist[]>([]);
  const [playlistsLoading, setPlaylistsLoading] = useState(false);
  const [currentPlaylist, setCurrentPlaylist] = useState<SpotifyPlaylist | null>(null);
  const [player, setPlayer] = useState<SpotifyPlayer | null>(null);
  const [deviceId, setDeviceId] = useState<string | null>(null);
  const [playerReady, setPlayerReady] = useState(false);

  const hasToken = !!token;
  const isLoggedIn = hasToken;

  const getToken = useCallback(async (): Promise<string> => {
    if (token) return token;
    if (isElectron && CLIENT_ID && (window as unknown as { electronAPI?: { spotify: { getToken: (id: string) => Promise<{ access_token?: string }> } } }).electronAPI?.spotify) {
      const result = await (window as unknown as { electronAPI: { spotify: { getToken: (id: string) => Promise<{ access_token?: string }> } } }).electronAPI.spotify.getToken(CLIENT_ID);
      if (result.access_token) return result.access_token;
    }
    throw new Error('Not logged in');
  }, [isElectron, token]);

  useEffect(() => {
    const w = window as unknown as { electronAPI?: unknown };
    setIsElectron(!!w.electronAPI);
  }, []);

  useEffect(() => {
    if (!isElectron || !CLIENT_ID) return;
    const w = window as unknown as {
      electronAPI?: {
        spotify: {
          hasToken: () => Promise<{ hasToken: boolean }>;
          getToken: (id: string) => Promise<{ access_token?: string }>;
          onToken: (fn: (t: { access_token: string }) => void) => () => void;
          onAuthError: (fn: (msg: string) => void) => () => void;
        };
      };
    };
    if (!w.electronAPI?.spotify) return;
    w.electronAPI.spotify.hasToken().then((r) => {
      if (r.hasToken) w.electronAPI!.spotify.getToken(CLIENT_ID).then((t) => t.access_token && setToken(t.access_token));
    });
    const unsubToken = w.electronAPI.spotify.onToken((t) => {
      setToken(t.access_token);
      setAuthError(null);
    });
    const unsubErr = w.electronAPI.spotify.onAuthError((msg) => setAuthError(msg));
    const unsubLogout = w.electronAPI.spotify.onLoggedOut(() => {
      setToken(null);
      setAuthError(null);
      setPlaylists([]);
      setCurrentPlaylist(null);
    });
    return () => {
      unsubToken();
      unsubErr();
      unsubLogout();
    };
  }, [isElectron, CLIENT_ID]);

  const logout = useCallback(async () => {
    const w = window as unknown as { electronAPI?: { spotify: { logout: () => Promise<unknown> } } };
    if (w.electronAPI?.spotify?.logout) {
      await w.electronAPI.spotify.logout();
    } else {
      setToken(null);
      setPlaylists([]);
      setCurrentPlaylist(null);
    }
  }, []);

  const login = useCallback(async () => {
    setAuthError(null);
    if (!isElectron || !CLIENT_ID) {
      setAuthError('Spotify Client ID not set. Add VITE_SPOTIFY_CLIENT_ID to .env');
      return;
    }
    const w = window as unknown as { electronAPI?: { spotify: { getAuthUrl: (id: string) => Promise<unknown> } } };
    if (!w.electronAPI?.spotify) {
      setAuthError('Not running in Electron');
      return;
    }
    await w.electronAPI.spotify.getAuthUrl(CLIENT_ID);
  }, [isElectron, CLIENT_ID]);

  const loadPlaylists = useCallback(async () => {
    if (!token) return;
    setPlaylistsLoading(true);
    setAuthError(null);
    try {
      const list = await api.getMyPlaylists();
      setPlaylists(list);
      if (list.length > 0) {
        const first = await api.getPlaylistWithTracks(list[0].id);
        setCurrentPlaylist(first);
      }
    } catch (e) {
      setAuthError(e instanceof Error ? e.message : 'Failed to load playlists');
    } finally {
      setPlaylistsLoading(false);
    }
  }, [token]);

  const selectPlaylist = useCallback(async (playlistId: string) => {
    if (!token) return;
    try {
      const full = await api.getPlaylistWithTracks(playlistId);
      setCurrentPlaylist(full);
    } catch (e) {
      setAuthError(e instanceof Error ? e.message : 'Failed to load playlist');
    }
  }, [token]);

  useEffect(() => {
    if (token) loadPlaylists();
  }, [token, loadPlaylists]);

  useEffect(() => {
    if (!token || !CLIENT_ID) return;
    let cancelled = false;
    createSpotifyPlayer(() => getToken(), { name: 'PixelMP3' })
      .then((p) => {
        if (cancelled) return;
        setPlayer(p);
        p.addListener('ready', ({ device_id }: { device_id: string }) => {
          if (!cancelled) {
            setDeviceId(device_id);
            setPlayerReady(true);
          }
        });
        p.connect();
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [token, CLIENT_ID, getToken]);

  const playTrack = useCallback(
    async (track: SpotifyTrack) => {
      if (!deviceId) return;
      await api.playOnDevice(deviceId, track.uri);
    },
    [deviceId]
  );

  return {
    isElectron,
    isLoggedIn,
    authError,
    login,
    logout,
    playlists,
    playlistsLoading,
    loadPlaylists,
    currentPlaylist,
    selectPlaylist,
    setCurrentPlaylist,
    player,
    deviceId,
    playerReady,
    playTrack,
    getToken,
  };
}
