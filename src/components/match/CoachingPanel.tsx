import { useState } from 'react';
import { MatchState, TeamTactics, CourtPlayer } from '../../engine/types';
import { Timer, Users, Settings } from 'lucide-react';
import clsx from 'clsx';

interface Props {
  matchState: MatchState;
  isUserHome: boolean;
  onSubstitution: (playerOut: string, playerIn: string) => void;
  onTimeout: () => void;
  onTacticsChange: (tactics: Partial<TeamTactics>) => void;
}

type Tab = 'lineup' | 'tactics';

export default function CoachingPanel({
  matchState,
  isUserHome,
  onSubstitution,
  onTimeout,
  onTacticsChange,
}: Props) {
  const [activeTab, setActiveTab] = useState<Tab>('lineup');
  const [selectedPlayer, setSelectedPlayer] = useState<string | null>(null);
  
  const team = isUserHome ? matchState.homeTeam : matchState.awayTeam;
  const tactics = isUserHome ? matchState.homeTactics : matchState.awayTactics;
  
  const onCourtPlayers = team.onCourt.map(id => matchState.players[id]).filter(Boolean);
  const benchPlayers = team.bench.map(id => matchState.players[id]).filter(Boolean);
  
  const handlePlayerClick = (playerId: string, isOnCourt: boolean) => {
    if (!selectedPlayer) {
      setSelectedPlayer(playerId);
    } else {
      // Make substitution
      if (isOnCourt) {
        // Clicked player on court, swap with selected bench player
        if (benchPlayers.find(p => p.playerId === selectedPlayer)) {
          onSubstitution(playerId, selectedPlayer);
        }
      } else {
        // Clicked bench player
        if (onCourtPlayers.find(p => p.playerId === selectedPlayer)) {
          onSubstitution(selectedPlayer, playerId);
        }
      }
      setSelectedPlayer(null);
    }
  };
  
  return (
    <div className="bg-surface-100 rounded-xl overflow-hidden">
      {/* Tabs */}
      <div className="flex border-b border-surface-200">
        <button
          onClick={() => setActiveTab('lineup')}
          className={clsx(
            'flex-1 py-3 px-4 text-sm font-medium flex items-center justify-center gap-2',
            activeTab === 'lineup'
              ? 'bg-surface-200 text-white'
              : 'text-gray-400 hover:text-white'
          )}
        >
          <Users size={16} />
          Lineup
        </button>
        <button
          onClick={() => setActiveTab('tactics')}
          className={clsx(
            'flex-1 py-3 px-4 text-sm font-medium flex items-center justify-center gap-2',
            activeTab === 'tactics'
              ? 'bg-surface-200 text-white'
              : 'text-gray-400 hover:text-white'
          )}
        >
          <Settings size={16} />
          Tactics
        </button>
      </div>
      
      <div className="p-4">
        {activeTab === 'lineup' && (
          <div className="space-y-4">
            {/* Timeout button */}
            <button
              onClick={onTimeout}
              disabled={team.timeoutsRemaining <= 0}
              className={clsx(
                'w-full py-2 px-4 rounded-lg text-sm font-medium flex items-center justify-center gap-2',
                team.timeoutsRemaining > 0
                  ? 'bg-yellow-600 hover:bg-yellow-500 text-white'
                  : 'bg-surface-300 text-gray-500 cursor-not-allowed'
              )}
            >
              <Timer size={16} />
              Call Timeout ({team.timeoutsRemaining} left)
            </button>
            
            {/* On Court */}
            <div>
              <h4 className="text-xs text-gray-500 uppercase mb-2">On Court</h4>
              <div className="space-y-1">
                {onCourtPlayers.map((player) => (
                  <PlayerRow
                    key={player.playerId}
                    player={player}
                    isSelected={selectedPlayer === player.playerId}
                    onClick={() => handlePlayerClick(player.playerId, true)}
                  />
                ))}
              </div>
            </div>
            
            {/* Bench */}
            <div>
              <h4 className="text-xs text-gray-500 uppercase mb-2">Bench</h4>
              <div className="space-y-1">
                {benchPlayers.map((player) => (
                  <PlayerRow
                    key={player.playerId}
                    player={player}
                    isSelected={selectedPlayer === player.playerId}
                    onClick={() => handlePlayerClick(player.playerId, false)}
                    isBench
                  />
                ))}
              </div>
            </div>
            
            {selectedPlayer && (
              <p className="text-xs text-gray-500 text-center">
                Click another player to swap
              </p>
            )}
          </div>
        )}
        
        {activeTab === 'tactics' && (
          <div className="space-y-4">
            {/* Pace */}
            <TacticSelector
              label="Pace"
              value={tactics.pace}
              options={[
                { value: 'push', label: 'Push Tempo', desc: 'Fast breaks, quick shots' },
                { value: 'normal', label: 'Normal', desc: 'Balanced approach' },
                { value: 'slow', label: 'Slow Down', desc: 'Control pace, use clock' },
              ]}
              onChange={(v) => onTacticsChange({ pace: v as TeamTactics['pace'] })}
            />
            
            {/* Offense Focus */}
            <TacticSelector
              label="Offense"
              value={tactics.offenseFocus}
              options={[
                { value: 'inside', label: 'Inside', desc: 'Post-ups, drives to basket' },
                { value: 'balanced', label: 'Balanced', desc: 'Read the defense' },
                { value: 'perimeter', label: 'Perimeter', desc: 'Three-pointers, kick-outs' },
              ]}
              onChange={(v) => onTacticsChange({ offenseFocus: v as TeamTactics['offenseFocus'] })}
            />
            
            {/* Defense Scheme */}
            <TacticSelector
              label="Defense"
              value={tactics.defenseScheme}
              options={[
                { value: 'man', label: 'Man-to-Man', desc: 'Standard, versatile' },
                { value: 'zone-23', label: '2-3 Zone', desc: 'Protect the paint' },
                { value: 'zone-32', label: '3-2 Zone', desc: 'Protect perimeter' },
                { value: 'press', label: 'Full Court Press', desc: 'High risk/reward' },
              ]}
              onChange={(v) => onTacticsChange({ defenseScheme: v as TeamTactics['defenseScheme'] })}
            />
          </div>
        )}
      </div>
    </div>
  );
}

function PlayerRow({
  player,
  isSelected,
  onClick,
  isBench,
}: {
  player: CourtPlayer;
  isSelected: boolean;
  onClick: () => void;
  isBench?: boolean;
}) {
  const fatigueColor = player.fatigue > 70 ? 'text-red-500' : player.fatigue > 40 ? 'text-yellow-500' : 'text-green-500';
  
  return (
    <button
      onClick={onClick}
      className={clsx(
        'w-full flex items-center gap-2 p-2 rounded-lg text-left transition-colors',
        isSelected
          ? 'bg-primary/30 ring-2 ring-primary'
          : 'hover:bg-surface-200',
        isBench && 'opacity-75'
      )}
    >
      <span className="w-6 h-6 rounded-full bg-surface-300 flex items-center justify-center text-xs font-bold">
        {player.jerseyNumber}
      </span>
      
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">
          {player.playerId.split('-').slice(0, 2).join(' ')}
        </p>
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <span>{Math.round(player.shooting)} OVR</span>
          {player.fouls >= 4 && (
            <span className="text-yellow-500">⚠️ {player.fouls} fouls</span>
          )}
        </div>
      </div>
      
      {/* Fatigue bar */}
      <div className="w-12">
        <div className="h-1.5 bg-surface-300 rounded-full overflow-hidden">
          <div
            className={clsx(
              'h-full rounded-full transition-all',
              player.fatigue > 70 ? 'bg-red-500' : player.fatigue > 40 ? 'bg-yellow-500' : 'bg-green-500'
            )}
            style={{ width: `${100 - player.fatigue}%` }}
          />
        </div>
        <p className={clsx('text-xs text-center', fatigueColor)}>
          {Math.round(100 - player.fatigue)}%
        </p>
      </div>
      
      {/* Stats */}
      <div className="text-right text-xs">
        <p className="font-medium">{player.stats.points} pts</p>
        <p className="text-gray-500">{player.stats.rebounds}r {player.stats.assists}a</p>
      </div>
    </button>
  );
}

function TacticSelector({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: { value: string; label: string; desc: string }[];
  onChange: (value: string) => void;
}) {
  return (
    <div>
      <h4 className="text-xs text-gray-500 uppercase mb-2">{label}</h4>
      <div className="grid gap-1">
        {options.map((opt) => (
          <button
            key={opt.value}
            onClick={() => onChange(opt.value)}
            className={clsx(
              'w-full p-2 rounded-lg text-left transition-colors',
              value === opt.value
                ? 'bg-primary text-white'
                : 'bg-surface-200 hover:bg-surface-300'
            )}
          >
            <p className="text-sm font-medium">{opt.label}</p>
            <p className="text-xs opacity-70">{opt.desc}</p>
          </button>
        ))}
      </div>
    </div>
  );
}
