export type OperatorType = '+' | '-' | '×' | '÷'

export type DifficultyLevel = 'easy' | 'medium' | 'hard'

export interface BeadState {
  lower: number
  upper: number
}

export interface AbacusState {
  rods: BeadState[]
  decimalPosition: number
  isNegative: boolean
}

export interface StepInfo {
  id: number
  description: string
  rodIndex: number
  type: 'upper' | 'lower'
  delta: number
  carryOver?: boolean
  borrow?: boolean
  isError?: boolean
  errorMessage?: string
}

export interface CalculationResult {
  steps: StepInfo[]
  finalValue: number
  intermediateValues: number[]
}

export interface PracticeQuestion {
  id: number
  num1: number
  num2: number
  operator: OperatorType
  answer: number
  difficulty: DifficultyLevel
}

export interface UserOperationError {
  rodIndex: number
  rodLabel: string
  expectedValue: number
  actualValue: number
  type: 'upper' | 'lower' | 'both'
  description: string
}

export interface PracticeRecord {
  questionId: number
  startTime: number
  endTime: number
  userAnswer: number | null
  isCorrect: boolean
  errorSteps: StepInfo[]
  operationErrors: UserOperationError[]
  totalSteps: number
}

export interface PracticeStats {
  totalQuestions: number
  correctCount: number
  totalTime: number
  errorSteps: number
  currentStreak: number
  bestStreak: number
}
