<template>
  <div class="level-game">
    <div class="game-header">
      <div class="game-info">
        <n-tag type="info">第 {{ currentLevel?.id }} 关: {{ currentLevel?.name }}</n-tag>
        <n-tag type="success">第 {{ questionIndex + 1 }} / {{ totalQuestions }} 题</n-tag>
        <n-tag type="warning">得分: {{ score }}%</n-tag>
      </div>
      <div class="game-progress">
        <n-progress type="line" :percentage="progress" :show-indicator="false" :height="8" />
      </div>
    </div>

    <n-card :bordered="false" class="question-card">
      <div class="question-content">
        <div class="question-header">
          <n-tag :type="difficultyTagType">{{ difficultyText }}</n-tag>
          <n-tag type="info" v-if="isAnswering">用时: {{ formatTime(elapsedTime) }}</n-tag>
        </div>

        <div class="question-display">
          <span class="question-num">{{ currentQuestion?.num1 }}</span>
          <span class="question-op">{{ currentQuestion?.operator }}</span>
          <span class="question-num">{{ currentQuestion?.num2 }}</span>
          <span class="question-eq">=</span>
          <span class="question-answer">?</span>
        </div>

        <div class="streak-display" v-if="currentStreak > 0">
          <n-tag type="warning">🔥 {{ currentStreak }} 连胜</n-tag>
        </div>
      </div>
    </n-card>

    <n-card :bordered="false" class="tips-card" v-if="showTips">
      <template #header>
        <div class="tips-header">
          <span>💡 提示</span>
          <n-button text size="small" @click="showTips = false">收起</n-button>
        </div>
      </template>
      <p class="tip-text">{{ currentTip }}</p>
    </n-card>
    <div class="tips-toggle" v-else>
      <n-button text type="primary" @click="showTips = true">💡 查看提示</n-button>
    </div>

    <div class="action-section">
      <n-button type="primary" size="large" @click="checkAnswer" :disabled="!isAnswering">
        ✅ 检查答案
      </n-button>
      <n-button type="info" size="large" @click="showReplay = true" :disabled="!hasReplayData">
        🎬 回放对比
      </n-button>
      <n-button @click="handleExit">
        🚪 退出关卡
      </n-button>
    </div>

    <div v-if="showResult" class="result-section">
      <n-alert :type="lastCorrect ? 'success' : 'error'" :show-icon="true" class="result-alert">
        <template #header>
          {{ lastCorrect ? '🎉 回答正确！' : '❌ 回答错误' }}
        </template>
        正确答案: {{ currentQuestion?.answer }}
        <br />
        用时: {{ formatTime(lastAnswerTime) }}
      </n-alert>

      <div v-if="!lastCorrect && operationErrors.length > 0" class="error-detail">
        <n-alert type="warning" :show-icon="true">
          <template #header>拨珠错误详情</template>
          <div class="error-list">
            <div v-for="(error, idx) in operationErrors" :key="idx" class="error-item">
              <n-tag type="error" size="small">{{ error.rodLabel }}</n-tag>
              <span class="error-desc">{{ error.description }}</span>
            </div>
          </div>
        </n-alert>
      </div>

      <div class="next-action">
        <n-button type="primary" size="large" @click="goToNext" v-if="hasMoreQuestions">
          下一题 →
        </n-button>
        <n-button type="success" size="large" @click="finishLevel" v-else>
          🏆 查看结果
        </n-button>
      </div>
    </div>

    <n-modal v-model:show="showReplay" preset="card" title="🎬 回放对比" style="width: 900px">
      <ReplayCompare v-if="currentReplayData" :replay-data="currentReplayData" />
    </n-modal>

    <n-modal v-model:show="showExitConfirm" preset="dialog" title="确认退出" positive-text="确认退出" negative-text="继续挑战"
      @positive-click="confirmExit">
      确定要退出当前关卡吗？当前进度将不会保存。
    </n-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onUnmounted, onMounted } from 'vue'
import { NCard, NTag, NAlert, NButton, NModal, NProgress } from 'naive-ui'
import { useLevelStore } from '../stores/level'
import { useAbacusStore } from '../stores/abacus'
import type { DifficultyLevel } from '../types/abacus'
import ReplayCompare from './ReplayCompare.vue'

const emit = defineEmits<{
  (e: 'exit'): void
  (e: 'levelComplete'): void
}>()

const levelStore = useLevelStore()
const abacusStore = useAbacusStore()

const showTips = ref(true)
const showReplay = ref(false)
const showExitConfirm = ref(false)
const elapsedTime = ref(0)
const lastAnswerTime = ref(0)
let timerInterval: number | null = null

const currentLevel = computed(() => levelStore.currentLevel)
const currentQuestion = computed(() => levelStore.currentQuestion)
const questionIndex = computed(() => levelStore.currentQuestionIndex)
const totalQuestions = computed(() => currentLevel.value?.questionCount || 0)
const isAnswering = computed(() => levelStore.isQuestionAnswering)
const showResult = computed(() => !levelStore.isQuestionAnswering && currentQuestion.value)
const lastCorrect = computed(() => levelStore.lastQuestionCorrect)
const operationErrors = computed(() => levelStore.operationErrors)
const currentStreak = computed(() => levelStore.currentStreak)
const progress = computed(() => levelStore.currentProgress)
const score = computed(() => {
  if (questionIndex.value === 0) return 0
  return Math.round((levelStore.correctCount / questionIndex.value) * 100)
})
const hasMoreQuestions = computed(() => questionIndex.value + 1 < totalQuestions.value)
const hasReplayData = computed(() => levelStore.currentReplayData !== null)
const currentReplayData = computed(() => levelStore.currentReplayData)
const currentTip = computed(() => levelStore.getHintForCurrentQuestion())

const difficultyTagType = computed(() => {
  const diff = currentLevel.value?.difficulty as DifficultyLevel
  switch (diff) {
    case 'easy': return 'success'
    case 'medium': return 'warning'
    case 'hard': return 'error'
    default: return 'default'
  }
})

const difficultyText = computed(() => {
  const diff = currentLevel.value?.difficulty as DifficultyLevel
  switch (diff) {
    case 'easy': return '简单'
    case 'medium': return '中等'
    case 'hard': return '困难'
    default: return ''
  }
})

function formatTime(ms: number): string {
  const seconds = Math.floor(ms / 1000)
  const minutes = Math.floor(seconds / 60)
  const secs = seconds % 60
  if (minutes > 0) {
    return `${minutes}分${secs}秒`
  }
  return `${secs}秒`
}

function startTimer() {
  stopTimer()
  elapsedTime.value = 0
  timerInterval = window.setInterval(() => {
    if (isAnswering.value) {
      elapsedTime.value += 100
    }
  }, 100)
}

function stopTimer() {
  if (timerInterval) {
    clearInterval(timerInterval)
    timerInterval = null
  }
}

function checkAnswer() {
  if (!isAnswering.value) return
  
  lastAnswerTime.value = elapsedTime.value
  stopTimer()
  
  levelStore.checkAbacusAnswer(abacusStore.abacusState)
}

function goToNext() {
  abacusStore.resetAbacus()
  levelStore.nextQuestion()
  startTimer()
}

function finishLevel() {
  emit('levelComplete')
}

function handleExit() {
  showExitConfirm.value = true
}

function confirmExit() {
  stopTimer()
  levelStore.exitLevel()
  emit('exit')
}

onMounted(() => {
  if (isAnswering.value) {
    startTimer()
  }
})

onUnmounted(() => {
  stopTimer()
})

watch(isAnswering, (newVal) => {
  if (newVal) {
    startTimer()
  } else {
    stopTimer()
  }
})
</script>

<style scoped>
.level-game {
  width: 100%;
  max-width: 600px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.game-header {
  background: white;
  border-radius: 12px;
  padding: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.game-info {
  display: flex;
  justify-content: center;
  gap: 12px;
  flex-wrap: wrap;
  margin-bottom: 12px;
}

.game-progress {
  width: 100%;
}

.question-card {
  text-align: center;
  margin-bottom: 0 !important;
}

.question-content {
  padding: 8px 0;
}

.question-header {
  display: flex;
  justify-content: center;
  gap: 12px;
  margin-bottom: 20px;
}

.question-display {
  font-size: 42px;
  font-weight: bold;
  margin-bottom: 16px;
  color: #333;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16px;
}

.question-num {
  font-family: 'Courier New', monospace;
}

.question-op {
  color: #1890ff;
}

.question-eq {
  color: #666;
}

.question-answer {
  color: #ff4d4f;
  min-width: 80px;
}

.streak-display {
  margin-top: 12px;
}

.tips-card {
  margin-bottom: 0 !important;
}

.tips-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  font-weight: bold;
}

.tip-text {
  margin: 0;
  color: #666;
  line-height: 1.6;
  font-size: 14px;
}

.tips-toggle {
  text-align: center;
}

.action-section {
  display: flex;
  justify-content: center;
  gap: 12px;
  flex-wrap: wrap;
}

.result-section {
  background: white;
  border-radius: 12px;
  padding: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.result-alert {
  margin-bottom: 16px;
}

.error-detail {
  margin-bottom: 16px;
  text-align: left;
}

.error-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-top: 8px;
}

.error-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 10px;
  background: #fff7e6;
  border-radius: 4px;
}

.error-desc {
  font-size: 13px;
  color: #666;
  flex: 1;
}

.next-action {
  display: flex;
  justify-content: center;
}
</style>
