import { useRef, useEffect } from 'react';
import { PlayByPlayEntry } from '../../engine/types';
import clsx from 'clsx';

interface Props {
  entries: PlayByPlayEntry[];
  homeTeamId: string;
  homeColor: string;
  awayColor: string;
}

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

function getActionIcon(action: PlayByPlayEntry['action']): string {
  switch (action) {
    case 'made_shot':
    case 'made_three':
      return '🏀';
    case 'missed_shot':
    case 'missed_three':
      return '❌';
    case 'made_ft':
      return '✓';
    case 'missed_ft':
      return '○';
    case 'offensive_rebound':
    case 'defensive_rebound':
      return '📥';
    case 'assist':
      return '👏';
    case 'steal':
      return '🔥';
    case 'block':
      return '🚫';
    case 'turnover':
      return '💨';
    case 'foul':
      return '⚠️';
    case 'timeout':
      return '⏸️';
    case 'substitution':
      return '🔄';
    case 'quarter_start':
    case 'quarter_end':
      return '🏁';
    case 'game_start':
    case 'game_end':
      return '🎮';
    default:
      return '•';
  }
}

export default function PlayByPlay({ entries, homeTeamId, homeColor, awayColor }: Props) {
  const scrollRef = useRef<HTMLDivElement>(null);
  
  // Auto-scroll to bottom when new entries added
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [entries.length]);
  
  // Show last 50 entries, reversed (newest at bottom)
  const displayEntries = entries.slice(-50);
  
  return (
    <div className="bg-surface-100 rounded-xl h-full flex flex-col">
      <div className="p-3 border-b border-surface-200">
        <h3 className="font-semibold text-sm">Play-by-Play</h3>
      </div>
      
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-2 space-y-1"
        style={{ maxHeight: '400px' }}
      >
        {displayEntries.map((entry) => {
          const isHome = entry.teamId === homeTeamId;
          const color = entry.teamId ? (isHome ? homeColor : awayColor) : undefined;
          
          return (
            <div
              key={entry.id}
              className={clsx(
                'flex items-start gap-2 p-2 rounded text-sm',
                entry.isImportant && 'bg-surface-200'
              )}
            >
              {/* Quarter & Time */}
              <div className="text-xs text-gray-500 w-14 flex-shrink-0">
                <span className="font-medium">Q{entry.quarter}</span>
                <span className="ml-1">{formatTime(entry.time)}</span>
              </div>
              
              {/* Team indicator */}
              {color && (
                <div
                  className="w-2 h-2 rounded-full mt-1.5 flex-shrink-0"
                  style={{ backgroundColor: color }}
                />
              )}
              
              {/* Icon */}
              <span className="flex-shrink-0">{getActionIcon(entry.action)}</span>
              
              {/* Description */}
              <p className={clsx(
                'flex-1',
                entry.isImportant && 'font-medium'
              )}>
                {entry.description}
              </p>
              
              {/* Score */}
              <div className="text-xs text-gray-500 flex-shrink-0">
                {entry.homeScore}-{entry.awayScore}
              </div>
            </div>
          );
        })}
        
        {displayEntries.length === 0 && (
          <p className="text-center text-gray-500 py-4">
            Game starting...
          </p>
        )}
      </div>
    </div>
  );
}
