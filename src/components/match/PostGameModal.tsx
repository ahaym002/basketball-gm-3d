import { MatchState, CourtPlayer } from '../../engine/types';
import { BoxScoreStats } from '../../gm/types';
import { Trophy, TrendingUp, X } from 'lucide-react';
import clsx from 'clsx';

interface Props {
  matchState: MatchState;
  isOpen: boolean;
  onClose: () => void;
  homeTeamName: string;
  awayTeamName: string;
  homeColor: string;
  awayColor: string;
  playerNames: Record<string, string>;
}

export default function PostGameModal({
  matchState,
  isOpen,
  onClose,
  homeTeamName,
  awayTeamName,
  homeColor,
  awayColor,
  playerNames,
}: Props) {
  if (!isOpen || !matchState.isComplete) return null;
  
  const homeWon = matchState.homeTeam.score > matchState.awayTeam.score;
  
  // Collect stats
  const homeStats = getTeamStats(matchState, matchState.homeTeam.teamId);
  const awayStats = getTeamStats(matchState, matchState.awayTeam.teamId);
  
  // Find top performers
  const mvpHome = homeStats.sort((a, b) => calculateGameScore(b) - calculateGameScore(a))[0];
  const mvpAway = awayStats.sort((a, b) => calculateGameScore(b) - calculateGameScore(a))[0];
  
  // Key plays
  const keyPlays = matchState.playByPlay.filter(p => p.isImportant).slice(-5);
  
  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-surface-100 rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-surface-200">
          <div className="flex items-center gap-3">
            <Trophy className="text-yellow-500" size={24} />
            <h2 className="text-xl font-bold">Game Complete</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-surface-200 rounded-lg"
          >
            <X size={20} />
          </button>
        </div>
        
        {/* Final Score */}
        <div className="p-6 bg-gradient-to-r from-surface-200 to-surface-100">
          <div className="flex items-center justify-center gap-8">
            <div className={clsx('text-center', homeWon && 'scale-110')}>
              <div
                className="w-16 h-16 rounded-xl flex items-center justify-center text-white font-bold text-xl mx-auto mb-2"
                style={{ backgroundColor: homeColor }}
              >
                {homeTeamName.slice(0, 3).toUpperCase()}
              </div>
              <p className="font-medium text-gray-300">{homeTeamName}</p>
              <p className={clsx('text-4xl font-bold mt-1', homeWon && 'text-primary')}>
                {matchState.homeTeam.score}
              </p>
              {homeWon && <span className="text-xs text-primary font-bold">WINNER</span>}
            </div>
            
            <div className="text-2xl text-gray-500">FINAL</div>
            
            <div className={clsx('text-center', !homeWon && 'scale-110')}>
              <div
                className="w-16 h-16 rounded-xl flex items-center justify-center text-white font-bold text-xl mx-auto mb-2"
                style={{ backgroundColor: awayColor }}
              >
                {awayTeamName.slice(0, 3).toUpperCase()}
              </div>
              <p className="font-medium text-gray-300">{awayTeamName}</p>
              <p className={clsx('text-4xl font-bold mt-1', !homeWon && 'text-primary')}>
                {matchState.awayTeam.score}
              </p>
              {!homeWon && <span className="text-xs text-primary font-bold">WINNER</span>}
            </div>
          </div>
        </div>
        
        {/* Top Performers */}
        <div className="p-4 border-b border-surface-200">
          <h3 className="text-sm font-semibold text-gray-400 mb-3 flex items-center gap-2">
            <TrendingUp size={16} />
            Top Performers
          </h3>
          <div className="grid grid-cols-2 gap-4">
            {mvpHome && (
              <TopPerformer
                player={mvpHome}
                playerName={playerNames[mvpHome.playerId] || mvpHome.playerId}
                teamColor={homeColor}
                grade={calculateGrade(mvpHome)}
              />
            )}
            {mvpAway && (
              <TopPerformer
                player={mvpAway}
                playerName={playerNames[mvpAway.playerId] || mvpAway.playerId}
                teamColor={awayColor}
                grade={calculateGrade(mvpAway)}
              />
            )}
          </div>
        </div>
        
        {/* Box Score */}
        <div className="p-4">
          <h3 className="text-sm font-semibold text-gray-400 mb-3">Box Score</h3>
          
          {/* Home Team */}
          <div className="mb-4">
            <div className="flex items-center gap-2 mb-2">
              <div
                className="w-4 h-4 rounded"
                style={{ backgroundColor: homeColor }}
              />
              <span className="font-medium">{homeTeamName}</span>
            </div>
            <BoxScoreTable 
              stats={homeStats} 
              playerNames={playerNames}
            />
          </div>
          
          {/* Away Team */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div
                className="w-4 h-4 rounded"
                style={{ backgroundColor: awayColor }}
              />
              <span className="font-medium">{awayTeamName}</span>
            </div>
            <BoxScoreTable 
              stats={awayStats}
              playerNames={playerNames}
            />
          </div>
        </div>
        
        {/* Key Plays */}
        {keyPlays.length > 0 && (
          <div className="p-4 border-t border-surface-200">
            <h3 className="text-sm font-semibold text-gray-400 mb-3">Key Moments</h3>
            <div className="space-y-2">
              {keyPlays.map((play) => (
                <div key={play.id} className="text-sm bg-surface-200 p-2 rounded flex justify-between">
                  <span>{play.description}</span>
                  <span className="text-gray-500">
                    Q{play.quarter} {Math.floor(play.time / 60)}:{Math.floor(play.time % 60).toString().padStart(2, '0')}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* Close button */}
        <div className="p-4 border-t border-surface-200">
          <button
            onClick={onClose}
            className="w-full py-3 bg-primary hover:bg-primary/80 rounded-lg font-semibold transition-colors"
          >
            Continue
          </button>
        </div>
      </div>
    </div>
  );
}

function TopPerformer({
  player,
  playerName,
  teamColor,
  grade,
}: {
  player: CourtPlayer;
  playerName: string;
  teamColor: string;
  grade: string;
}) {
  return (
    <div className="bg-surface-200 rounded-lg p-3 flex items-center gap-3">
      <div
        className="w-12 h-12 rounded-lg flex items-center justify-center text-white font-bold"
        style={{ backgroundColor: teamColor }}
      >
        {player.jerseyNumber}
      </div>
      <div className="flex-1">
        <p className="font-medium">{playerName}</p>
        <p className="text-sm text-gray-400">
          {player.stats.points} pts, {player.stats.rebounds} reb, {player.stats.assists} ast
        </p>
      </div>
      <div className={clsx(
        'text-2xl font-bold',
        grade.startsWith('A') ? 'text-green-500' :
        grade.startsWith('B') ? 'text-primary' :
        grade.startsWith('C') ? 'text-yellow-500' :
        'text-red-500'
      )}>
        {grade}
      </div>
    </div>
  );
}

function BoxScoreTable({
  stats,
  playerNames,
}: {
  stats: CourtPlayer[];
  playerNames: Record<string, string>;
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-gray-500 text-xs">
            <th className="text-left py-1 px-2">Player</th>
            <th className="text-right py-1 px-1">MIN</th>
            <th className="text-right py-1 px-1">PTS</th>
            <th className="text-right py-1 px-1">REB</th>
            <th className="text-right py-1 px-1">AST</th>
            <th className="text-right py-1 px-1">STL</th>
            <th className="text-right py-1 px-1">BLK</th>
            <th className="text-right py-1 px-1">FG</th>
            <th className="text-right py-1 px-1">3P</th>
            <th className="text-right py-1 px-1">FT</th>
          </tr>
        </thead>
        <tbody>
          {stats
            .filter(p => p.stats.minutes > 0)
            .sort((a, b) => b.stats.minutes - a.stats.minutes)
            .map((player) => (
              <tr key={player.playerId} className="border-t border-surface-300">
                <td className="py-1.5 px-2 font-medium">
                  {playerNames[player.playerId] || `#${player.jerseyNumber}`}
                </td>
                <td className="text-right py-1 px-1">{Math.round(player.stats.minutes)}</td>
                <td className="text-right py-1 px-1 font-medium">{player.stats.points}</td>
                <td className="text-right py-1 px-1">{player.stats.rebounds}</td>
                <td className="text-right py-1 px-1">{player.stats.assists}</td>
                <td className="text-right py-1 px-1">{player.stats.steals}</td>
                <td className="text-right py-1 px-1">{player.stats.blocks}</td>
                <td className="text-right py-1 px-1 text-gray-400">
                  {player.stats.fgm}-{player.stats.fga}
                </td>
                <td className="text-right py-1 px-1 text-gray-400">
                  {player.stats.tpm}-{player.stats.tpa}
                </td>
                <td className="text-right py-1 px-1 text-gray-400">
                  {player.stats.ftm}-{player.stats.fta}
                </td>
              </tr>
            ))}
        </tbody>
      </table>
    </div>
  );
}

function getTeamStats(state: MatchState, teamId: string): CourtPlayer[] {
  const team = state.homeTeam.teamId === teamId ? state.homeTeam : state.awayTeam;
  return [...team.onCourt, ...team.bench]
    .map(id => state.players[id])
    .filter(Boolean);
}

function calculateGameScore(player: CourtPlayer): number {
  const s = player.stats;
  return s.points + s.rebounds * 1.2 + s.assists * 1.5 + s.steals * 2 + s.blocks * 2 - s.turnovers;
}

function calculateGrade(player: CourtPlayer): string {
  const score = calculateGameScore(player);
  
  if (score >= 35) return 'A+';
  if (score >= 28) return 'A';
  if (score >= 22) return 'A-';
  if (score >= 18) return 'B+';
  if (score >= 14) return 'B';
  if (score >= 10) return 'B-';
  if (score >= 7) return 'C+';
  if (score >= 4) return 'C';
  if (score >= 2) return 'C-';
  if (score >= 0) return 'D';
  return 'F';
}
