// ============================================
// Trade System - Fanspo-style Trade Machine
// ============================================

import { Player, DraftPick, Trade, TradeAsset, Team, LeagueState } from '../types';

export interface TradeProposal {
  teams: string[]; // 2 or 3 team trade
  assets: Map<string, TradePackage>; // teamId -> what they're sending out
}

export interface TradePackage {
  players: string[]; // Player IDs
  picks: DraftPick[];
  cash: number;
}

export interface TradeValidation {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  salaryDetails: TradeSalaryDetails[];
}

export interface TradeSalaryDetails {
  teamId: string;
  teamName: string;
  outgoingSalary: number;
  incomingSalary: number;
  currentPayroll: number;
  newPayroll: number;
  capSpace: number;
  overTaxLine: boolean;
  overSecondApron: boolean;
  tradeException: number;
  salaryMatchValid: boolean;
}

export interface TradeValue {
  teamId: string;
  value: number;
  breakdown: {
    playerValue: number;
    pickValue: number;
    cashValue: number;
  };
}

export interface TradeSuggestion {
  targetTeamId: string;
  targetTeamName: string;
  youSend: { players: Player[]; picks: DraftPick[] };
  youReceive: { players: Player[]; picks: DraftPick[] };
  valueDifference: number;
  likelihood: 'low' | 'medium' | 'high';
  reason: string;
}

// Trade value calculation based on overall, age, potential, contract
export function calculatePlayerTradeValue(player: Player): number {
  const { stats, age, potential, contract } = player;
  
  // Base value from overall rating
  let value = stats.overall * 2;
  
  // Age adjustment - prime years (24-30) are most valuable
  if (age < 22) {
    value *= 1.1; // Young with upside
  } else if (age >= 22 && age <= 27) {
    value *= 1.2; // Approaching/in prime
  } else if (age >= 28 && age <= 31) {
    value *= 1.0; // Still productive
  } else if (age >= 32 && age <= 34) {
    value *= 0.75; // Declining
  } else {
    value *= 0.5; // End of career
  }
  
  // Potential boost for young players
  if (age < 25) {
    value += (potential - stats.overall) * 0.5;
  }
  
  // Contract value - good contracts are worth more
  const avgSalary = 15000000;
  const contractValue = (avgSalary - contract.salary) / 5000000; // +/- based on value
  if (stats.overall >= 75) {
    value += contractValue * 10;
  }
  
  // No trade clause penalty
  if (contract.noTradeClause) {
    value *= 0.95;
  }
  
  return Math.max(0, Math.round(value));
}

export function calculatePickTradeValue(pick: DraftPick, teamRecords?: Record<string, { wins: number; losses: number }>): number {
  // Base value by round
  let value = pick.round === 1 ? 100 : 30;
  
  // Estimate pick position based on team record if available
  if (teamRecords && pick.originalTeamId in teamRecords) {
    const record = teamRecords[pick.originalTeamId];
    const winPct = record.wins / (record.wins + record.losses || 1);
    
    if (pick.round === 1) {
      // Worse teams have more valuable lottery picks
      if (winPct < 0.3) value = 150; // Lottery
      else if (winPct < 0.5) value = 100;
      else if (winPct < 0.6) value = 70;
      else value = 50; // Late first
    }
  }
  
  // Future picks are more valuable (uncertainty premium)
  const yearsOut = pick.year - new Date().getFullYear();
  if (yearsOut >= 1) {
    value *= 1.1;
  }
  if (yearsOut >= 2) {
    value *= 1.15;
  }
  if (yearsOut >= 4) {
    value *= 1.2;
  }
  
  // Swap rights are worth less
  if (pick.isSwap) {
    value *= 0.6;
  }
  
  // Protected picks are worth less
  if (pick.protections && pick.protections.length > 0) {
    const protection = pick.protections[0];
    if (protection.type === 'top' && protection.value) {
      // Top-X protection reduces value
      const protectionPenalty = 0.5 + (0.5 * (1 - protection.value / 15));
      value *= protectionPenalty;
    } else if (protection.type === 'lottery') {
      value *= 0.6;
    }
  }
  
  return Math.round(value);
}

export function calculateTradeValues(
  proposal: TradeProposal,
  state: LeagueState
): Record<string, TradeValue> {
  const values: Record<string, TradeValue> = {};
  
  const teamRecords: Record<string, { wins: number; losses: number }> = {};
  for (const [teamId, team] of Object.entries(state.teams)) {
    teamRecords[teamId] = { wins: team.wins, losses: team.losses };
  }
  
  for (const teamId of proposal.teams) {
    const sending = proposal.assets.get(teamId);
    if (!sending) continue;
    
    let playerValue = 0;
    let pickValue = 0;
    let cashValue = 0;
    
    // What this team is sending
    for (const playerId of sending.players) {
      const player = state.players[playerId];
      if (player) {
        playerValue -= calculatePlayerTradeValue(player);
      }
    }
    
    for (const pick of sending.picks) {
      pickValue -= calculatePickTradeValue(pick, teamRecords);
    }
    
    cashValue -= sending.cash / 100000; // $100k = 1 value point
    
    // What this team is receiving
    for (const otherTeamId of proposal.teams) {
      if (otherTeamId === teamId) continue;
      
      const receiving = proposal.assets.get(otherTeamId);
      if (!receiving) continue;
      
      // In a 2-team trade, team receives everything the other sends
      // In a 3-team trade, would need destination mapping
      for (const playerId of receiving.players) {
        const player = state.players[playerId];
        if (player) {
          playerValue += calculatePlayerTradeValue(player);
        }
      }
      
      for (const pick of receiving.picks) {
        pickValue += calculatePickTradeValue(pick, teamRecords);
      }
      
      cashValue += receiving.cash / 100000;
    }
    
    values[teamId] = {
      teamId,
      value: playerValue + pickValue + cashValue,
      breakdown: {
        playerValue,
        pickValue,
        cashValue
      }
    };
  }
  
  return values;
}

export function validateTrade(
  proposal: TradeProposal,
  state: LeagueState
): TradeValidation {
  const errors: string[] = [];
  const warnings: string[] = [];
  const salaryDetails: TradeSalaryDetails[] = [];
  
  const CAP = state.settings.salaryCap;
  const TAX_LINE = state.settings.luxuryTax;
  const SECOND_APRON = TAX_LINE + 17500000;
  
  for (const teamId of proposal.teams) {
    const team = state.teams[teamId];
    const sending = proposal.assets.get(teamId) || { players: [], picks: [], cash: 0 };
    
    // Calculate outgoing salary
    let outgoingSalary = 0;
    for (const playerId of sending.players) {
      const player = state.players[playerId];
      if (player) {
        outgoingSalary += player.contract.salary;
        
        // Check no trade clause
        if (player.contract.noTradeClause) {
          warnings.push(`${player.firstName} ${player.lastName} has a no-trade clause and must approve the trade.`);
        }
      }
    }
    
    // Calculate incoming salary
    let incomingSalary = 0;
    for (const otherTeamId of proposal.teams) {
      if (otherTeamId === teamId) continue;
      const receiving = proposal.assets.get(otherTeamId) || { players: [], picks: [], cash: 0 };
      
      for (const playerId of receiving.players) {
        const player = state.players[playerId];
        if (player) {
          incomingSalary += player.contract.salary;
        }
      }
    }
    
    // Salary matching rules
    const currentPayroll = team.payroll;
    const newPayroll = currentPayroll - outgoingSalary + incomingSalary;
    const capSpace = CAP - currentPayroll;
    
    let salaryMatchValid = true;
    let tradeException = 0;
    
    // NBA salary matching rules
    if (capSpace > 0 && incomingSalary <= capSpace + outgoingSalary) {
      // Under cap - can absorb salary into cap space
      salaryMatchValid = true;
    } else if (outgoingSalary === 0) {
      // Can't receive salary without sending any (unless using TPE or cap space)
      if (incomingSalary > capSpace) {
        errors.push(`${team.name} cannot absorb $${(incomingSalary / 1000000).toFixed(1)}M without sending salary.`);
        salaryMatchValid = false;
      }
    } else {
      // Over cap - need to match salaries
      // Rules: Can receive up to 125% + $250k of outgoing salary (if under $6.5M)
      // Or 100% + $5M (if between $6.5M-$19.6M)
      // Or 125% + $250k (if over $19.6M)
      
      let maxIncoming: number;
      if (outgoingSalary <= 6500000) {
        maxIncoming = outgoingSalary * 1.75 + 250000;
      } else if (outgoingSalary <= 19600000) {
        maxIncoming = outgoingSalary + 5000000;
      } else {
        maxIncoming = outgoingSalary * 1.25 + 250000;
      }
      
      if (incomingSalary > maxIncoming) {
        errors.push(`${team.name} salary mismatch: Receiving $${(incomingSalary / 1000000).toFixed(1)}M but can only receive $${(maxIncoming / 1000000).toFixed(1)}M based on $${(outgoingSalary / 1000000).toFixed(1)}M outgoing.`);
        salaryMatchValid = false;
      }
      
      // Generate trade exception if outgoing > incoming
      if (outgoingSalary > incomingSalary && salaryMatchValid) {
        tradeException = outgoingSalary - incomingSalary;
      }
    }
    
    // Second apron restrictions
    const overSecondApron = newPayroll > SECOND_APRON;
    if (overSecondApron && incomingSalary > outgoingSalary) {
      errors.push(`${team.name} is over the second apron and cannot aggregate salary in trades.`);
      salaryMatchValid = false;
    }
    
    // Roster limits
    const playersIn = proposal.teams.reduce((count, otherTeamId) => {
      if (otherTeamId === teamId) return count;
      const receiving = proposal.assets.get(otherTeamId);
      return count + (receiving?.players.length || 0);
    }, 0);
    const playersOut = sending.players.length;
    const newRosterSize = team.roster.length - playersOut + playersIn;
    
    if (newRosterSize > 15) {
      errors.push(`${team.name} would exceed 15-player roster limit (${newRosterSize} players).`);
    }
    if (newRosterSize < 12) {
      warnings.push(`${team.name} would have only ${newRosterSize} players (minimum 12 in season).`);
    }
    
    salaryDetails.push({
      teamId,
      teamName: team.name,
      outgoingSalary,
      incomingSalary,
      currentPayroll,
      newPayroll,
      capSpace,
      overTaxLine: newPayroll > TAX_LINE,
      overSecondApron,
      tradeException,
      salaryMatchValid
    });
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    salaryDetails
  };
}

export function findTradeSuggestions(
  userTeamId: string,
  targetPlayerId: string,
  state: LeagueState,
  maxResults: number = 10
): TradeSuggestion[] {
  const suggestions: TradeSuggestion[] = [];
  const targetPlayer = state.players[targetPlayerId];
  if (!targetPlayer || !targetPlayer.teamId) return suggestions;
  
  const targetTeamId = targetPlayer.teamId;
  const targetTeam = state.teams[targetTeamId];
  const userTeam = state.teams[userTeamId];
  
  const targetValue = calculatePlayerTradeValue(targetPlayer);
  
  // Try to find matching packages
  const userPlayers = userTeam.roster
    .map(id => state.players[id])
    .filter(p => p)
    .sort((a, b) => calculatePlayerTradeValue(b) - calculatePlayerTradeValue(a));
  
  // Single player trades
  for (const player of userPlayers) {
    const playerValue = calculatePlayerTradeValue(player);
    const valueDiff = Math.abs(playerValue - targetValue);
    
    if (valueDiff < 30) {
      suggestions.push({
        targetTeamId,
        targetTeamName: `${targetTeam.city} ${targetTeam.name}`,
        youSend: { players: [player], picks: [] },
        youReceive: { players: [targetPlayer], picks: [] },
        valueDifference: targetValue - playerValue,
        likelihood: valueDiff < 10 ? 'high' : valueDiff < 20 ? 'medium' : 'low',
        reason: `Straight-up swap based on similar value (${Math.round(playerValue)} vs ${Math.round(targetValue)})`
      });
    }
  }
  
  // Player + pick combinations
  for (const player of userPlayers.slice(0, 5)) {
    for (const pick of userTeam.draftPicks) {
      const playerValue = calculatePlayerTradeValue(player);
      const pickValue = calculatePickTradeValue(pick);
      const totalValue = playerValue + pickValue;
      const valueDiff = Math.abs(totalValue - targetValue);
      
      if (valueDiff < 40 && totalValue >= targetValue * 0.9) {
        suggestions.push({
          targetTeamId,
          targetTeamName: `${targetTeam.city} ${targetTeam.name}`,
          youSend: { players: [player], picks: [pick] },
          youReceive: { players: [targetPlayer], picks: [] },
          valueDifference: targetValue - totalValue,
          likelihood: valueDiff < 15 ? 'high' : 'medium',
          reason: `Package deal - ${player.firstName} ${player.lastName} + ${pick.year} ${pick.round === 1 ? '1st' : '2nd'}`
        });
      }
    }
  }
  
  // Sort by likelihood then value difference
  suggestions.sort((a, b) => {
    const likelihoodOrder = { 'high': 0, 'medium': 1, 'low': 2 };
    if (likelihoodOrder[a.likelihood] !== likelihoodOrder[b.likelihood]) {
      return likelihoodOrder[a.likelihood] - likelihoodOrder[b.likelihood];
    }
    return Math.abs(a.valueDifference) - Math.abs(b.valueDifference);
  });
  
  return suggestions.slice(0, maxResults);
}

export function aiEvaluateTrade(
  teamId: string,
  proposal: TradeProposal,
  state: LeagueState
): { accept: boolean; reason: string; counterOffer?: TradeProposal } {
  const values = calculateTradeValues(proposal, state);
  const teamValue = values[teamId];
  
  if (!teamValue) {
    return { accept: false, reason: 'Invalid trade proposal' };
  }
  
  // AI generally wants positive value
  const valueThreshold = -20; // Willing to take slight losses for fit
  
  if (teamValue.value > valueThreshold) {
    // Check team needs
    const team = state.teams[teamId];
    const receiving = proposal.assets.get(
      proposal.teams.find(t => t !== teamId) || ''
    );
    
    if (receiving && receiving.players.length > 0) {
      // Check position needs
      const positionCounts: Record<string, number> = { PG: 0, SG: 0, SF: 0, PF: 0, C: 0 };
      for (const playerId of team.roster) {
        const player = state.players[playerId];
        if (player) positionCounts[player.position]++;
      }
      
      const needsPlayer = receiving.players.some(playerId => {
        const player = state.players[playerId];
        return player && positionCounts[player.position] < 2;
      });
      
      if (needsPlayer || teamValue.value > 10) {
        return { 
          accept: true, 
          reason: `Fair trade with ${teamValue.value > 0 ? 'slight advantage' : 'acceptable value'}` 
        };
      }
    }
    
    return { accept: true, reason: 'Trade value acceptable' };
  }
  
  return { 
    accept: false, 
    reason: `Insufficient value (needs +${Math.abs(teamValue.value).toFixed(0)} more in assets)` 
  };
}

export function executeTrade(
  proposal: TradeProposal,
  state: LeagueState
): Trade {
  const trade: Trade = {
    id: `trade-${Date.now()}`,
    date: new Date(),
    teams: proposal.teams,
    assets: [],
    status: 'completed',
    tradeValue: {}
  };
  
  const values = calculateTradeValues(proposal, state);
  for (const [teamId, value] of Object.entries(values)) {
    trade.tradeValue[teamId] = value.value;
  }
  
  // For 2-team trades
  if (proposal.teams.length === 2) {
    const [teamA, teamB] = proposal.teams;
    const packageA = proposal.assets.get(teamA) || { players: [], picks: [], cash: 0 };
    const packageB = proposal.assets.get(teamB) || { players: [], picks: [], cash: 0 };
    
    // Move players from A to B
    for (const playerId of packageA.players) {
      const player = state.players[playerId];
      if (player) {
        // Remove from team A roster
        const indexA = state.teams[teamA].roster.indexOf(playerId);
        if (indexA > -1) state.teams[teamA].roster.splice(indexA, 1);
        
        // Add to team B roster
        state.teams[teamB].roster.push(playerId);
        player.teamId = teamB;
        
        trade.assets.push({
          type: 'player',
          fromTeamId: teamA,
          toTeamId: teamB,
          playerId
        });
      }
    }
    
    // Move players from B to A
    for (const playerId of packageB.players) {
      const player = state.players[playerId];
      if (player) {
        const indexB = state.teams[teamB].roster.indexOf(playerId);
        if (indexB > -1) state.teams[teamB].roster.splice(indexB, 1);
        
        state.teams[teamA].roster.push(playerId);
        player.teamId = teamA;
        
        trade.assets.push({
          type: 'player',
          fromTeamId: teamB,
          toTeamId: teamA,
          playerId
        });
      }
    }
    
    // Move picks
    for (const pick of packageA.picks) {
      pick.currentTeamId = teamB;
      state.teams[teamA].draftPicks = state.teams[teamA].draftPicks.filter(
        p => p !== pick
      );
      state.teams[teamB].draftPicks.push(pick);
      
      trade.assets.push({
        type: 'pick',
        fromTeamId: teamA,
        toTeamId: teamB,
        pick
      });
    }
    
    for (const pick of packageB.picks) {
      pick.currentTeamId = teamA;
      state.teams[teamB].draftPicks = state.teams[teamB].draftPicks.filter(
        p => p !== pick
      );
      state.teams[teamA].draftPicks.push(pick);
      
      trade.assets.push({
        type: 'pick',
        fromTeamId: teamB,
        toTeamId: teamA,
        pick
      });
    }
    
    // Update payrolls
    state.teams[teamA].payroll = state.teams[teamA].roster.reduce((sum, id) => {
      const p = state.players[id];
      return sum + (p ? p.contract.salary : 0);
    }, 0);
    
    state.teams[teamB].payroll = state.teams[teamB].roster.reduce((sum, id) => {
      const p = state.players[id];
      return sum + (p ? p.contract.salary : 0);
    }, 0);
  }
  
  // Add to history
  state.tradeHistory.push(trade);
  
  return trade;
}
