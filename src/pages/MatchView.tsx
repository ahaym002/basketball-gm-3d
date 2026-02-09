import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useGameStore } from '../store/gameStore';
import { useMatchStore } from '../store/matchStore';
import { ArrowLeft } from 'lucide-react';

import CourtVisualization from '../components/match/CourtVisualization';
import Scoreboard from '../components/match/Scoreboard';
import PlayByPlay from '../components/match/PlayByPlay';
import SimControls from '../components/match/SimControls';
import CoachingPanel from '../components/match/CoachingPanel';
import TimeoutModal from '../components/match/TimeoutModal';
import PostGameModal from '../components/match/PostGameModal';

export default function MatchView() {
  const navigate = useNavigate();
  const { gameId } = useParams<{ gameId: string }>();
  
  const { state, getTeamPlayers, getTeam } = useGameStore();
  const {
    matchState,
    isLoading,
    showTimeoutModal,
    showPostGameModal,
    startMatch,
    endMatch,
    setSimSpeed,
    togglePause,
    simulatePossession,
    simulateToQuarter,
    simulateToEnd,
    makeSubstitution,
    callTimeout,
    updateTactics,
    setShowTimeoutModal,
    setShowPostGameModal,
    getBoxScore,
  } = useMatchStore();
  
  const simIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const [initialized, setInitialized] = useState(false);
  
  // Initialize match
  useEffect(() => {
    if (!state || !gameId || initialized) return;
    
    // Find the game
    const game = state.currentSeason.schedule.find(g => g.id === gameId);
    if (!game) {
      navigate('/schedule');
      return;
    }
    
    // Already played
    if (game.played) {
      navigate('/schedule');
      return;
    }
    
    const homeTeam = getTeam(game.homeTeamId);
    const awayTeam = getTeam(game.awayTeamId);
    const homePlayers = getTeamPlayers(game.homeTeamId);
    const awayPlayers = getTeamPlayers(game.awayTeamId);
    
    if (!homeTeam || !awayTeam) {
      navigate('/schedule');
      return;
    }
    
    startMatch(gameId, homeTeam, awayTeam, homePlayers, awayPlayers);
    setInitialized(true);
    
    return () => {
      // Clean up
    };
  }, [state, gameId, initialized]);
  
  // Auto-simulation loop
  useEffect(() => {
    if (!matchState) return;
    
    if (simIntervalRef.current) {
      clearInterval(simIntervalRef.current);
      simIntervalRef.current = null;
    }
    
    if (!matchState.isPaused && !matchState.isComplete && matchState.simSpeed !== 'paused') {
      const speedMs = {
        '1x': 1000,
        '2x': 500,
        '4x': 250,
        '8x': 125,
        'instant': 10,
      }[matchState.simSpeed] || 1000;
      
      simIntervalRef.current = setInterval(() => {
        simulatePossession();
      }, speedMs);
    }
    
    return () => {
      if (simIntervalRef.current) {
        clearInterval(simIntervalRef.current);
      }
    };
  }, [matchState?.isPaused, matchState?.simSpeed, matchState?.isComplete]);
  
  // Handle game end
  const handleGameEnd = () => {
    setShowPostGameModal(false);
    
    // Update the game in state - record the result in gameStore
    if (matchState && gameId) {
      const boxScore = getBoxScore();
      const { recordGameResult } = useGameStore.getState();
      recordGameResult(
        gameId,
        matchState.homeTeam.score,
        matchState.awayTeam.score,
        boxScore
      );
    }
    
    endMatch();
    navigate('/schedule');
  };
  
  if (!matchState || !state) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-gray-400">Loading match...</p>
        </div>
      </div>
    );
  }
  
  // Get team info
  const homeTeam = getTeam(matchState.homeTeam.teamId);
  const awayTeam = getTeam(matchState.awayTeam.teamId);
  
  if (!homeTeam || !awayTeam) {
    return <div>Error loading teams</div>;
  }
  
  const isUserHome = matchState.homeTeam.teamId === state.userTeamId;
  
  // Build player name map
  const playerNames: Record<string, string> = {};
  const allPlayers = [...getTeamPlayers(homeTeam.id), ...getTeamPlayers(awayTeam.id)];
  for (const p of allPlayers) {
    playerNames[p.id] = `${p.firstName} ${p.lastName}`;
  }
  
  return (
    <div className="min-h-screen bg-surface-50 p-4">
      {/* Back button */}
      <button
        onClick={() => {
          if (window.confirm('Leave the game? Progress will be lost.')) {
            endMatch();
            navigate('/schedule');
          }
        }}
        className="flex items-center gap-2 text-gray-400 hover:text-white mb-4"
      >
        <ArrowLeft size={20} />
        Back to Schedule
      </button>
      
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left column - Court and Controls */}
        <div className="lg:col-span-8 space-y-4">
          {/* Scoreboard */}
          <Scoreboard
            matchState={matchState}
            homeTeamName={`${homeTeam.city} ${homeTeam.name}`}
            awayTeamName={`${awayTeam.city} ${awayTeam.name}`}
            homeColor={homeTeam.colors.primary}
            awayColor={awayTeam.colors.primary}
          />
          
          {/* Court */}
          <div className="card p-4">
            <CourtVisualization
              matchState={matchState}
              homeColor={homeTeam.colors.primary}
              awayColor={awayTeam.colors.primary}
            />
          </div>
          
          {/* Sim Controls */}
          <SimControls
            speed={matchState.simSpeed}
            isPaused={matchState.isPaused}
            isComplete={matchState.isComplete}
            onSetSpeed={setSimSpeed}
            onTogglePause={togglePause}
            onSimPossession={simulatePossession}
            onSimToQuarter={simulateToQuarter}
            onSimToEnd={simulateToEnd}
          />
        </div>
        
        {/* Right column - Play-by-Play and Coaching */}
        <div className="lg:col-span-4 space-y-4">
          {/* Coaching Panel */}
          <CoachingPanel
            matchState={matchState}
            isUserHome={isUserHome}
            onSubstitution={makeSubstitution}
            onTimeout={callTimeout}
            onTacticsChange={updateTactics}
          />
          
          {/* Play-by-Play */}
          <PlayByPlay
            entries={matchState.playByPlay}
            homeTeamId={matchState.homeTeam.teamId}
            homeColor={homeTeam.colors.primary}
            awayColor={awayTeam.colors.primary}
          />
        </div>
      </div>
      
      {/* Timeout Modal */}
      <TimeoutModal
        matchState={matchState}
        isOpen={showTimeoutModal}
        onClose={() => {
          setShowTimeoutModal(false);
          togglePause(); // Resume game
        }}
        onSubstitution={makeSubstitution}
        onTacticsChange={updateTactics}
        isUserHome={isUserHome}
      />
      
      {/* Post-Game Modal */}
      <PostGameModal
        matchState={matchState}
        isOpen={showPostGameModal}
        onClose={handleGameEnd}
        homeTeamName={`${homeTeam.city} ${homeTeam.name}`}
        awayTeamName={`${awayTeam.city} ${awayTeam.name}`}
        homeColor={homeTeam.colors.primary}
        awayColor={awayTeam.colors.primary}
        playerNames={playerNames}
      />
      
      {/* Loading overlay */}
      {isLoading && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-40">
          <div className="bg-surface-100 rounded-xl p-6 text-center">
            <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-4" />
            <p>Simulating...</p>
          </div>
        </div>
      )}
    </div>
  );
}
