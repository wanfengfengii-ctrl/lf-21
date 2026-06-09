import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { StepInfo, OperatorType, AbacusState } from '../types/abacus'
import {
  createInitialAbacusState,
  getAbacusValue,
  cloneAbacusState,
  numberToRods,
  isValidRodState,
  TOTAL_RODS,
  formatNumber,
  numberToAbacusState
} from '../utils/abacus'
import { generateCalculationSteps, calculateResult } from '../utils/calculation'

export const useAbacusStore = defineStore('abacus', () => {
  const abacusState = ref(createInitialAbacusState())
  const steps = ref<StepInfo[]>([])
  const currentStepIndex = ref(-1)
  const isPlaying = ref(false)
  const playSpeed = ref(1000)
  const historyStack = ref<AbacusState[]>([])
  const num1 = ref(0)
  const num2 = ref(0)
  const operator = ref<OperatorType>('+')
  const hasError = ref(false)
  const errorMessage = ref('')
  const highlightedRod = ref<number | null>(null)
  const errorRods = ref<number[]>([])

  const currentValue = computed(() => formatNumber(getAbacusValue(abacusState.value)))
  const isNegative = computed(() => abacusState.value.isNegative)
  const canUndo = computed(() => historyStack.value.length > 0)
  const canStepForward = computed(() => currentStepIndex.value < steps.value.length - 1)
  const canStepBackward = computed(() => currentStepIndex.value >= 0)
  const totalSteps = computed(() => steps.value.length)
  const currentStepNumber = computed(() => currentStepIndex.value + 1)
  const currentStep = computed(() => {
    if (currentStepIndex.value >= 0 && currentStepIndex.value < steps.value.length) {
      return steps.value[currentStepIndex.value]
    }
    return null
  })

  function saveHistory() {
    historyStack.value.push(cloneAbacusState(abacusState.value))
  }

  function resetAbacus() {
    abacusState.value = createInitialAbacusState()
    steps.value = []
    currentStepIndex.value = -1
    isPlaying.value = false
    historyStack.value = []
    hasError.value = false
    errorMessage.value = ''
    highlightedRod.value = null
    errorRods.value = []
  }

  function setNumber(value: number) {
    abacusState.value = numberToAbacusState(value, abacusState.value.decimalPosition)
    historyStack.value = []
    errorRods.value = []
  }

  function toggleNegative() {
    saveHistory()
    abacusState.value.isNegative = !abacusState.value.isNegative
    errorRods.value = []
  }

  function setNegative(value: boolean) {
    if (abacusState.value.isNegative !== value) {
      saveHistory()
      abacusState.value.isNegative = value
    }
    errorRods.value = []
  }

  function clickBead(rodIndex: number, type: 'upper' | 'lower', beadIndex: number) {
    if (rodIndex < 0 || rodIndex >= TOTAL_RODS) return

    const rod = abacusState.value.rods[rodIndex]
    const newRod = { ...rod }

    if (type === 'upper') {
      if (beadIndex === 0) {
        newRod.upper = rod.upper === 1 ? 0 : 1
      }
    } else {
      const beadsToSet = beadIndex + 1
      if (beadsToSet > rod.lower) {
        newRod.lower = Math.min(beadsToSet, 4)
      } else {
        newRod.lower = beadIndex
      }
    }

    if (!isValidRodState(newRod)) {
      return
    }

    if (rod.upper !== newRod.upper || rod.lower !== newRod.lower) {
      saveHistory()
      abacusState.value.rods[rodIndex] = newRod
      errorRods.value = errorRods.value.filter(r => r !== rodIndex)
    }
  }

  function dragBead(rodIndex: number, type: 'upper' | 'lower', value: number) {
    if (rodIndex < 0 || rodIndex >= TOTAL_RODS) return

    const rod = abacusState.value.rods[rodIndex]
    const newRod = { ...rod }

    if (type === 'upper') {
      newRod.upper = Math.max(0, Math.min(1, value))
    } else {
      newRod.lower = Math.max(0, Math.min(4, value))
    }

    if (!isValidRodState(newRod)) {
      return
    }

    if (rod.upper !== newRod.upper || rod.lower !== newRod.lower) {
      saveHistory()
      abacusState.value.rods[rodIndex] = newRod
      errorRods.value = errorRods.value.filter(r => r !== rodIndex)
    }
  }

  function undo() {
    if (historyStack.value.length === 0) return
    const previousState = historyStack.value.pop()
    if (previousState) {
      abacusState.value = previousState
    }
  }

  function loadCalculation(n1: number, n2: number, op: OperatorType) {
    num1.value = n1
    num2.value = n2
    operator.value = op
    hasError.value = false
    errorMessage.value = ''
    errorRods.value = []

    const result = generateCalculationSteps(n1, n2, op)
    
    if (result.steps.length > 0 && result.steps[0].isError) {
      hasError.value = true
      errorMessage.value = result.steps[0].errorMessage || '计算错误'
      steps.value = result.steps
      return
    }

    const initialValue = op === '×' ? 0 : n1
    abacusState.value = numberToAbacusState(initialValue, result.decimalPosition)

    if (op === '×') {
      const setupSteps: StepInfo[] = []
      let stepId = 0
      
      setupSteps.push({
        id: stepId++,
        description: `初始化算盘为 0`,
        rodIndex: TOTAL_RODS - 1,
        type: 'lower',
        delta: 0
      })
      
      const num1Rods = numberToRods(n1, result.decimalPosition)
      for (let i = 0; i < TOTAL_RODS; i++) {
        if (num1Rods[i].upper > 0) {
          setupSteps.push({
            id: stepId++,
            description: `设置被乘数：第 ${TOTAL_RODS - i} 档上珠拨下 1 颗`,
            rodIndex: i,
            type: 'upper',
            delta: 1
          })
        }
        if (num1Rods[i].lower > 0) {
          setupSteps.push({
            id: stepId++,
            description: `设置被乘数：第 ${TOTAL_RODS - i} 档下珠拨上 ${num1Rods[i].lower} 颗`,
            rodIndex: i,
            type: 'lower',
            delta: num1Rods[i].lower
          })
        }
      }
      
      steps.value = [...setupSteps, ...result.steps.map(s => ({ ...s, id: s.id + stepId }))]
    } else if (op === '÷') {
      steps.value = result.steps
    } else {
      const setupSteps: StepInfo[] = []
      let stepId = 0
      
      setupSteps.push({
        id: stepId++,
        description: `设置第一个数 ${n1}`,
        rodIndex: TOTAL_RODS - 1,
        type: 'lower',
        delta: 0
      })
      
      const num1Rods = numberToRods(n1, result.decimalPosition)
      for (let i = 0; i < TOTAL_RODS; i++) {
        if (num1Rods[i].upper > 0) {
          setupSteps.push({
            id: stepId++,
            description: `第 ${TOTAL_RODS - i} 档上珠拨下 ${num1Rods[i].upper} 颗`,
            rodIndex: i,
            type: 'upper',
            delta: num1Rods[i].upper
          })
        }
        if (num1Rods[i].lower > 0) {
          setupSteps.push({
            id: stepId++,
            description: `第 ${TOTAL_RODS - i} 档下珠拨上 ${num1Rods[i].lower} 颗`,
            rodIndex: i,
            type: 'lower',
            delta: num1Rods[i].lower
          })
        }
      }
      
      steps.value = [...setupSteps, ...result.steps.map(s => ({ ...s, id: s.id + stepId }))]
    }

    currentStepIndex.value = -1
    isPlaying.value = false
    historyStack.value = []
    highlightedRod.value = null
  }

  function stepForward() {
    if (currentStepIndex.value >= steps.value.length - 1) return

    const nextStep = steps.value[currentStepIndex.value + 1]
    
    if (nextStep.isError) {
      currentStepIndex.value++
      return
    }

    saveHistory()

    const rod = abacusState.value.rods[nextStep.rodIndex]
    const newRod = { ...rod }

    if (nextStep.type === 'upper') {
      newRod.upper += nextStep.delta
    } else {
      newRod.lower += nextStep.delta
    }

    if (isValidRodState(newRod)) {
      abacusState.value.rods[nextStep.rodIndex] = newRod
      highlightedRod.value = nextStep.rodIndex
    }

    currentStepIndex.value++
  }

  function stepBackward() {
    if (currentStepIndex.value < 0) return

    const prevStep = steps.value[currentStepIndex.value]
    
    if (prevStep.isError) {
      currentStepIndex.value--
      return
    }

    if (historyStack.value.length > 0) {
      const previousState = historyStack.value.pop()
      if (previousState) {
        abacusState.value = previousState
      }
    }

    currentStepIndex.value--
    
    if (currentStepIndex.value >= 0) {
      highlightedRod.value = steps.value[currentStepIndex.value].rodIndex
    } else {
      highlightedRod.value = null
    }
  }

  function jumpToStep(stepIndex: number) {
    if (stepIndex < -1 || stepIndex >= steps.value.length) return

    while (currentStepIndex.value < stepIndex) {
      stepForward()
    }
    while (currentStepIndex.value > stepIndex) {
      stepBackward()
    }
  }

  function play() {
    if (isPlaying.value) return
    if (currentStepIndex.value >= steps.value.length - 1) return

    isPlaying.value = true
    playNextStep()
  }

  function playNextStep() {
    if (!isPlaying.value) return
    if (currentStepIndex.value >= steps.value.length - 1) {
      isPlaying.value = false
      return
    }

    stepForward()
    setTimeout(playNextStep, playSpeed.value)
  }

  function pause() {
    isPlaying.value = false
  }

  function togglePlay() {
    if (isPlaying.value) {
      pause()
    } else {
      play()
    }
  }

  function setSpeed(speed: number) {
    playSpeed.value = speed
  }

  function getExpectedResult(): number {
    return calculateResult(num1.value, num2.value, operator.value)
  }

  function setErrorRods(rods: number[]) {
    errorRods.value = rods
  }

  function clearErrorRods() {
    errorRods.value = []
  }

  return {
    abacusState,
    steps,
    currentStepIndex,
    isPlaying,
    playSpeed,
    num1,
    num2,
    operator,
    hasError,
    errorMessage,
    highlightedRod,
    errorRods,
    currentValue,
    isNegative,
    canUndo,
    canStepForward,
    canStepBackward,
    totalSteps,
    currentStepNumber,
    currentStep,
    resetAbacus,
    setNumber,
    toggleNegative,
    setNegative,
    clickBead,
    dragBead,
    undo,
    loadCalculation,
    stepForward,
    stepBackward,
    jumpToStep,
    play,
    pause,
    togglePlay,
    setSpeed,
    getExpectedResult,
    setErrorRods,
    clearErrorRods
  }
})
