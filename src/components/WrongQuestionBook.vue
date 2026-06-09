<template>
  <div class="wrong-question-book">
    <div class="book-header">
      <div class="header-info">
        <n-tag type="error" size="large">
          📝 共 {{ wrongQuestions.length }} 道错题
        </n-tag>
      </div>
      <div class="header-actions">
        <n-button size="small" @click="clearAll" v-if="wrongQuestions.length > 0">
          清空错题本
        </n-button>
      </div>
    </div>

    <div class="filter-section">
      <n-radio-group v-model:value="filterOperator" size="small">
        <n-radio-button value="all">全部</n-radio-button>
        <n-radio-button value="+">加法</n-radio-button>
        <n-radio-button value="-">减法</n-radio-button>
        <n-radio-button value="×">乘法</n-radio-button>
        <n-radio-button value="÷">除法</n-radio-button>
      </n-radio-group>
    </div>

    <div class="wrong-list" v-if="filteredQuestions.length > 0">
      <div
        v-for="(question, index) in filteredQuestions"
        :key="index"
        class="wrong-item"
      >
        <div class="wrong-header">
          <n-tag :type="getOperatorTagType(question.operator)" size="small">
            {{ getOperatorName(question.operator) }}
          </n-tag>
          <span class="wrong-time">{{ formatTime(question.timestamp) }}</span>
        </div>

        <div class="wrong-question">
          <span class="question-text">
            {{ question.num1 }} {{ question.operator }} {{ question.num2 }} = ?
          </span>
        </div>

        <div class="wrong-answers">
          <div class="answer-item wrong">
            <span class="answer-label">你的答案</span>
            <span class="answer-value">{{ question.userAnswer }}</span>
          </div>
          <div class="answer-item correct">
            <span class="answer-label">正确答案</span>
            <span class="answer-value">{{ question.answer }}</span>
          </div>
        </div>

        <div class="wrong-detail" v-if="question.errorDescription">
          <n-alert type="warning" :show-icon="true" size="small">
            <template #header>错误原因</template>
            {{ question.errorDescription }}
          </n-alert>
        </div>

        <div class="wrong-rods" v-if="question.errorRods.length > 0">
          <span class="rods-label">错误档位:</span>
          <n-tag
            v-for="rodIdx in question.errorRods"
            :key="rodIdx"
            type="error"
            size="small"
          >
            第 {{ TOTAL_RODS - rodIdx }} 档
          </n-tag>
        </div>
      </div>
    </div>

    <div class="empty-state" v-else>
      <div class="empty-icon">🎉</div>
      <p class="empty-text">太棒了！没有错题记录</p>
      <p class="empty-desc">继续保持，争取全对！</p>
    </div>

    <n-modal v-model:show="showClearConfirm" preset="dialog" title="确认清空"
      positive-text="确认清空" negative-text="取消"
      @positive-click="confirmClear">
      确定要清空所有错题记录吗？此操作不可恢复。
    </n-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { NTag, NButton, NRadioGroup, NRadioButton, NAlert, NModal } from 'naive-ui'
import { useLevelStore } from '../stores/level'
import type { OperatorType } from '../types/abacus'
import { TOTAL_RODS } from '../utils/abacus'

const levelStore = useLevelStore()

const filterOperator = ref<OperatorType | 'all'>('all')
const showClearConfirm = ref(false)

const wrongQuestions = computed(() => levelStore.wrongQuestions)

const filteredQuestions = computed(() => {
  if (filterOperator.value === 'all') {
    return wrongQuestions.value
  }
  return wrongQuestions.value.filter(q => q.operator === filterOperator.value)
})

function getOperatorName(op: OperatorType): string {
  switch (op) {
    case '+': return '加法'
    case '-': return '减法'
    case '×': return '乘法'
    case '÷': return '除法'
    default: return ''
  }
}

function getOperatorTagType(op: OperatorType): 'success' | 'warning' | 'error' | 'info' | 'default' {
  switch (op) {
    case '+': return 'success'
    case '-': return 'warning'
    case '×': return 'error'
    case '÷': return 'info'
    default: return 'default'
  }
}

function formatTime(timestamp: number): string {
  const date = new Date(timestamp)
  const month = date.getMonth() + 1
  const day = date.getDate()
  const hours = date.getHours().toString().padStart(2, '0')
  const minutes = date.getMinutes().toString().padStart(2, '0')
  return `${month}/${day} ${hours}:${minutes}`
}

function clearAll() {
  showClearConfirm.value = true
}

function confirmClear() {
  levelStore.clearWrongQuestions()
  showClearConfirm.value = false
}
</script>

<style scoped>
.wrong-question-book {
  width: 100%;
}

.book-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.filter-section {
  margin-bottom: 16px;
  display: flex;
  justify-content: center;
}

.wrong-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
  max-height: 450px;
  overflow-y: auto;
  padding-right: 8px;
}

.wrong-item {
  background: #fff1f0;
  border-radius: 10px;
  padding: 12px;
  border: 1px solid #ffccc7;
}

.wrong-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.wrong-time {
  font-size: 12px;
  color: #999;
}

.wrong-question {
  text-align: center;
  margin-bottom: 12px;
}

.question-text {
  font-size: 20px;
  font-weight: bold;
  color: #333;
  font-family: 'Courier New', monospace;
}

.wrong-answers {
  display: flex;
  gap: 12px;
  margin-bottom: 12px;
}

.answer-item {
  flex: 1;
  text-align: center;
  padding: 8px;
  border-radius: 6px;
}

.answer-item.wrong {
  background: #fff1f0;
}

.answer-item.correct {
  background: #f6ffed;
}

.answer-label {
  font-size: 12px;
  color: #999;
  display: block;
  margin-bottom: 4px;
}

.answer-value {
  font-size: 18px;
  font-weight: bold;
  font-family: 'Courier New', monospace;
}

.answer-item.wrong .answer-value {
  color: #ff4d4f;
}

.answer-item.correct .answer-value {
  color: #52c41a;
}

.wrong-detail {
  margin-bottom: 10px;
}

.wrong-rods {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.rods-label {
  font-size: 12px;
  color: #666;
}

.empty-state {
  text-align: center;
  padding: 40px 20px;
}

.empty-icon {
  font-size: 48px;
  margin-bottom: 12px;
}

.empty-text {
  font-size: 16px;
  font-weight: bold;
  color: #52c41a;
  margin: 0 0 8px 0;
}

.empty-desc {
  font-size: 13px;
  color: #999;
  margin: 0;
}
</style>
