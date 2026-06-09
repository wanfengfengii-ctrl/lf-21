<template>
  <div class="demo-panel">
    <n-card title="算式输入" :bordered="false" class="input-section">
      <div class="calculation-input">
        <n-input-number
          v-model:value="localNum1"
          :min="-999999"
          :max="999999"
          placeholder="第一个数"
          class="number-input"
        />
        <n-select
          v-model:value="localOperator"
          :options="operatorOptions"
          class="operator-select"
        />
        <n-input-number
          v-model:value="localNum2"
          :min="-999999"
          :max="999999"
          placeholder="第二个数"
          class="number-input"
        />
        <n-button type="primary" @click="handleStart" :disabled="!canStart">
          开始演示
        </n-button>
        <n-button @click="handleReset">重置</n-button>
      </div>
    </n-card>

    <n-card title="播放控制" :bordered="false" class="control-section">
      <div class="playback-controls">
        <n-button-group>
          <n-button @click="handleStepBack" :disabled="!canStepBack">
            ← 上一步
          </n-button>
          <n-button @click="handleTogglePlay" :type="isPlaying ? 'warning' : 'success'">
            {{ isPlaying ? '⏸ 暂停' : '▶ 播放' }}
          </n-button>
          <n-button @click="handleStepForward" :disabled="!canStepForward">
            下一步 →
          </n-button>
        </n-button-group>
      </div>

      <div class="progress-section">
        <div class="progress-info">
          <span>步骤: {{ currentStepNumber }} / {{ totalSteps }}</span>
          <span>进度: {{ progressPercent }}%</span>
        </div>
        <n-slider
          v-model:value="sliderValue"
          :min="0"
          :max="Math.max(0, totalSteps - 1)"
          :disabled="totalSteps === 0"
          @update:value="handleSliderChange"
        />
      </div>

      <div class="speed-control">
        <span class="speed-label">播放速度:</span>
        <n-radio-group v-model:value="localSpeed" size="small">
          <n-radio-button :value="2000">0.5x</n-radio-button>
          <n-radio-button :value="1000">1x</n-radio-button>
          <n-radio-button :value="500">2x</n-radio-button>
          <n-radio-button :value="250">4x</n-radio-button>
        </n-radio-group>
      </div>
    </n-card>

    <n-card title="当前步骤" :bordered="false" class="step-info-section">
      <div v-if="currentStep" class="current-step-info">
        <n-tag :type="stepTagType" class="step-tag">
          {{ stepNumberLabel }}
        </n-tag>
        <p class="step-description">{{ currentStep.description }}</p>
        <div class="step-detail">
          <n-tag size="small">档位: 第 {{ TOTAL_RODS - currentStep.rodIndex }} 档</n-tag>
          <n-tag size="small" v-if="currentStep.carryOver" type="warning">进位</n-tag>
          <n-tag size="small" v-if="currentStep.borrow" type="info">借位</n-tag>
          <n-tag size="small" :type="currentStep.type === 'upper' ? 'success' : 'info'">
            {{ currentStep.type === 'upper' ? '上珠' : '下珠' }}
          </n-tag>
          <n-tag size="small" v-if="currentStep.delta > 0" type="success">
            +{{ currentStep.delta }}
          </n-tag>
          <n-tag size="small" v-else-if="currentStep.delta < 0" type="error">
            {{ currentStep.delta }}
          </n-tag>
        </div>
      </div>
      <div v-else class="no-step-info">
        <n-empty description="暂无步骤，请先输入算式并开始演示" />
      </div>
    </n-card>

    <n-card title="步骤列表" :bordered="false" class="steps-list-section">
      <div class="steps-list" v-if="steps.length > 0">
        <div
          v-for="(step, index) in steps"
          :key="step.id"
          class="step-item"
          :class="{ 
            active: index === currentStepIndex,
            completed: index < currentStepIndex,
            error: step.isError 
          }"
          @click="jumpToStep(index)"
        >
          <div class="step-number">{{ index + 1 }}</div>
          <div class="step-text">{{ step.description }}</div>
        </div>
      </div>
      <div v-else class="no-steps">
        <n-empty description="暂无步骤" />
      </div>
    </n-card>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import {
  NCard,
  NInputNumber,
  NSelect,
  NButton,
  NButtonGroup,
  NSlider,
  NRadioGroup,
  NRadioButton,
  NTag,
  NEmpty
} from 'naive-ui'

import type { OperatorType } from '../types/abacus'
import { useAbacusStore } from '../stores/abacus'
import { TOTAL_RODS } from '../utils/abacus'

const store = useAbacusStore()

const localNum1 = ref(123)
const localNum2 = ref(45)
const localOperator = ref<OperatorType>('+')
const localSpeed = ref(1000)

const operatorOptions = [
  { label: '+ 加法', value: '+' },
  { label: '- 减法', value: '-' },
  { label: '× 乘法', value: '×' },
  { label: '÷ 除法', value: '÷' }
]

const canStart = computed(() => {
  if (localOperator.value === '÷' && localNum2.value === 0) return false
  return localNum1.value !== null && localNum2.value !== null
})

const isPlaying = computed(() => store.isPlaying)
const canStepForward = computed(() => store.canStepForward)
const canStepBack = computed(() => store.canStepBackward)
const totalSteps = computed(() => store.totalSteps)
const currentStepNumber = computed(() => store.currentStepNumber)
const currentStepIndex = computed(() => store.currentStepIndex)
const currentStep = computed(() => store.currentStep)
const steps = computed(() => store.steps)

const sliderValue = computed({
  get: () => Math.max(0, store.currentStepIndex),
  set: (val: number) => store.jumpToStep(val)
})

const progressPercent = computed(() => {
  if (totalSteps.value === 0) return 0
  return Math.round((currentStepNumber.value / totalSteps.value) * 100)
})

const stepNumberLabel = computed(() => {
  if (!currentStep.value) return '等待开始'
  return `第 ${currentStepNumber.value} 步`
})

const stepTagType = computed(() => {
  if (!currentStep.value) return 'default'
  if (currentStep.value.isError) return 'error'
  if (currentStep.value.carryOver) return 'warning'
  if (currentStep.value.borrow) return 'info'
  return 'success'
})

function handleStart() {
  if (!canStart.value) return
  if (localOperator.value === '÷' && localNum2.value === 0) return
  
  store.loadCalculation(
    localNum1.value || 0,
    localNum2.value || 0,
    localOperator.value
  )
}

function handleReset() {
  store.resetAbacus()
}

function handleTogglePlay() {
  store.togglePlay()
}

function handleStepForward() {
  store.stepForward()
}

function handleStepBack() {
  store.stepBackward()
}

function handleSliderChange(value: number) {
  store.jumpToStep(value)
}

function jumpToStep(index: number) {
  store.jumpToStep(index)
}

watch(localSpeed, (speed) => {
  store.setSpeed(speed)
})
</script>

<style scoped>
.demo-panel {
  display: flex;
  flex-direction: column;
  gap: 16px;
  width: 100%;
  max-width: 600px;
}

.input-section {
  margin-bottom: 0 !important;
}

.calculation-input {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.number-input {
  width: 120px;
}

.operator-select {
  width: 100px;
}

.control-section {
  margin-bottom: 0 !important;
}

.playback-controls {
  display: flex;
  justify-content: center;
  margin-bottom: 16px;
}

.progress-section {
  margin-bottom: 16px;
}

.progress-info {
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
  font-size: 14px;
  color: #666;
}

.speed-control {
  display: flex;
  align-items: center;
  gap: 12px;
}

.speed-label {
  font-size: 14px;
  color: #666;
}

.step-info-section {
  margin-bottom: 0 !important;
}

.current-step-info {
  text-align: center;
}

.step-tag {
  margin-bottom: 12px;
}

.step-description {
  font-size: 16px;
  color: #333;
  margin: 12px 0;
}

.step-detail {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  justify-content: center;
}

.no-step-info {
  padding: 20px;
}

.steps-list-section {
  margin-bottom: 0 !important;
  max-height: 300px;
  overflow-y: auto;
}

.steps-list {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.step-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 12px;
  border-radius: 6px;
  cursor: pointer;
  transition: background-color 0.2s;
  border: 1px solid transparent;
}

.step-item:hover {
  background-color: #f0f0f0;
}

.step-item.active {
  background-color: #e6f7ff;
  border-color: #1890ff;
}

.step-item.completed {
  opacity: 0.7;
}

.step-item.error {
  background-color: #fff1f0;
  border-color: #ff4d4f;
}

.step-number {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: #e0e0e0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: bold;
  flex-shrink: 0;
}

.step-item.active .step-number {
  background: #1890ff;
  color: white;
}

.step-item.completed .step-number {
  background: #52c41a;
  color: white;
}

.step-item.error .step-number {
  background: #ff4d4f;
  color: white;
}

.step-text {
  font-size: 14px;
  color: #333;
  flex: 1;
}

.no-steps {
  padding: 20px;
}
</style>
