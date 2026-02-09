import { useMemo } from 'react';
import { MatchState, CourtPlayer, COURT } from '../../engine/types';

interface Props {
  matchState: MatchState;
  homeColor: string;
  awayColor: string;
}

// Court dimensions for SVG (scaled)
const SCALE = 8;
const SVG_WIDTH = COURT.width * SCALE;
const SVG_HEIGHT = COURT.length * SCALE;
const CENTER_X = SVG_WIDTH / 2;
const CENTER_Y = SVG_HEIGHT / 2;

// Convert court position to SVG coordinates
function toSVG(pos: { x: number; y: number }): { x: number; y: number } {
  return {
    x: CENTER_X + pos.x * SCALE,
    y: CENTER_Y - pos.y * SCALE, // Flip Y axis
  };
}

export default function CourtVisualization({ matchState, homeColor, awayColor }: Props) {
  const players = useMemo(() => {
    const homePlayers: CourtPlayer[] = [];
    const awayPlayers: CourtPlayer[] = [];
    
    for (const id of matchState.homeTeam.onCourt) {
      if (matchState.players[id]) {
        homePlayers.push(matchState.players[id]);
      }
    }
    
    for (const id of matchState.awayTeam.onCourt) {
      if (matchState.players[id]) {
        awayPlayers.push(matchState.players[id]);
      }
    }
    
    return { home: homePlayers, away: awayPlayers };
  }, [matchState]);

  const ballPos = toSVG(matchState.ball.position);

  return (
    <svg
      viewBox={`0 0 ${SVG_WIDTH} ${SVG_HEIGHT}`}
      className="w-full h-full"
      style={{ maxHeight: '500px' }}
    >
      {/* Court background */}
      <rect x="0" y="0" width={SVG_WIDTH} height={SVG_HEIGHT} fill="#B8642E" />
      
      {/* Court lines */}
      <rect x="4" y="4" width={SVG_WIDTH - 8} height={SVG_HEIGHT - 8} fill="none" stroke="#fff" strokeWidth="2" />
      
      {/* Center line */}
      <line x1="4" y1={CENTER_Y} x2={SVG_WIDTH - 4} y2={CENTER_Y} stroke="#fff" strokeWidth="2" />
      
      {/* Center circle */}
      <circle cx={CENTER_X} cy={CENTER_Y} r={6 * SCALE} fill="none" stroke="#fff" strokeWidth="2" />
      
      {/* Top three-point arc */}
      <path
        d={`M ${4 + 3 * SCALE} ${4}
            L ${4 + 3 * SCALE} ${4 + 14 * SCALE}
            A ${COURT.threePointRadius * SCALE} ${COURT.threePointRadius * SCALE} 0 0 0 ${SVG_WIDTH - 4 - 3 * SCALE} ${4 + 14 * SCALE}
            L ${SVG_WIDTH - 4 - 3 * SCALE} ${4}`}
        fill="none"
        stroke="#fff"
        strokeWidth="2"
      />
      
      {/* Bottom three-point arc */}
      <path
        d={`M ${4 + 3 * SCALE} ${SVG_HEIGHT - 4}
            L ${4 + 3 * SCALE} ${SVG_HEIGHT - 4 - 14 * SCALE}
            A ${COURT.threePointRadius * SCALE} ${COURT.threePointRadius * SCALE} 0 0 1 ${SVG_WIDTH - 4 - 3 * SCALE} ${SVG_HEIGHT - 4 - 14 * SCALE}
            L ${SVG_WIDTH - 4 - 3 * SCALE} ${SVG_HEIGHT - 4}`}
        fill="none"
        stroke="#fff"
        strokeWidth="2"
      />
      
      {/* Top key */}
      <rect
        x={CENTER_X - (COURT.keyWidth / 2) * SCALE}
        y={4}
        width={COURT.keyWidth * SCALE}
        height={COURT.keyLength * SCALE}
        fill="none"
        stroke="#fff"
        strokeWidth="2"
      />
      
      {/* Bottom key */}
      <rect
        x={CENTER_X - (COURT.keyWidth / 2) * SCALE}
        y={SVG_HEIGHT - 4 - COURT.keyLength * SCALE}
        width={COURT.keyWidth * SCALE}
        height={COURT.keyLength * SCALE}
        fill="none"
        stroke="#fff"
        strokeWidth="2"
      />
      
      {/* Top free throw circle */}
      <circle
        cx={CENTER_X}
        cy={4 + COURT.keyLength * SCALE}
        r={6 * SCALE}
        fill="none"
        stroke="#fff"
        strokeWidth="2"
        strokeDasharray="10,10"
      />
      
      {/* Bottom free throw circle */}
      <circle
        cx={CENTER_X}
        cy={SVG_HEIGHT - 4 - COURT.keyLength * SCALE}
        r={6 * SCALE}
        fill="none"
        stroke="#fff"
        strokeWidth="2"
        strokeDasharray="10,10"
      />
      
      {/* Top basket */}
      <circle
        cx={CENTER_X}
        cy={4 + 5 * SCALE}
        r={4}
        fill="#FF6B35"
        stroke="#fff"
        strokeWidth="2"
      />
      
      {/* Bottom basket */}
      <circle
        cx={CENTER_X}
        cy={SVG_HEIGHT - 4 - 5 * SCALE}
        r={4}
        fill="#FF6B35"
        stroke="#fff"
        strokeWidth="2"
      />
      
      {/* Home players */}
      {players.home.map((player, i) => {
        const pos = toSVG(player.position);
        return (
          <g key={player.playerId}>
            <circle
              cx={pos.x}
              cy={pos.y}
              r={12}
              fill={homeColor}
              stroke={player.hasBall ? '#FFD700' : '#fff'}
              strokeWidth={player.hasBall ? 3 : 2}
            />
            <text
              x={pos.x}
              y={pos.y + 4}
              textAnchor="middle"
              fill="#fff"
              fontSize="10"
              fontWeight="bold"
            >
              {player.jerseyNumber}
            </text>
            {player.isHot && (
              <text x={pos.x + 10} y={pos.y - 10} fontSize="12">🔥</text>
            )}
            {player.isCold && (
              <text x={pos.x + 10} y={pos.y - 10} fontSize="12">❄️</text>
            )}
          </g>
        );
      })}
      
      {/* Away players */}
      {players.away.map((player, i) => {
        const pos = toSVG(player.position);
        return (
          <g key={player.playerId}>
            <circle
              cx={pos.x}
              cy={pos.y}
              r={12}
              fill={awayColor}
              stroke={player.hasBall ? '#FFD700' : '#fff'}
              strokeWidth={player.hasBall ? 3 : 2}
            />
            <text
              x={pos.x}
              y={pos.y + 4}
              textAnchor="middle"
              fill="#fff"
              fontSize="10"
              fontWeight="bold"
            >
              {player.jerseyNumber}
            </text>
            {player.isHot && (
              <text x={pos.x + 10} y={pos.y - 10} fontSize="12">🔥</text>
            )}
            {player.isCold && (
              <text x={pos.x + 10} y={pos.y - 10} fontSize="12">❄️</text>
            )}
          </g>
        );
      })}
      
      {/* Ball (when not held) */}
      {matchState.ball.state !== 'held' && (
        <circle
          cx={ballPos.x}
          cy={ballPos.y}
          r={6}
          fill="#FF6B00"
          stroke="#000"
          strokeWidth="1"
        />
      )}
      
      {/* Possession indicator */}
      <g transform={`translate(${CENTER_X}, ${CENTER_Y})`}>
        <circle
          cx={0}
          cy={0}
          r={8}
          fill={matchState.homeTeam.possession ? homeColor : awayColor}
          opacity="0.8"
        />
      </g>
    </svg>
  );
}
