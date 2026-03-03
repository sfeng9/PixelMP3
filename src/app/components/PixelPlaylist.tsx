import { Music } from 'lucide-react';
import { ColorTheme } from '../App';

interface Song {
  id: number;
  title: string;
  artist: string;
  duration: number;
}

interface PixelPlaylistProps {
  songs: Song[];
  currentSongId: number;
  onSongSelect: (id: number) => void;
  theme: ColorTheme;
}

export function PixelPlaylist({ songs, currentSongId, onSongSelect, theme }: PixelPlaylistProps) {
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="border-2 p-1.5" style={{ backgroundColor: theme.bgLight, borderColor: theme.bg }}>
      <div className="border p-1 mb-1.5" style={{ backgroundColor: theme.display, borderColor: theme.borderDark }}>
        <h2 className="font-['Press_Start_2P'] text-[7px]" style={{ color: theme.borderDark }}>PLAYLIST</h2>
      </div>
      
      <div className="space-y-1 max-h-[300px] overflow-y-auto">
        {songs.map((song) => (
          <button
            key={song.id}
            onClick={() => onSongSelect(song.id)}
            className="w-full p-1.5 border text-left transition-all"
            style={{
              backgroundColor: currentSongId === song.id ? theme.buttonActive : theme.display,
              borderColor: currentSongId === song.id ? theme.borderDark : theme.bgLight,
            }}
            onMouseEnter={(e) => currentSongId !== song.id && (e.currentTarget.style.backgroundColor = theme.bgLight)}
            onMouseLeave={(e) => currentSongId !== song.id && (e.currentTarget.style.backgroundColor = theme.display)}
          >
            <div className="flex items-start gap-1">
              <Music size={10} className="mt-0.5 flex-shrink-0" style={{ color: theme.borderDark }} />
              <div className="flex-1 min-w-0">
                <div className="font-['Press_Start_2P'] text-[7px] truncate mb-0.5" style={{ color: theme.displayText }}>
                  {song.title}
                </div>
                <div className="flex justify-between items-center">
                  <div className="text-[6px] font-['Press_Start_2P'] truncate" style={{ color: theme.borderDark }}>
                    {song.artist}
                  </div>
                  <div className="text-[6px] font-['Press_Start_2P'] ml-2 flex-shrink-0" style={{ color: theme.borderDark }}>
                    {formatTime(song.duration)}
                  </div>
                </div>
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}