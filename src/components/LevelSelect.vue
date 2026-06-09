<template>
  <div class="level-select">
    <div class="level-header">
      <h2 class="level-title">🎮 闯关学习模式</h2>
      <div class="level-stats">
        <n-tag type="success">已完成 {{ completedLevels }} / {{ totalLevels }} 关</n-tag>
        <n-tag type="warning">⭐ {{ totalStars }} 颗星</n-tag>
        <n-tag type="info">🏆 {{ unlockedAchievements }} 个成就</n-tag>
      </div>
    </div>

    <div class="level-tabs">
      <n-radio-group v-model:value="activeCategory" size="medium" type="button">
        <n-radio-button value="all">全部</n-radio-button>
        <n-radio-button value="addition">加法</n-radio-button>
        <n-radio-button value="subtraction">减法</n-radio-button>
        <n-radio-button value="multiplication">乘法</n-radio-button>
        <n-radio-button value="division">除法</n-radio-button>
        <n-radio-button value="mixed">综合</n-radio-button>
      </n-radio-group>
    </div>

    <div class="levels-grid">
      <div
        v-for="level in filteredLevels"
        :key="level.id"
        class="level-card"
        :class="{
          'unlocked': level.unlocked,
          'completed': level.completed,
          'locked': !level.unlocked
        }"
        @click="handleLevelClick(level)"
      >
        <div class="level-card-header">
          <span class="level-number">第 {{ level.id }} 关</span>
          <n-tag :type="getDifficultyTagType(level.difficulty)" size="small">
            {{ getDifficultyText(level.difficulty) }}
          </n-tag>
        </div>

        <div class="level-card-body">
          <h3 class="level-name">{{ level.name }}</h3>
          <p class="level-desc">{{ level.description }}</p>

          <div class="level-stars" v-if="level.completed">
            <span v-for="i in 3" :key="i" class="star" :class="{ filled: i <= level.stars }">
              ⭐
            </span>
          </div>
          <div class="level-stars" v-else-if="level.unlocked">
            <span class="star empty">☆</span>
            <span class="star empty">☆</span>
            <span class="star empty">☆</span>
          </div>
          <div class="level-locked" v-else>
            <span class="lock-icon">🔒</span>
            <span class="lock-text">未解锁</span>
          </div>
        </div>

        <div class="level-card-footer" v-if="level.completed">
          <span class="best-score">最高分: {{ level.bestScore }}%</span>
          <span class="best-time">最佳: {{ formatTime(level.bestTime) }}</span>
        </div>
      </div>
    </div>

    <div class="level-actions">
      <n-button type="primary" size="large" @click="showAchievements = true">
        🏆 成就系统
      </n-button>
      <n-button type="info" size="large" @click="showReport = true">
        📊 学习报告
      </n-button>
      <n-button type="warning" size="large" @click="showWrongBook = true">
        📝 错题本 ({{ wrongCount }})
      </n-button>
      <n-button type="default" size="large" @click="handleReset">
        🔄 重置进度
      </n-button>
    </div>

    <n-modal v-model:show="showAchievements" preset="card" title="🏆 成就系统" style="width: 600px">
      <AchievementPanel />
    </n-modal>

    <n-modal v-model:show="showReport" preset="card" title="📊 学习报告" style="width: 650px">
      <LearningReport />
    </n-modal>

    <n-modal v-model:show="showWrongBook" preset="card" title="📝 错题本" style="width: 600px">
      <WrongQuestionBook />
    </n-modal>

    <n-modal v-model:show="showLevelDetail" preset="card" :title="selectedLevel?.name || '关卡详情'" style="width: 500px">
      <div v-if="selectedLevel" class="level-detail">
        <div class="detail-section">
          <h4>🎯 关卡目标</h4>
          <ul>
            <li v-for="(goal, idx) in selectedLevel.goals" :key="idx">{{ goal }}</li>
          </ul>
        </div>

        <div class="detail-section">
          <h4>💡 小提示</h4>
          <ul>
            <li v-for="(tip, idx) in selectedLevel.tips" :key="idx">{{ tip }}</li>
          </ul>
        </div>

        <div class="detail-section">
          <h4>📋 关卡信息</h4>
          <p>题目数量: {{ selectedLevel.questionCount }} 题</p>
          <p>及格分数: {{ selectedLevel.passingScore }}%</p>
          <p>难度: {{ getDifficultyText(selectedLevel.difficulty) }}</p>
        </div>

        <div class="detail-actions">
          <n-button type="primary" size="large" @click="startSelectedLevel" :disabled="!selectedLevel.unlocked">
            {{ selectedLevel.completed ? '再次挑战' : '开始挑战' }}
          </n-button>
          <n-button @click="showLevelDetail = false">返回</n-button>
        </div>
      </div>
    </n-modal>

    <n-modal v-model:show="showResetConfirm" preset="dialog" title="确认重置" positive-text="确认重置" negative-text="取消"
      @positive-click="confirmReset">
      确定要重置所有闯关进度吗？此操作不可恢复！
    </n-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { NTag, NRadioGroup, NRadioButton, NButton, NModal } from 'naive-ui'
import { useLevelStore } from '../stores/level'
import type { LevelConfig, LevelType, DifficultyLevel } from '../types/abacus'
import AchievementPanel from './AchievementPanel.vue'
import LearningReport from './LearningReport.vue'
import WrongQuestionBook from './WrongQuestionBook.vue'

const emit = defineEmits<{
  (e: 'startLevel', levelId: number): void
}>()

const levelStore = useLevelStore()

const activeCategory = ref<LevelType | 'all'>('all')
const showAchievements = ref(false)
const showReport = ref(false)
const showWrongBook = ref(false)
const showLevelDetail = ref(false)
const selectedLevel = ref<LevelConfig | null>(null)
const showResetConfirm = ref(false)

const completedLevels = computed(() => levelStore.completedLevels)
const totalLevels = computed(() => levelStore.levels.length)
const totalStars = computed(() => levelStore.totalStars)
const unlockedAchievements = computed(() => levelStore.unlockedAchievements)
const wrongCount = computed(() => levelStore.wrongQuestions.length)

const filteredLevels = computed(() => {
  if (activeCategory.value === 'all') {
    return levelStore.levels
  }
  return levelStore.levels.filter(l => l.type === activeCategory.value)
})

function getDifficultyTagType(difficulty: DifficultyLevel): 'success' | 'warning' | 'error' | 'default' {
  switch (difficulty) {
    case 'easy': return 'success'
    case 'medium': return 'warning'
    case 'hard': return 'error'
    default: return 'default'
  }
}

function getDifficultyText(difficulty: DifficultyLevel): string {
  switch (difficulty) {
    case 'easy': return '简单'
    case 'medium': return '中等'
    case 'hard': return '困难'
    default: return ''
  }
}

function formatTime(ms: number): string {
  if (ms === 0) return '--'
  const seconds = Math.floor(ms / 1000)
  const minutes = Math.floor(seconds / 60)
  const secs = seconds % 60
  if (minutes > 0) {
    return `${minutes}分${secs}秒`
  }
  return `${secs}秒`
}

function handleLevelClick(level: LevelConfig) {
  selectedLevel.value = level
  showLevelDetail.value = true
}

function startSelectedLevel() {
  if (selectedLevel.value) {
    showLevelDetail.value = false
    emit('startLevel', selectedLevel.value.id)
  }
}

function handleReset() {
  showResetConfirm.value = true
}

function confirmReset() {
  levelStore.clearAllProgress()
  showResetConfirm.value = false
}
</script>

<style scoped>
.level-select {
  width: 100%;
  max-width: 900px;
}

.level-header {
  text-align: center;
  margin-bottom: 24px;
}

.level-title {
  font-size: 28px;
  color: #333;
  margin: 0 0 12px 0;
}

.level-stats {
  display: flex;
  justify-content: center;
  gap: 12px;
  flex-wrap: wrap;
}

.level-tabs {
  display: flex;
  justify-content: center;
  margin-bottom: 24px;
}

.levels-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 16px;
  margin-bottom: 24px;
}

.level-card {
  background: white;
  border-radius: 12px;
  padding: 16px;
  cursor: pointer;
  transition: all 0.3s ease;
  border: 2px solid #e8e8e8;
  position: relative;
  overflow: hidden;
}

.level-card.unlocked:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
  border-color: #1890ff;
}

.level-card.completed {
  border-color: #52c41a;
  background: linear-gradient(135deg, #f6ffed 0%, #ffffff 100%);
}

.level-card.locked {
  opacity: 0.6;
  cursor: not-allowed;
  background: #f5f5f5;
}

.level-card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.level-number {
  font-size: 12px;
  color: #999;
  font-weight: bold;
}

.level-card-body {
  text-align: center;
  padding: 12px 0;
}

.level-name {
  font-size: 18px;
  font-weight: bold;
  color: #333;
  margin: 0 0 8px 0;
}

.level-desc {
  font-size: 13px;
  color: #666;
  margin: 0 0 12px 0;
  line-height: 1.5;
  min-height: 40px;
}

.level-stars {
  font-size: 24px;
  letter-spacing: 4px;
}

.star.filled {
  color: #fadb14;
  text-shadow: 0 0 8px rgba(250, 219, 20, 0.6);
}

.star.empty {
  color: #d9d9d9;
}

.level-locked {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 12px 0;
}

.lock-icon {
  font-size: 32px;
}

.lock-text {
  font-size: 14px;
  color: #999;
}

.level-card-footer {
  display: flex;
  justify-content: space-between;
  padding-top: 12px;
  border-top: 1px solid #f0f0f0;
  font-size: 12px;
  color: #666;
}

.level-actions {
  display: flex;
  justify-content: center;
  gap: 12px;
  flex-wrap: wrap;
}

.level-detail {
  padding: 8px 0;
}

.detail-section {
  margin-bottom: 20px;
}

.detail-section h4 {
  font-size: 16px;
  color: #333;
  margin: 0 0 10px 0;
}

.detail-section ul {
  margin: 0;
  padding-left: 20px;
  color: #666;
  line-height: 1.8;
}

.detail-section p {
  margin: 6px 0;
  color: #666;
}

.detail-actions {
  display: flex;
  justify-content: center;
  gap: 12px;
  margin-top: 24px;
}
</style>
