<template>
  <div class="level-result">
    <div class="result-header">
      <div class="result-icon">{{ passed ? '🎉' : '😢' }}</div>
      <h2 class="result-title">{{ passed ? '恭喜通关！' : '挑战失败' }}</h2>
      <p class="result-subtitle">{{ currentLevel?.name }}</p>
    </div>

    <div class="stars-section">
      <span v-for="i in 3" :key="i" class="big-star" :class="{ filled: i <= stars }">
        ⭐
      </span>
      <p class="stars-text">{{ getStarsText() }}</p>
    </div>

    <div class="stats-grid">
      <div class="stat-item">
        <div class="stat-value score">{{ score }}%</div>
        <div class="stat-label">得分</div>
      </div>
      <div class="stat-item">
        <div class="stat-value correct">{{ correctCount }} / {{ totalQuestions }}</div>
        <div class="stat-label">正确题数</div>
      </div>
      <div class="stat-item">
        <div class="stat-value time">{{ formatTime(totalTime) }}</div>
        <div class="stat-label">总用时</div>
      </div>
      <div class="stat-item">
        <div class="stat-value avg">{{ averageTime }}s</div>
        <div class="stat-label">平均用时</div>
      </div>
    </div>

    <div class="detail-section" v-if="!passed">
      <n-alert type="warning" :show-icon="true">
        <template #header>继续加油！</template>
        及格分数为 {{ passingScore }}%，再练习一下就能通过啦！
      </n-alert>
    </div>

    <div class="detail-section" v-if="hasNextLevel && passed">
      <n-alert type="success" :show-icon="true">
        <template #header>新关卡解锁！</template>
        恭喜你解锁了「{{ nextLevelName }}」，快去挑战吧！
      </n-alert>
    </div>

    <div class="action-section">
      <n-button type="primary" size="large" @click="retryLevel">
        🔄 再来一次
      </n-button>
      <n-button type="success" size="large" @click="goNextLevel" v-if="hasNextLevel && passed">
        ➡️ 下一关
      </n-button>
      <n-button size="large" @click="backToLevels">
        🏠 返回选关
      </n-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { NButton, NAlert } from 'naive-ui'
import { useLevelStore } from '../stores/level'

const emit = defineEmits<{
  (e: 'retry'): void
  (e: 'nextLevel'): void
  (e: 'back'): void
}>()

const levelStore = useLevelStore()

const currentLevel = computed(() => levelStore.currentLevel)
const correctCount = computed(() => levelStore.correctCount)
const totalQuestions = computed(() => currentLevel.value?.questionCount || 0)
const score = computed(() => {
  if (totalQuestions.value === 0) return 0
  return Math.round((correctCount.value / totalQuestions.value) * 100)
})
const passingScore = computed(() => currentLevel.value?.passingScore || 60)
const passed = computed(() => score.value >= passingScore.value)
const stars = computed(() => {
  if (score.value >= 90) return 3
  if (score.value >= 80) return 2
  if (passed.value) return 1
  return 0
})

const totalTime = computed(() => {
  const records = levelStore.levelRecords
  if (records.length === 0) return 0
  const lastRecord = records[records.length - 1]
  return lastRecord.endTime - lastRecord.startTime
})

const averageTime = computed(() => {
  if (totalQuestions.value === 0) return 0
  return Math.round(totalTime.value / totalQuestions.value / 100) / 10
})

const hasNextLevel = computed(() => {
  if (!currentLevel.value) return false
  return currentLevel.value.id < levelStore.levels.length
})

const nextLevelName = computed(() => {
  if (!currentLevel.value) return ''
  const nextLevel = levelStore.getLevelById(currentLevel.value.id + 1)
  return nextLevel?.name || ''
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

function getStarsText(): string {
  if (stars.value === 3) return '完美通关！你真是太厉害了！'
  if (stars.value === 2) return '表现不错！继续努力可以更好！'
  if (stars.value === 1) return '勉强过关，还有提升空间哦！'
  return '别灰心，再试一次吧！'
}

function retryLevel() {
  emit('retry')
}

function goNextLevel() {
  emit('nextLevel')
}

function backToLevels() {
  emit('back')
}
</script>

<style scoped>
.level-result {
  width: 100%;
  max-width: 500px;
  text-align: center;
  padding: 20px;
}

.result-header {
  margin-bottom: 24px;
}

.result-icon {
  font-size: 64px;
  margin-bottom: 12px;
}

.result-title {
  font-size: 28px;
  color: #333;
  margin: 0 0 8px 0;
}

.result-subtitle {
  font-size: 16px;
  color: #666;
  margin: 0;
}

.stars-section {
  margin-bottom: 24px;
}

.big-star {
  font-size: 48px;
  margin: 0 8px;
  opacity: 0.3;
  transition: all 0.3s ease;
}

.big-star.filled {
  opacity: 1;
  color: #fadb14;
  text-shadow: 0 0 16px rgba(250, 219, 20, 0.8);
  animation: starPop 0.5s ease-out;
}

@keyframes starPop {
  0% { transform: scale(0); }
  50% { transform: scale(1.2); }
  100% { transform: scale(1); }
}

.stars-text {
  font-size: 14px;
  color: #666;
  margin: 12px 0 0 0;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
  margin-bottom: 24px;
}

.stat-item {
  background: #f5f5f5;
  border-radius: 12px;
  padding: 16px;
  text-align: center;
}

.stat-value {
  font-size: 28px;
  font-weight: bold;
  color: #333;
  margin-bottom: 4px;
}

.stat-value.score {
  color: #1890ff;
}

.stat-value.correct {
  color: #52c41a;
}

.stat-value.time {
  color: #722ed1;
}

.stat-value.avg {
  color: #fa8c16;
}

.stat-label {
  font-size: 13px;
  color: #999;
}

.detail-section {
  margin-bottom: 24px;
  text-align: left;
}

.action-section {
  display: flex;
  justify-content: center;
  gap: 12px;
  flex-wrap: wrap;
}
</style>
