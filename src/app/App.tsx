import React, { useState, useEffect, useCallback, useRef } from 'react';
import { PixelDisplay } from './components/PixelDisplay';
import { PixelControls } from './components/PixelControls';
import { PixelPlaylist, type Song } from './components/PixelPlaylist';
import { useSpotify } from '@/spotify/useSpotify';
import { List, X, Palette, LogIn, LogOut, Music2 } from 'lucide-react';

export interface ColorTheme {
  name: string;
  bg: string;
  bgDark: string;
  bgLight: string;
  border: string;
  borderDark: string;
  display: string;
  displayText: string;
  displayTextDark: string;
  button: string;
  buttonActive: string;
  buttonHover: string;
}

const themes: ColorTheme[] = [
  {
    name: 'Green',
    bg: '#5a7a5a',
    bgDark: '#4a6a4a',
    bgLight: '#7a9a7a',
    border: '#4a6a4a',
    borderDark: '#2d3f2d',
    display: '#9cb89c',
    displayText: '#1a1a1a',
    displayTextDark: '#2d3f2d',
    button: '#7a9a7a',
    buttonActive: '#4a6a4a',
    buttonHover: '#6a8a6a',
  },
  {
    name: 'Blue',
    bg: '#5a6a8a',
    bgDark: '#4a5a7a',
    bgLight: '#7a8aaa',
    border: '#4a5a7a',
    borderDark: '#2d3f5f',
    display: '#9cabc8',
    displayText: '#1a1a2a',
    displayTextDark: '#2d3f5f',
    button: '#7a8aaa',
    buttonActive: '#4a5a7a',
    buttonHover: '#6a7a9a',
  },
  {
    name: 'Amber',
    bg: '#8a7a5a',
    bgDark: '#7a6a4a',
    bgLight: '#aa9a7a',
    border: '#7a6a4a',
    borderDark: '#5f4f2d',
    display: '#d4ba8c',
    displayText: '#2a1a1a',
    displayTextDark: '#5f4f2d',
    button: '#aa9a7a',
    buttonActive: '#7a6a4a',
    buttonHover: '#9a8a6a',
  },
  {
    name: 'Purple',
    bg: '#7a5a8a',
    bgDark: '#6a4a7a',
    bgLight: '#9a7aaa',
    border: '#6a4a7a',
    borderDark: '#4f2d5f',
    display: '#c89cb8',
    displayText: '#2a1a2a',
    displayTextDark: '#4f2d5f',
    button: '#9a7aaa',
    buttonActive: '#6a4a7a',
    buttonHover: '#8a6a9a',
  },
];

function App() {
  const spotify = useSpotify();
  const useSpotifyMode = spotify.isElectron && spotify.isLoggedIn;

  const [currentSongId, setCurrentSongId] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [volume, setVolume] = useState(70);
  const [isShuffle, setIsShuffle] = useState(false);
  const [isRepeat, setIsRepeat] = useState(false);
  const [showPlaylist, setShowPlaylist] = useState(false);
  const [playlistPanelView, setPlaylistPanelView] = useState<'playlists' | 'tracks'>('playlists');
  const [currentThemeIndex, setCurrentThemeIndex] = useState(0);
  const playlistPanelRetriedRef = useRef(false);

  const songs = useSpotifyMode && spotify.currentPlaylist?.tracks
    ? spotify.currentPlaylist.tracks.map((t) => ({
        id: t.id,
        title: t.name,
        artist: t.artist,
        duration: Math.round(t.duration_ms / 1000),
        album: t.album,
      }))
    : [];

  const currentTheme = themes[currentThemeIndex];
  const currentSong = songs.find((s) => s.id === currentSongId) || songs[0] || { id: '', title: '—', artist: '—', duration: 0 };
  const albumArtUrl = useSpotifyMode && spotify.currentPlaylist
    ? (spotify.currentPlaylist.tracks.find((t) => t.id === currentSongId)?.albumImageUrl ?? spotify.currentPlaylist.imageUrl)
    : undefined;

  const handleThemeChange = () => {
    setCurrentThemeIndex((prev) => (prev + 1) % themes.length);
  };

  const handleNext = useCallback(() => {
    const idx = songs.findIndex((s) => s.id === currentSongId);
    const nextIdx = isShuffle ? Math.floor(Math.random() * songs.length) : (idx + 1) % songs.length;
    setCurrentSongId(songs[nextIdx]?.id ?? null);
    setCurrentTime(0);
    if (useSpotifyMode && spotify.player) spotify.player.nextTrack();
  }, [songs, currentSongId, isShuffle, useSpotifyMode, spotify.player]);

  const handlePrevious = useCallback(() => {
    if (currentTime > 3) {
      setCurrentTime(0);
      return;
    }
    const idx = songs.findIndex((s) => s.id === currentSongId);
    const prevIdx = idx <= 0 ? songs.length - 1 : idx - 1;
    setCurrentSongId(songs[prevIdx]?.id ?? null);
    setCurrentTime(0);
    if (useSpotifyMode && spotify.player) spotify.player.previousTrack();
  }, [songs, currentSongId, currentTime, useSpotifyMode, spotify.player]);

  const handlePlayPause = useCallback(() => {
    if (useSpotifyMode && spotify.player) {
      spotify.player.getCurrentState().then((state) => {
        if (state?.paused) spotify.player?.resume();
        else spotify.player?.pause();
        setIsPlaying(!state?.paused);
      });
    } else {
      setIsPlaying((p) => !p);
    }
  }, [useSpotifyMode, spotify.player]);

  const handleSongSelect = useCallback(
    (id: string) => {
      setCurrentSongId(id);
      setCurrentTime(0);
      setIsPlaying(true);
      setShowPlaylist(false);
      if (useSpotifyMode && spotify.currentPlaylist?.tracks) {
        const track = spotify.currentPlaylist.tracks.find((t) => t.id === id);
        if (track) spotify.playTrack(track);
      }
    },
    [useSpotifyMode, spotify.playTrack, spotify.currentPlaylist]
  );

  useEffect(() => {
    if (useSpotifyMode && spotify.currentPlaylist?.tracks?.length) {
      setCurrentSongId(spotify.currentPlaylist.tracks[0].id);
    }
  }, [useSpotifyMode, spotify.currentPlaylist?.id]);

  // When user opens playlist panel and list is empty, retry loading once
  useEffect(() => {
    if (!showPlaylist) {
      playlistPanelRetriedRef.current = false;
      return;
    }
    if (useSpotifyMode && spotify.playlists.length === 0 && !spotify.playlistsLoading && spotify.isLoggedIn && !playlistPanelRetriedRef.current) {
      playlistPanelRetriedRef.current = true;
      spotify.loadPlaylists();
    }
  }, [showPlaylist, useSpotifyMode, spotify.playlists.length, spotify.playlistsLoading, spotify.isLoggedIn, spotify.loadPlaylists]);

  useEffect(() => {
    if (useSpotifyMode && spotify.player) {
      const interval = setInterval(() => {
        spotify.player!.getCurrentState().then((state) => {
          if (state) {
            setCurrentTime(Math.floor(state.position / 1000));
            setIsPlaying(!state.paused);
          }
        });
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [useSpotifyMode, spotify.player]);

  useEffect(() => {
    if (useSpotifyMode) return;
    if (!isPlaying || songs.length === 0) return;
    const interval = setInterval(() => {
      setCurrentTime((prev) => {
        if (prev >= (currentSong?.duration ?? 0)) {
          if (isRepeat) return 0;
          handleNext();
          return 0;
        }
        return prev + 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [useSpotifyMode, isPlaying, currentSong?.duration, isRepeat, songs.length]);

  if (spotify.isElectron && !spotify.isLoggedIn) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#2d3f2d] via-[#3a4a3a] to-[#1a2a1a] flex items-center justify-center p-4">
        <div className="relative z-10 w-full" style={{ maxWidth: '280px' }}>
          <div className="border-[3px] p-2.5 rounded-lg" style={{ backgroundColor: themes[0].bg, borderColor: themes[0].border }}>
            <div className="border p-4 text-center" style={{ backgroundColor: themes[0].bgDark, borderColor: themes[0].borderDark }}>
              <Music2 className="mx-auto mb-3" size={40} style={{ color: themes[0].display }} />
              <p className="font-['Press_Start_2P'] text-[8px] mb-4" style={{ color: themes[0].display }}>
                LOG IN TO SPOTIFY TO PLAY YOUR PLAYLISTS
              </p>
              {spotify.authError && (
                <p className="font-['Press_Start_2P'] text-[6px] mb-2 text-red-400">{spotify.authError}</p>
              )}
              <button
                onClick={() => spotify.login()}
                className="inline-flex items-center gap-2 px-4 py-2 border-2 font-['Press_Start_2P'] text-[8px] transition-all active:translate-y-0.5"
                style={{ backgroundColor: themes[0].button, borderColor: themes[0].border }}
              >
                <LogIn size={12} /> Log in with Spotify
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#2d3f2d] via-[#3a4a3a] to-[#1a2a1a] flex items-center justify-center p-4">
      {/* Pixel Art Background Pattern */}
      <div className="absolute inset-0 opacity-5" style={{
        backgroundImage: `
          repeating-linear-gradient(0deg, transparent, transparent 8px, rgba(255,255,255,0.1) 8px, rgba(255,255,255,0.1) 10px),
          repeating-linear-gradient(90deg, transparent, transparent 8px, rgba(255,255,255,0.1) 8px, rgba(255,255,255,0.1) 10px)
        `
      }} />

      <div className="relative z-10 w-full" style={{ maxWidth: '280px' }}>
        {/* MP3 Player Device */}
        <div className="border-[3px] p-2.5" style={{ backgroundColor: currentTheme.bg, borderColor: currentTheme.border }}>
          {/* Device Header */}
          <div 
            className="border border-[#2d3f2d] p-1.5 mb-2.5 flex items-center justify-between"
            style={{ backgroundColor: currentTheme.bgDark }}
          >
            <div className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 bg-[#ff6b6b] rounded-full border border-[#2d3f2d]" />
              <div className="w-1.5 h-1.5 bg-[#4ecb71] rounded-full border border-[#2d3f2d]" />
              <span 
                className="ml-0.5 font-['Press_Start_2P'] text-[7px]"
                style={{ color: currentTheme.display }}
              >
                PixelMP3
              </span>
            </div>
            <div className="flex gap-1">
              {useSpotifyMode && (
                <button
                  onClick={() => spotify.logout()}
                  className="p-0.5 border transition-all active:translate-y-0.5"
                  style={{
                    backgroundColor: currentTheme.button,
                    borderColor: currentTheme.bg,
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = currentTheme.buttonHover)}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = currentTheme.button)}
                  title="Log out of Spotify"
                >
                  <LogOut size={10} className="text-[#1a1a1a]" />
                </button>
              )}
              <button
                onClick={handleThemeChange}
                className="p-0.5 border transition-all active:translate-y-0.5"
                style={{ 
                  backgroundColor: currentTheme.button,
                  borderColor: currentTheme.bg,
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = currentTheme.buttonHover}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = currentTheme.button}
              >
                <Palette size={10} className="text-[#1a1a1a]" />
              </button>
              <button
                onClick={() => {
                  setShowPlaylist((open) => {
                    if (!open && useSpotifyMode && spotify.currentPlaylist) setPlaylistPanelView('tracks');
                    else if (!open) setPlaylistPanelView('playlists');
                    return !open;
                  });
                }}
                className="p-0.5 border transition-all active:translate-y-0.5"
                style={{ 
                  backgroundColor: currentTheme.button,
                  borderColor: currentTheme.bg,
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = currentTheme.buttonHover}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = currentTheme.button}
              >
                {showPlaylist ? (
                  <X size={10} className="text-[#1a1a1a]" />
                ) : (
                  <List size={10} className="text-[#1a1a1a]" />
                )}
              </button>
            </div>
          </div>

          {/* Content Area */}
          {!showPlaylist ? (
            <div className="space-y-2.5">
              {/* Album Art - Smaller */}
              <div className="border p-1.5" style={{ backgroundColor: currentTheme.bgDark, borderColor: currentTheme.borderDark }}>
                <div className="aspect-square border overflow-hidden relative" style={{ backgroundColor: currentTheme.borderDark, borderColor: currentTheme.borderDark }}>
                  <img 
                    src={albumArtUrl ?? 'https://images.unsplash.com/photo-1629923759854-156b88c433aa?w=400'}
                    alt="Album Cover"
                    className="w-full h-full object-cover"
                    style={{ imageRendering: 'pixelated' }}
                  />
                  <div className="absolute inset-0" style={{
                    backgroundImage: `
                      repeating-linear-gradient(0deg, transparent, transparent 4px, rgba(0,0,0,0.1) 4px, rgba(0,0,0,0.1) 5px),
                      repeating-linear-gradient(90deg, transparent, transparent 4px, rgba(0,0,0,0.1) 4px, rgba(0,0,0,0.1) 5px)
                    `
                  }} />
                </div>
              </div>

              {/* Display */}
              <PixelDisplay
                songTitle={currentSong.title}
                artist={currentSong.artist}
                currentTime={currentTime}
                duration={currentSong.duration}
                theme={currentTheme}
              />
              
              {/* Controls */}
              <PixelControls
                isPlaying={isPlaying}
                onPlayPause={handlePlayPause}
                onPrevious={handlePrevious}
                onNext={handleNext}
                volume={volume}
                onVolumeChange={setVolume}
                isShuffle={isShuffle}
                onShuffleToggle={() => setIsShuffle(!isShuffle)}
                isRepeat={isRepeat}
                onRepeatToggle={() => setIsRepeat(!isRepeat)}
                theme={currentTheme}
              />
            </div>
          ) : (
            <div>
              {useSpotifyMode ? (
                playlistPanelView === 'playlists' ? (
                  <div className="border-2 p-1.5" style={{ backgroundColor: currentTheme.bgLight, borderColor: currentTheme.bg }}>
                    <div className="border p-1 mb-1.5" style={{ backgroundColor: currentTheme.display, borderColor: currentTheme.borderDark }}>
                      <h2 className="font-['Press_Start_2P'] text-[7px]" style={{ color: currentTheme.borderDark }}>YOUR PLAYLISTS</h2>
                    </div>
                    {spotify.authError && (
                      <p className="font-['Press_Start_2P'] text-[6px] mb-1 p-1" style={{ color: '#e74c3c' }}>{spotify.authError}</p>
                    )}
                    {spotify.playlistsLoading ? (
                      <p className="font-['Press_Start_2P'] text-[7px] p-2" style={{ color: currentTheme.displayText }}>Loading...</p>
                    ) : spotify.playlists.length === 0 ? (
                      <div className="p-2 space-y-1.5">
                        <p className="font-['Press_Start_2P'] text-[6px]" style={{ color: currentTheme.displayText }}>
                          No playlists found. Create one in Spotify, or tap Refresh.
                        </p>
                        <button
                          onClick={() => spotify.loadPlaylists()}
                          className="w-full p-1.5 border font-['Press_Start_2P'] text-[7px]"
                          style={{ backgroundColor: currentTheme.button, borderColor: currentTheme.bg }}
                        >
                          Refresh
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-1 max-h-[300px] overflow-y-auto">
                        {spotify.playlists.map((p) => (
                          <button
                            key={p.id}
                            onClick={() => {
                              spotify.selectPlaylist(p.id);
                              setPlaylistPanelView('tracks');
                            }}
                            className="w-full p-1.5 border text-left transition-all"
                            style={{ backgroundColor: currentTheme.display, borderColor: currentTheme.bgLight }}
                            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = currentTheme.bgLight; }}
                            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = currentTheme.display; }}
                          >
                            <div className="font-['Press_Start_2P'] text-[7px] truncate" style={{ color: currentTheme.displayText }}>{p.name}</div>
                            <div className="text-[6px] font-['Press_Start_2P']" style={{ color: currentTheme.borderDark }}>{p.trackCount} tracks</div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <div>
                    <button
                      onClick={() => setPlaylistPanelView('playlists')}
                      className="w-full mb-1 p-1 border font-['Press_Start_2P'] text-[6px] text-left"
                      style={{ backgroundColor: currentTheme.button, borderColor: currentTheme.bg }}
                    >
                      ← Back to playlists
                    </button>
                    <PixelPlaylist
                      songs={songs}
                      currentSongId={currentSongId}
                      onSongSelect={handleSongSelect}
                      theme={currentTheme}
                    />
                  </div>
                )
              ) : (
                <div className="border-2 p-1.5" style={{ backgroundColor: currentTheme.bgLight, borderColor: currentTheme.bg }}>
                  <div className="border p-4 text-center" style={{ backgroundColor: currentTheme.display, borderColor: currentTheme.borderDark }}>
                    <p className="font-['Press_Start_2P'] text-[7px]" style={{ color: currentTheme.borderDark }}>Log in with Spotify to see your playlists.</p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        
        .animate-marquee {
          animation: marquee 10s linear infinite;
        }
        
        /* Custom scrollbar for playlist */
        .space-y-1::-webkit-scrollbar {
          width: 8px;
        }
        
        .space-y-1::-webkit-scrollbar-track {
          background: #7a9a7a;
          border: 2px solid #5a7a5a;
        }
        
        .space-y-1::-webkit-scrollbar-thumb {
          background: #4a6a4a;
          border: 2px solid #2d3f2d;
        }
        
        .space-y-1::-webkit-scrollbar-thumb:hover {
          background: #3a5a3a;
        }
      `}</style>
    </div>
  );
}

export default App;