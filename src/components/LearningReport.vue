<template>
  <div class="learning-report">
    <div class="report-section">
      <h3 class="section-title">📊 总体概览</h3>
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-value">{{ report.totalLevels }}</div>
          <div class="stat-label">总关卡数</div>
        </div>
        <div class="stat-card">
          <div class="stat-value success">{{ report.completedLevels }}</div>
          <div class="stat-label">已完成</div>
        </div>
        <div class="stat-card">
          <div class="stat-value info">{{ report.totalQuestions }}</div>
          <div class="stat-label">总题数</div>
        </div>
        <div class="stat-card">
          <div class="stat-value warning">{{ report.accuracy }}%</div>
          <div class="stat-label">正确率</div>
        </div>
        <div class="stat-card">
          <div class="stat-value primary">{{ report.averageTime }}s</div>
          <div class="stat-label">平均用时</div>
        </div>
        <div class="stat-card">
          <div class="stat-value purple">{{ report.bestStreak }}</div>
          <div class="stat-label">最佳连胜</div>
        </div>
      </div>
    </div>

    <div class="report-section">
      <h3 class="section-title">📈 运算类型分析</h3>
      <div class="operation-stats">
        <div
          v-for="op in report.weakOperations"
          :key="op.operator"
          class="operation-item"
        >
          <div class="operation-header">
            <span class="operation-name">{{ getOperationName(op.operator) }}</span>
            <span class="operation-accuracy" :class="getAccuracyClass(op.accuracy)">
              {{ op.accuracy }}%
            </span>
          </div>
          <n-progress
            type="line"
            :percentage="op.accuracy"
            :show-indicator="false"
            :height="8"
            :status="getAccuracyStatus(op.accuracy)"
          />
        </div>
        <div v-if="report.weakOperations.length === 0" class="empty-text">
          暂无数据，快去闯关吧！
        </div>
      </div>
    </div>

    <div class="report-section">
      <h3 class="section-title">🎯 薄弱档位分析</h3>
      <div class="rod-stats" v-if="report.weakRods.length > 0">
        <div
          v-for="(rod, idx) in report.weakRods"
          :key="rod.rodIndex"
          class="rod-item"
        >
          <n-tag type="error" size="small">第 {{ TOTAL_RODS - rod.rodIndex }} 档</n-tag>
          <span class="rod-error-count">错误 {{ rod.errorCount }} 次</span>
          <span class="rod-rank">TOP {{ idx + 1 }}</span>
        </div>
      </div>
      <div v-else class="empty-text">
        太棒了！暂无明显薄弱档位
      </div>
    </div>

    <div class="report-section">
      <h3 class="section-title">📚 难度分布</h3>
      <div class="difficulty-stats">
        <div
          v-for="diff in report.difficultyStats"
          :key="diff.difficulty"
          class="difficulty-item"
        >
          <n-tag :type="getDifficultyTagType(diff.difficulty)">
            {{ getDifficultyText(diff.difficulty) }}
          </n-tag>
          <span class="difficulty-count">{{ diff.count }} 题</span>
          <span class="difficulty-accuracy" :class="getAccuracyClass(diff.accuracy)">
            {{ diff.accuracy }}%
          </span>
        </div>
        <div v-if="report.difficultyStats.length === 0" class="empty-text">
          暂无数据
        </div>
      </div>
    </div>

    <div class="report-section">
      <h3 class="section-title">💡 学习建议</h3>
      <div class="suggestions">
        <p v-for="(suggestion, idx) in suggestions" :key="idx" class="suggestion-item">
          {{ suggestion }}
        </p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { NTag, NProgress } from 'naive-ui'
import { useLevelStore } from '../stores/level'
import type { OperatorType, DifficultyLevel } from '../types/abacus'
import { TOTAL_RODS } from '../utils/abacus'

const levelStore = useLevelStore()

const report = computed(() => levelStore.getLearningReport())

const suggestions = computed(() => {
  const list: string[] = []
  
  if (report.value.accuracy < 70) {
    list.push('整体正确率有待提高，建议从简单关卡开始巩固基础。')
  }
  
  if (report.value.weakOperations.length > 0) {
    const weakestOp = report.value.weakOperations[0]
    list.push(`${getOperationName(weakestOp.operator)}是你的薄弱项，建议多加练习。`)
  }
  
  if (report.value.weakRods.length > 0) {
    list.push('注意薄弱档位的拨珠练习，可以放慢速度，确保准确。')
  }
  
  if (report.value.currentStreak < 3 && report.value.totalQuestions > 5) {
    list.push('连胜次数较少，建议保持专注，提高答题稳定性。')
  }
  
  if (report.value.averageTime > 30 && report.value.totalQuestions > 3) {
    list.push('答题速度偏慢，可以通过多练习来提高熟练度。')
  }
  
  if (report.value.completedLevels === 0) {
    list.push('还没有完成任何关卡，快去挑战第一关吧！')
  }
  
  if (list.length === 0) {
    list.push('表现优秀！继续保持，挑战更高难度的关卡吧！')
    list.push('可以尝试挑战三星评价，追求完美通关！')
  }
  
  return list
})

function getOperationName(op: OperatorType): string {
  switch (op) {
    case '+': return '加法'
    case '-': return '减法'
    case '×': return '乘法'
    case '÷': return '除法'
    default: return ''
  }
}

function getAccuracyClass(accuracy: number): string {
  if (accuracy >= 80) return 'success'
  if (accuracy >= 60) return 'warning'
  return 'error'
}

function getAccuracyStatus(accuracy: number): 'success' | 'warning' | 'error' | 'info' {
  if (accuracy >= 80) return 'success'
  if (accuracy >= 60) return 'warning'
  return 'error'
}

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
</script>

<style scoped>
.learning-report {
  width: 100%;
  max-height: 600px;
  overflow-y: auto;
  padding-right: 8px;
}

.report-section {
  margin-bottom: 24px;
}

.section-title {
  font-size: 16px;
  color: #333;
  margin: 0 0 12px 0;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
}

.stat-card {
  background: #f5f5f5;
  border-radius: 10px;
  padding: 16px;
  text-align: center;
}

.stat-value {
  font-size: 24px;
  font-weight: bold;
  color: #333;
  margin-bottom: 4px;
}

.stat-value.success {
  color: #52c41a;
}

.stat-value.info {
  color: #1890ff;
}

.stat-value.warning {
  color: #faad14;
}

.stat-value.primary {
  color: #1890ff;
}

.stat-value.purple {
  color: #722ed1;
}

.stat-label {
  font-size: 12px;
  color: #999;
}

.operation-stats {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.operation-item {
  background: #f9f9f9;
  border-radius: 8px;
  padding: 12px;
}

.operation-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.operation-name {
  font-size: 14px;
  font-weight: bold;
  color: #333;
}

.operation-accuracy {
  font-size: 14px;
  font-weight: bold;
}

.operation-accuracy.success {
  color: #52c41a;
}

.operation-accuracy.warning {
  color: #faad14;
}

.operation-accuracy.error {
  color: #ff4d4f;
}

.rod-stats {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.rod-item {
  display: flex;
  align-items: center;
  gap: 12px;
  background: #fff1f0;
  padding: 10px 12px;
  border-radius: 8px;
}

.rod-error-count {
  font-size: 13px;
  color: #666;
  flex: 1;
}

.rod-rank {
  font-size: 12px;
  font-weight: bold;
  color: #ff4d4f;
  background: #fff1f0;
  padding: 2px 8px;
  border-radius: 10px;
}

.difficulty-stats {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.difficulty-item {
  display: flex;
  align-items: center;
  gap: 12px;
  background: #f9f9f9;
  padding: 10px 12px;
  border-radius: 8px;
}

.difficulty-count {
  font-size: 13px;
  color: #666;
  flex: 1;
}

.difficulty-accuracy {
  font-size: 13px;
  font-weight: bold;
}

.difficulty-accuracy.success {
  color: #52c41a;
}

.difficulty-accuracy.warning {
  color: #faad14;
}

.difficulty-accuracy.error {
  color: #ff4d4f;
}

.suggestions {
  background: #e6f7ff;
  border-radius: 8px;
  padding: 12px 16px;
}

.suggestion-item {
  font-size: 13px;
  color: #1890ff;
  margin: 6px 0;
  line-height: 1.5;
}

.empty-text {
  text-align: center;
  color: #999;
  padding: 20px;
  font-size: 13px;
}
</style>
