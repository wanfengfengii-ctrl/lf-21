import type { BeadState, AbacusState } from '../types/abacus'

export const TOTAL_RODS = 13

export function createEmptyAbacus(): BeadState[] {
  return Array.from({ length: TOTAL_RODS }, () => ({
    lower: 0,
    upper: 0
  }))
}

export function createInitialAbacusState(): AbacusState {
  return {
    rods: createEmptyAbacus(),
    decimalPosition: 6
  }
}

export function getRodValue(rod: BeadState): number {
  return rod.upper * 5 + rod.lower
}

export function getAbacusValue(state: AbacusState): number {
  let value = 0
  const { rods, decimalPosition } = state
  
  for (let i = 0; i < rods.length; i++) {
    const rodValue = getRodValue(rods[i])
    const power = decimalPosition - i
    value += rodValue * Math.pow(10, power)
  }
  
  return Math.round(value * 10000) / 10000
}

export function isValidRodState(rod: BeadState): boolean {
  return rod.lower >= 0 && rod.lower <= 4 && rod.upper >= 0 && rod.upper <= 1
}

export function setDigitToRod(
  rods: BeadState[],
  rodIndex: number,
  digit: number
): BeadState[] {
  if (digit < 0 || digit > 9) {
    throw new Error(`Invalid digit ${digit} for rod ${rodIndex}`)
  }
  if (rodIndex < 0 || rodIndex >= TOTAL_RODS) {
    throw new Error(`Invalid rod index ${rodIndex}`)
  }
  
  const newRods = rods.map(r => ({ ...r }))
  newRods[rodIndex] = {
    upper: Math.floor(digit / 5),
    lower: digit % 5
  }
  return newRods
}

export function addToRod(
  rods: BeadState[],
  rodIndex: number,
  value: number
): { rods: BeadState[], carry: number } {
  if (rodIndex < 0 || rodIndex >= TOTAL_RODS) {
    throw new Error(`Invalid rod index ${rodIndex}`)
  }
  
  const newRods = rods.map(r => ({ ...r }))
  const currentValue = getRodValue(newRods[rodIndex])
  let newValue = currentValue + value
  let carry = 0
  
  if (newValue > 9) {
    carry = Math.floor(newValue / 10)
    newValue = newValue % 10
  } else if (newValue < 0) {
    carry = -Math.ceil(Math.abs(newValue) / 10)
    newValue = (newValue % 10 + 10) % 10
  }
  
  newRods[rodIndex] = {
    upper: Math.floor(newValue / 5),
    lower: newValue % 5
  }
  
  return { rods: newRods, carry }
}

export function cloneAbacusState(state: AbacusState): AbacusState {
  return {
    rods: state.rods.map(r => ({ ...r })),
    decimalPosition: state.decimalPosition
  }
}

export function numberToRods(value: number, decimalPosition: number = 6): BeadState[] {
  const rods = createEmptyAbacus()
  
  const str = Math.abs(value).toFixed(decimalPosition)
  const [intPart, decPart] = str.split('.')
  
  const digits = (intPart + decPart).padStart(TOTAL_RODS, '0').slice(-TOTAL_RODS)
  
  for (let i = 0; i < TOTAL_RODS; i++) {
    const digit = parseInt(digits[i], 10)
    rods[i] = {
      upper: Math.floor(digit / 5),
      lower: digit % 5
    }
  }
  
  return rods
}

export function formatNumber(value: number): string {
  if (Math.abs(value) < 1e-6) return '0'
  const str = value.toFixed(10)
  return str.replace(/\.?0+$/, '')
}
