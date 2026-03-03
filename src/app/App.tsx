import { useState, useEffect } from 'react';
import { PixelDisplay } from './components/PixelDisplay';
import { PixelControls } from './components/PixelControls';
import { PixelPlaylist } from './components/PixelPlaylist';
import { List, X, Palette } from 'lucide-react';

interface Song {
  id: number;
  title: string;
  artist: string;
  duration: number;
  album: string;
}

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

const mockSongs: Song[] = [
  { id: 1, title: 'Pixel Dreams', artist: 'Retro Vibes', duration: 243, album: 'Digital Nostalgia' },
  { id: 2, title: '8-Bit Love', artist: 'Chiptune Masters', duration: 198, album: 'Console Classics' },
  { id: 3, title: 'Synthwave Nights', artist: 'Neon Pulse', duration: 287, album: 'Electric Dreams' },
  { id: 4, title: 'Game Over', artist: 'Arcade Heroes', duration: 156, album: 'High Score' },
  { id: 5, title: 'Digital Sunset', artist: 'Pixel Artists', duration: 221, album: 'Bit World' },
  { id: 6, title: 'Retro Runner', artist: 'Speed Demons', duration: 189, album: 'Fast Lane' },
  { id: 7, title: 'Cyber City', artist: 'Future Past', duration: 265, album: 'Urban Bits' },
  { id: 8, title: 'Boss Battle', artist: 'Epic Games', duration: 312, album: 'Final Level' },
  { id: 9, title: 'Power Up', artist: 'Coin Collectors', duration: 178, album: 'Extra Life' },
  { id: 10, title: 'Glitch Hop', artist: 'Bug Fixers', duration: 234, album: 'Debug Mode' },
];

function App() {
  const [currentSongId, setCurrentSongId] = useState(1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [volume, setVolume] = useState(70);
  const [isShuffle, setIsShuffle] = useState(false);
  const [isRepeat, setIsRepeat] = useState(false);
  const [showPlaylist, setShowPlaylist] = useState(false);
  const [currentThemeIndex, setCurrentThemeIndex] = useState(0);

  const currentTheme = themes[currentThemeIndex];

  const handleThemeChange = () => {
    setCurrentThemeIndex((prev) => (prev + 1) % themes.length);
  };

  const currentSong = mockSongs.find(song => song.id === currentSongId) || mockSongs[0];

  // Simulate playback progress
  useEffect(() => {
    if (!isPlaying) return;

    const interval = setInterval(() => {
      setCurrentTime(prev => {
        if (prev >= currentSong.duration) {
          if (isRepeat) {
            return 0;
          } else {
            handleNext();
            return 0;
          }
        }
        return prev + 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isPlaying, currentSong.duration, isRepeat]);

  const handlePlayPause = () => {
    setIsPlaying(!isPlaying);
  };

  const handleNext = () => {
    if (isShuffle) {
      const randomIndex = Math.floor(Math.random() * mockSongs.length);
      setCurrentSongId(mockSongs[randomIndex].id);
    } else {
      const currentIndex = mockSongs.findIndex(song => song.id === currentSongId);
      const nextIndex = (currentIndex + 1) % mockSongs.length;
      setCurrentSongId(mockSongs[nextIndex].id);
    }
    setCurrentTime(0);
  };

  const handlePrevious = () => {
    if (currentTime > 3) {
      setCurrentTime(0);
    } else {
      const currentIndex = mockSongs.findIndex(song => song.id === currentSongId);
      const prevIndex = currentIndex === 0 ? mockSongs.length - 1 : currentIndex - 1;
      setCurrentSongId(mockSongs[prevIndex].id);
      setCurrentTime(0);
    }
  };

  const handleSongSelect = (id: number) => {
    setCurrentSongId(id);
    setCurrentTime(0);
    setIsPlaying(true);
    setShowPlaylist(false);
  };

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
                PIXELFY
              </span>
            </div>
            <div className="flex gap-1">
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
                onClick={() => setShowPlaylist(!showPlaylist)}
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
                    src="https://images.unsplash.com/photo-1629923759854-156b88c433aa?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxhbGJ1bSUyMGNvdmVyJTIwbXVzaWMlMjB2aW55bHxlbnwxfHx8fDE3NzI0ODY3MDd8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral"
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
              <PixelPlaylist
                songs={mockSongs}
                currentSongId={currentSongId}
                onSongSelect={handleSongSelect}
                theme={currentTheme}
              />
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