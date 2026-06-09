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

export type LevelType = 'addition' | 'subtraction' | 'multiplication' | 'division' | 'mixed'

export interface LevelConfig {
  id: number
  name: string
  type: LevelType
  difficulty: DifficultyLevel
  description: string
  goals: string[]
  tips: string[]
  questionCount: number
  passingScore: number
  unlocked: boolean
  completed: boolean
  bestScore: number
  bestTime: number
  stars: number
}

export interface LevelQuestion extends PracticeQuestion {
  levelId: number
  questionIndex: number
  standardSteps: StepInfo[]
}

export interface LevelRecord {
  levelId: number
  startTime: number
  endTime: number
  score: number
  correctCount: number
  totalQuestions: number
  stars: number
  errorRods: number[]
  wrongQuestions: WrongQuestion[]
}

export interface WrongQuestion {
  questionId: number
  num1: number
  num2: number
  operator: OperatorType
  answer: number
  userAnswer: number
  errorRods: number[]
  errorDescription: string
  timestamp: number
}

export interface Achievement {
  id: string
  name: string
  description: string
  icon: string
  unlocked: boolean
  unlockedAt?: number
  progress: number
  target: number
}

export interface LearningReport {
  totalLevels: number
  completedLevels: number
  totalQuestions: number
  correctCount: number
  accuracy: number
  totalTime: number
  averageTime: number
  currentStreak: number
  bestStreak: number
  weakOperations: { operator: OperatorType; accuracy: number }[]
  weakRods: { rodIndex: number; errorCount: number }[]
  difficultyStats: { difficulty: DifficultyLevel; accuracy: number; count: number }[]
}

export interface ReplayFrame {
  abacusState: AbacusState
  stepIndex: number
  timestamp: number
  description: string
}

export interface ReplayData {
  question: PracticeQuestion
  userFrames: ReplayFrame[]
  standardFrames: ReplayFrame[]
  totalTime: number
}
