<template>
  <div class="replay-compare">
    <div class="replay-header">
      <h3>拨珠过程对比</h3>
      <div class="replay-controls">
        <n-button-group>
          <n-button @click="stepBackward" :disabled="currentFrame <= 0">
            ⏮ 上一步
          </n-button>
          <n-button @click="togglePlay">
            {{ isPlaying ? '⏸ 暂停' : '▶ 播放' }}
          </n-button>
          <n-button @click="stepForward" :disabled="currentFrame >= maxFrames - 1">
            下一步 ⏭
          </n-button>
        </n-button-group>
        <n-slider v-model:value="playSpeed" :min="200" :max="2000" :step="100" class="speed-slider" />
        <span class="speed-label">{{ playSpeed }}ms/步</span>
      </div>
    </div>

    <div class="replay-progress">
      <span>第 {{ currentFrame + 1 }} / {{ maxFrames }} 步</span>
      <n-progress type="line" :percentage="progressPercent" :show-indicator="false" :height="6" />
    </div>

    <div class="replay-content">
      <div class="replay-side">
        <div class="side-header">
          <span class="side-title">👤 我的拨珠</span>
          <span class="side-time">{{ formatTime(userCurrentTime) }}</span>
        </div>
        <div class="abacus-wrapper">
          <Abacus
            :rods="userAbacusState.rods"
            :decimal-position="userAbacusState.decimalPosition"
            :is-negative="userAbacusState.isNegative"
            :interactive="false"
            :show-value="true"
          />
        </div>
        <div class="step-description">
          {{ userStepDescription }}
        </div>
      </div>

      <div class="replay-divider">
        <div class="divider-line"></div>
        <span class="divider-text">VS</span>
        <div class="divider-line"></div>
      </div>

      <div class="replay-side">
        <div class="side-header">
          <span class="side-title">📖 标准过程</span>
          <span class="side-time">{{ formatTime(standardCurrentTime) }}</span>
        </div>
        <div class="abacus-wrapper">
          <Abacus
            :rods="standardAbacusState.rods"
            :decimal-position="standardAbacusState.decimalPosition"
            :is-negative="standardAbacusState.isNegative"
            :interactive="false"
            :show-value="true"
          />
        </div>
        <div class="step-description">
          {{ standardStepDescription }}
        </div>
      </div>
    </div>

    <div class="replay-footer">
      <div class="question-info">
        <span class="question-text">
          {{ replayData.question.num1 }} {{ replayData.question.operator }} {{ replayData.question.num2 }} = {{ replayData.question.answer }}
        </span>
      </div>
      <div class="total-time">
        总用时: {{ formatTime(replayData.totalTime) }}
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onUnmounted } from 'vue'
import { NButton, NButtonGroup, NSlider, NProgress } from 'naive-ui'
import Abacus from './Abacus.vue'
import type { ReplayData, AbacusState } from '../types/abacus'
import { createInitialAbacusState } from '../utils/abacus'

const props = defineProps<{
  replayData: ReplayData
}>()

const currentFrame = ref(0)
const isPlaying = ref(false)
const playSpeed = ref(1000)
let playTimer: number | null = null

const maxFrames = computed(() => {
  return Math.max(props.replayData.userFrames.length, props.replayData.standardFrames.length)
})

const progressPercent = computed(() => {
  if (maxFrames.value <= 1) return 0
  return (currentFrame.value / (maxFrames.value - 1)) * 100
})

const userCurrentTime = computed(() => {
  const idx = Math.min(currentFrame.value, props.replayData.userFrames.length - 1)
  if (idx < 0) return 0
  return props.replayData.userFrames[idx].timestamp
})

const standardCurrentTime = computed(() => {
  const idx = Math.min(currentFrame.value, props.replayData.standardFrames.length - 1)
  if (idx < 0) return 0
  return props.replayData.standardFrames[idx].timestamp
})

const userAbacusState = computed<AbacusState>(() => {
  const idx = Math.min(currentFrame.value, props.replayData.userFrames.length - 1)
  if (idx < 0 || props.replayData.userFrames.length === 0) {
    return createInitialAbacusState()
  }
  return props.replayData.userFrames[idx].abacusState
})

const standardAbacusState = computed<AbacusState>(() => {
  const idx = Math.min(currentFrame.value, props.replayData.standardFrames.length - 1)
  if (idx < 0 || props.replayData.standardFrames.length === 0) {
    return createInitialAbacusState()
  }
  return props.replayData.standardFrames[idx].abacusState
})

const userStepDescription = computed(() => {
  const idx = Math.min(currentFrame.value, props.replayData.userFrames.length - 1)
  if (idx < 0 || props.replayData.userFrames.length === 0) return '等待开始...'
  return props.replayData.userFrames[idx].description || `第 ${idx + 1} 步`
})

const standardStepDescription = computed(() => {
  const idx = Math.min(currentFrame.value, props.replayData.standardFrames.length - 1)
  if (idx < 0 || props.replayData.standardFrames.length === 0) return '等待开始...'
  return props.replayData.standardFrames[idx].description || `第 ${idx + 1} 步`
})

function formatTime(ms: number): string {
  const seconds = Math.floor(ms / 1000)
  const decimals = Math.floor((ms % 1000) / 100)
  return `${seconds}.${decimals}s`
}

function stepForward() {
  if (currentFrame.value < maxFrames.value - 1) {
    currentFrame.value++
  }
}

function stepBackward() {
  if (currentFrame.value > 0) {
    currentFrame.value--
  }
}

function togglePlay() {
  if (isPlaying.value) {
    pause()
  } else {
    play()
  }
}

function play() {
  if (currentFrame.value >= maxFrames.value - 1) {
    currentFrame.value = 0
  }
  isPlaying.value = true
  playNextFrame()
}

function pause() {
  isPlaying.value = false
  if (playTimer) {
    clearTimeout(playTimer)
    playTimer = null
  }
}

function playNextFrame() {
  if (!isPlaying.value) return
  if (currentFrame.value >= maxFrames.value - 1) {
    isPlaying.value = false
    return
  }
  currentFrame.value++
  playTimer = window.setTimeout(playNextFrame, playSpeed.value)
}

watch(() => props.replayData, () => {
  currentFrame.value = 0
  pause()
})

onUnmounted(() => {
  pause()
})
</script>

<style scoped>
.replay-compare {
  width: 100%;
}

.replay-header {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 16px;
}

.replay-header h3 {
  margin: 0;
  font-size: 18px;
  color: #333;
  text-align: center;
}

.replay-controls {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16px;
  flex-wrap: wrap;
}

.speed-slider {
  width: 150px;
}

.speed-label {
  font-size: 12px;
  color: #666;
  min-width: 70px;
}

.replay-progress {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
  font-size: 13px;
  color: #666;
}

.replay-progress .n-progress {
  flex: 1;
}

.replay-content {
  display: flex;
  gap: 16px;
  margin-bottom: 16px;
}

.replay-side {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  background: #f9f9f9;
  border-radius: 12px;
  padding: 16px;
}

.side-header {
  display: flex;
  justify-content: space-between;
  width: 100%;
  margin-bottom: 12px;
  padding: 0 8px;
}

.side-title {
  font-size: 14px;
  font-weight: bold;
  color: #333;
}

.side-time {
  font-size: 12px;
  color: #999;
}

.abacus-wrapper {
  transform: scale(0.7);
  transform-origin: top center;
  height: 200px;
}

.step-description {
  margin-top: 12px;
  padding: 8px 12px;
  background: white;
  border-radius: 8px;
  font-size: 13px;
  color: #666;
  text-align: center;
  min-height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
}

.replay-divider {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 40px;
}

.divider-line {
  flex: 1;
  width: 2px;
  background: #e8e8e8;
}

.divider-text {
  font-size: 12px;
  font-weight: bold;
  color: #999;
  padding: 8px 0;
}

.replay-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 12px;
  border-top: 1px solid #f0f0f0;
}

.question-info {
  font-size: 16px;
  font-weight: bold;
  color: #333;
}

.question-text {
  font-family: 'Courier New', monospace;
}

.total-time {
  font-size: 13px;
  color: #666;
}
</style>
