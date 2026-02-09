import { MatchState, TeamTactics, CourtPlayer } from '../../engine/types';
import { X } from 'lucide-react';
import clsx from 'clsx';

interface Props {
  matchState: MatchState;
  isOpen: boolean;
  onClose: () => void;
  onSubstitution: (playerOut: string, playerIn: string) => void;
  onTacticsChange: (tactics: Partial<TeamTactics>) => void;
  isUserHome: boolean;
}

export default function TimeoutModal({
  matchState,
  isOpen,
  onClose,
  onSubstitution,
  onTacticsChange,
  isUserHome,
}: Props) {
  if (!isOpen) return null;
  
  const team = isUserHome ? matchState.homeTeam : matchState.awayTeam;
  const oppTeam = isUserHome ? matchState.awayTeam : matchState.homeTeam;
  
  const onCourtPlayers = team.onCourt.map(id => matchState.players[id]).filter(Boolean);
  const benchPlayers = team.bench.map(id => matchState.players[id]).filter(Boolean);
  
  const scoreDiff = team.score - oppTeam.score;
  const suggestions = getCoachSuggestions(matchState, isUserHome);
  
  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-surface-100 rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-surface-200">
          <div>
            <h2 className="text-xl font-bold">⏸️ Timeout</h2>
            <p className="text-gray-400 text-sm">
              Q{matchState.clock.quarter} • {Math.floor(matchState.clock.timeRemaining / 60)}:
              {Math.floor(matchState.clock.timeRemaining % 60).toString().padStart(2, '0')}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-surface-200 rounded-lg"
          >
            <X size={20} />
          </button>
        </div>
        
        {/* Score */}
        <div className="p-4 bg-surface-200 text-center">
          <p className="text-3xl font-bold">
            <span className={scoreDiff >= 0 ? 'text-primary' : ''}>
              {team.score}
            </span>
            {' - '}
            <span className={scoreDiff < 0 ? 'text-accent-red' : ''}>
              {oppTeam.score}
            </span>
          </p>
          <p className="text-sm text-gray-400 mt-1">
            {scoreDiff > 0 ? `Leading by ${scoreDiff}` : scoreDiff < 0 ? `Trailing by ${Math.abs(scoreDiff)}` : 'Tied'}
          </p>
        </div>
        
        {/* Coach Suggestions */}
        {suggestions.length > 0 && (
          <div className="p-4 border-b border-surface-200">
            <h3 className="text-sm font-semibold text-gray-400 mb-2">💡 Coach's Notes</h3>
            <div className="space-y-2">
              {suggestions.map((s, i) => (
                <p key={i} className="text-sm bg-surface-200 p-2 rounded">
                  {s}
                </p>
              ))}
            </div>
          </div>
        )}
        
        {/* Current Lineup */}
        <div className="p-4">
          <h3 className="text-sm font-semibold text-gray-400 mb-3">On Court</h3>
          <div className="grid grid-cols-5 gap-2">
            {onCourtPlayers.map((player) => (
              <div
                key={player.playerId}
                className="bg-surface-200 rounded-lg p-2 text-center"
              >
                <div className="text-2xl font-bold">{player.jerseyNumber}</div>
                <div className="text-xs text-gray-400 truncate">
                  {player.playerId.split('-')[0]}
                </div>
                <div className="mt-1 text-xs">
                  <span className="font-medium">{player.stats.points}</span>
                  <span className="text-gray-500"> pts</span>
                </div>
                <div className={clsx(
                  'text-xs mt-1',
                  player.fatigue > 60 ? 'text-red-500' : player.fatigue > 30 ? 'text-yellow-500' : 'text-green-500'
                )}>
                  {Math.round(100 - player.fatigue)}% energy
                </div>
              </div>
            ))}
          </div>
        </div>
        
        {/* Quick Subs */}
        <div className="p-4 border-t border-surface-200">
          <h3 className="text-sm font-semibold text-gray-400 mb-3">Quick Substitutions</h3>
          <div className="space-y-2">
            {getRecommendedSubs(onCourtPlayers, benchPlayers).map((sub, i) => (
              <button
                key={i}
                onClick={() => onSubstitution(sub.out.playerId, sub.in.playerId)}
                className="w-full flex items-center justify-between p-3 bg-surface-200 hover:bg-surface-300 rounded-lg transition-colors"
              >
                <div className="flex items-center gap-2">
                  <span className="text-red-400">OUT</span>
                  <span>#{sub.out.jerseyNumber}</span>
                  <span className="text-gray-400">({Math.round(100 - sub.out.fatigue)}%)</span>
                </div>
                <div>→</div>
                <div className="flex items-center gap-2">
                  <span className="text-green-400">IN</span>
                  <span>#{sub.in.jerseyNumber}</span>
                  <span className="text-gray-400">({Math.round(100 - sub.in.fatigue)}%)</span>
                </div>
              </button>
            ))}
          </div>
        </div>
        
        {/* Resume button */}
        <div className="p-4 border-t border-surface-200">
          <button
            onClick={onClose}
            className="w-full py-3 bg-primary hover:bg-primary/80 rounded-lg font-semibold transition-colors"
          >
            Resume Game
          </button>
        </div>
      </div>
    </div>
  );
}

function getCoachSuggestions(state: MatchState, isUserHome: boolean): string[] {
  const suggestions: string[] = [];
  const team = isUserHome ? state.homeTeam : state.awayTeam;
  const oppTeam = isUserHome ? state.awayTeam : state.homeTeam;
  const players = team.onCourt.map(id => state.players[id]).filter(Boolean);
  
  // Check for tired players
  const tiredPlayers = players.filter(p => p.fatigue > 60);
  if (tiredPlayers.length > 0) {
    suggestions.push(`Consider resting #${tiredPlayers[0].jerseyNumber} - showing fatigue.`);
  }
  
  // Check for foul trouble
  const foulTrouble = players.filter(p => p.fouls >= 4);
  if (foulTrouble.length > 0) {
    suggestions.push(`#${foulTrouble[0].jerseyNumber} in foul trouble with ${foulTrouble[0].fouls} fouls.`);
  }
  
  // Check opponent momentum
  if (oppTeam.momentum > 50) {
    suggestions.push("Opponent has momentum - good timeout to slow them down.");
  }
  
  // Check score differential
  const diff = team.score - oppTeam.score;
  if (diff < -10 && state.clock.quarter >= 3) {
    suggestions.push("Consider pushing tempo and looking for threes.");
  }
  if (diff > 10 && state.clock.quarter >= 3) {
    suggestions.push("Control the pace and protect the lead.");
  }
  
  return suggestions.slice(0, 3);
}

function getRecommendedSubs(
  onCourt: CourtPlayer[],
  bench: CourtPlayer[]
): { out: CourtPlayer; in: CourtPlayer }[] {
  const subs: { out: CourtPlayer; in: CourtPlayer; priority: number }[] = [];
  
  // Find tired or foul-troubled players
  for (const player of onCourt) {
    if (player.fatigue > 50 || player.fouls >= 4) {
      // Find a rested bench player
      const replacement = bench
        .filter(b => b.fatigue < 40)
        .sort((a, b) => b.shooting - a.shooting)[0];
      
      if (replacement) {
        subs.push({
          out: player,
          in: replacement,
          priority: player.fouls >= 4 ? 100 : player.fatigue,
        });
      }
    }
  }
  
  return subs
    .sort((a, b) => b.priority - a.priority)
    .slice(0, 3)
    .map(({ out, in: replacement }) => ({ out, in: replacement }));
}
