<template>
  <div class="student-task-view">
    <div class="student-header">
      <div class="student-info">
        <n-avatar round :size="56" style="background: #6366f1">
          {{ currentStudent?.realName?.charAt(0) || '学' }}
        </n-avatar>
        <div class="student-detail">
          <h2 class="student-name">{{ currentStudent?.realName }}</h2>
          <p class="student-meta">
            {{ currentStudent?.grade || '' }} · 
            <span class="stars">⭐ {{ currentStudent?.stars || 0 }} 颗星</span>
          </p>
        </div>
      </div>
      <div class="student-stats">
        <div class="stat-badge">
          <span class="stat-num">{{ studentProgress.accuracy }}%</span>
          <span class="stat-label">正确率</span>
        </div>
        <div class="stat-badge">
          <span class="stat-num">{{ studentProgress.totalQuestions }}</span>
          <span class="stat-label">答题数</span>
        </div>
        <div class="stat-badge">
          <span class="stat-num">{{ currentStudent?.currentStreak || 0 }}</span>
          <span class="stat-label">连续打卡</span>
        </div>
      </div>
    </div>

    <n-tabs v-model:value="activeTab" type="line">
      <n-tab-pane name="tasks" tab="我的任务">
        <div class="task-list-section">
          <div class="section-header">
            <h3>待完成</h3>
            <n-tag size="small" type="warning">{{ pendingTasks.length }} 个任务</n-tag>
          </div>

          <div v-if="pendingTasks.length === 0" class="empty-state">
            <div class="empty-icon">🎉</div>
            <p>太棒了！所有任务都完成了</p>
          </div>

          <div v-else class="task-cards">
            <n-card
              v-for="task in pendingTasks"
              :key="task.id"
              :bordered="false"
              :class="['task-card', 'pending', getTaskStatusClass(task.id)]"
              hoverable
            >
              <div class="task-status-row">
                <div class="task-type-badge" :class="task.config.type">
                  {{ task.config.type === 'level' ? '关卡作业' : '练习任务' }}
                </div>
                <n-tag :type="getStatusTagType(task.id)" size="small">
                  {{ getStatusLabel(task.id) }}
                </n-tag>
              </div>
              <h4 class="task-title">{{ task.title }}</h4>
              <p class="task-desc">{{ task.description || '暂无描述' }}</p>

              <div class="task-info">
                <div class="info-row">
                  <span class="info-icon">📝</span>
                  <span>{{ task.config.questionCount }} 道题目</span>
                </div>
                <div class="info-row">
                  <span class="info-icon">⏰</span>
                  <span :class="{ 'overdue': isOverdue(task.deadline) }">
                    {{ task.deadline ? '截止: ' + formatDateTime(task.deadline) : '无截止时间' }}
                  </span>
                </div>
                <div v-if="task.config.difficulty" class="info-row">
                  <span class="info-icon">🎯</span>
                  <span>难度: {{ getDifficultyLabel(task.config.difficulty) }}</span>
                </div>
              </div>

              <div class="task-actions">
                <n-button type="primary" size="small" @click="startTask(task)">
                  {{ getTaskButtonText(task.id) }}
                </n-button>
              </div>
            </n-card>
          </div>

          <div class="section-header" style="margin-top: 24px">
            <h3>已提交</h3>
            <n-tag size="small" type="success">{{ completedTasks.length }} 个任务</n-tag>
          </div>

          <div v-if="completedTasks.length === 0" class="empty-state">
            <p>暂无已提交的任务</p>
          </div>

          <div v-else class="task-cards">
            <n-card
              v-for="task in completedTasks"
              :key="task.id"
              :bordered="false"
              class="task-card completed"
              hoverable
            >
              <div class="task-status-row">
                <div class="task-type-badge" :class="task.config.type">
                  {{ task.config.type === 'level' ? '关卡作业' : '练习任务' }}
                </div>
                <n-tag :type="getStatusTagType(task.id)" size="small">
                  {{ getStatusLabel(task.id) }}
                </n-tag>
              </div>
              <div class="task-header-row">
                <h4 class="task-title">{{ task.title }}</h4>
              </div>

              <div class="task-result">
                <div class="result-item">
                  <span class="result-label">得分</span>
                  <span class="result-value score">{{ getSubmission(task.id)?.score || 0 }}分</span>
                </div>
                <div class="result-item">
                  <span class="result-label">正确</span>
                  <span class="result-value">{{ getSubmission(task.id)?.correctCount || 0 }}/{{ task.config.questionCount }}</span>
                </div>
                <div class="result-item">
                  <span class="result-label">用时</span>
                  <span class="result-value">{{ formatTime(getSubmission(task.id)?.totalTime || 0) }}</span>
                </div>
              </div>

              <div v-if="getSubmission(task.id)?.teacherComment" class="teacher-comment-preview">
                <n-tag size="small" type="info">教师评语</n-tag>
                <span class="comment-text">{{ getSubmission(task.id)?.teacherComment }}</span>
              </div>

              <div class="task-actions">
                <n-button size="small" @click="viewTaskDetail(task)">
                  查看详情
                </n-button>
              </div>
            </n-card>
          </div>
        </div>
      </n-tab-pane>

      <n-tab-pane name="comments" tab="教师评语">
        <div class="comments-section">
          <div v-if="studentComments.length === 0" class="empty-state">
            <div class="empty-icon">💬</div>
            <p>暂无教师评语</p>
          </div>

          <div v-else class="comments-list">
            <div v-for="comment in studentComments" :key="comment.id" class="comment-card">
              <div class="comment-header">
                <n-tag size="small" :type="getCommentType(comment.type)">
                  {{ getCommentTypeLabel(comment.type) }}
                </n-tag>
                <span class="comment-time">{{ formatDateTime(comment.createdAt) }}</span>
              </div>
              <div class="comment-content">
                {{ comment.content }}
              </div>
              <div v-if="comment.taskId" class="comment-task">
                来自任务: {{ getTaskName(comment.taskId) }}
              </div>
            </div>
          </div>
        </div>
      </n-tab-pane>

      <n-tab-pane name="report" tab="学习报告">
        <div class="report-section">
          <n-grid :cols="3" :x-gap="16" style="margin-bottom: 20px">
            <n-gi>
              <n-card :bordered="false" class="mini-stat-card">
                <div class="mini-stat-num">{{ studentProgress.completedLevels }}/{{ studentProgress.totalLevels }}</div>
                <div class="mini-stat-label">完成关卡</div>
              </n-card>
            </n-gi>
            <n-gi>
              <n-card :bordered="false" class="mini-stat-card">
                <div class="mini-stat-num">{{ studentProgress.accuracy }}%</div>
                <div class="mini-stat-label">总正确率</div>
              </n-card>
            </n-gi>
            <n-gi>
              <n-card :bordered="false" class="mini-stat-card">
                <div class="mini-stat-num">{{ formatTime(studentProgress.totalTime) }}</div>
                <div class="mini-stat-label">总学习时长</div>
              </n-card>
            </n-gi>
          </n-grid>

          <n-card :bordered="false" title="薄弱环节">
            <div class="weak-ops">
              <div v-for="op in studentProgress.weakOperations?.slice(0, 4)" :key="op.operator" class="weak-op-item">
                <span class="op-name">{{ op.operator }}</span>
                <n-progress
                  type="line"
                  :percentage="op.accuracy"
                  :stroke-width="8"
                  style="flex: 1; margin: 0 16px"
                />
                <span class="op-accuracy">{{ op.accuracy }}%</span>
              </div>
            </div>
          </n-card>

          <n-card :bordered="false" title="学习建议" style="margin-top: 16px">
            <div class="advice-list">
              <div
                v-for="(suggestion, idx) in learningAdvice?.suggestions || []"
                :key="idx"
                class="advice-item"
              >
                <span class="advice-number">{{ idx + 1 }}</span>
                <span>{{ suggestion }}</span>
              </div>
            </div>
          </n-card>
        </div>
      </n-tab-pane>
    </n-tabs>

    <n-modal v-model:show="showTaskDetail" preset="card" :title="currentTask?.title || '任务详情'" style="width: 600px">
      <div v-if="currentTask && currentSubmission" class="task-detail-modal">
        <n-descriptions :column="2" bordered>
          <n-descriptions-item label="任务类型">
            {{ currentTask.config.type === 'level' ? '关卡作业' : '练习任务' }}
          </n-descriptions-item>
          <n-descriptions-item label="提交状态">
            <n-tag :type="getStatusTagType(currentTask.id)" size="small">
              {{ getStatusLabel(currentTask.id) }}
            </n-tag>
          </n-descriptions-item>
          <n-descriptions-item label="得分">
            <n-tag type="success" size="large">{{ currentSubmission.score }}分</n-tag>
          </n-descriptions-item>
          <n-descriptions-item label="教师评分">
            <span v-if="currentSubmission.teacherScore !== undefined">
              {{ currentSubmission.teacherScore }}分
            </span>
            <span v-else class="text-muted">待批改</span>
          </n-descriptions-item>
          <n-descriptions-item label="正确题数">
            {{ currentSubmission.correctCount }} / {{ currentTask.config.questionCount }}
          </n-descriptions-item>
          <n-descriptions-item label="总用时">
            {{ formatTime(currentSubmission.totalTime) }}
          </n-descriptions-item>
          <n-descriptions-item label="平均每题用时">
            {{ formatTime(currentSubmission.averageTime) }}
          </n-descriptions-item>
          <n-descriptions-item label="提交时间">
            {{ formatDateTime(currentSubmission.submittedAt) }}
          </n-descriptions-item>
          <n-descriptions-item label="错题数量" v-if="currentSubmission.wrongQuestions.length > 0">
            <n-tag type="error" size="small">{{ currentSubmission.wrongQuestions.length }} 道</n-tag>
          </n-descriptions-item>
        </n-descriptions>

        <n-divider title="错题明细" v-if="currentSubmission.wrongQuestions.length > 0" />
        <div v-if="currentSubmission.wrongQuestions.length > 0" class="wrong-questions-list">
          <div
            v-for="(wq, idx) in currentSubmission.wrongQuestions"
            :key="idx"
            class="wrong-question-item"
          >
            <div class="wq-header">
              <span class="wq-num">第 {{ idx + 1 }} 题</span>
              <span class="wq-op">{{ wq.operator }}</span>
            </div>
            <div class="wq-content">
              <div class="wq-question">
                {{ wq.num1 }} {{ wq.operator }} {{ wq.num2 }} = ?
              </div>
              <div class="wq-answers">
                <span class="wq-correct">正确答案: {{ wq.answer }}</span>
                <span class="wq-user">你的答案: {{ wq.userAnswer }}</span>
              </div>
              <div class="wq-error" v-if="wq.errorDescription">
                <n-tag size="small" type="warning">错误分析</n-tag>
                <span>{{ wq.errorDescription }}</span>
              </div>
              <div class="wq-rods" v-if="wq.errorRods && wq.errorRods.length > 0">
                <span class="wq-rods-label">错误档位:</span>
                <n-tag
                  v-for="rod in wq.errorRods"
                  :key="rod"
                  size="small"
                  type="error"
                >
                  第 {{ 13 - rod }} 档
                </n-tag>
              </div>
            </div>
          </div>
        </div>

        <n-divider title="教师评语" v-if="currentSubmission.teacherComment" />
        <div v-if="currentSubmission.teacherComment" class="task-comment">
          <n-tag size="small" type="info">教师评语</n-tag>
          <p>{{ currentSubmission.teacherComment }}</p>
          <div class="comment-meta" v-if="currentSubmission.gradedAt">
            批改时间: {{ formatDateTime(currentSubmission.gradedAt) }}
          </div>
        </div>
      </div>
    </n-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import {
  NAvatar,
  NTag,
  NTabs,
  NTabPane,
  NCard,
  NButton,
  NProgress,
  NGrid,
  NGi,
  NModal,
  NDescriptions,
  NDescriptionsItem,
  NDivider
} from 'naive-ui'
import { useTeacherStore } from '../stores/teacher'
import type { Task, TaskSubmission, TeacherComment } from '../types/teacher'
import type { DifficultyLevel } from '../types/abacus'

const teacherStore = useTeacherStore()

const activeTab = ref('tasks')
const showTaskDetail = ref(false)
const currentTask = ref<Task | null>(null)
const currentSubmission = ref<TaskSubmission | null>(null)

const currentStudent = computed(() => teacherStore.currentStudent)

const studentProgress = computed(() => {
  if (!currentStudent.value) {
    return {
      accuracy: 0,
      totalQuestions: 0,
      completedLevels: 0,
      totalLevels: 15,
      totalTime: 0,
      weakOperations: []
    }
  }
  return teacherStore.getStudentProgress(currentStudent.value.id)
})

const studentTasks = computed((): Task[] => {
  if (!currentStudent.value) return []
  return teacherStore.tasksByStudent[currentStudent.value.id] || []
})

const pendingTasks = computed((): Task[] => {
  if (!currentStudent.value) return []
  return studentTasks.value.filter((task: Task) => {
    const status = teacherStore.getStudentTaskStatus(task.id, currentStudent.value!.id)
    return status === 'not_started' || status === 'in_progress' || status === 'overdue'
  }).sort((a, b) => {
    const statusA = teacherStore.getStudentTaskStatus(a.id, currentStudent.value!.id)
    const statusB = teacherStore.getStudentTaskStatus(b.id, currentStudent.value!.id)
    const priority = { overdue: 0, in_progress: 1, not_started: 2 }
    return priority[statusA as keyof typeof priority] - priority[statusB as keyof typeof priority]
  })
})

const completedTasks = computed((): Task[] => {
  if (!currentStudent.value) return []
  return studentTasks.value.filter((task: Task) => {
    const status = teacherStore.getStudentTaskStatus(task.id, currentStudent.value!.id)
    return status === 'submitted' || status === 'graded'
  })
})

const studentComments = computed(() => {
  if (!currentStudent.value) return []
  return teacherStore.getCommentsByStudent(currentStudent.value.id)
})

const learningAdvice = computed(() => {
  if (!currentStudent.value) return null
  return teacherStore.getLearningAdvice(currentStudent.value.id)
})

function getSubmission(taskId: string): TaskSubmission | undefined {
  if (!currentStudent.value) return undefined
  return teacherStore.getSubmissionsByStudent(currentStudent.value.id)
    .find(s => s.taskId === taskId)
}

function getTaskName(taskId: string): string {
  return teacherStore.getTaskById(taskId)?.title || '未知任务'
}

function getDifficultyLabel(diff: DifficultyLevel | undefined): string {
  if (!diff) return ''
  const labels: Record<string, string> = {
    easy: '简单',
    medium: '中等',
    hard: '困难'
  }
  return labels[diff] || diff
}

function getCommentType(type: TeacherComment['type']): 'success' | 'warning' | 'error' | 'default' {
  const map: Record<TeacherComment['type'], 'success' | 'warning' | 'error' | 'default'> = {
    encouragement: 'success',
    suggestion: 'warning',
    correction: 'error',
    general: 'default'
  }
  return map[type]
}

function getCommentTypeLabel(type: TeacherComment['type']): string {
  const map: Record<TeacherComment['type'], string> = {
    encouragement: '鼓励',
    suggestion: '建议',
    correction: '纠正',
    general: '通用'
  }
  return map[type]
}

function formatDateTime(timestamp: number | undefined): string {
  if (!timestamp) return ''
  return new Date(timestamp).toLocaleString('zh-CN')
}

function formatTime(ms: number): string {
  const seconds = Math.floor(ms / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)

  if (hours > 0) {
    return `${hours}小时${minutes % 60}分钟`
  }
  if (minutes > 0) {
    return `${minutes}分${seconds % 60}秒`
  }
  return `${seconds}秒`
}

function isOverdue(deadline: number | undefined): boolean {
  if (!deadline) return false
  return Date.now() > deadline
}

function getStatusLabel(taskId: string): string {
  if (!currentStudent.value) return ''
  const status = teacherStore.getStudentTaskStatus(taskId, currentStudent.value.id)
  const labels: Record<string, string> = {
    not_started: '未开始',
    in_progress: '进行中',
    submitted: '已提交',
    graded: '已批改',
    overdue: '已逾期'
  }
  return labels[status] || status
}

function getStatusTagType(taskId: string): 'success' | 'warning' | 'error' | 'info' | 'default' {
  if (!currentStudent.value) return 'default'
  const status = teacherStore.getStudentTaskStatus(taskId, currentStudent.value.id)
  const types: Record<string, 'success' | 'warning' | 'error' | 'info' | 'default'> = {
    not_started: 'default',
    in_progress: 'warning',
    submitted: 'info',
    graded: 'success',
    overdue: 'error'
  }
  return types[status] || 'default'
}

function getTaskStatusClass(taskId: string): string {
  if (!currentStudent.value) return ''
  const status = teacherStore.getStudentTaskStatus(taskId, currentStudent.value.id)
  return `status-${status}`
}

function getTaskButtonText(taskId: string): string {
  if (!currentStudent.value) return '开始练习'
  const status = teacherStore.getStudentTaskStatus(taskId, currentStudent.value.id)
  if (status === 'in_progress') return '继续练习'
  if (status === 'overdue') return '查看任务'
  return '开始练习'
}

function startTask(task: Task) {
  if (!currentStudent.value) return
  const status = teacherStore.getStudentTaskStatus(task.id, currentStudent.value.id)
  if (status === 'overdue') {
    return
  }
  teacherStore.startTaskSubmission(task.id, currentStudent.value.id)
  teacherStore.setActiveTask(task.id)
}

function viewTaskDetail(task: Task) {
  currentTask.value = task
  currentSubmission.value = getSubmission(task.id) || null
  showTaskDetail.value = true
}
</script>

<style scoped>
.student-task-view {
  height: 100%;
}

.student-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 24px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 12px;
  margin-bottom: 20px;
  color: white;
}

.student-info {
  display: flex;
  align-items: center;
  gap: 16px;
}

.student-detail {
  flex: 1;
}

.student-name {
  font-size: 24px;
  font-weight: 700;
  margin: 0;
}

.student-meta {
  font-size: 14px;
  opacity: 0.9;
  margin: 4px 0 0 0;
}

.stars {
  font-weight: 600;
}

.student-stats {
  display: flex;
  gap: 24px;
}

.stat-badge {
  text-align: center;
  background: rgba(255, 255, 255, 0.2);
  padding: 12px 20px;
  border-radius: 8px;
}

.stat-num {
  display: block;
  font-size: 20px;
  font-weight: 700;
}

.stat-label {
  font-size: 12px;
  opacity: 0.9;
}

.section-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
}

.section-header h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: #1e293b;
}

.empty-state {
  text-align: center;
  padding: 40px;
  color: #94a3b8;
}

.empty-icon {
  font-size: 48px;
  margin-bottom: 12px;
}

.task-cards {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 16px;
}

.task-card {
  position: relative;
  overflow: hidden;

  &.pending {
    border-left: 4px solid #f59e0b;
  }

  &.completed {
    border-left: 4px solid #10b981;
  }
}

.task-type-badge {
  position: absolute;
  top: 12px;
  right: 12px;
  padding: 3px 10px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;

  &.practice {
    background: #dbeafe;
    color: #1d4ed8;
  }

  &.level {
    background: #dcfce7;
    color: #15803d;
  }
}

.task-header-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.task-title {
  font-size: 16px;
  font-weight: 600;
  color: #1e293b;
  margin: 0 0 6px 0;
  padding-right: 60px;
}

.task-desc {
  font-size: 13px;
  color: #64748b;
  margin: 0 0 12px 0;
  line-height: 1.5;
}

.task-info {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-bottom: 16px;
}

.info-row {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: #475569;

  & .overdue {
    color: #ef4444;
    font-weight: 500;
  }
}

.info-icon {
  font-size: 14px;
}

.task-result {
  display: flex;
  gap: 16px;
  padding: 12px;
  background: #f8fafc;
  border-radius: 8px;
  margin-bottom: 16px;
}

.result-item {
  flex: 1;
  text-align: center;
}

.result-label {
  display: block;
  font-size: 12px;
  color: #64748b;
}

.result-value {
  font-size: 18px;
  font-weight: 700;
  color: #1e293b;

  &.score {
    color: #10b981;
  }
}

.task-actions {
  display: flex;
  justify-content: flex-end;
}

.comments-section {
  padding-top: 8px;
}

.comments-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.comment-card {
  padding: 16px;
  background: #f8fafc;
  border-radius: 8px;
}

.comment-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 10px;
}

.comment-time {
  font-size: 12px;
  color: #94a3b8;
}

.comment-content {
  font-size: 14px;
  line-height: 1.6;
  color: #334155;
}

.comment-task {
  margin-top: 10px;
  padding-top: 10px;
  border-top: 1px dashed #e2e8f0;
  font-size: 12px;
  color: #64748b;
}

.report-section {
  padding-top: 8px;
}

.mini-stat-card {
  text-align: center;
  background: #f8fafc !important;
}

.mini-stat-num {
  font-size: 22px;
  font-weight: 700;
  color: #6366f1;
}

.mini-stat-label {
  font-size: 13px;
  color: #64748b;
  margin-top: 4px;
}

.weak-ops {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.weak-op-item {
  display: flex;
  align-items: center;
}

.op-name {
  font-size: 20px;
  font-weight: 600;
  width: 30px;
}

.op-accuracy {
  font-size: 14px;
  font-weight: 600;
  color: #475569;
  width: 60px;
  text-align: right;
}

.advice-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.advice-item {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 12px;
  background: #fffbeb;
  border-radius: 8px;
  font-size: 14px;
  color: #92400e;
  line-height: 1.5;
}

.advice-number {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: #f59e0b;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 13px;
  font-weight: 600;
  flex-shrink: 0;
}

.task-detail-modal {
  padding: 8px 0;
}

.task-comment {
  padding: 12px;
  background: #f0f9ff;
  border-radius: 8px;

  p {
    margin: 8px 0 0 0;
    color: #075985;
    line-height: 1.6;
  }
}

.task-card {
  &.status-overdue {
    border-left-color: #ef4444 !important;
  }

  &.status-in_progress {
    border-left-color: #f59e0b;
  }

  &.status-graded {
    border-left-color: #10b981;
  }
}

.task-type-badge {
  position: static;
  display: inline-block;
}

.teacher-comment-preview {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background: #f0f9ff;
  border-radius: 6px;
  margin-bottom: 12px;
  font-size: 13px;

  .comment-text {
    color: #0369a1;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    flex: 1;
  }
}

.text-muted {
  color: #94a3b8;
}

.wrong-questions-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-top: 12px;
}

.wrong-question-item {
  padding: 12px;
  background: #fef2f2;
  border-radius: 8px;
  border-left: 3px solid #ef4444;
}

.wq-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;

  .wq-num {
    font-weight: 600;
    color: #991b1b;
  }

  .wq-op {
    font-size: 12px;
    padding: 2px 8px;
    background: #fee2e2;
    border-radius: 4px;
    color: #dc2626;
  }
}

.wq-content {
  .wq-question {
    font-size: 18px;
    font-weight: 600;
    color: #1e293b;
    margin-bottom: 8px;
  }

  .wq-answers {
    display: flex;
    gap: 16px;
    font-size: 14px;
    margin-bottom: 8px;

    .wq-correct {
      color: #16a34a;
    }

    .wq-user {
      color: #dc2626;
    }
  }

  .wq-error {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 13px;
    color: #92400e;
    margin-bottom: 8px;
  }

  .wq-rods {
    display: flex;
    align-items: center;
    gap: 8px;
    flex-wrap: wrap;

    .wq-rods-label {
      font-size: 13px;
      color: #64748b;
    }
  }
}

.comment-meta {
  font-size: 12px;
  color: #64748b;
  margin-top: 8px;
  text-align: right;
}
</style>
