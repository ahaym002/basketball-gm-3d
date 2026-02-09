// Match simulation state store

import { create } from 'zustand';
import {
  MatchState,
  SimSpeed,
  TeamTactics,
  PlayByPlayEntry,
} from '../engine/types';
import {
  initializeMatch,
  simulateNextPossession,
  simulateToQuarterEnd,
  simulateToGameEnd,
  makeSubstitution,
  callTimeout,
  updateTactics,
} from '../engine/GameSimulator';
import { Team, Player, Game, BoxScoreStats } from '../gm/types';

interface MatchStore {
  // Match state
  matchState: MatchState | null;
  isLoading: boolean;
  
  // UI state
  showTimeoutModal: boolean;
  showPostGameModal: boolean;
  
  // Actions
  startMatch: (gameId: string, homeTeam: Team, awayTeam: Team, homePlayers: Player[], awayPlayers: Player[]) => void;
  endMatch: () => void;
  
  // Simulation controls
  setSimSpeed: (speed: SimSpeed) => void;
  togglePause: () => void;
  simulatePossession: () => void;
  simulateToQuarter: () => void;
  simulateToEnd: () => void;
  
  // Coaching
  makeSubstitution: (playerOut: string, playerIn: string) => void;
  callTimeout: () => void;
  updateTactics: (tactics: Partial<TeamTactics>) => void;
  
  // UI
  setShowTimeoutModal: (show: boolean) => void;
  setShowPostGameModal: (show: boolean) => void;
  
  // Getters
  getBoxScore: () => { home: BoxScoreStats[]; away: BoxScoreStats[] } | null;
  getUserTeamId: () => string | null;
  isUserPossession: () => boolean;
}

export const useMatchStore = create<MatchStore>((set, get) => ({
  matchState: null,
  isLoading: false,
  showTimeoutModal: false,
  showPostGameModal: false,

  startMatch: (gameId, homeTeam, awayTeam, homePlayers, awayPlayers) => {
    const matchState = initializeMatch(gameId, homeTeam, awayTeam, homePlayers, awayPlayers);
    set({ matchState, isLoading: false });
  },

  endMatch: () => {
    set({ matchState: null, showPostGameModal: false, showTimeoutModal: false });
  },

  setSimSpeed: (speed) => {
    const { matchState } = get();
    if (!matchState) return;
    
    set({
      matchState: {
        ...matchState,
        simSpeed: speed,
        isPaused: speed === 'paused',
      },
    });
  },

  togglePause: () => {
    const { matchState } = get();
    if (!matchState) return;
    
    const newPaused = !matchState.isPaused;
    set({
      matchState: {
        ...matchState,
        isPaused: newPaused,
        simSpeed: newPaused ? 'paused' : '1x',
      },
    });
  },

  simulatePossession: () => {
    const { matchState } = get();
    if (!matchState || matchState.isComplete) return;
    
    const newState = simulateNextPossession({ ...matchState });
    set({ matchState: newState });
    
    if (newState.isComplete) {
      set({ showPostGameModal: true });
    }
  },

  simulateToQuarter: () => {
    const { matchState } = get();
    if (!matchState || matchState.isComplete) return;
    
    set({ isLoading: true });
    
    setTimeout(() => {
      const newState = simulateToQuarterEnd({ ...matchState });
      set({ matchState: newState, isLoading: false });
      
      if (newState.isComplete) {
        set({ showPostGameModal: true });
      }
    }, 100);
  },

  simulateToEnd: () => {
    const { matchState } = get();
    if (!matchState || matchState.isComplete) return;
    
    set({ isLoading: true });
    
    setTimeout(() => {
      const newState = simulateToGameEnd({ ...matchState });
      set({ matchState: newState, isLoading: false, showPostGameModal: true });
    }, 100);
  },

  makeSubstitution: (playerOut, playerIn) => {
    const { matchState } = get();
    if (!matchState) return;
    
    // Get user team ID from game store
    const userTeamId = matchState.homeTeam.teamId; // TODO: Get from gameStore
    const newState = makeSubstitution({ ...matchState }, userTeamId, playerOut, playerIn);
    set({ matchState: newState });
  },

  callTimeout: () => {
    const { matchState } = get();
    if (!matchState) return;
    
    const userTeamId = matchState.homeTeam.teamId; // TODO: Get from gameStore
    const newState = callTimeout({ ...matchState }, userTeamId);
    set({ matchState: newState, showTimeoutModal: true });
  },

  updateTactics: (tactics) => {
    const { matchState } = get();
    if (!matchState) return;
    
    const userTeamId = matchState.homeTeam.teamId; // TODO: Get from gameStore
    const newState = updateTactics({ ...matchState }, userTeamId, tactics);
    set({ matchState: newState });
  },

  setShowTimeoutModal: (show) => set({ showTimeoutModal: show }),
  setShowPostGameModal: (show) => set({ showPostGameModal: show }),

  getBoxScore: () => {
    const { matchState } = get();
    if (!matchState) return null;
    
    const homeStats: BoxScoreStats[] = [];
    const awayStats: BoxScoreStats[] = [];
    
    // Collect all home players
    for (const id of [...matchState.homeTeam.onCourt, ...matchState.homeTeam.bench]) {
      const player = matchState.players[id];
      if (player) {
        homeStats.push({
          playerId: id,
          minutes: Math.round(player.stats.minutes),
          points: player.stats.points,
          rebounds: player.stats.rebounds,
          assists: player.stats.assists,
          steals: player.stats.steals,
          blocks: player.stats.blocks,
          turnovers: player.stats.turnovers,
          fgm: player.stats.fgm,
          fga: player.stats.fga,
          tpm: player.stats.tpm,
          tpa: player.stats.tpa,
          ftm: player.stats.ftm,
          fta: player.stats.fta,
          fouls: player.stats.fouls,
          plusMinus: player.stats.plusMinus,
        });
      }
    }
    
    // Collect all away players
    for (const id of [...matchState.awayTeam.onCourt, ...matchState.awayTeam.bench]) {
      const player = matchState.players[id];
      if (player) {
        awayStats.push({
          playerId: id,
          minutes: Math.round(player.stats.minutes),
          points: player.stats.points,
          rebounds: player.stats.rebounds,
          assists: player.stats.assists,
          steals: player.stats.steals,
          blocks: player.stats.blocks,
          turnovers: player.stats.turnovers,
          fgm: player.stats.fgm,
          fga: player.stats.fga,
          tpm: player.stats.tpm,
          tpa: player.stats.tpa,
          ftm: player.stats.ftm,
          fta: player.stats.fta,
          fouls: player.stats.fouls,
          plusMinus: player.stats.plusMinus,
        });
      }
    }
    
    return { home: homeStats, away: awayStats };
  },

  getUserTeamId: () => {
    const { matchState } = get();
    return matchState?.homeTeam.teamId || null;
  },

  isUserPossession: () => {
    const { matchState } = get();
    if (!matchState) return false;
    return matchState.homeTeam.possession;
  },
}));
