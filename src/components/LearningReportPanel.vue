<template>
  <div class="learning-report-panel">
    <div class="page-header">
      <h2 class="page-title">学习报告</h2>
    </div>

    <n-card :bordered="false" class="filter-card">
      <n-grid :cols="4" :x-gap="16">
        <n-gi>
          <n-form-item label="班级筛选">
            <n-select
              v-model:value="filter.groupIds"
              multiple
              :options="groupOptions"
              placeholder="选择班级"
              clearable
            />
          </n-form-item>
        </n-gi>
        <n-gi>
          <n-form-item label="学生筛选">
            <n-select
              v-model:value="filter.studentIds"
              multiple
              filterable
              :options="studentOptions"
              placeholder="选择学生"
              clearable
            />
          </n-form-item>
        </n-gi>
        <n-gi>
          <n-form-item label="开始时间">
            <n-date-picker
              v-model:value="filter.startTime"
              type="date"
              placeholder="开始日期"
              clearable
            />
          </n-form-item>
        </n-gi>
        <n-gi>
          <n-form-item label="结束时间">
            <n-date-picker
              v-model:value="filter.endTime"
              type="date"
              placeholder="结束日期"
              clearable
            />
          </n-form-item>
        </n-gi>
      </n-grid>
      <div class="filter-actions">
        <n-button @click="resetFilter">重置</n-button>
        <n-button type="primary" @click="applyFilter" style="margin-left: 8px">
          查询
        </n-button>
      </div>
    </n-card>

    <n-grid :cols="4" :x-gap="16" style="margin: 20px 0">
      <n-gi>
        <n-card :bordered="false" class="stat-card">
          <div class="stat-icon" style="background: #dbeafe">📊</div>
          <div class="stat-content">
            <div class="stat-num">{{ overallStats.studentCount }}</div>
            <div class="stat-label">学生人数</div>
          </div>
        </n-card>
      </n-gi>
      <n-gi>
        <n-card :bordered="false" class="stat-card">
          <div class="stat-icon" style="background: #dcfce7">✅</div>
          <div class="stat-content">
            <div class="stat-num">{{ overallStats.avgAccuracy }}%</div>
            <div class="stat-label">平均正确率</div>
          </div>
        </n-card>
      </n-gi>
      <n-gi>
        <n-card :bordered="false" class="stat-card">
          <div class="stat-icon" style="background: #fef3c7">📝</div>
          <div class="stat-content">
            <div class="stat-num">{{ overallStats.totalQuestions }}</div>
            <div class="stat-label">总答题数</div>
          </div>
        </n-card>
      </n-gi>
      <n-gi>
        <n-card :bordered="false" class="stat-card">
          <div class="stat-icon" style="background: #fce7f3">⭐</div>
          <div class="stat-content">
            <div class="stat-num">{{ overallStats.totalStars }}</div>
            <div class="stat-label">总星星数</div>
          </div>
        </n-card>
      </n-gi>
    </n-grid>

    <n-tabs v-model:value="activeTab" type="line">
      <n-tab-pane name="list" tab="学生详情">
        <n-data-table
          :columns="studentColumns"
          :data="reportData"
          :pagination="{ pageSize: 8 }"
          :row-key="row => row.studentId"
          size="small"
        />
      </n-tab-pane>

      <n-tab-pane name="comparison" tab="班级对比">
        <div class="comparison-section">
          <n-grid :cols="2" :x-gap="20">
            <n-gi v-for="cls in classComparisonData" :key="cls.groupId">
              <n-card :bordered="false" class="class-card">
                <div class="class-header">
                  <h3>{{ cls.groupName }}</h3>
                  <n-tag size="small">{{ cls.studentCount }}人</n-tag>
                </div>
                <n-grid :cols="3" :x-gap="12" style="margin-top: 12px">
                  <n-gi>
                    <div class="mini-stat">
                      <div class="mini-stat-num">{{ cls.avgAccuracy }}%</div>
                      <div class="mini-stat-label">平均正确率</div>
                    </div>
                  </n-gi>
                  <n-gi>
                    <div class="mini-stat">
                      <div class="mini-stat-num">{{ cls.avgStars }}</div>
                      <div class="mini-stat-label">平均星星</div>
                    </div>
                  </n-gi>
                  <n-gi>
                    <div class="mini-stat">
                      <div class="mini-stat-num">{{ cls.avgCompletedLevels }}</div>
                      <div class="mini-stat-label">完成关卡</div>
                    </div>
                  </n-gi>
                </n-grid>
              </n-card>
            </n-gi>
          </n-grid>
        </div>
      </n-tab-pane>

      <n-tab-pane name="weak" tab="薄弱分析">
        <div class="weak-analysis">
          <n-grid :cols="2" :x-gap="20">
            <n-gi>
              <n-card :bordered="false" title="运算类型正确率分布">
                <div class="bar-chart">
                  <div v-for="op in operationStats" :key="op.operator" class="bar-item">
                    <div class="bar-label">{{ op.operator }}</div>
                    <div class="bar-track">
                      <div class="bar-fill" :style="{ width: op.accuracy + '%', background: getOpColor(op.operator) }"></div>
                    </div>
                    <div class="bar-value">{{ op.accuracy }}%</div>
                  </div>
                </div>
              </n-card>
            </n-gi>
            <n-gi>
              <n-card :bordered="false" title="难度分布">
                <div class="difficulty-stats">
                  <n-grid :cols="3" :x-gap="12">
                    <n-gi v-for="diff in difficultyStats" :key="diff.difficulty">
                      <div class="diff-card" :class="diff.difficulty">
                        <div class="diff-name">{{ getDifficultyLabel(diff.difficulty) }}</div>
                        <div class="diff-accuracy">{{ diff.accuracy }}%</div>
                        <div class="diff-count">{{ diff.count }}题</div>
                      </div>
                    </n-gi>
                  </n-grid>
                </div>
              </n-card>
            </n-gi>
          </n-grid>

          <n-card :bordered="false" title="薄弱档位分析" style="margin-top: 20px">
            <div v-if="weakRodsStats.length > 0" class="rod-stats">
              <div
                v-for="(rod, idx) in weakRodsStats"
                :key="rod.rodIndex"
                class="rod-item"
              >
                <n-tag type="error" size="small">{{ rod.rodLabel }}</n-tag>
                <div class="rod-bar-track">
                  <div
                    class="rod-bar-fill"
                    :style="{ width: (rod.errorCount / (weakRodsStats[0]?.errorCount || 1)) * 100 + '%' }"
                  ></div>
                </div>
                <span class="rod-error-count">{{ rod.errorCount }} 次错误</span>
                <span class="rod-rank">TOP {{ idx + 1 }}</span>
              </div>
            </div>
            <div v-else class="empty-text">
              太棒了！暂无明显薄弱档位
            </div>
          </n-card>

          <n-grid :cols="2" :x-gap="20" style="margin-top: 20px">
            <n-gi>
              <n-card :bordered="false" title="错题分布-运算类型">
                <div class="wrong-op-stats">
                  <div class="wrong-total">
                    共 <span class="wrong-total-num">{{ totalWrongCount }}</span> 道错题
                  </div>
                  <div class="wrong-op-list">
                    <div
                      v-for="item in wrongQuestionsByOperator"
                      :key="item.operator"
                      class="wrong-op-item"
                    >
                      <span class="wrong-op-label">{{ item.label }}</span>
                      <div class="wrong-op-bar-track">
                        <div
                          class="wrong-op-bar-fill"
                          :style="{
                            width: (item.count / (totalWrongCount || 1)) * 100 + '%',
                            background: getOpColor(item.operator)
                          }"
                        ></div>
                      </div>
                      <span class="wrong-op-count">{{ item.count }} 道</span>
                    </div>
                  </div>
                </div>
              </n-card>
            </n-gi>
            <n-gi>
              <n-card :bordered="false" title="错题分布-难度等级">
                <div class="wrong-diff-stats">
                  <n-grid :cols="3" :x-gap="12">
                    <n-gi v-for="item in wrongQuestionsByDifficulty" :key="item.difficulty">
                      <div class="wrong-diff-card" :class="item.difficulty">
                        <div class="wrong-diff-label">{{ item.label }}</div>
                        <div class="wrong-diff-count">{{ item.count }}</div>
                        <div class="wrong-diff-unit">道题</div>
                      </div>
                    </n-gi>
                  </n-grid>
                </div>
              </n-card>
            </n-gi>
          </n-grid>

          <n-card :bordered="false" title="学习建议" style="margin-top: 20px">
            <div class="advice-list">
              <div v-for="(advice, idx) in generalAdvice" :key="idx" class="advice-item">
                <n-icon size="18" style="color: #f59e0b; margin-right: 8px">💡</n-icon>
                <span>{{ advice }}</span>
              </div>
            </div>
          </n-card>
        </div>
      </n-tab-pane>
    </n-tabs>

    <n-modal v-model:show="showDetailModal" preset="card" :title="currentStudentDetail?.realName + ' - 学习详情'" style="width: 650px">
      <div v-if="currentStudentDetail" class="student-detail-modal">
        <n-descriptions :column="2" bordered label-style="width: 100px">
          <n-descriptions-item label="总答题数">
            {{ currentProgress?.totalQuestions || 0 }}
          </n-descriptions-item>
          <n-descriptions-item label="正确率">
            {{ currentProgress?.accuracy || 0 }}%
          </n-descriptions-item>
          <n-descriptions-item label="完成关卡">
            {{ currentProgress?.completedLevels || 0 }} / {{ currentProgress?.totalLevels || 0 }}
          </n-descriptions-item>
          <n-descriptions-item label="获得星星">
            {{ currentStudentDetail.stars }} ⭐
          </n-descriptions-item>
          <n-descriptions-item label="总学习时长">
            {{ formatTime(currentProgress?.totalTime || 0) }}
          </n-descriptions-item>
          <n-descriptions-item label="平均用时">
            {{ formatTime(currentProgress?.averageTime || 0) }}/题
          </n-descriptions-item>
        </n-descriptions>

        <n-divider title="薄弱环节" />
        <div class="weak-ops">
          <div v-for="op in currentProgress?.weakOperations?.slice(0, 4)" :key="op.operator" class="weak-op-item">
            <span class="op-name">{{ op.operator }}</span>
            <n-progress type="line" :percentage="op.accuracy" :stroke-width="6" style="flex: 1; margin: 0 12px" />
            <span class="op-accuracy">{{ op.accuracy }}%</span>
          </div>
        </div>

        <n-divider title="薄弱档位" />
        <div class="weak-rods">
          <div
            v-for="(rod, idx) in currentProgress?.weakRods?.slice(0, 5)"
            :key="rod.rodIndex"
            class="weak-rod-item"
          >
            <n-tag type="error" size="small">第 {{ TOTAL_RODS - rod.rodIndex }} 档</n-tag>
            <span class="rod-error-text">错误 {{ rod.errorCount }} 次</span>
            <span class="rod-badge">TOP {{ idx + 1 }}</span>
          </div>
          <div v-if="!currentProgress?.weakRods?.length" class="empty-weak-rods">
            暂无薄弱档位数据
          </div>
        </div>

        <n-divider title="学习建议" />
        <div class="student-advice">
          <div v-for="(suggestion, idx) in currentAdvice?.suggestions || []" :key="idx" class="suggestion-item">
            <n-tag size="small" type="info">建议{{ idx + 1 }}</n-tag>
            <span>{{ suggestion }}</span>
          </div>
        </div>
      </div>
    </n-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, reactive, h } from 'vue'
import {
  NCard,
  NGrid,
  NGi,
  NFormItem,
  NSelect,
  NDatePicker,
  NButton,
  NTabs,
  NTabPane,
  NDataTable,
  NAvatar,
  NProgress,
  NTag,
  NDivider,
  NDescriptions,
  NDescriptionsItem,
  NModal,
  NIcon
} from 'naive-ui'
import { useTeacherStore } from '../stores/teacher'
import type { StudentProgress, LearningReportFilter } from '../types/teacher'
import type { DifficultyLevel, OperatorType } from '../types/abacus'
import { TOTAL_RODS } from '../utils/abacus'

const teacherStore = useTeacherStore()

const activeTab = ref('list')
const showDetailModal = ref(false)
const currentStudentDetail = ref<any>(null)
const currentProgress = ref<StudentProgress | null>(null)
const currentAdvice = ref<any>(null)

const filter = reactive<LearningReportFilter>({
  groupIds: [],
  studentIds: [],
  startTime: undefined,
  endTime: undefined
})

const groupOptions = computed(() =>
  teacherStore.allGroups.map(g => ({ label: g.name, value: g.id }))
)

const studentOptions = computed(() =>
  teacherStore.allStudents.map(s => ({
    label: `${s.realName} (${s.username})`,
    value: s.id
  }))
)

const reportData = computed(() => {
  const filterParams: LearningReportFilter = {}
  if (filter.groupIds && filter.groupIds.length > 0) {
    filterParams.groupIds = filter.groupIds
  }
  if (filter.studentIds && filter.studentIds.length > 0) {
    filterParams.studentIds = filter.studentIds
  }
  return teacherStore.getFilteredReport(filterParams)
})

const classComparisonData = computed(() => teacherStore.getClassComparison())

const overallStats = computed(() => {
  const data = reportData.value
  const totalQuestions = data.reduce((sum, p) => sum + p.totalQuestions, 0)
  const avgAccuracy = data.length > 0
    ? Math.round(data.reduce((sum, p) => sum + p.accuracy, 0) / data.length)
    : 0
  const totalStars = teacherStore.students
    .filter(s => {
      if (filter.groupIds && filter.groupIds.length > 0) {
        return s.groupIds.some(gid => filter.groupIds!.includes(gid))
      }
      if (filter.studentIds && filter.studentIds.length > 0) {
        return filter.studentIds.includes(s.id)
      }
      return true
    })
    .reduce((sum, s) => sum + s.stars, 0)

  return {
    studentCount: data.length,
    avgAccuracy,
    totalQuestions,
    totalStars
  }
})

const operationStats = computed(() => {
  const data = reportData.value
  if (data.length === 0) return []

  const opStats: Record<OperatorType, { accuracy: number; count: number }> = {
    '+': { accuracy: 0, count: 0 },
    '-': { accuracy: 0, count: 0 },
    '×': { accuracy: 0, count: 0 },
    '÷': { accuracy: 0, count: 0 }
  }

  for (const progress of data) {
    for (const op of progress.weakOperations) {
      if (op.count > 0) {
        opStats[op.operator].accuracy += op.accuracy
        opStats[op.operator].count += 1
      }
    }
  }

  return (['+', '-', '×', '÷'] as OperatorType[]).map(op => ({
    operator: op,
    accuracy: opStats[op].count > 0 ? Math.round(opStats[op].accuracy / opStats[op].count) : 0
  }))
})

const difficultyStats = computed(() => {
  const data = reportData.value
  if (data.length === 0) return []

  const diffStats: Record<DifficultyLevel, { accuracy: number; count: number }> = {
    easy: { accuracy: 0, count: 0 },
    medium: { accuracy: 0, count: 0 },
    hard: { accuracy: 0, count: 0 }
  }

  for (const progress of data) {
    for (const diff of progress.difficultyStats) {
      diffStats[diff.difficulty].accuracy += diff.accuracy
      diffStats[diff.difficulty].count += 1
    }
  }

  return (['easy', 'medium', 'hard'] as DifficultyLevel[]).map(d => ({
    difficulty: d,
    accuracy: diffStats[d].count > 0 ? Math.round(diffStats[d].accuracy / diffStats[d].count) : 0,
    count: Math.round(diffStats[d].count / Math.max(data.length, 1))
  }))
})

const weakRodsStats = computed(() => {
  const data = reportData.value
  if (data.length === 0) return []

  const rodStats: Record<number, number> = {}
  for (const progress of data) {
    for (const rod of progress.weakRods) {
      rodStats[rod.rodIndex] = (rodStats[rod.rodIndex] || 0) + rod.errorCount
    }
  }

  return Object.entries(rodStats)
    .map(([rodIndex, errorCount]) => ({
      rodIndex: parseInt(rodIndex),
      errorCount,
      rodLabel: `第 ${TOTAL_RODS - parseInt(rodIndex)} 档`
    }))
    .sort((a, b) => b.errorCount - a.errorCount)
    .slice(0, 5)
})

const wrongQuestionsByOperator = computed(() => {
  const data = reportData.value
  if (data.length === 0) return []

  const opStats: Record<OperatorType, number> = { '+': 0, '-': 0, '×': 0, '÷': 0 }

  for (const progress of data) {
    const wrongQs = teacherStore.getWrongQuestionsByStudent(progress.studentId)
    for (const q of wrongQs) {
      opStats[q.operator]++
    }
  }

  const operators: OperatorType[] = ['+', '-', '×', '÷']
  return operators.map(op => ({
    operator: op,
    count: opStats[op],
    label: { '+': '加法', '-': '减法', '×': '乘法', '÷': '除法' }[op]
  }))
})

const totalWrongCount = computed(() => {
  return wrongQuestionsByOperator.value.reduce((sum, item) => sum + item.count, 0)
})

const wrongQuestionsByDifficulty = computed(() => {
  const data = reportData.value
  if (data.length === 0) return []

  const diffStats: Record<DifficultyLevel, number> = { easy: 0, medium: 0, hard: 0 }

  for (const progress of data) {
    const wrongQs = teacherStore.getWrongQuestionsByStudent(progress.studentId)
    for (const q of wrongQs) {
      diffStats[q.difficulty]++
    }
  }

  const difficulties: DifficultyLevel[] = ['easy', 'medium', 'hard']
  return difficulties.map(diff => ({
    difficulty: diff,
    count: diffStats[diff],
    label: { easy: '简单', medium: '中等', hard: '困难' }[diff]
  }))
})

const generalAdvice = computed(() => {
  const advice: string[] = []

  const weakestOp = operationStats.value.length > 0
    ? operationStats.value.reduce((min, op) => op.accuracy < min.accuracy ? op : min)
    : null

  if (weakestOp && weakestOp.accuracy < 70) {
    const opNames: Record<OperatorType, string> = {
      '+': '加法',
      '-': '减法',
      '×': '乘法',
      '÷': '除法'
    }
    advice.push(`${opNames[weakestOp.operator]}正确率较低，建议加强专项练习，每天安排10-15道题`)
  }

  const hardDiff = difficultyStats.value.find(d => d.difficulty === 'hard')
  if (hardDiff && hardDiff.accuracy < 60) {
    advice.push('困难题目正确率偏低，建议先巩固基础，再逐步提升难度')
  }

  if (overallStats.value.avgAccuracy < 70) {
    advice.push('整体正确率有待提高，建议放慢速度，先保证正确率再提升速度')
  }

  advice.push('建议每天坚持练习15-20分钟，保持学习的连贯性')
  advice.push('对于错题要认真分析原因，可以使用错题本进行针对性复习')

  return advice
})

const studentColumns = [
  {
    title: '学生',
    key: 'studentName',
    width: 150,
    render: (row: StudentProgress) =>
      h('div', { style: 'display: flex; align-items: center; gap: 10px' }, [
        h(NAvatar, { round: true, size: 30 }, {
          default: () => getStudent(row.studentId)?.realName?.charAt(0) || ''
        }),
        h('span', getStudent(row.studentId)?.realName || '')
      ])
  },
  { title: '完成关卡', key: 'completedLevels', width: 120 },
  { title: '答题数', key: 'totalQuestions', width: 100 },
  {
    title: '正确率',
    key: 'accuracy',
    width: 150,
    render: (row: StudentProgress) =>
      h(NProgress, {
        type: 'line',
        percentage: row.accuracy,
        strokeWidth: 6,
        color: getAccuracyColor(row.accuracy),
        style: 'width: 100px'
      })
  },
  { title: '平均用时', key: 'averageTime', width: 120 },
  {
    title: '操作',
    key: 'actions',
    width: 100,
    fixed: 'right' as const,
    render: (row: StudentProgress) =>
      h(NButton, { size: 'tiny', onClick: () => viewDetail(row) }, {
        default: () => '查看详情'
      })
  }
]

function getStudent(id: string) {
  return teacherStore.getStudentById(id)
}

function getAccuracyColor(accuracy: number): string {
  if (accuracy >= 80) return '#10b981'
  if (accuracy >= 60) return '#f59e0b'
  return '#ef4444'
}

function getOpColor(op: OperatorType): string {
  const colors: Record<OperatorType, string> = {
    '+': '#3b82f6',
    '-': '#10b981',
    '×': '#f59e0b',
    '÷': '#8b5cf6'
  }
  return colors[op] || '#64748b'
}

function getDifficultyLabel(diff: DifficultyLevel): string {
  const labels: Record<DifficultyLevel, string> = {
    easy: '简单',
    medium: '中等',
    hard: '困难'
  }
  return labels[diff] || diff
}

function formatTime(ms: number): string {
  const seconds = Math.floor(ms / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)

  if (hours > 0) {
    return `${hours}小时${minutes % 60}分钟`
  }
  if (minutes > 0) {
    return `${minutes}分钟${seconds % 60}秒`
  }
  return `${seconds}秒`
}

function resetFilter() {
  filter.groupIds = []
  filter.studentIds = []
  filter.startTime = undefined
  filter.endTime = undefined
}

function applyFilter() {
  // 数据已经是响应式的，这里可以加一些加载效果
}

function viewDetail(row: StudentProgress) {
  const student = getStudent(row.studentId)
  if (student) {
    currentStudentDetail.value = student
    currentProgress.value = row
    currentAdvice.value = teacherStore.getLearningAdvice(row.studentId)
    showDetailModal.value = true
  }
}
</script>

<style scoped>
.learning-report-panel {
  height: 100%;
}

.page-header {
  margin-bottom: 20px;
}

.page-title {
  font-size: 22px;
  font-weight: 600;
  color: #1e293b;
  margin: 0;
}

.filter-card {
  margin-bottom: 20px;
}

.filter-actions {
  display: flex;
  justify-content: flex-end;
  margin-top: 8px;
}

.stat-card {
  display: flex;
  align-items: center;
  gap: 12px;
}

.stat-icon {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
}

.stat-content {
  flex: 1;
}

.stat-num {
  font-size: 24px;
  font-weight: 700;
  color: #1e293b;
}

.stat-label {
  font-size: 13px;
  color: #64748b;
}

.comparison-section {
  padding-top: 16px;
}

.class-card {
  margin-bottom: 0;
}

.class-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.class-header h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: #1e293b;
}

.mini-stat {
  text-align: center;
}

.mini-stat-num {
  font-size: 18px;
  font-weight: 700;
  color: #6366f1;
}

.mini-stat-label {
  font-size: 12px;
  color: #64748b;
  margin-top: 4px;
}

.weak-analysis {
  padding-top: 16px;
}

.bar-chart {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.bar-item {
  display: flex;
  align-items: center;
  gap: 12px;
}

.bar-label {
  width: 24px;
  font-size: 16px;
  font-weight: 600;
  color: #1e293b;
}

.bar-track {
  flex: 1;
  height: 20px;
  background: #f1f5f9;
  border-radius: 10px;
  overflow: hidden;
}

.bar-fill {
  height: 100%;
  border-radius: 10px;
  transition: width 0.3s ease;
}

.bar-value {
  width: 50px;
  text-align: right;
  font-size: 14px;
  font-weight: 600;
  color: #475569;
}

.difficulty-stats {
  padding: 8px 0;
}

.diff-card {
  text-align: center;
  padding: 16px;
  border-radius: 8px;
  background: #f8fafc;

  &.easy {
    background: #f0fdf4;
  }

  &.medium {
    background: #fffbeb;
  }

  &.hard {
    background: #fef2f2;
  }
}

.diff-name {
  font-size: 14px;
  color: #64748b;
}

.diff-accuracy {
  font-size: 20px;
  font-weight: 700;
  margin: 4px 0;
  color: #1e293b;
}

.diff-count {
  font-size: 12px;
  color: #94a3b8;
}

.rod-stats {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.rod-item {
  display: flex;
  align-items: center;
  gap: 12px;
  background: #fff1f0;
  padding: 10px 12px;
  border-radius: 8px;
}

.rod-bar-track {
  flex: 1;
  height: 8px;
  background: #ffe4e6;
  border-radius: 4px;
  overflow: hidden;
}

.rod-bar-fill {
  height: 100%;
  background: linear-gradient(90deg, #f87171, #ef4444);
  border-radius: 4px;
  transition: width 0.3s ease;
}

.rod-error-count {
  font-size: 13px;
  color: #dc2626;
  font-weight: 500;
  min-width: 80px;
}

.rod-rank {
  font-size: 12px;
  font-weight: bold;
  color: #b91c1c;
  background: #fee2e2;
  padding: 2px 8px;
  border-radius: 10px;
}

.empty-text {
  text-align: center;
  color: #94a3b8;
  padding: 20px;
  font-size: 13px;
}

.wrong-op-stats {
  padding: 8px 0;
}

.wrong-total {
  font-size: 14px;
  color: #64748b;
  margin-bottom: 16px;
  text-align: center;
}

.wrong-total-num {
  font-size: 24px;
  font-weight: 700;
  color: #dc2626;
  margin: 0 4px;
}

.wrong-op-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.wrong-op-item {
  display: flex;
  align-items: center;
  gap: 12px;
}

.wrong-op-label {
  font-size: 13px;
  color: #475569;
  width: 48px;
}

.wrong-op-bar-track {
  flex: 1;
  height: 10px;
  background: #f1f5f9;
  border-radius: 5px;
  overflow: hidden;
}

.wrong-op-bar-fill {
  height: 100%;
  border-radius: 5px;
  transition: width 0.3s ease;
}

.wrong-op-count {
  font-size: 13px;
  font-weight: 600;
  color: #1e293b;
  width: 50px;
  text-align: right;
}

.wrong-diff-stats {
  padding: 8px 0;
}

.wrong-diff-card {
  text-align: center;
  padding: 16px 8px;
  border-radius: 8px;
  background: #f8fafc;

  &.easy {
    background: #f0fdf4;
  }

  &.medium {
    background: #fffbeb;
  }

  &.hard {
    background: #fef2f2;
  }
}

.wrong-diff-label {
  font-size: 13px;
  color: #64748b;
}

.wrong-diff-count {
  font-size: 24px;
  font-weight: 700;
  margin: 4px 0 2px;
  color: #1e293b;
}

.wrong-diff-unit {
  font-size: 11px;
  color: #94a3b8;
}

.advice-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.advice-item {
  display: flex;
  align-items: flex-start;
  padding: 10px 12px;
  background: #fffbeb;
  border-radius: 6px;
  font-size: 14px;
  color: #92400e;
  line-height: 1.5;
}

.student-detail-modal {
  padding: 8px 0;
}

.weak-ops {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.weak-op-item {
  display: flex;
  align-items: center;
}

.op-name {
  font-size: 18px;
  font-weight: 600;
  width: 24px;
}

.op-accuracy {
  font-size: 14px;
  font-weight: 600;
  color: #475569;
  width: 50px;
  text-align: right;
}

.weak-rods {
  padding: 8px 0;
}

.weak-rod-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 12px;
  background: #fff1f0;
  border-radius: 6px;
  margin-bottom: 8px;
}

.rod-error-text {
  flex: 1;
  font-size: 13px;
  color: #dc2626;
}

.rod-badge {
  font-size: 12px;
  font-weight: bold;
  color: #b91c1c;
  background: #fee2e2;
  padding: 2px 8px;
  border-radius: 10px;
}

.empty-weak-rods {
  text-align: center;
  color: #94a3b8;
  padding: 16px;
  font-size: 13px;
}

.student-advice {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.suggestion-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  background: #f0f9ff;
  border-radius: 6px;
  font-size: 14px;
  color: #075985;
}
</style>
