/** Spotify track as returned by Web API / used in our UI */
export interface SpotifyTrack {
  id: string;
  uri: string;
  name: string;
  artist: string;
  artistId?: string;
  duration_ms: number;
  album: string;
  albumImageUrl?: string;
}

/** Playlist with tracks */
export interface SpotifyPlaylist {
  id: string;
  name: string;
  uri: string;
  trackCount: number;
  imageUrl?: string;
  tracks: SpotifyTrack[];
}

/** Token stored after OAuth */
export interface SpotifyToken {
  access_token: string;
  refresh_token?: string;
  expires_in: number;
  expires_at?: number;
}
