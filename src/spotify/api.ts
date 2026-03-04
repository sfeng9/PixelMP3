/**
 * Spotify Web API client (playlists, tracks).
 * Requires a valid access token from the Electron main process (Spotify OAuth).
 */

import type { SpotifyPlaylist, SpotifyTrack } from './types';

const SPOTIFY_API_BASE = 'https://api.spotify.com/v1';

export async function getSpotifyToken(): Promise<string> {
  const w = typeof window !== 'undefined' ? (window as unknown as { electronAPI?: { spotify: { getToken: (clientId: string) => Promise<{ access_token?: string; error?: string }> } } }) : null;
  if (w?.electronAPI?.spotify?.getToken) {
    const clientId = import.meta.env.VITE_SPOTIFY_CLIENT_ID as string;
    if (!clientId) throw new Error('Missing VITE_SPOTIFY_CLIENT_ID');
    const result = await w.electronAPI.spotify.getToken(clientId);
    if (result.error || !result.access_token) throw new Error(result.error || 'Not logged in');
    return result.access_token;
  }
  const t = localStorage.getItem('spotify_access_token');
  if (!t) throw new Error('Not logged in to Spotify');
  return t;
}

async function getToken(): Promise<string> {
  return getSpotifyToken();
}

async function spotifyFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = await getToken();
  const res = await fetch(`${SPOTIFY_API_BASE}${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });
  if (res.status === 401) {
    localStorage.removeItem('spotify_access_token');
    throw new Error('Session expired. Please log in again.');
  }
  if (!res.ok) {
    const errText = await res.text();
    if (res.status === 403) {
    //    if (window.electronAPI?.spotify?.logout) {
    //     await window.electronAPI.spotify.logout();
    // }
    throw new Error('Access denied. Scopes have changed. You have been logged out, please log in again.');
    }
    throw new Error(errText || `Spotify API error ${res.status}`);
  }
  return res.json() as Promise<T>;
}

/** Get current user's playlists (first 50) */
export async function getMyPlaylists(): Promise<SpotifyPlaylist[]> {
  const data = await spotifyFetch<{
    items?: Array<{
      id: string;
      name: string;
      uri: string;
      tracks?: { total?: number };
      images?: Array<{ url: string }>;
    }>;
  }>('/me/playlists?limit=50');
  const items = data.items ?? [];
  const playlists: SpotifyPlaylist[] = items.map((p) => ({
    id: p.id,
    name: p.name ?? '',
    uri: p.uri ?? '',
    trackCount: p.tracks?.total ?? 0,
    imageUrl: p.images?.[0]?.url,
    tracks: [],
  }));
  return playlists;
}

/** Get tracks for a playlist */
export async function getPlaylistTracks(playlistId: string): Promise<SpotifyTrack[]> {
  const data = await spotifyFetch<{
    items?: Array<{
      track?: {
        id: string;
        uri: string;
        name: string;
        duration_ms: number;
        album?: { name?: string; images?: Array<{ url: string }> };
        artists?: Array<{ id: string; name: string }>;
      } | null;
    }>;
  }>(`/playlists/${playlistId}/items?limit=100&market=from_token&additional_types=track&fields=items(track(id,uri,name,duration_ms,album(name,images),artists(id,name)))`);
  const items = data.items ?? [];
  const tracks: SpotifyTrack[] = [];
  for (const { track } of items) {
    if (!track) continue;
    tracks.push({
      id: track.id,
      uri: track.uri,
      name: track.name,
      artist: (track.artists ?? []).map((a) => a.name).join(', '),
      artistId: track.artists?.[0]?.id,
      duration_ms: track.duration_ms ?? 0,
      album: track.album?.name ?? '',
      albumImageUrl: track.album?.images?.[0]?.url,
    });
  }
  return tracks;
}

/** Get a single playlist with its tracks */
export async function getPlaylistWithTracks(playlistId: string): Promise<SpotifyPlaylist> {
  const [playlistData, tracks] = await Promise.all([
    spotifyFetch<{ id: string; name: string; uri: string; images: Array<{ url: string }> }>(
      `/playlists/${playlistId}?fields=id,name,uri,images`
    ),
    getPlaylistTracks(playlistId),
  ]);
  return {
    id: playlistData.id,
    name: playlistData.name,
    uri: playlistData.uri,
    trackCount: tracks.length,
    imageUrl: playlistData.images?.[0]?.url,
    tracks,
  };
}

/** Transfer playback to a device (e.g. Web Playback SDK device) and optionally start a track */
export async function playOnDevice(deviceId: string, trackUri?: string): Promise<void> {
  const token = await getToken();
  await fetch(`${SPOTIFY_API_BASE}/me/player`, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ device_ids: [deviceId], play: !!trackUri }),
  });
  if (trackUri) {
    await fetch(`${SPOTIFY_API_BASE}/me/player/play?device_id=${encodeURIComponent(deviceId)}`, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ uris: [trackUri] }),
    });
  }
}
