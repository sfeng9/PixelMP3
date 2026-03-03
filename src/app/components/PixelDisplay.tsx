import { ColorTheme } from '../App';

interface PixelDisplayProps {
  songTitle: string;
  artist: string;
  currentTime: number;
  duration: number;
  theme: ColorTheme;
}

export function PixelDisplay({ songTitle, artist, currentTime, duration, theme }: PixelDisplayProps) {
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="p-1.5 border-2 relative" style={{ backgroundColor: theme.display, borderColor: theme.borderDark }}>
      {/* LCD Screen effect */}
      <div className="absolute inset-0 pointer-events-none opacity-10">
        <div className="h-full w-full" style={{
          backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 1px, rgba(0,0,0,0.1) 1px, rgba(0,0,0,0.1) 2px)'
        }} />
      </div>
      
      <div className="space-y-1.5 relative z-10">
        {/* Song Title - Scrolling effect */}
        <div className="h-5 overflow-hidden">
          <div className="font-['Press_Start_2P'] text-[9px] whitespace-nowrap animate-marquee" style={{ color: theme.displayText }}>
            {songTitle}
          </div>
        </div>
        
        {/* Artist */}
        <div className="font-['Press_Start_2P'] text-[7px] truncate" style={{ color: theme.displayTextDark }}>
          {artist}
        </div>
        
        {/* Progress Bar */}
        <div className="space-y-0.5">
          <div className="h-1.5 border" style={{ backgroundColor: theme.bgLight, borderColor: theme.borderDark }}>
            <div 
              className="h-full transition-all duration-300"
              style={{ width: `${(currentTime / duration) * 100}%`, backgroundColor: theme.borderDark }}
            />
          </div>
          
          {/* Time Display */}
          <div className="flex justify-between font-['Press_Start_2P'] text-[7px]" style={{ color: theme.displayTextDark }}>
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}