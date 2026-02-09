export function formatCurrency(amount: number): string {
  if (amount >= 1000000) {
    return `$${(amount / 1000000).toFixed(1)}M`
  } else if (amount >= 1000) {
    return `$${(amount / 1000).toFixed(0)}K`
  }
  return `$${amount}`
}

export function formatRecord(wins: number, losses: number): string {
  return `${wins}-${losses}`
}

export function getWinPct(wins: number, losses: number): string {
  const total = wins + losses
  if (total === 0) return '.000'
  const pct = wins / total
  return pct.toFixed(3).replace('0.', '.')
}

export function formatHeight(inches: number): string {
  const feet = Math.floor(inches / 12)
  const remainingInches = inches % 12
  return `${feet}'${remainingInches}"`
}

export function formatContractYears(years: number): string {
  if (years === 1) return '1 year'
  return `${years} years`
}

export function getRatingClass(rating: number): string {
  if (rating >= 85) return 'rating-elite'
  if (rating >= 75) return 'rating-good'
  if (rating >= 65) return 'rating-average'
  if (rating >= 55) return 'rating-poor'
  return 'rating-bad'
}

export function formatSalary(salary: number): string {
  return formatCurrency(salary)
}

export function getPositionColor(position: string): string {
  const colors: Record<string, string> = {
    'PG': 'bg-blue-500',
    'SG': 'bg-green-500',
    'SF': 'bg-yellow-500',
    'PF': 'bg-orange-500',
    'C': 'bg-red-500',
  }
  return colors[position] || 'bg-gray-500'
}

export function abbreviateNumber(num: number): string {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M'
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K'
  }
  return num.toString()
}
