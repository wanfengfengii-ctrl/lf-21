import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { DifficultyLevel, OperatorType, PracticeQuestion, PracticeRecord, PracticeStats, StepInfo } from '../types/abacus'
import { generateCalculationSteps } from '../utils/calculation'

function getRandomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function generateQuestion(difficulty: DifficultyLevel, allowedOps: OperatorType[]): PracticeQuestion {
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
        num1 = getRandomInt(2, 9)
        num2 = getRandomInt(2, 9)
        answer = num1 * num2
      } else {
        num2 = getRandomInt(2, 9)
        answer = getRandomInt(2, 9)
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
        num1 = getRandomInt(10, 99)
        num2 = getRandomInt(2, 9)
        answer = num1 * num2
      } else {
        num2 = getRandomInt(2, 9)
        answer = getRandomInt(10, 99)
        num1 = num2 * answer
      }
      break
    default:
      num1 = 1
      num2 = 1
      answer = 2
  }

  return {
    id: Date.now(),
    num1,
    num2,
    operator: op,
    answer,
    difficulty
  }
}

export const usePracticeStore = defineStore('practice', () => {
  const difficulty = ref<DifficultyLevel>('easy')
  const allowedOperations = ref<OperatorType[]>(['+', '-'])
  const currentQuestion = ref<PracticeQuestion | null>(null)
  const records = ref<PracticeRecord[]>([])
  const isAnswering = ref(false)
  const startTime = ref(0)
  const userAnswer = ref<string>('')
  const showResult = ref(false)
  const lastAnswerCorrect = ref(false)
  const userSteps = ref<StepInfo[]>([])
  const questionIndex = ref(0)
  const totalQuestions = ref(10)

  const stats = computed<PracticeStats>(() => {
    const correctRecords = records.value.filter(r => r.isCorrect)
    const totalTime = records.value.reduce((sum, r) => sum + (r.endTime - r.startTime), 0)
    const errorSteps = records.value.reduce((sum, r) => sum + r.errorSteps.length, 0)
    
    let currentStreak = 0
    let bestStreak = 0
    for (let i = records.value.length - 1; i >= 0; i--) {
      if (records.value[i].isCorrect) {
        currentStreak++
      } else {
        break
      }
    }
    let tempStreak = 0
    for (const record of records.value) {
      if (record.isCorrect) {
        tempStreak++
        bestStreak = Math.max(bestStreak, tempStreak)
      } else {
        tempStreak = 0
      }
    }

    return {
      totalQuestions: records.value.length,
      correctCount: correctRecords.length,
      totalTime,
      errorSteps,
      currentStreak,
      bestStreak
    }
  })

  const accuracy = computed(() => {
    if (stats.value.totalQuestions === 0) return 0
    return Math.round((stats.value.correctCount / stats.value.totalQuestions) * 100)
  })

  const averageTime = computed(() => {
    if (stats.value.totalQuestions === 0) return 0
    return Math.round(stats.value.totalTime / stats.value.totalQuestions / 1000 * 10) / 10
  })

  function setDifficulty(level: DifficultyLevel) {
    difficulty.value = level
  }

  function setAllowedOperations(ops: OperatorType[]) {
    allowedOperations.value = ops
  }

  function setTotalQuestions(count: number) {
    totalQuestions.value = count
  }

  function generateNewQuestion() {
    currentQuestion.value = generateQuestion(difficulty.value, allowedOperations.value)
    userAnswer.value = ''
    showResult.value = false
    lastAnswerCorrect.value = false
    isAnswering.value = false
    userSteps.value = []
    startTime.value = Date.now()
    isAnswering.value = true
    questionIndex.value++
  }

  function submitAnswer(answer: number): boolean {
    if (!currentQuestion.value || !isAnswering.value) return false

    const endTime = Date.now()
    const isCorrect = Math.abs(answer - currentQuestion.value.answer) < 0.001

    const result = generateCalculationSteps(
      currentQuestion.value.num1,
      currentQuestion.value.num2,
      currentQuestion.value.operator
    )

    const errorSteps = result.steps.filter(s => s.isError)

    const record: PracticeRecord = {
      questionId: currentQuestion.value.id,
      startTime: startTime.value,
      endTime,
      userAnswer: answer,
      isCorrect,
      errorSteps,
      totalSteps: result.steps.length
    }

    records.value.push(record)
    isAnswering.value = false
    showResult.value = true
    lastAnswerCorrect.value = isCorrect
    userSteps.value = result.steps

    return isCorrect
  }

  function addUserStep(step: StepInfo) {
    userSteps.value.push(step)
  }

  function resetPractice() {
    records.value = []
    currentQuestion.value = null
    questionIndex.value = 0
    userAnswer.value = ''
    showResult.value = false
    isAnswering.value = false
    userSteps.value = []
  }

  function getCorrectSteps(): StepInfo[] {
    if (!currentQuestion.value) return []
    const result = generateCalculationSteps(
      currentQuestion.value.num1,
      currentQuestion.value.num2,
      currentQuestion.value.operator
    )
    return result.steps
  }

  return {
    difficulty,
    allowedOperations,
    currentQuestion,
    records,
    isAnswering,
    userAnswer,
    showResult,
    lastAnswerCorrect,
    userSteps,
    questionIndex,
    totalQuestions,
    stats,
    accuracy,
    averageTime,
    setDifficulty,
    setAllowedOperations,
    setTotalQuestions,
    generateNewQuestion,
    submitAnswer,
    addUserStep,
    resetPractice,
    getCorrectSteps
  }
})
