<template>
  <div class="practice-panel">
    <n-card title="练习设置" :bordered="false" class="settings-section">
      <div class="settings-row">
        <span class="setting-label">难度:</span>
        <n-radio-group v-model:value="difficulty" size="small">
          <n-radio-button value="easy">简单</n-radio-button>
          <n-radio-button value="medium">中等</n-radio-button>
          <n-radio-button value="hard">困难</n-radio-button>
        </n-radio-group>
      </div>

      <div class="settings-row">
        <span class="setting-label">运算类型:</span>
        <n-checkbox-group v-model:value="allowedOperations">
          <n-checkbox value="+">加法</n-checkbox>
          <n-checkbox value="-">减法</n-checkbox>
          <n-checkbox value="×">乘法</n-checkbox>
          <n-checkbox value="÷">除法</n-checkbox>
        </n-checkbox-group>
      </div>

      <div class="settings-row">
        <span class="setting-label">题目数量:</span>
        <n-input-number v-model:value="totalQuestions" :min="1" :max="100" size="small" />
      </div>

      <div class="settings-row actions">
        <n-button type="primary" @click="startPractice" :disabled="!canStart">
          开始练习
        </n-button>
        <n-button @click="resetPractice">重置记录</n-button>
      </div>
    </n-card>

    <n-card title="当前题目" :bordered="false" class="question-section">
      <div v-if="currentQuestion" class="question-content">
        <div class="question-header">
          <n-tag type="info">第 {{ questionIndex }} / {{ totalQuestions }} 题</n-tag>
          <n-tag :type="difficultyTagType">{{ difficultyText }}</n-tag>
        </div>
        
        <div class="question-display">
          <span class="question-num">{{ currentQuestion.num1 }}</span>
          <span class="question-op">{{ currentQuestion.operator }}</span>
          <span class="question-num">{{ currentQuestion.num2 }}</span>
          <span class="question-eq">=</span>
          <span class="question-answer">?</span>
        </div>

        <div class="timer-display" v-if="isAnswering">
          <n-tag type="warning">
            用时: {{ formatTime(elapsedTime) }}
          </n-tag>
        </div>

        <div class="answer-section">
          <n-input-number
            v-model:value="userAnswerNum"
            placeholder="输入你的答案"
            class="answer-input"
            :disabled="!isAnswering"
            @keyup.enter="submitAnswer"
          />
          <n-button 
            type="primary" 
            @click="submitAnswer" 
            :disabled="!isAnswering"
            size="large"
          >
            提交答案
          </n-button>
        </div>

        <div v-if="showResult" class="result-display">
          <n-alert 
            :type="lastAnswerCorrect ? 'success' : 'error'" 
            :show-icon="true"
            class="result-alert"
          >
            <template #header>
              {{ lastAnswerCorrect ? '回答正确！' : '回答错误' }}
            </template>
            正确答案: {{ currentQuestion.answer }}
            <br />
            你的答案: {{ lastUserAnswer }}
            <br />
            用时: {{ formatTime(lastAnswerTime) }}
          </n-alert>

          <div v-if="!lastAnswerCorrect && operationErrors.length > 0" class="error-detail-section">
            <n-alert type="warning" :show-icon="true">
              <template #header>拨珠错误详情</template>
              <div class="error-detail-list">
                <div 
                  v-for="(error, index) in operationErrors" 
                  :key="index" 
                  class="error-detail-item"
                >
                  <n-tag type="error" size="small">{{ error.rodLabel }}</n-tag>
                  <span class="error-detail-text">{{ error.description }}</span>
                </div>
              </div>
            </n-alert>
          </div>
          
          <div class="next-action">
            <n-button type="primary" @click="nextQuestion" v-if="questionIndex < totalQuestions">
              下一题
            </n-button>
            <n-button type="success" @click="store.finishPractice()" v-else>
              查看总结
            </n-button>
          </div>
        </div>
      </div>
      <div v-else class="no-question">
        <n-empty description="点击开始练习生成题目" />
      </div>
    </n-card>

    <n-card title="练习统计" :bordered="false" class="stats-section">
      <div class="stats-grid">
        <div class="stat-item">
          <div class="stat-value">{{ stats.totalQuestions }}</div>
          <div class="stat-label">已答题数</div>
        </div>
        <div class="stat-item">
          <div class="stat-value correct">{{ stats.correctCount }}</div>
          <div class="stat-label">正确数</div>
        </div>
        <div class="stat-item">
          <div class="stat-value" :class="accuracyClass">{{ accuracy }}%</div>
          <div class="stat-label">正确率</div>
        </div>
        <div class="stat-item">
          <div class="stat-value">{{ averageTime }}s</div>
          <div class="stat-label">平均用时</div>
        </div>
        <div class="stat-item">
          <div class="stat-value streak">{{ stats.currentStreak }}</div>
          <div class="stat-label">当前连胜</div>
        </div>
        <div class="stat-item">
          <div class="stat-value best-streak">{{ stats.bestStreak }}</div>
          <div class="stat-label">最佳连胜</div>
        </div>
      </div>
    </n-card>

    <n-card title="错误步骤记录" :bordered="false" class="errors-section" v-if="stats.errorSteps > 0">
      <div class="error-steps-list">
        <n-tag v-for="(record, index) in recordsWithErrors" :key="index" type="error" class="error-tag">
          第 {{ index + 1 }} 题 - {{ record.errorSteps.length }} 个错误步骤
        </n-tag>
      </div>
    </n-card>

    <n-modal v-model:show="showSummary" preset="card" title="练习总结" style="width: 500px">
      <div class="summary-content">
        <div class="summary-stats">
          <div class="summary-stat">
            <span class="summary-label">总题数</span>
            <span class="summary-value">{{ stats.totalQuestions }}</span>
          </div>
          <div class="summary-stat">
            <span class="summary-label">正确数</span>
            <span class="summary-value correct">{{ stats.correctCount }}</span>
          </div>
          <div class="summary-stat">
            <span class="summary-label">正确率</span>
            <span class="summary-value" :class="accuracyClass">{{ accuracy }}%</span>
          </div>
          <div class="summary-stat">
            <span class="summary-label">总用时</span>
            <span class="summary-value">{{ formatTime(stats.totalTime) }}</span>
          </div>
          <div class="summary-stat">
            <span class="summary-label">平均用时</span>
            <span class="summary-value">{{ averageTime }}s</span>
          </div>
          <div class="summary-stat">
            <span class="summary-label">最佳连胜</span>
            <span class="summary-value best-streak">{{ stats.bestStreak }}</span>
          </div>
        </div>
        
        <div class="summary-actions">
          <n-button type="primary" @click="restartPractice">再练一次</n-button>
          <n-button @click="showSummary = false">关闭</n-button>
        </div>
      </div>
    </n-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onUnmounted } from 'vue'
import {
  NCard,
  NRadioGroup,
  NRadioButton,
  NCheckboxGroup,
  NCheckbox,
  NInputNumber,
  NButton,
  NTag,
  NEmpty,
  NAlert,
  NModal
} from 'naive-ui'
import { usePracticeStore } from '../stores/practice'
import type { DifficultyLevel, OperatorType, PracticeRecord } from '../types/abacus'

const store = usePracticeStore()

const difficulty = ref<DifficultyLevel>('easy')
const allowedOperations = ref<OperatorType[]>(['+', '-'])
const totalQuestions = ref(10)
const elapsedTime = ref(0)
const lastAnswerTime = ref(0)
const lastUserAnswer = ref<number | null>(null)
let timerInterval: number | null = null

const currentQuestion = computed(() => store.currentQuestion)
const isAnswering = computed(() => store.isAnswering)
const showResult = computed(() => store.showResult)
const lastAnswerCorrect = computed(() => store.lastAnswerCorrect)
const questionIndex = computed(() => store.questionIndex)
const stats = computed(() => store.stats)
const accuracy = computed(() => store.accuracy)
const averageTime = computed(() => store.averageTime)
const operationErrors = computed(() => store.operationErrors)
const showSummary = computed({
  get: () => store.showSummary,
  set: (val: boolean) => { store.showSummary = val }
})

const userAnswerNum = computed({
  get: () => store.userAnswer ? parseFloat(store.userAnswer) : null as unknown as number,
  set: (val: number) => { store.userAnswer = val?.toString() || '' }
})

const canStart = computed(() => {
  return allowedOperations.value.length > 0
})

const difficultyTagType = computed(() => {
  switch (difficulty.value) {
    case 'easy': return 'success'
    case 'medium': return 'warning'
    case 'hard': return 'error'
    default: return 'default'
  }
})

const difficultyText = computed(() => {
  switch (difficulty.value) {
    case 'easy': return '简单'
    case 'medium': return '中等'
    case 'hard': return '困难'
    default: return ''
  }
})

const accuracyClass = computed(() => {
  if (accuracy.value >= 80) return 'correct'
  if (accuracy.value >= 60) return 'warning'
  return 'error'
})

const recordsWithErrors = computed(() => {
  return store.records.filter((r: PracticeRecord) => r.errorSteps.length > 0)
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

function startPractice() {
  store.setDifficulty(difficulty.value)
  store.setAllowedOperations(allowedOperations.value)
  store.setTotalQuestions(totalQuestions.value)
  store.resetPractice()
  store.generateNewQuestion()
  startTimer()
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

function submitAnswer() {
  if (!isAnswering.value) return
  
  const answer = userAnswerNum.value
  if (answer === null || isNaN(answer)) return
  
  lastUserAnswer.value = answer
  lastAnswerTime.value = elapsedTime.value
  stopTimer()
  store.submitAnswer(answer)
}

function nextQuestion() {
  store.generateNewQuestion()
  startTimer()
}

function resetPractice() {
  store.resetPractice()
  stopTimer()
  elapsedTime.value = 0
}

function restartPractice() {
  showSummary.value = false
  startPractice()
}

watch(difficulty, (val) => {
  store.setDifficulty(val)
})

watch(allowedOperations, (val) => {
  store.setAllowedOperations(val)
})

onUnmounted(() => {
  stopTimer()
})
</script>

<style scoped>
.practice-panel {
  display: flex;
  flex-direction: column;
  gap: 16px;
  width: 100%;
  max-width: 600px;
}

.settings-section {
  margin-bottom: 0 !important;
}

.settings-row {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
  flex-wrap: wrap;
}

.settings-row:last-child {
  margin-bottom: 0;
}

.setting-label {
  font-size: 14px;
  color: #666;
  min-width: 80px;
}

.settings-row.actions {
  justify-content: flex-start;
  gap: 12px;
}

.question-section {
  margin-bottom: 0 !important;
}

.question-content {
  text-align: center;
}

.question-header {
  display: flex;
  justify-content: center;
  gap: 12px;
  margin-bottom: 20px;
}

.question-display {
  font-size: 36px;
  font-weight: bold;
  margin-bottom: 20px;
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
  min-width: 60px;
}

.timer-display {
  margin-bottom: 20px;
}

.answer-section {
  display: flex;
  gap: 12px;
  justify-content: center;
  margin-bottom: 20px;
}

.answer-input {
  width: 200px;
}

.result-display {
  margin-top: 16px;
}

.result-alert {
  margin-bottom: 16px;
  text-align: left;
}

.error-detail-section {
  margin-bottom: 16px;
  text-align: left;
}

.error-detail-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-top: 8px;
}

.error-detail-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 10px;
  background: #fff7e6;
  border-radius: 4px;
}

.error-detail-text {
  font-size: 13px;
  color: #666;
  flex: 1;
}

.next-action {
  display: flex;
  justify-content: center;
}

.no-question {
  padding: 20px;
}

.stats-section {
  margin-bottom: 0 !important;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
}

.stat-item {
  text-align: center;
  padding: 12px;
  background: #f5f5f5;
  border-radius: 8px;
}

.stat-value {
  font-size: 24px;
  font-weight: bold;
  color: #333;
  margin-bottom: 4px;
}

.stat-value.correct {
  color: #52c41a;
}

.stat-value.error {
  color: #ff4d4f;
}

.stat-value.warning {
  color: #faad14;
}

.stat-value.streak {
  color: #1890ff;
}

.stat-value.best-streak {
  color: #722ed1;
}

.stat-label {
  font-size: 12px;
  color: #999;
}

.errors-section {
  margin-bottom: 0 !important;
}

.error-steps-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.error-tag {
  margin: 0 !important;
}

.summary-content {
  padding: 20px 0;
}

.summary-stats {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
  margin-bottom: 24px;
}

.summary-stat {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 16px;
  background: #f5f5f5;
  border-radius: 8px;
}

.summary-label {
  font-size: 14px;
  color: #666;
  margin-bottom: 8px;
}

.summary-value {
  font-size: 28px;
  font-weight: bold;
  color: #333;
}

.summary-value.correct {
  color: #52c41a;
}

.summary-value.error {
  color: #ff4d4f;
}

.summary-value.best-streak {
  color: #722ed1;
}

.summary-actions {
  display: flex;
  justify-content: center;
  gap: 12px;
}
</style>
