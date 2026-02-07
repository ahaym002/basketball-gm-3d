// ============================================
// Contract & Salary Cap System
// ============================================

import { Player, Team, Contract, ContractType, CapException, LeagueState } from '../types';

// 2024-25 NBA Salary Cap Values
export const CAP_VALUES = {
  salaryCap: 140588000,
  luxuryTax: 170814000,
  firstApron: 178132000,
  secondApron: 188931000,
  minimumSalary: 1119563,
  maximumSalary: 51415938,
  midLevelException: 12850000,
  midLevelExceptionApron: 5178000,
  biAnnualException: 4878000,
  rookieException: 1119563,
  veteranMinimum: [
    { years: 0, salary: 1119563 },
    { years: 1, salary: 1902057 },
    { years: 2, salary: 2165423 },
    { years: 3, salary: 2428789 },
    { years: 4, salary: 2692155 },
    { years: 5, salary: 2955521 },
    { years: 6, salary: 3218886 },
    { years: 7, salary: 3482252 },
    { years: 8, salary: 3745618 },
    { years: 9, salary: 4008984 },
    { years: 10, salary: 4008984 }, // 10+ years
  ]
};

export interface ContractOffer {
  salary: number;
  years: number;
  type: ContractType;
  playerOption?: number;
  teamOption?: number;
  noTradeClause?: boolean;
  tradeBonusPercent?: number;
}

export interface CapSituation {
  payroll: number;
  capSpace: number;
  taxSpace: number;
  overCap: boolean;
  overTax: boolean;
  overFirstApron: boolean;
  overSecondApron: boolean;
  availableExceptions: CapException[];
  projectedTax: number;
  repeaterTax: boolean;
}

export function calculateMaxContract(
  player: Player,
  capAmount: number = CAP_VALUES.salaryCap
): { salary: number; years: number } {
  // Max contract percentages based on experience
  let maxPercent: number;
  
  if (player.yearsExperience >= 10) {
    maxPercent = 0.35; // 35% of cap
  } else if (player.yearsExperience >= 7) {
    maxPercent = 0.30; // 30% of cap
  } else {
    maxPercent = 0.25; // 25% of cap
  }
  
  // Supermax for players who qualify (MVP, DPOY, All-NBA in last 3 years)
  const recentAwards = player.awards.filter(a => 
    new Date().getFullYear() - a.year <= 3 &&
    ['MVP', 'DPOY', 'All-NBA-1st', 'All-NBA-2nd', 'All-NBA-3rd'].includes(a.type)
  );
  
  if (recentAwards.length > 0 && player.yearsExperience >= 7) {
    maxPercent = 0.35;
  }
  
  const maxSalary = Math.min(
    Math.round(capAmount * maxPercent),
    CAP_VALUES.maximumSalary
  );
  
  // Max years: 5 with current team (Bird rights), 4 otherwise
  const maxYears = player.birdRights ? 5 : 4;
  
  return { salary: maxSalary, years: maxYears };
}

export function calculateMinimumSalary(yearsExperience: number): number {
  const index = Math.min(yearsExperience, CAP_VALUES.veteranMinimum.length - 1);
  return CAP_VALUES.veteranMinimum[index].salary;
}

export function getCapSituation(team: Team, state: LeagueState): CapSituation {
  const payroll = team.payroll;
  const capSpace = Math.max(0, CAP_VALUES.salaryCap - payroll);
  const taxSpace = Math.max(0, CAP_VALUES.luxuryTax - payroll);
  
  const overCap = payroll > CAP_VALUES.salaryCap;
  const overTax = payroll > CAP_VALUES.luxuryTax;
  const overFirstApron = payroll > CAP_VALUES.firstApron;
  const overSecondApron = payroll > CAP_VALUES.secondApron;
  
  // Calculate luxury tax
  let projectedTax = 0;
  if (overTax) {
    const taxableAmount = payroll - CAP_VALUES.luxuryTax;
    // Progressive tax brackets
    const brackets = [
      { threshold: 0, rate: 1.5 },
      { threshold: 5000000, rate: 1.75 },
      { threshold: 10000000, rate: 2.5 },
      { threshold: 15000000, rate: 3.25 },
      { threshold: 20000000, rate: 3.75 },
      { threshold: 25000000, rate: 4.25 }
    ];
    
    let remaining = taxableAmount;
    for (let i = 0; i < brackets.length && remaining > 0; i++) {
      const nextThreshold = brackets[i + 1]?.threshold ?? Infinity;
      const bracketSize = nextThreshold - brackets[i].threshold;
      const taxableInBracket = Math.min(remaining, bracketSize);
      projectedTax += taxableInBracket * brackets[i].rate;
      remaining -= taxableInBracket;
    }
  }
  
  // Check for repeater tax (over tax 3 of last 4 years)
  // Simplified: assume not repeater for now
  const repeaterTax = false;
  if (repeaterTax) {
    projectedTax *= 1.5;
  }
  
  // Available exceptions
  const availableExceptions: CapException[] = [];
  
  if (overCap) {
    // Mid-level exception (full or taxpayer)
    if (!overFirstApron) {
      availableExceptions.push({
        type: 'mid-level',
        amount: CAP_VALUES.midLevelException,
        remaining: CAP_VALUES.midLevelException,
        expiresYear: state.currentSeason.year + 1
      });
    } else if (!overSecondApron) {
      availableExceptions.push({
        type: 'mid-level',
        amount: CAP_VALUES.midLevelExceptionApron,
        remaining: CAP_VALUES.midLevelExceptionApron,
        expiresYear: state.currentSeason.year + 1
      });
    }
    
    // Bi-annual exception (not available if over first apron)
    if (!overFirstApron) {
      availableExceptions.push({
        type: 'bi-annual',
        amount: CAP_VALUES.biAnnualException,
        remaining: CAP_VALUES.biAnnualException,
        expiresYear: state.currentSeason.year + 1
      });
    }
  }
  
  // Add team's existing exceptions
  availableExceptions.push(...team.exceptions.filter(e => e.remaining > 0));
  
  return {
    payroll,
    capSpace,
    taxSpace,
    overCap,
    overTax,
    overFirstApron,
    overSecondApron,
    availableExceptions,
    projectedTax,
    repeaterTax
  };
}

export function canSignPlayer(
  team: Team,
  player: Player,
  offer: ContractOffer,
  state: LeagueState
): { canSign: boolean; method: string; reason?: string } {
  const capSituation = getCapSituation(team, state);
  
  // Under cap - can use cap space
  if (!capSituation.overCap && offer.salary <= capSituation.capSpace) {
    return { canSign: true, method: 'cap-space' };
  }
  
  // Check Bird rights
  if (player.birdRights && player.teamId === team.id) {
    // Can go over cap to re-sign own player
    const maxContract = calculateMaxContract(player);
    if (offer.salary <= maxContract.salary && offer.years <= maxContract.years) {
      return { canSign: true, method: 'bird-rights' };
    }
  }
  
  // Check available exceptions
  for (const exception of capSituation.availableExceptions) {
    if (offer.salary <= exception.remaining) {
      if (exception.type === 'mid-level') {
        // MLE has year limits
        if (offer.years <= 4) {
          return { canSign: true, method: 'mid-level-exception' };
        }
      } else if (exception.type === 'bi-annual') {
        if (offer.years <= 2) {
          return { canSign: true, method: 'bi-annual-exception' };
        }
      } else if (exception.type === 'trade') {
        if (offer.years <= 4) {
          return { canSign: true, method: 'trade-exception' };
        }
      }
    }
  }
  
  // Minimum salary exception
  const minimum = calculateMinimumSalary(player.yearsExperience);
  if (offer.salary <= minimum) {
    return { canSign: true, method: 'minimum' };
  }
  
  // Room exception (for teams just over cap)
  if (capSituation.payroll < CAP_VALUES.salaryCap + 5000000) {
    const roomException = 7500000;
    if (offer.salary <= roomException && offer.years <= 2) {
      return { canSign: true, method: 'room-exception' };
    }
  }
  
  return { 
    canSign: false, 
    method: 'none',
    reason: `No available salary cap space or exception for $${(offer.salary / 1000000).toFixed(1)}M contract`
  };
}

export function createContractOffer(
  player: Player,
  team: Team,
  state: LeagueState,
  preferredSalary?: number
): ContractOffer | null {
  const capSituation = getCapSituation(team, state);
  
  // Determine appropriate offer based on player value
  const maxContract = calculateMaxContract(player);
  const minimumSalary = calculateMinimumSalary(player.yearsExperience);
  
  // Player's expected salary based on overall rating
  let expectedSalary: number;
  if (player.stats.overall >= 90) {
    expectedSalary = maxContract.salary;
  } else if (player.stats.overall >= 85) {
    expectedSalary = maxContract.salary * 0.8;
  } else if (player.stats.overall >= 80) {
    expectedSalary = maxContract.salary * 0.5;
  } else if (player.stats.overall >= 75) {
    expectedSalary = CAP_VALUES.midLevelException;
  } else if (player.stats.overall >= 70) {
    expectedSalary = CAP_VALUES.midLevelException * 0.5;
  } else if (player.stats.overall >= 65) {
    expectedSalary = minimumSalary * 2;
  } else {
    expectedSalary = minimumSalary;
  }
  
  // Use preferred salary if provided
  const targetSalary = preferredSalary ?? expectedSalary;
  
  // Try different methods
  const offers: ContractOffer[] = [];
  
  // Cap space
  if (!capSituation.overCap) {
    offers.push({
      salary: Math.min(targetSalary, capSituation.capSpace),
      years: Math.min(4, player.stats.overall >= 80 ? 4 : 3),
      type: 'standard'
    });
  }
  
  // MLE
  if (capSituation.overCap) {
    const mle = capSituation.availableExceptions.find(e => e.type === 'mid-level');
    if (mle && targetSalary <= mle.remaining) {
      offers.push({
        salary: Math.min(targetSalary, mle.remaining),
        years: Math.min(4, 3),
        type: 'mid-level'
      });
    }
  }
  
  // Bi-annual
  const biAnnual = capSituation.availableExceptions.find(e => e.type === 'bi-annual');
  if (biAnnual && targetSalary <= biAnnual.remaining) {
    offers.push({
      salary: Math.min(targetSalary, biAnnual.remaining),
      years: 2,
      type: 'bi-annual'
    });
  }
  
  // Minimum
  offers.push({
    salary: minimumSalary,
    years: 2,
    type: 'minimum'
  });
  
  // Find best offer that works
  for (const offer of offers) {
    const result = canSignPlayer(team, player, offer, state);
    if (result.canSign) {
      return offer;
    }
  }
  
  return null;
}

export function signPlayer(
  player: Player,
  team: Team,
  offer: ContractOffer,
  state: LeagueState
): boolean {
  const result = canSignPlayer(team, player, offer, state);
  
  if (!result.canSign) {
    return false;
  }
  
  // Update player contract
  player.contract = {
    salary: offer.salary,
    years: offer.years,
    type: offer.type,
    noTradeClause: offer.noTradeClause ?? false,
    playerOption: offer.playerOption,
    teamOption: offer.teamOption,
    tradeBonusPercent: offer.tradeBonusPercent,
    signedYear: state.currentSeason.year
  };
  
  // Remove from free agents
  const faIndex = state.freeAgents.indexOf(player.id);
  if (faIndex > -1) {
    state.freeAgents.splice(faIndex, 1);
  }
  
  // Add to team
  player.teamId = team.id;
  team.roster.push(player.id);
  team.payroll += offer.salary;
  
  // Bird rights after 3 years with team
  player.birdRights = false;
  
  // Update exception usage
  if (result.method === 'mid-level-exception') {
    const mle = team.exceptions.find(e => e.type === 'mid-level');
    if (mle) mle.remaining -= offer.salary;
  } else if (result.method === 'bi-annual-exception') {
    const biAnnual = team.exceptions.find(e => e.type === 'bi-annual');
    if (biAnnual) biAnnual.remaining -= offer.salary;
  }
  
  return true;
}

export function releasePlayer(
  player: Player,
  team: Team,
  state: LeagueState,
  waived: boolean = true
): void {
  // Remove from team roster
  const index = team.roster.indexOf(player.id);
  if (index > -1) {
    team.roster.splice(index, 1);
  }
  
  // Dead money if waived (guaranteed contract)
  if (waived) {
    // Stretch provision could be applied
    const remainingSalary = player.contract.salary * player.contract.years;
    // For now, just remove from payroll
    team.payroll -= player.contract.salary;
  }
  
  // Add to free agents
  player.teamId = null;
  player.birdRights = false;
  state.freeAgents.push(player.id);
  
  // Clear contract to minimum for new offers
  player.contract = {
    salary: calculateMinimumSalary(player.yearsExperience),
    years: 1,
    type: 'minimum',
    noTradeClause: false,
    signedYear: state.currentSeason.year
  };
}

export function extendContract(
  player: Player,
  team: Team,
  extension: ContractOffer,
  state: LeagueState
): boolean {
  // Extension rules: Can extend in final year of contract
  if (player.contract.years > 1) {
    return false;
  }
  
  // Max extension based on current contract
  const maxExtension = calculateMaxContract(player);
  
  if (extension.salary > maxExtension.salary * 1.08) { // 8% annual raise
    return false;
  }
  
  // Apply extension
  player.contract.years += extension.years;
  player.contract.salary = extension.salary;
  
  return true;
}

export function processEndOfSeason(team: Team, state: LeagueState): void {
  // Reduce contract years, handle expirations
  for (const playerId of [...team.roster]) {
    const player = state.players[playerId];
    if (!player) continue;
    
    player.contract.years--;
    
    // Check team options
    if (player.contract.teamOption === player.contract.years + 1) {
      // Team can decline option - simple AI logic
      if (player.stats.overall < 70) {
        player.contract.years = 0; // Decline option
      }
    }
    
    // Contract expired
    if (player.contract.years <= 0) {
      // Becomes unrestricted free agent
      releasePlayer(player, team, state, false);
    }
  }
  
  // Reset cap exceptions
  team.exceptions = [
    { 
      type: 'mid-level', 
      amount: CAP_VALUES.midLevelException, 
      remaining: CAP_VALUES.midLevelException,
      expiresYear: state.currentSeason.year + 1
    },
    { 
      type: 'bi-annual', 
      amount: CAP_VALUES.biAnnualException, 
      remaining: CAP_VALUES.biAnnualException,
      expiresYear: state.currentSeason.year + 1
    }
  ];
  
  // Update Bird rights (3 years with team)
  for (const playerId of team.roster) {
    const player = state.players[playerId];
    if (player && player.contract.signedYear <= state.currentSeason.year - 3) {
      player.birdRights = true;
    }
  }
}
