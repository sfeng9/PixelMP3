import { Play, Pause, SkipBack, SkipForward, Volume2, Shuffle, Repeat } from 'lucide-react';
import { ColorTheme } from '../App';

interface PixelControlsProps {
  isPlaying: boolean;
  onPlayPause: () => void;
  onPrevious: () => void;
  onNext: () => void;
  volume: number;
  onVolumeChange: (volume: number) => void;
  isShuffle: boolean;
  onShuffleToggle: () => void;
  isRepeat: boolean;
  onRepeatToggle: () => void;
  theme: ColorTheme;
}

export function PixelControls({
  isPlaying,
  onPlayPause,
  onPrevious,
  onNext,
  volume,
  onVolumeChange,
  isShuffle,
  onShuffleToggle,
  isRepeat,
  onRepeatToggle,
  theme,
}: PixelControlsProps) {
  return (
    <div className="space-y-2.5">
      {/* Main Controls */}
      <div className="flex justify-center items-center gap-1.5">
        <button
          onClick={onShuffleToggle}
          className="p-1 border-2 transition-all active:translate-y-0.5"
          style={{
            backgroundColor: isShuffle ? theme.buttonActive : theme.button,
            borderColor: isShuffle ? theme.borderDark : theme.bg,
          }}
          onMouseEnter={(e) => !isShuffle && (e.currentTarget.style.backgroundColor = theme.buttonHover)}
          onMouseLeave={(e) => !isShuffle && (e.currentTarget.style.backgroundColor = theme.button)}
        >
          <Shuffle size={10} className="text-[#1a1a1a]" />
        </button>

        <button
          onClick={onPrevious}
          className="p-1.5 border-2 transition-all active:translate-y-0.5"
          style={{ backgroundColor: theme.button, borderColor: theme.bg }}
          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = theme.buttonHover}
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = theme.button}
        >
          <SkipBack size={12} className="text-[#1a1a1a]" fill="#1a1a1a" />
        </button>

        <button
          onClick={onPlayPause}
          className="p-2 border-2 transition-all active:translate-y-0.5"
          style={{ backgroundColor: theme.buttonActive, borderColor: theme.borderDark }}
          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = theme.bgDark}
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = theme.buttonActive}
        >
          {isPlaying ? (
            <Pause size={16} style={{ color: theme.display }} fill={theme.display} />
          ) : (
            <Play size={16} style={{ color: theme.display }} fill={theme.display} />
          )}
        </button>

        <button
          onClick={onNext}
          className="p-1.5 border-2 transition-all active:translate-y-0.5"
          style={{ backgroundColor: theme.button, borderColor: theme.bg }}
          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = theme.buttonHover}
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = theme.button}
        >
          <SkipForward size={12} className="text-[#1a1a1a]" fill="#1a1a1a" />
        </button>

        <button
          onClick={onRepeatToggle}
          className="p-1 border-2 transition-all active:translate-y-0.5"
          style={{
            backgroundColor: isRepeat ? theme.buttonActive : theme.button,
            borderColor: isRepeat ? theme.borderDark : theme.bg,
          }}
          onMouseEnter={(e) => !isRepeat && (e.currentTarget.style.backgroundColor = theme.buttonHover)}
          onMouseLeave={(e) => !isRepeat && (e.currentTarget.style.backgroundColor = theme.button)}
        >
          <Repeat size={10} className="text-[#1a1a1a]" />
        </button>
      </div>

      {/* Volume Control */}
      <div className="flex items-center gap-1.5 px-1">
        <Volume2 size={12} style={{ color: theme.borderDark }} />
        <div className="flex-1 flex gap-0.5">
          {[...Array(10)].map((_, i) => (
            <button
              key={i}
              onClick={() => onVolumeChange((i + 1) * 10)}
              className="flex-1 h-5 border transition-all"
              style={{
                backgroundColor: i < volume / 10 ? theme.buttonActive : theme.display,
                borderColor: i < volume / 10 ? theme.borderDark : theme.bgLight,
              }}
              onMouseEnter={(e) => e.currentTarget.style.borderColor = theme.borderDark}
              onMouseLeave={(e) => e.currentTarget.style.borderColor = i < volume / 10 ? theme.borderDark : theme.bgLight}
            />
          ))}
        </div>
      </div>
    </div>
  );
}