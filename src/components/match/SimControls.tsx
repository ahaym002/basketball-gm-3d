import { Pause, Play, FastForward, SkipForward } from 'lucide-react';
import { SimSpeed } from '../../engine/types';
import clsx from 'clsx';

interface Props {
  speed: SimSpeed;
  isPaused: boolean;
  isComplete: boolean;
  onSetSpeed: (speed: SimSpeed) => void;
  onTogglePause: () => void;
  onSimPossession: () => void;
  onSimToQuarter: () => void;
  onSimToEnd: () => void;
}

export default function SimControls({
  speed,
  isPaused,
  isComplete,
  onSetSpeed,
  onTogglePause,
  onSimPossession,
  onSimToQuarter,
  onSimToEnd,
}: Props) {
  if (isComplete) {
    return (
      <div className="bg-surface-100 rounded-xl p-4 text-center">
        <p className="text-lg font-bold text-primary">Game Complete</p>
      </div>
    );
  }
  
  return (
    <div className="bg-surface-100 rounded-xl p-4">
      <div className="flex items-center justify-center gap-2">
        {/* Pause/Play */}
        <button
          onClick={onTogglePause}
          className={clsx(
            'p-2 rounded-lg transition-colors',
            isPaused
              ? 'bg-primary text-white'
              : 'bg-surface-200 hover:bg-surface-300'
          )}
        >
          {isPaused ? <Play size={20} /> : <Pause size={20} />}
        </button>
        
        {/* Speed buttons */}
        {(['1x', '2x', '4x', '8x'] as const).map((s) => (
          <button
            key={s}
            onClick={() => onSetSpeed(s)}
            className={clsx(
              'px-3 py-2 rounded-lg text-sm font-medium transition-colors',
              speed === s && !isPaused
                ? 'bg-primary text-white'
                : 'bg-surface-200 hover:bg-surface-300'
            )}
          >
            {s}
          </button>
        ))}
        
        <div className="w-px h-8 bg-surface-300 mx-2" />
        
        {/* Sim one possession */}
        <button
          onClick={onSimPossession}
          className="px-3 py-2 rounded-lg text-sm font-medium bg-surface-200 hover:bg-surface-300 transition-colors"
          title="Simulate one possession"
        >
          <FastForward size={16} />
        </button>
        
        {/* Sim to quarter end */}
        <button
          onClick={onSimToQuarter}
          className="px-3 py-2 rounded-lg text-sm font-medium bg-surface-200 hover:bg-surface-300 transition-colors"
          title="Simulate to end of quarter"
        >
          Sim Quarter
        </button>
        
        {/* Sim to end */}
        <button
          onClick={onSimToEnd}
          className="px-3 py-2 rounded-lg text-sm font-medium bg-accent-red hover:bg-red-600 transition-colors text-white"
          title="Simulate to end of game"
        >
          <SkipForward size={16} className="inline mr-1" />
          Sim to End
        </button>
      </div>
    </div>
  );
}
