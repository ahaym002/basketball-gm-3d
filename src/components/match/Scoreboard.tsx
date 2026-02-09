import { MatchState } from '../../engine/types';
import clsx from 'clsx';

interface Props {
  matchState: MatchState;
  homeTeamName: string;
  awayTeamName: string;
  homeColor: string;
  awayColor: string;
}

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export default function Scoreboard({
  matchState,
  homeTeamName,
  awayTeamName,
  homeColor,
  awayColor,
}: Props) {
  const { clock, homeTeam, awayTeam } = matchState;
  
  const quarterLabel = clock.quarter <= 4 
    ? `Q${clock.quarter}` 
    : `OT${clock.quarter - 4}`;
  
  return (
    <div className="bg-surface-100 rounded-xl p-4">
      <div className="flex items-center justify-between gap-4">
        {/* Home Team */}
        <div className="flex items-center gap-3 flex-1">
          <div
            className="w-12 h-12 rounded-lg flex items-center justify-center text-white font-bold text-lg"
            style={{ backgroundColor: homeColor }}
          >
            {homeTeamName.slice(0, 3).toUpperCase()}
          </div>
          <div>
            <p className="font-medium text-gray-300">{homeTeamName}</p>
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <span>TO: {homeTeam.timeoutsRemaining}</span>
              <span>•</span>
              <span>Fouls: {homeTeam.teamFouls}</span>
              {homeTeam.inBonus && <span className="text-yellow-500">BONUS</span>}
            </div>
          </div>
        </div>
        
        {/* Score */}
        <div className="text-center">
          <div className="flex items-center gap-4">
            <span className={clsx(
              'text-4xl font-bold',
              homeTeam.possession && 'text-primary'
            )}>
              {homeTeam.score}
            </span>
            <span className="text-2xl text-gray-500">-</span>
            <span className={clsx(
              'text-4xl font-bold',
              awayTeam.possession && 'text-primary'
            )}>
              {awayTeam.score}
            </span>
          </div>
        </div>
        
        {/* Away Team */}
        <div className="flex items-center gap-3 flex-1 justify-end">
          <div className="text-right">
            <p className="font-medium text-gray-300">{awayTeamName}</p>
            <div className="flex items-center gap-2 text-xs text-gray-500 justify-end">
              {awayTeam.inBonus && <span className="text-yellow-500">BONUS</span>}
              <span>Fouls: {awayTeam.teamFouls}</span>
              <span>•</span>
              <span>TO: {awayTeam.timeoutsRemaining}</span>
            </div>
          </div>
          <div
            className="w-12 h-12 rounded-lg flex items-center justify-center text-white font-bold text-lg"
            style={{ backgroundColor: awayColor }}
          >
            {awayTeamName.slice(0, 3).toUpperCase()}
          </div>
        </div>
      </div>
      
      {/* Clock */}
      <div className="flex items-center justify-center gap-6 mt-4 pt-4 border-t border-surface-200">
        <div className="text-center">
          <p className="text-xs text-gray-500">Quarter</p>
          <p className="text-xl font-bold text-primary">{quarterLabel}</p>
        </div>
        <div className="text-center">
          <p className="text-xs text-gray-500">Time</p>
          <p className="text-xl font-mono font-bold">{formatTime(clock.timeRemaining)}</p>
        </div>
        <div className="text-center">
          <p className="text-xs text-gray-500">Shot Clock</p>
          <p className={clsx(
            'text-xl font-mono font-bold',
            clock.shotClock <= 5 && 'text-accent-red'
          )}>
            {Math.ceil(clock.shotClock)}
          </p>
        </div>
        
        {/* Momentum indicators */}
        <div className="flex gap-4 ml-4">
          <div className="text-center">
            <p className="text-xs text-gray-500">Momentum</p>
            <div className="flex items-center gap-2 mt-1">
              <div 
                className="h-2 rounded-full"
                style={{ 
                  width: `${Math.abs(homeTeam.momentum)}px`,
                  backgroundColor: homeTeam.momentum > 0 ? homeColor : '#444',
                  minWidth: '4px'
                }}
              />
              <span className="text-xs">{homeTeam.momentum > 0 ? '🔥' : ''}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
