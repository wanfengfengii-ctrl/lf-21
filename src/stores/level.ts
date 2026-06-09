import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type {
  LevelConfig,
  LevelQuestion,
  LevelRecord,
  WrongQuestion,
  Achievement,
  LearningReport,
  ReplayFrame,
  ReplayData,
  OperatorType,
  DifficultyLevel,
  AbacusState,
  UserOperationError
} from '../types/abacus'
import { getInitialLevels, getOperatorsForType } from '../data/levels'
import { getInitialAchievements } from '../data/achievements'
import { generateCalculationSteps } from '../utils/calculation'
import { compareAbacusStates, numberToAbacusState, cloneAbacusState, TOTAL_RODS, getAbacusValue } from '../utils/abacus'

function getRandomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function generateLevelQuestion(
  levelId: number,
  difficulty: DifficultyLevel,
  allowedOps: OperatorType[],
  questionIndex: number
): LevelQuestion {
  const op = allowedOps[getRandomInt(0, allowedOps.length - 1)]
  let num1: number, num2: number, answer: number

  switch (difficulty) {
    case 'easy':
      if (op === '+') {
        num1 = getRandomInt(1, 9)
        num2 = getRandomInt(1, 9)
        answer = num1 + num2
      } else if (op === '-') {
        num1 = getRandomInt(1, 9)
        num2 = getRandomInt(1, num1)
        answer = num1 - num2
      } else if (op === '×') {
        num1 = getRandomInt(1, 9)
        num2 = getRandomInt(1, 9)
        answer = num1 * num2
      } else {
        num2 = getRandomInt(1, 9)
        answer = getRandomInt(1, 9)
        num1 = num2 * answer
      }
      break
    case 'medium':
      if (op === '+') {
        num1 = getRandomInt(10, 99)
        num2 = getRandomInt(10, 99)
        answer = num1 + num2
      } else if (op === '-') {
        num1 = getRandomInt(10, 99)
        num2 = getRandomInt(10, num1)
        answer = num1 - num2
      } else if (op === '×') {
        num1 = getRandomInt(10, 99)
        num2 = getRandomInt(2, 9)
        answer = num1 * num2
      } else {
        num2 = getRandomInt(2, 9)
        answer = getRandomInt(10, 99)
        num1 = num2 * answer
      }
      break
    case 'hard':
      if (op === '+') {
        num1 = getRandomInt(100, 999)
        num2 = getRandomInt(100, 999)
        answer = num1 + num2
      } else if (op === '-') {
        num1 = getRandomInt(100, 999)
        num2 = getRandomInt(100, num1)
        answer = num1 - num2
      } else if (op === '×') {
        const multiDigitOp = Math.random() > 0.5
        if (multiDigitOp) {
          num1 = getRandomInt(10, 99)
          num2 = getRandomInt(10, 99)
        } else {
          num1 = getRandomInt(100, 999)
          num2 = getRandomInt(2, 9)
        }
        answer = num1 * num2
      } else {
        const multiDigitDivisor = Math.random() > 0.5
        if (multiDigitDivisor) {
          num2 = getRandomInt(10, 99)
          answer = getRandomInt(2, 9)
        } else {
          num2 = getRandomInt(2, 9)
          answer = getRandomInt(100, 999)
        }
        num1 = num2 * answer
      }
      break
    default:
      num1 = 1
      num2 = 1
      answer = 2
  }

  const standardSteps = generateCalculationSteps(num1, num2, op).steps

  return {
    id: Date.now() + questionIndex,
    num1,
    num2,
    operator: op,
    answer,
    difficulty,
    levelId,
    questionIndex,
    standardSteps
  }
}

function generateStandardFrames(question: LevelQuestion): ReplayFrame[] {
  const frames: ReplayFrame[] = []
  const decimalPosition = 6
  let state: AbacusState = {
    rods: Array.from({ length: TOTAL_RODS }, () => ({ lower: 0, upper: 0 })),
    decimalPosition,
    isNegative: false
  }

  if (question.operator === '+' || question.operator === '-') {
    state = numberToAbacusState(question.num1, decimalPosition)
  }

  frames.push({
    abacusState: cloneAbacusState(state),
    stepIndex: -1,
    timestamp: 0,
    description: '初始状态'
  })

  for (let i = 0; i < question.standardSteps.length; i++) {
    const step = question.standardSteps[i]
    if (step.isError) continue

    const rod = state.rods[step.rodIndex]
    if (step.type === 'upper') {
      state.rods[step.rodIndex] = { ...rod, upper: rod.upper + step.delta }
    } else {
      state.rods[step.rodIndex] = { ...rod, lower: rod.lower + step.delta }
    }

    frames.push({
      abacusState: cloneAbacusState(state),
      stepIndex: i,
      timestamp: (i + 1) * 1000,
      description: step.description
    })
  }

  return frames
}

export const useLevelStore = defineStore('level', () => {
  const levels = ref<LevelConfig[]>(getInitialLevels())
  const currentLevel = ref<LevelConfig | null>(null)
  const currentQuestion = ref<LevelQuestion | null>(null)
  const currentQuestionIndex = ref(0)
  const isLevelStarted = ref(false)
  const isQuestionAnswering = ref(false)
  const levelStartTime = ref(0)
  const questionStartTime = ref(0)
  const correctCount = ref(0)
  const levelRecords = ref<LevelRecord[]>([])
  const wrongQuestions = ref<WrongQuestion[]>([])
  const achievements = ref<Achievement[]>(getInitialAchievements())
  const currentStreak = ref(0)
  const bestStreak = ref(0)
  const totalAnsweredQuestions = ref(0)
  const totalCorrectQuestions = ref(0)
  const showLevelResult = ref(false)
  const lastQuestionCorrect = ref(false)
  const operationErrors = ref<UserOperationError[]>([])
  const isSignError = ref(false)
  const signErrorExpected = ref(false)
  const currentErrorRodIndices = ref<number[]>([])

  const userReplayFrames = ref<ReplayFrame[]>([])
  const standardReplayFrames = ref<ReplayFrame[]>([])
  const currentReplayData = ref<ReplayData | null>(null)
  const realTimeCheck = ref(false)
  const realTimeErrors = ref<UserOperationError[]>([])
  const realTimeSignError = ref(false)
  const realTimeSignExpected = ref(false)

  const completedLevels = computed(() => levels.value.filter(l => l.completed).length)
  const unlockedLevels = computed(() => levels.value.filter(l => l.unlocked).length)
  const totalStars = computed(() => levels.value.reduce((sum, l) => sum + l.stars, 0))
  const unlockedAchievements = computed(() => achievements.value.filter(a => a.unlocked).length)

  const errorRodIndices = computed(() => {
    return operationErrors.value
      .filter(e => e.rodIndex >= 0)
      .map(e => e.rodIndex)
  })

  const currentProgress = computed(() => {
    if (!currentLevel.value) return 0
    return (currentQuestionIndex.value / currentLevel.value.questionCount) * 100
  })

  const realTimeErrorRodIndices = computed(() => {
    return realTimeErrors.value
      .filter(e => e.rodIndex >= 0)
      .map(e => e.rodIndex)
  })

  const displayErrors = computed(() => {
    if (realTimeCheck.value && isQuestionAnswering.value) {
      return realTimeErrors.value
    }
    return operationErrors.value
  })

  const displayErrorRodIndices = computed(() => {
    if (realTimeCheck.value && isQuestionAnswering.value) {
      return realTimeErrorRodIndices.value
    }
    return errorRodIndices.value
  })

  const displaySignError = computed(() => {
    if (realTimeCheck.value && isQuestionAnswering.value) {
      return realTimeSignError.value
    }
    return isSignError.value
  })

  const displaySignErrorExpected = computed(() => {
    if (realTimeCheck.value && isQuestionAnswering.value) {
      return realTimeSignExpected.value
    }
    return signErrorExpected.value
  })

  const canShowAnswer = computed(() => {
    return !isQuestionAnswering.value
  })

  const canShowSteps = computed(() => {
    return !isQuestionAnswering.value
  })

  function startLevel(levelId: number) {
    const level = levels.value.find(l => l.id === levelId)
    if (!level || !level.unlocked) return false

    currentLevel.value = level
    currentQuestionIndex.value = 0
    correctCount.value = 0
    isLevelStarted.value = true
    levelStartTime.value = Date.now()
    showLevelResult.value = false

    generateNextQuestion()
    return true
  }

  function generateNextQuestion() {
    if (!currentLevel.value) return

    const operators = getOperatorsForType(currentLevel.value.type)
    const question = generateLevelQuestion(
      currentLevel.value.id,
      currentLevel.value.difficulty,
      operators,
      currentQuestionIndex.value
    )

    currentQuestion.value = question
    isQuestionAnswering.value = true
    questionStartTime.value = Date.now()
    lastQuestionCorrect.value = false
    operationErrors.value = []
    isSignError.value = false
    signErrorExpected.value = false
    currentErrorRodIndices.value = []
    realTimeErrors.value = []
    realTimeSignError.value = false
    realTimeSignExpected.value = false
    userReplayFrames.value = []
    standardReplayFrames.value = generateStandardFrames(question)
  }

  function addUserReplayFrame(abacusState: AbacusState, description: string) {
    if (!isQuestionAnswering.value) return
    
    userReplayFrames.value.push({
      abacusState: cloneAbacusState(abacusState),
      stepIndex: userReplayFrames.value.length,
      timestamp: Date.now() - questionStartTime.value,
      description
    })
  }

  function realTimeCheckAbacus(abacusState: AbacusState): void {
    if (!realTimeCheck.value || !currentQuestion.value || !isQuestionAnswering.value) return

    const expectedState = numberToAbacusState(currentQuestion.value.answer, abacusState.decimalPosition)
    const errors = compareAbacusStates(abacusState, expectedState)
    
    realTimeErrors.value = errors
    realTimeSignError.value = errors.some(e => e.rodIndex === -1)
    const signError = errors.find(e => e.rodIndex === -1)
    realTimeSignExpected.value = signError ? signError.expectedValue === 1 : false
  }

  function toggleRealTimeCheck(enabled: boolean) {
    realTimeCheck.value = enabled
    if (!enabled) {
      realTimeErrors.value = []
      realTimeSignError.value = false
      realTimeSignExpected.value = false
    }
  }

  function checkAbacusAnswer(abacusState: AbacusState): boolean {
    if (!currentQuestion.value || !isQuestionAnswering.value) return false

    const expectedState = numberToAbacusState(currentQuestion.value.answer, abacusState.decimalPosition)
    const errors = compareAbacusStates(abacusState, expectedState)
    
    operationErrors.value = errors
    isSignError.value = errors.some(e => e.rodIndex === -1)
    const signError = errors.find(e => e.rodIndex === -1)
    signErrorExpected.value = signError ? signError.expectedValue === 1 : false
    currentErrorRodIndices.value = errors.filter(e => e.rodIndex >= 0).map(e => e.rodIndex)

    const isCorrect = errors.length === 0

    if (isCorrect) {
      handleCorrectAnswer(abacusState)
    } else {
      handleWrongAnswer(abacusState, errors)
    }

    return isCorrect
  }

  function handleCorrectAnswer(_abacusState: AbacusState) {
    if (!currentQuestion.value || !currentLevel.value) return

    correctCount.value++
    lastQuestionCorrect.value = true
    isQuestionAnswering.value = false
    currentStreak.value++
    bestStreak.value = Math.max(bestStreak.value, currentStreak.value)
    totalAnsweredQuestions.value++
    totalCorrectQuestions.value++

    currentReplayData.value = {
      question: currentQuestion.value,
      userFrames: [...userReplayFrames.value],
      standardFrames: [...standardReplayFrames.value],
      totalTime: Date.now() - questionStartTime.value
    }

    updateAchievements()
  }

  function handleWrongAnswer(abacusState: AbacusState, errors: UserOperationError[]) {
    if (!currentQuestion.value || !currentLevel.value) return

    lastQuestionCorrect.value = false
    currentStreak.value = 0
    totalAnsweredQuestions.value++

    const wrongQuestion: WrongQuestion = {
      questionId: currentQuestion.value.id,
      num1: currentQuestion.value.num1,
      num2: currentQuestion.value.num2,
      operator: currentQuestion.value.operator,
      answer: currentQuestion.value.answer,
      userAnswer: getAbacusValue(abacusState),
      errorRods: errors.filter(e => e.rodIndex >= 0).map(e => e.rodIndex),
      errorDescription: errors.map(e => e.description).join('; '),
      timestamp: Date.now()
    }

    wrongQuestions.value.push(wrongQuestion)

    currentReplayData.value = {
      question: currentQuestion.value,
      userFrames: [...userReplayFrames.value],
      standardFrames: [...standardReplayFrames.value],
      totalTime: Date.now() - questionStartTime.value
    }
  }

  function nextQuestion() {
    if (!currentLevel.value) return

    currentQuestionIndex.value++
    
    if (currentQuestionIndex.value >= currentLevel.value.questionCount) {
      finishLevel()
    } else {
      generateNextQuestion()
    }
  }

  function finishLevel() {
    if (!currentLevel.value) return

    const endTime = Date.now()
    const totalTime = endTime - levelStartTime.value
    const score = Math.round((correctCount.value / currentLevel.value.questionCount) * 100)
    const passed = score >= currentLevel.value.passingScore
    let stars = 0

    if (score >= 90) stars = 3
    else if (score >= 80) stars = 2
    else if (passed) stars = 1

    const record: LevelRecord = {
      levelId: currentLevel.value.id,
      startTime: levelStartTime.value,
      endTime,
      score,
      correctCount: correctCount.value,
      totalQuestions: currentLevel.value.questionCount,
      stars,
      errorRods: [],
      wrongQuestions: wrongQuestions.value.filter(w => {
        const q = currentQuestion.value
        return q && w.questionId === q.id
      })
    }

    levelRecords.value.push(record)

    const levelIndex = levels.value.findIndex(l => l.id === currentLevel.value!.id)
    if (levelIndex >= 0) {
      if (passed) {
        levels.value[levelIndex].completed = true
      }
      if (score > levels.value[levelIndex].bestScore) {
        levels.value[levelIndex].bestScore = score
      }
      if (levels.value[levelIndex].bestTime === 0 || totalTime < levels.value[levelIndex].bestTime) {
        levels.value[levelIndex].bestTime = totalTime
      }
      if (stars > levels.value[levelIndex].stars) {
        levels.value[levelIndex].stars = stars
      }

      if (passed && levelIndex + 1 < levels.value.length) {
        levels.value[levelIndex + 1].unlocked = true
      }
    }

    showLevelResult.value = true
    isLevelStarted.value = false

    updateAchievements()
  }

  function updateAchievements() {
    const updateAchievement = (id: string, progress: number) => {
      const achievement = achievements.value.find(a => a.id === id)
      if (achievement && !achievement.unlocked) {
        achievement.progress = Math.min(progress, achievement.target)
        if (achievement.progress >= achievement.target) {
          achievement.unlocked = true
          achievement.unlockedAt = Date.now()
        }
      }
    }

    updateAchievement('first_question', totalAnsweredQuestions.value)
    updateAchievement('ten_questions', totalAnsweredQuestions.value)
    updateAchievement('fifty_questions', totalAnsweredQuestions.value)
    updateAchievement('hundred_questions', totalAnsweredQuestions.value)
    updateAchievement('first_correct', totalCorrectQuestions.value > 0 ? 1 : 0)
    updateAchievement('five_streak', currentStreak.value)
    updateAchievement('ten_streak', currentStreak.value)
    updateAchievement('twenty_streak', currentStreak.value)
    updateAchievement('first_level', completedLevels.value)
    updateAchievement('five_levels', completedLevels.value)
    updateAchievement('ten_levels', completedLevels.value)
    updateAchievement('all_levels', completedLevels.value)

    const threeStarCount = levels.value.filter(l => l.stars >= 3).length
    updateAchievement('three_stars_one', threeStarCount)
    updateAchievement('three_stars_five', threeStarCount)

    const additionLevels = levels.value.filter(l => l.type === 'addition' && l.completed).length
    const subtractionLevels = levels.value.filter(l => l.type === 'subtraction' && l.completed).length
    const multiplicationLevels = levels.value.filter(l => l.type === 'multiplication' && l.completed).length
    const divisionLevels = levels.value.filter(l => l.type === 'division' && l.completed).length
    updateAchievement('addition_master', additionLevels)
    updateAchievement('subtraction_master', subtractionLevels)
    updateAchievement('multiplication_master', multiplicationLevels)
    updateAchievement('division_master', divisionLevels)

    const perfectAccuracyLevels = levels.value.filter(l => l.bestScore === 100).length
    updateAchievement('perfect_accuracy', perfectAccuracyLevels)

    let hasSpeedDemon = false
    for (const level of levels.value) {
      if (level.bestTime > 0 && level.questionCount > 0) {
        const avgTime = level.bestTime / level.questionCount / 1000
        if (avgTime < 10) {
          hasSpeedDemon = true
          break
        }
      }
    }
    updateAchievement('speed_demon', hasSpeedDemon ? 1 : 0)
  }

  function getLearningReport(): LearningReport {
    const operationStats: Map<OperatorType, { correct: number; total: number }> = new Map()
    const rodErrorCount: Map<number, number> = new Map()
    const difficultyStats: Map<DifficultyLevel, { correct: number; total: number }> = new Map()

    for (const record of levelRecords.value) {
      const level = levels.value.find(l => l.id === record.levelId)
      if (!level) continue

      if (!difficultyStats.has(level.difficulty)) {
        difficultyStats.set(level.difficulty, { correct: 0, total: 0 })
      }
      const diffStat = difficultyStats.get(level.difficulty)!
      diffStat.correct += record.correctCount
      diffStat.total += record.totalQuestions
    }

    const opTypes: OperatorType[] = ['+', '-', '×', '÷']
    for (const op of opTypes) {
      operationStats.set(op, { correct: 0, total: 0 })
    }

    for (const wq of wrongQuestions.value) {
      const stat = operationStats.get(wq.operator)
      if (stat) {
        stat.total++
      }
      for (const rodIdx of wq.errorRods) {
        rodErrorCount.set(rodIdx, (rodErrorCount.get(rodIdx) || 0) + 1)
      }
    }

    for (const record of levelRecords.value) {
      const level = levels.value.find(l => l.id === record.levelId)
      if (!level) continue

      const ops = getOperatorsForType(level.type)
      const perOpCount = record.correctCount / Math.max(ops.length, 1)
      const perOpTotal = record.totalQuestions / Math.max(ops.length, 1)

      for (const op of ops) {
        const stat = operationStats.get(op)
        if (stat) {
          stat.correct += perOpCount
          stat.total += perOpTotal
        }
      }
    }

    const weakOperations = Array.from(operationStats.entries())
      .filter(([, stat]) => stat.total > 0)
      .map(([operator, stat]) => ({
        operator,
        accuracy: Math.round((stat.correct / stat.total) * 100)
      }))
      .sort((a, b) => a.accuracy - b.accuracy)

    const weakRods = Array.from(rodErrorCount.entries())
      .map(([rodIndex, errorCount]) => ({ rodIndex, errorCount }))
      .sort((a, b) => b.errorCount - a.errorCount)
      .slice(0, 5)

    const diffStats = Array.from(difficultyStats.entries())
      .map(([difficulty, stat]) => ({
        difficulty,
        accuracy: stat.total > 0 ? Math.round((stat.correct / stat.total) * 100) : 0,
        count: stat.total
      }))

    const totalQuestions = levelRecords.value.reduce((sum, r) => sum + r.totalQuestions, 0)
    const totalCorrect = levelRecords.value.reduce((sum, r) => sum + r.correctCount, 0)
    const totalTime = levelRecords.value.reduce((sum, r) => sum + (r.endTime - r.startTime), 0)

    return {
      totalLevels: levels.value.length,
      completedLevels: completedLevels.value,
      totalQuestions,
      correctCount: totalCorrect,
      accuracy: totalQuestions > 0 ? Math.round((totalCorrect / totalQuestions) * 100) : 0,
      totalTime,
      averageTime: totalQuestions > 0 ? Math.round(totalTime / totalQuestions / 100) / 10 : 0,
      currentStreak: currentStreak.value,
      bestStreak: bestStreak.value,
      weakOperations,
      weakRods,
      difficultyStats: diffStats
    }
  }

  function clearWrongQuestions() {
    wrongQuestions.value = []
  }

  function clearAllProgress() {
    levels.value = getInitialLevels()
    levelRecords.value = []
    wrongQuestions.value = []
    achievements.value = getInitialAchievements()
    currentStreak.value = 0
    bestStreak.value = 0
    totalAnsweredQuestions.value = 0
    totalCorrectQuestions.value = 0
    currentLevel.value = null
    currentQuestion.value = null
    isLevelStarted.value = false
  }

  function exitLevel() {
    currentLevel.value = null
    currentQuestion.value = null
    isLevelStarted.value = false
    showLevelResult.value = false
    operationErrors.value = []
    isSignError.value = false
    currentReplayData.value = null
  }

  function getLevelById(id: number): LevelConfig | undefined {
    return levels.value.find(l => l.id === id)
  }

  function getHintForCurrentQuestion(): string {
    if (!currentQuestion.value || !currentLevel.value) return ''
    
    const tips = currentLevel.value.tips
    return tips[currentQuestionIndex.value % tips.length]
  }

  return {
    levels,
    currentLevel,
    currentQuestion,
    currentQuestionIndex,
    isLevelStarted,
    isQuestionAnswering,
    correctCount,
    levelRecords,
    wrongQuestions,
    achievements,
    currentStreak,
    bestStreak,
    showLevelResult,
    lastQuestionCorrect,
    operationErrors,
    isSignError,
    signErrorExpected,
    errorRodIndices,
    currentErrorRodIndices,
    userReplayFrames,
    standardReplayFrames,
    currentReplayData,
    realTimeCheck,
    realTimeErrors,
    realTimeSignError,
    realTimeSignExpected,
    realTimeErrorRodIndices,
    displayErrors,
    displayErrorRodIndices,
    displaySignError,
    displaySignErrorExpected,
    canShowAnswer,
    canShowSteps,
    completedLevels,
    unlockedLevels,
    totalStars,
    unlockedAchievements,
    currentProgress,
    startLevel,
    nextQuestion,
    checkAbacusAnswer,
    addUserReplayFrame,
    realTimeCheckAbacus,
    toggleRealTimeCheck,
    getLearningReport,
    clearWrongQuestions,
    clearAllProgress,
    exitLevel,
    getLevelById,
    getHintForCurrentQuestion
  }
})
