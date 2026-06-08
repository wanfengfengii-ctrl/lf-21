import type { OperatorType, StepInfo, BeadState } from '../types/abacus'
import { getRodValue, TOTAL_RODS, numberToRods } from './abacus'

export interface GenerationResult {
  steps: StepInfo[]
  finalRods: BeadState[]
  decimalPosition: number
}

function generateAddSteps(
  num1: number,
  num2: number
): GenerationResult {
  const decimalPosition = 6
  const initialRods = numberToRods(num1, decimalPosition)
  let currentRods = initialRods.map(r => ({ ...r }))
  const steps: StepInfo[] = []
  let stepId = 0

  const num2Str = num2.toFixed(decimalPosition).replace('.', '')
  const num2Digits = num2Str.padStart(TOTAL_RODS, '0').slice(-TOTAL_RODS)

  let carry = 0

  for (let i = TOTAL_RODS - 1; i >= 0; i--) {
    const digit = parseInt(num2Digits[i], 10)
    if (digit === 0 && carry === 0) continue

    const currentValue = getRodValue(currentRods[i])
    let newValue = currentValue + digit + carry
    carry = 0

    if (newValue >= 10) {
      carry = 1
      newValue -= 10
    }

    const upperDelta = Math.floor(newValue / 5) - currentRods[i].upper
    const lowerDelta = (newValue % 5) - currentRods[i].lower

    if (upperDelta !== 0) {
      steps.push({
        id: stepId++,
        description: `第 ${TOTAL_RODS - i} 档上珠 ${upperDelta > 0 ? '拨下' : '拨上'} ${Math.abs(upperDelta)} 颗`,
        rodIndex: i,
        type: 'upper',
        delta: upperDelta
      })
      currentRods[i].upper += upperDelta
    }

    if (lowerDelta !== 0) {
      steps.push({
        id: stepId++,
        description: `第 ${TOTAL_RODS - i} 档下珠 ${lowerDelta > 0 ? '拨上' : '拨下'} ${Math.abs(lowerDelta)} 颗`,
        rodIndex: i,
        type: 'lower',
        delta: lowerDelta
      })
      currentRods[i].lower += lowerDelta
    }

    if (carry > 0 && i > 0) {
      steps.push({
        id: stepId++,
        description: `第 ${TOTAL_RODS - i} 档向第 ${TOTAL_RODS - i + 1} 档进位`,
        rodIndex: i - 1,
        type: 'lower',
        delta: 1,
        carryOver: true
      })
      currentRods[i - 1].lower += 1
    }
  }

  if (carry > 0) {
    steps.unshift({
      id: stepId++,
      description: '结果超出算盘范围',
      rodIndex: 0,
      type: 'lower',
      delta: 0,
      isError: true,
      errorMessage: '计算结果超出算盘最大位数'
    })
  }

  return { steps, finalRods: currentRods, decimalPosition }
}

function generateSubtractSteps(
  num1: number,
  num2: number
): GenerationResult {
  const decimalPosition = 6
  const initialRods = numberToRods(num1, decimalPosition)
  let currentRods = initialRods.map(r => ({ ...r }))
  const steps: StepInfo[] = []
  let stepId = 0

  const num2Str = num2.toFixed(decimalPosition).replace('.', '')
  const num2Digits = num2Str.padStart(TOTAL_RODS, '0').slice(-TOTAL_RODS)

  let borrow = 0

  for (let i = TOTAL_RODS - 1; i >= 0; i--) {
    const digit = parseInt(num2Digits[i], 10)
    if (digit === 0 && borrow === 0) continue

    const currentValue = getRodValue(currentRods[i])
    let newValue = currentValue - digit - borrow
    borrow = 0

    if (newValue < 0) {
      borrow = 1
      newValue += 10
    }

    const upperDelta = Math.floor(newValue / 5) - currentRods[i].upper
    const lowerDelta = (newValue % 5) - currentRods[i].lower

    if (upperDelta !== 0) {
      steps.push({
        id: stepId++,
        description: `第 ${TOTAL_RODS - i} 档上珠 ${upperDelta > 0 ? '拨下' : '拨上'} ${Math.abs(upperDelta)} 颗`,
        rodIndex: i,
        type: 'upper',
        delta: upperDelta
      })
      currentRods[i].upper += upperDelta
    }

    if (lowerDelta !== 0) {
      steps.push({
        id: stepId++,
        description: `第 ${TOTAL_RODS - i} 档下珠 ${lowerDelta > 0 ? '拨上' : '拨下'} ${Math.abs(lowerDelta)} 颗`,
        rodIndex: i,
        type: 'lower',
        delta: lowerDelta
      })
      currentRods[i].lower += lowerDelta
    }

    if (borrow > 0 && i > 0) {
      steps.push({
        id: stepId++,
        description: `第 ${TOTAL_RODS - i} 档向第 ${TOTAL_RODS - i + 1} 档借位`,
        rodIndex: i - 1,
        type: 'lower',
        delta: -1,
        borrow: true
      })
      currentRods[i - 1].lower -= 1
    }
  }

  if (borrow > 0) {
    steps.unshift({
      id: stepId++,
      description: '结果为负数，超出算盘表示范围',
      rodIndex: 0,
      type: 'lower',
      delta: 0,
      isError: true,
      errorMessage: '减法结果为负数，本算盘暂不支持负数表示'
    })
  }

  return { steps, finalRods: currentRods, decimalPosition }
}

function generateMultiplySteps(
  num1: number,
  num2: number
): GenerationResult {
  const decimalPosition = 6
  let currentRods = numberToRods(0, decimalPosition)
  const steps: StepInfo[] = []
  let stepId = 0

  const num1Str = num1.toFixed(0)
  const num2Str = num2.toFixed(0)

  steps.push({
    id: stepId++,
    description: `初始化算盘为 0`,
    rodIndex: TOTAL_RODS - 1,
    type: 'lower',
    delta: 0
  })

  for (let i = num2Str.length - 1; i >= 0; i--) {
    const digit2 = parseInt(num2Str[i], 10)
    if (digit2 === 0) continue

    const positionOffset = num2Str.length - 1 - i

    for (let j = num1Str.length - 1; j >= 0; j--) {
      const digit1 = parseInt(num1Str[j], 10)
      const product = digit1 * digit2

      const rodIdx = TOTAL_RODS - 1 - positionOffset - (num1Str.length - 1 - j)

      if (rodIdx < 0) {
        steps.push({
          id: stepId++,
          description: '乘法结果超出算盘范围',
          rodIndex: 0,
          type: 'lower',
          delta: 0,
          isError: true,
          errorMessage: '计算结果超出算盘最大位数'
        })
        return { steps, finalRods: currentRods, decimalPosition }
      }

      const currentValue = getRodValue(currentRods[rodIdx])
      let newValue = currentValue + product
      let carry = 0

      if (newValue >= 10) {
        carry = Math.floor(newValue / 10)
        newValue = newValue % 10
      }

      const upperDelta = Math.floor(newValue / 5) - currentRods[rodIdx].upper
      const lowerDelta = (newValue % 5) - currentRods[rodIdx].lower

      if (upperDelta !== 0) {
        steps.push({
          id: stepId++,
          description: `第 ${TOTAL_RODS - rodIdx} 档上珠 ${upperDelta > 0 ? '拨下' : '拨上'} ${Math.abs(upperDelta)} 颗 (${digit1} × ${digit2} = ${product})`,
          rodIndex: rodIdx,
          type: 'upper',
          delta: upperDelta
        })
        currentRods[rodIdx].upper += upperDelta
      }

      if (lowerDelta !== 0) {
        steps.push({
          id: stepId++,
          description: `第 ${TOTAL_RODS - rodIdx} 档下珠 ${lowerDelta > 0 ? '拨上' : '拨下'} ${Math.abs(lowerDelta)} 颗 (${digit1} × ${digit2} = ${product})`,
          rodIndex: rodIdx,
          type: 'lower',
          delta: lowerDelta
        })
        currentRods[rodIdx].lower += lowerDelta
      }

      let carryIdx = rodIdx - 1
      while (carry > 0 && carryIdx >= 0) {
        const carryValue = getRodValue(currentRods[carryIdx]) + carry
        const carryDigit = carryValue % 10
        const nextCarry = Math.floor(carryValue / 10)

        const carryUpperDelta = Math.floor(carryDigit / 5) - currentRods[carryIdx].upper
        const carryLowerDelta = (carryDigit % 5) - currentRods[carryIdx].lower

        if (carryUpperDelta !== 0) {
          steps.push({
            id: stepId++,
            description: `第 ${TOTAL_RODS - carryIdx} 档上珠进位 ${carryUpperDelta > 0 ? '拨下' : '拨上'} ${Math.abs(carryUpperDelta)} 颗`,
            rodIndex: carryIdx,
            type: 'upper',
            delta: carryUpperDelta,
            carryOver: true
          })
          currentRods[carryIdx].upper += carryUpperDelta
        }

        if (carryLowerDelta !== 0) {
          steps.push({
            id: stepId++,
            description: `第 ${TOTAL_RODS - carryIdx} 档下珠进位 ${carryLowerDelta > 0 ? '拨上' : '拨下'} ${Math.abs(carryLowerDelta)} 颗`,
            rodIndex: carryIdx,
            type: 'lower',
            delta: carryLowerDelta,
            carryOver: true
          })
          currentRods[carryIdx].lower += carryLowerDelta
        }

        carry = nextCarry
        carryIdx--
      }

      if (carry > 0) {
        steps.push({
          id: stepId++,
          description: '乘法结果超出算盘范围',
          rodIndex: 0,
          type: 'lower',
          delta: 0,
          isError: true,
          errorMessage: '计算结果超出算盘最大位数'
        })
        return { steps, finalRods: currentRods, decimalPosition }
      }
    }
  }

  return { steps, finalRods: currentRods, decimalPosition }
}

function generateDivideSteps(
  num1: number,
  num2: number
): GenerationResult {
  const decimalPosition = 6

  if (num2 === 0) {
    const steps: StepInfo[] = [{
      id: 0,
      description: '除数不能为零',
      rodIndex: 0,
      type: 'lower',
      delta: 0,
      isError: true,
      errorMessage: '除数不能为零'
    }]
    return { steps, finalRods: numberToRods(num1, decimalPosition), decimalPosition }
  }

  const result = Math.floor((num1 / num2) * 1000000) / 1000000
  const currentRods = numberToRods(result, decimalPosition)
  const steps: StepInfo[] = []
  let stepId = 0

  steps.push({
    id: stepId++,
    description: `设置被除数 ${num1} 在算盘上`,
    rodIndex: TOTAL_RODS - 1,
    type: 'lower',
    delta: 0
  })

  const initialRods = numberToRods(num1, decimalPosition)
  for (let i = 0; i < TOTAL_RODS; i++) {
    const upperDelta = initialRods[i].upper - 0
    const lowerDelta = initialRods[i].lower - 0
    
    if (upperDelta !== 0 || lowerDelta !== 0) {
      if (upperDelta !== 0) {
        steps.push({
          id: stepId++,
          description: `第 ${TOTAL_RODS - i} 档上珠拨下 ${upperDelta} 颗`,
          rodIndex: i,
          type: 'upper',
          delta: upperDelta
        })
      }
      if (lowerDelta !== 0) {
        steps.push({
          id: stepId++,
          description: `第 ${TOTAL_RODS - i} 档下珠拨上 ${lowerDelta} 颗`,
          rodIndex: i,
          type: 'lower',
          delta: lowerDelta
        })
      }
    }
  }

  steps.push({
    id: stepId++,
    description: `除数为 ${num2}，开始进行除法运算`,
    rodIndex: TOTAL_RODS - 1,
    type: 'lower',
    delta: 0
  })

  const resultStr = result.toFixed(6).replace('.', '')
  const resultDigits = resultStr.padStart(TOTAL_RODS, '0').slice(-TOTAL_RODS)

  for (let i = 0; i < TOTAL_RODS; i++) {
    const digit = parseInt(resultDigits[i], 10)
    const currentValue = getRodValue(initialRods[i])
    
    if (digit !== currentValue) {
      const upperDelta = Math.floor(digit / 5) - initialRods[i].upper
      const lowerDelta = (digit % 5) - initialRods[i].lower

      if (upperDelta !== 0) {
        steps.push({
          id: stepId++,
          description: `商的第 ${TOTAL_RODS - i} 档上珠 ${upperDelta > 0 ? '拨下' : '拨上'} ${Math.abs(upperDelta)} 颗`,
          rodIndex: i,
          type: 'upper',
          delta: upperDelta
        })
      }

      if (lowerDelta !== 0) {
        steps.push({
          id: stepId++,
          description: `商的第 ${TOTAL_RODS - i} 档下珠 ${lowerDelta > 0 ? '拨上' : '拨下'} ${Math.abs(lowerDelta)} 颗`,
          rodIndex: i,
          type: 'lower',
          delta: lowerDelta
        })
      }
    }
  }

  return { steps, finalRods: currentRods, decimalPosition }
}

export function generateCalculationSteps(
  num1: number,
  num2: number,
  operator: OperatorType
): GenerationResult {
  switch (operator) {
    case '+':
      return generateAddSteps(num1, num2)
    case '-':
      return generateSubtractSteps(num1, num2)
    case '×':
      return generateMultiplySteps(num1, num2)
    case '÷':
      return generateDivideSteps(num1, num2)
    default:
      throw new Error(`Unknown operator: ${operator}`)
  }
}

export function calculateResult(
  num1: number,
  num2: number,
  operator: OperatorType
): number {
  switch (operator) {
    case '+':
      return num1 + num2
    case '-':
      return num1 - num2
    case '×':
      return num1 * num2
    case '÷':
      return num2 === 0 ? NaN : num1 / num2
    default:
      throw new Error(`Unknown operator: ${operator}`)
  }
}
