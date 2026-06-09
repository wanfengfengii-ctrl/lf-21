<template>
  <div class="task-management">
    <div class="page-header">
      <h2 class="page-title">任务作业</h2>
      <div class="header-actions">
        <n-select
          v-model:value="filterType"
          :options="typeOptions"
          placeholder="任务类型"
          clearable
          style="width: 140px; margin-right: 12px"
        />
        <n-button type="primary" @click="showAddModal = true">
          <template #icon>
            <span>+</span>
          </template>
          创建任务
        </n-button>
      </div>
    </div>

    <n-grid :cols="2" :x-gap="20" :y-gap="20">
      <n-gi v-for="task in filteredTasks" :key="task.id">
        <n-card :bordered="false" class="task-card" hoverable>
          <div class="task-header">
            <div class="task-type-badge" :class="task.config.type">
              {{ task.config.type === 'level' ? '关卡作业' : '练习任务' }}
            </div>
            <n-tag v-if="task.deadline" :type="isOverdue(task.deadline) ? 'error' : 'warning'" size="small">
              {{ isOverdue(task.deadline) ? '已截止' : '进行中' }}
            </n-tag>
          </div>

          <h3 class="task-title">{{ task.title }}</h3>
          <p class="task-desc">{{ task.description || '暂无描述' }}</p>

          <div class="task-info">
            <div class="info-item">
              <span class="info-label">题目数量:</span>
              <span class="info-value">{{ task.config.questionCount }} 题</span>
            </div>
            <div class="info-item" v-if="task.config.difficulty">
              <span class="info-label">难度:</span>
              <span class="info-value">{{ getDifficultyLabel(task.config.difficulty) }}</span>
            </div>
            <div class="info-item" v-if="task.config.levelId">
              <span class="info-label">关卡:</span>
              <span class="info-value">{{ getLevelName(task.config.levelId) }}</span>
            </div>
            <div class="info-item" v-if="task.deadline">
              <span class="info-label">截止时间:</span>
              <span class="info-value">{{ formatDateTime(task.deadline) }}</span>
            </div>
          </div>

          <div class="task-progress-section">
            <div class="progress-header">
              <span>完成进度</span>
              <span class="progress-text">{{ getTaskCompletionRate(task.id) }}%</span>
            </div>
            <n-progress
              :percentage="getTaskCompletionRate(task.id)"
              :stroke-width="8"
              color="#6366f1"
            />
            <div class="progress-detail">
              {{ getCompletedCount(task.id) }} / {{ getAssignedCount(task.id) }} 人已完成
            </div>
          </div>

          <div class="task-actions">
            <n-button size="small" @click="viewTask(task)">查看详情</n-button>
            <n-button size="small" @click="editTask(task)" style="margin-left: 8px">
              编辑
            </n-button>
            <n-button size="small" type="error" @click="deleteTask(task)" style="margin-left: 8px">
              删除
            </n-button>
          </div>
        </n-card>
      </n-gi>
    </n-grid>

    <n-modal v-model:show="showAddModal" preset="card" :title="isEditing ? '编辑任务' : '创建任务'" style="width: 600px">
      <n-form label-placement="top" :model="formData">
        <n-form-item label="任务标题">
          <n-input v-model:value="formData.title" placeholder="请输入任务标题" />
        </n-form-item>

        <n-form-item label="任务描述">
          <n-input v-model:value="formData.description" type="textarea" :rows="2" placeholder="请输入任务描述" />
        </n-form-item>

        <n-form-item label="任务类型">
          <n-radio-group v-model:value="formData.config.type">
            <n-radio value="practice">练习任务</n-radio>
            <n-radio value="level">关卡作业</n-radio>
          </n-radio-group>
        </n-form-item>

        <template v-if="formData.config.type === 'practice'">
          <n-form-item label="难度">
            <n-select
              v-model:value="formData.config.difficulty"
              :options="difficultyOptions"
              placeholder="选择难度"
            />
          </n-form-item>

          <n-form-item label="运算类型">
            <n-checkbox-group v-model:value="formData.config.operators">
              <n-checkbox value="+">加法</n-checkbox>
              <n-checkbox value="-">减法</n-checkbox>
              <n-checkbox value="×">乘法</n-checkbox>
              <n-checkbox value="÷">除法</n-checkbox>
            </n-checkbox-group>
          </n-form-item>
        </template>

        <template v-else>
          <n-form-item label="选择关卡">
            <n-select
              v-model:value="formData.config.levelId"
              :options="levelOptions"
              placeholder="选择关卡"
            />
          </n-form-item>
        </template>

        <n-form-item label="题目数量">
          <n-input-number v-model:value="formData.config.questionCount" :min="1" :max="100" style="width: 200px" />
        </n-form-item>

        <n-form-item label="截止时间">
          <n-date-picker
            v-model:value="formData.deadline"
            type="datetime"
            placeholder="选择截止时间"
          />
        </n-form-item>

        <n-form-item label="分配班级">
          <n-select
            v-model:value="formData.assignedGroupIds"
            multiple
            :options="groupOptions"
            placeholder="选择班级（可多选）"
          />
        </n-form-item>

        <n-form-item label="指定学生（可选）">
          <n-select
            v-model:value="formData.assignedStudentIds"
            multiple
            filterable
            :options="studentOptions"
            placeholder="选择学生（可多选，留空则按班级分配）"
          />
        </n-form-item>
      </n-form>
      <template #footer>
        <n-button @click="showAddModal = false">取消</n-button>
        <n-button type="primary" @click="submitForm">确定</n-button>
      </template>
    </n-modal>

    <n-modal v-model:show="showDetailModal" preset="card" :title="currentTask?.title || '任务详情'" style="width: 800px">
      <div v-if="currentTask" class="task-detail">
        <div class="detail-header">
          <n-descriptions :column="3" bordered label-style="width: 80px">
            <n-descriptions-item label="任务类型">
              {{ currentTask.config.type === 'level' ? '关卡作业' : '练习任务' }}
            </n-descriptions-item>
            <n-descriptions-item label="题目数量">
              {{ currentTask.config.questionCount }} 题
            </n-descriptions-item>
            <n-descriptions-item label="截止时间">
              {{ currentTask.deadline ? formatDateTime(currentTask.deadline) : '无限制' }}
            </n-descriptions-item>
          </n-descriptions>
        </div>

        <n-divider title="提交统计" />

        <n-grid :cols="5" :x-gap="12" class="status-stats">
          <n-gi>
            <n-card class="status-card not-started" :bordered="false" size="small">
              <div class="status-num">{{ getStatusCount('not_started') }}</div>
              <div class="status-label">未开始</div>
            </n-card>
          </n-gi>
          <n-gi>
            <n-card class="status-card in-progress" :bordered="false" size="small">
              <div class="status-num">{{ getStatusCount('in_progress') }}</div>
              <div class="status-label">进行中</div>
            </n-card>
          </n-gi>
          <n-gi>
            <n-card class="status-card submitted" :bordered="false" size="small">
              <div class="status-num">{{ getStatusCount('submitted') }}</div>
              <div class="status-label">已提交</div>
            </n-card>
          </n-gi>
          <n-gi>
            <n-card class="status-card overdue" :bordered="false" size="small">
              <div class="status-num">{{ getStatusCount('overdue') }}</div>
              <div class="status-label">已逾期</div>
            </n-card>
          </n-gi>
          <n-gi>
            <n-card class="status-card graded" :bordered="false" size="small">
              <div class="status-num">{{ getStatusCount('graded') }}</div>
              <div class="status-label">已批改</div>
            </n-card>
          </n-gi>
        </n-grid>

        <div class="detail-actions">
          <n-button size="small" @click="sendReminder" :disabled="getReminderDisabled()">
            <template #icon><span>📢</span></template>
            催交
          </n-button>
          <n-button size="small" type="primary" @click="reassignAll">
            <template #icon><span>🔄</span></template>
            重新布置
          </n-button>
        </div>

        <n-divider title="提交列表" />

        <n-data-table
          :columns="submissionColumns"
          :data="taskSubmissions"
          :pagination="{ pageSize: 6 }"
          :row-key="row => row.id"
          size="small"
        />
      </div>
    </n-modal>

    <n-modal v-model:show="showSubmissionModal" preset="card" :title="submissionDetailTitle" style="width: 700px">
      <div v-if="currentSubmission" class="submission-detail">
        <n-descriptions :column="2" bordered label-style="width: 90px">
          <n-descriptions-item label="学生">
            {{ getStudentName(currentSubmission.studentId) }}
          </n-descriptions-item>
          <n-descriptions-item label="提交状态">
            <n-tag :type="getSubmissionStatusType(currentSubmission.status)" size="small">
              {{ getSubmissionStatusLabel(currentSubmission.status) }}
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
          <n-descriptions-item label="正确数">
            {{ currentSubmission.correctCount }} / {{ currentSubmission.totalQuestions }}
          </n-descriptions-item>
          <n-descriptions-item label="总用时">
            {{ formatTime(currentSubmission.totalTime) }}
          </n-descriptions-item>
          <n-descriptions-item label="提交时间">
            {{ currentSubmission.submittedAt ? formatDateTime(currentSubmission.submittedAt) : '-' }}
          </n-descriptions-item>
          <n-descriptions-item label="开始时间">
            {{ currentSubmission.startedAt ? formatDateTime(currentSubmission.startedAt) : '-' }}
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
                <span class="wq-user">学生答案: {{ wq.userAnswer ?? '-' }}</span>
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
        <div v-else class="no-wrong-questions">
          全部正确！太棒了 🎉
        </div>

        <n-divider title="教师批改" />
        <div class="grading-section">
          <n-form label-placement="top">
            <n-form-item label="教师评分">
              <n-input-number
                v-model:value="gradeForm.score"
                :min="0"
                :max="100"
                placeholder="请输入评分"
                style="width: 150px"
              />
            </n-form-item>
            <n-form-item label="教师评语">
              <n-input
                v-model:value="gradeForm.comment"
                type="textarea"
                :rows="3"
                placeholder="请输入评语..."
              />
            </n-form-item>
            <div class="grading-actions">
              <n-button type="primary" @click="submitGrade">
                提交批改
              </n-button>
              <n-button @click="reassignCurrentStudent" type="warning">
                重新布置
              </n-button>
            </div>
          </n-form>
        </div>

        <div v-if="currentSubmission.teacherComment" class="history-grade">
          <n-divider title="历史批改记录" />
          <div class="grade-record">
            <div class="grade-record-header">
              <n-tag v-if="currentSubmission.teacherScore !== undefined" type="success">
                {{ currentSubmission.teacherScore }}分
              </n-tag>
              <span class="grade-time">{{ currentSubmission.gradedAt ? formatDateTime(currentSubmission.gradedAt) : '' }}</span>
            </div>
            <p class="grade-comment">{{ currentSubmission.teacherComment }}</p>
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
  NButton,
  NModal,
  NForm,
  NFormItem,
  NInput,
  NSelect,
  NRadioGroup,
  NRadio,
  NCheckboxGroup,
  NCheckbox,
  NInputNumber,
  NDatePicker,
  NProgress,
  NTag,
  NDescriptions,
  NDescriptionsItem,
  NDivider,
  NDataTable,
  useMessage
} from 'naive-ui'
import { useTeacherStore } from '../stores/teacher'
import { levelConfigs } from '../data/levels'
import type { Task, TaskSubmission, TaskStatus, SubmissionStatus } from '../types/teacher'
import type { DifficultyLevel } from '../types/abacus'

const teacherStore = useTeacherStore()
const message = useMessage()

const filterType = ref<string | null>(null)
const showAddModal = ref(false)
const showDetailModal = ref(false)
const showSubmissionModal = ref(false)
const isEditing = ref(false)
const currentTask = ref<Task | null>(null)
const currentSubmission = ref<TaskSubmission | null>(null)

const gradeForm = reactive({
  score: undefined as number | undefined,
  comment: ''
})

const formData = reactive({
  title: '',
  description: '',
  deadline: null as number | null,
  assignedGroupIds: [] as string[],
  assignedStudentIds: [] as string[],
  config: {
    type: 'practice' as 'practice' | 'level',
    levelId: undefined as number | undefined,
    difficulty: 'easy' as DifficultyLevel | undefined,
    operators: ['+'] as string[],
    questionCount: 10,
    timeLimit: undefined as number | undefined
  }
})

const allTasks = computed(() => teacherStore.allTasks)
const allGroups = computed(() => teacherStore.allGroups)
const allStudents = computed(() => teacherStore.allStudents)

const typeOptions = [
  { label: '练习任务', value: 'practice' },
  { label: '关卡作业', value: 'level' }
]

const difficultyOptions = [
  { label: '简单', value: 'easy' },
  { label: '中等', value: 'medium' },
  { label: '困难', value: 'hard' }
]

const levelOptions = levelConfigs.map(l => ({
  label: `${l.name} (${l.difficulty})`,
  value: l.id
}))

const groupOptions = computed(() =>
  allGroups.value.map(g => ({ label: g.name, value: g.id }))
)

const studentOptions = computed(() =>
  allStudents.value.map(s => ({ label: `${s.realName} (${s.username})`, value: s.id }))
)

const filteredTasks = computed(() => {
  if (!filterType.value) return allTasks.value
  return allTasks.value.filter(t => t.config.type === filterType.value)
})

const taskSubmissions = computed(() => {
  if (!currentTask.value) return []
  return teacherStore.getSubmissionsByTask(currentTask.value.id)
})

const submissionDetailTitle = computed(() => {
  if (!currentSubmission.value) return '提交详情'
  return `${getStudentName(currentSubmission.value.studentId)} 的提交详情`
})

const submissionColumns = [
  {
    title: '学生',
    key: 'studentName',
    width: 120,
    render: (row: TaskSubmission) => getStudentName(row.studentId)
  },
  {
    title: '状态',
    key: 'status',
    width: 100,
    render: (row: TaskSubmission) =>
      h(
        NTag,
        {
          type: getSubmissionStatusType(row.status),
          size: 'small'
        },
        { default: () => getSubmissionStatusLabel(row.status) }
      )
  },
  {
    title: '得分',
    key: 'score',
    width: 80,
    render: (row: TaskSubmission) =>
      h(
        NTag,
        {
          type: row.score >= 80 ? 'success' : row.score >= 60 ? 'warning' : 'error',
          size: 'small'
        },
        { default: () => row.score + '分' }
      )
  },
  { title: '正确数', key: 'correctCount', width: 90, render: (row: TaskSubmission) => `${row.correctCount}/${row.totalQuestions}` },
  { title: '用时', key: 'totalTime', width: 100, render: (row: TaskSubmission) => formatTime(row.totalTime) },
  {
    title: '提交时间',
    key: 'submittedAt',
    width: 150,
    render: (row: TaskSubmission) => row.submittedAt ? formatDateTime(row.submittedAt) : '-'
  },
  {
    title: '操作',
    key: 'actions',
    width: 180,
    render: (row: TaskSubmission) =>
      h('div', { style: 'display: flex; gap: 8px;' }, [
        h(NButton, { size: 'tiny', type: 'primary', onClick: () => viewSubmission(row) }, {
          default: () => '查看详情'
        }),
        row.status === 'submitted'
          ? h(NButton, { size: 'tiny', type: 'success', onClick: () => quickGrade(row) }, {
              default: () => '批改'
            })
          : null,
        row.status === 'graded' || row.status === 'submitted'
          ? h(NButton, { size: 'tiny', type: 'warning', onClick: () => reassignOne(row) }, {
              default: () => '重布置'
            })
          : null
      ])
  }
]

function getDifficultyLabel(diff: DifficultyLevel | undefined): string {
  const map: Record<string, string> = {
    easy: '简单',
    medium: '中等',
    hard: '困难'
  }
  return diff ? map[diff] || diff : ''
}

function getLevelName(levelId: number | undefined): string {
  if (!levelId) return ''
  const level = levelConfigs.find(l => l.id === levelId)
  return level?.name || ''
}

function formatDateTime(timestamp: number): string {
  return new Date(timestamp).toLocaleString('zh-CN')
}

function isOverdue(deadline: number | undefined): boolean {
  if (!deadline) return false
  return Date.now() > deadline
}

function getTaskCompletionRate(taskId: string): number {
  return teacherStore.getTaskCompletionRate(taskId)
}

function getAssignedCount(taskId: string): number {
  return teacherStore.getStudentsForTask(taskId).length
}

function getCompletedCount(taskId: string): number {
  return teacherStore.getSubmissionsByTask(taskId).filter(s => s.isCompleted).length
}

function getStudentName(studentId: string): string {
  return teacherStore.getStudentById(studentId)?.realName || '未知'
}

function viewTask(task: Task) {
  currentTask.value = task
  showDetailModal.value = true
}

function editTask(task: Task) {
  isEditing.value = true
  currentTask.value = task
  formData.title = task.title
  formData.description = task.description || ''
  formData.deadline = task.deadline || null
  formData.assignedGroupIds = [...task.assignedGroupIds]
  formData.assignedStudentIds = [...task.assignedStudentIds]
  formData.config = {
    type: task.config.type,
    levelId: task.config.levelId,
    difficulty: task.config.difficulty,
    operators: task.config.operators || [],
    questionCount: task.config.questionCount,
    timeLimit: task.config.timeLimit
  }
  showAddModal.value = true
}

function deleteTask(task: Task) {
  if (confirm(`确定要删除任务 "${task.title}" 吗？`)) {
    teacherStore.deleteTask(task.id)
    message.success('删除成功')
  }
}

function submitForm() {
  if (!formData.title.trim()) {
    message.warning('请输入任务标题')
    return
  }

  if (formData.config.type === 'practice' && (!formData.config.operators || formData.config.operators.length === 0)) {
    message.warning('请至少选择一种运算类型')
    return
  }

  if (formData.config.type === 'level' && !formData.config.levelId) {
    message.warning('请选择关卡')
    return
  }

  if (formData.assignedGroupIds.length === 0 && formData.assignedStudentIds.length === 0) {
    message.warning('请至少分配一个班级或指定学生')
    return
  }

  const taskData = {
    title: formData.title,
    description: formData.description,
    deadline: formData.deadline || undefined,
    assignedGroupIds: formData.assignedGroupIds,
    assignedStudentIds: formData.assignedStudentIds,
    config: {
      type: formData.config.type,
      levelId: formData.config.levelId,
      difficulty: formData.config.difficulty,
      operators: formData.config.operators as any,
      questionCount: formData.config.questionCount,
      timeLimit: formData.config.timeLimit
    }
  }

  if (isEditing.value && currentTask.value) {
    teacherStore.updateTask(currentTask.value.id, taskData)
    message.success('更新成功')
  } else {
    teacherStore.addTask(taskData)
    message.success('创建成功')
  }

  showAddModal.value = false
  resetForm()
}

function resetForm() {
  formData.title = ''
  formData.description = ''
  formData.deadline = null
  formData.assignedGroupIds = []
  formData.assignedStudentIds = []
  formData.config = {
    type: 'practice',
    levelId: undefined,
    difficulty: 'easy',
    operators: ['+'],
    questionCount: 10,
    timeLimit: undefined
  }
  isEditing.value = false
  currentTask.value = null
}

function formatTime(ms: number): string {
  if (!ms) return '-'
  const seconds = Math.floor(ms / 1000)
  const minutes = Math.floor(seconds / 60)
  const secs = seconds % 60
  if (minutes > 0) {
    return `${minutes}分${secs}秒`
  }
  return `${secs}秒`
}

function getStatusCount(status: TaskStatus): number {
  if (!currentTask.value) return 0
  const counts = teacherStore.getTaskStatusCounts(currentTask.value.id)
  return counts[status] || 0
}

function getSubmissionStatusLabel(status: SubmissionStatus | string): string {
  const labels: Record<string, string> = {
    draft: '草稿',
    submitted: '已提交',
    graded: '已批改'
  }
  return labels[status] || status
}

function getSubmissionStatusType(status: SubmissionStatus | string): 'success' | 'warning' | 'info' | 'default' {
  const types: Record<string, 'success' | 'warning' | 'info' | 'default'> = {
    draft: 'default',
    submitted: 'warning',
    graded: 'success'
  }
  return types[status] || 'default'
}

function getReminderDisabled(): boolean {
  if (!currentTask.value) return true
  return getStatusCount('not_started') + getStatusCount('in_progress') + getStatusCount('overdue') === 0
}

function sendReminder() {
  if (!currentTask.value) return
  teacherStore.sendTaskReminder(currentTask.value.id)
  message.success('催交通知已发送')
}

function reassignAll() {
  if (!currentTask.value) return
  if (!confirm('确定要为所有已提交的学生重新布置这个任务吗？')) return
  const students = teacherStore.getStudentsForTask(currentTask.value.id)
  let count = 0
  students.forEach(s => {
    const submission = teacherStore.getTaskSubmissionDetail(currentTask.value!.id, s.id)
    if (submission && (submission.status === 'submitted' || submission.status === 'graded')) {
      teacherStore.reassignTask(currentTask.value!.id, s.id)
      count++
    }
  })
  message.success(`已为 ${count} 名学生重新布置任务`)
}

function reassignOne(row: TaskSubmission) {
  if (!confirm(`确定要为 ${getStudentName(row.studentId)} 重新布置这个任务吗？`)) return
  if (currentTask.value) {
    teacherStore.reassignTask(currentTask.value.id, row.studentId)
    message.success('已重新布置')
  }
}

function reassignCurrentStudent() {
  if (!currentSubmission.value || !currentTask.value) return
  if (!confirm(`确定要为 ${getStudentName(currentSubmission.value.studentId)} 重新布置这个任务吗？`)) return
  teacherStore.reassignTask(currentTask.value.id, currentSubmission.value.studentId)
  message.success('已重新布置')
  showSubmissionModal.value = false
}

function quickGrade(row: TaskSubmission) {
  currentSubmission.value = row
  gradeForm.score = row.score
  gradeForm.comment = ''
  showSubmissionModal.value = true
}

function viewSubmission(submission: TaskSubmission) {
  currentSubmission.value = submission
  if (submission.teacherScore !== undefined) {
    gradeForm.score = submission.teacherScore
  } else {
    gradeForm.score = submission.score
  }
  gradeForm.comment = submission.teacherComment || ''
  showSubmissionModal.value = true
}

function submitGrade() {
  if (!currentSubmission.value) return
  if (gradeForm.score === undefined) {
    message.warning('请输入评分')
    return
  }
  teacherStore.gradeSubmission(currentSubmission.value.id, {
    teacherScore: gradeForm.score,
    teacherComment: gradeForm.comment || undefined
  })
  message.success('批改成功')
  // Refresh
  if (currentSubmission.value) {
    const updated = teacherStore.getSubmissionById(currentSubmission.value.id)
    if (updated) {
      currentSubmission.value = { ...updated }
    }
  }
}
</script>

<style scoped>
.task-management {
  height: 100%;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.page-title {
  font-size: 22px;
  font-weight: 600;
  color: #1e293b;
  margin: 0;
}

.header-actions {
  display: flex;
  align-items: center;
}

.task-card {
  display: flex;
  flex-direction: column;
}

.task-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.task-type-badge {
  padding: 4px 10px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;

  &.practice {
    background: #e0f2fe;
    color: #0284c7;
  }

  &.level {
    background: #dcfce7;
    color: #16a34a;
  }
}

.task-title {
  font-size: 17px;
  font-weight: 600;
  color: #1e293b;
  margin: 0 0 6px 0;
}

.task-desc {
  font-size: 13px;
  color: #64748b;
  margin: 0 0 12px 0;
  line-height: 1.5;
}

.task-info {
  display: flex;
  flex-wrap: wrap;
  gap: 8px 16px;
  margin-bottom: 16px;
}

.info-item {
  font-size: 13px;
}

.info-label {
  color: #64748b;
}

.info-value {
  color: #334155;
  font-weight: 500;
}

.task-progress-section {
  margin-bottom: 16px;
}

.progress-header {
  display: flex;
  justify-content: space-between;
  font-size: 13px;
  color: #64748b;
  margin-bottom: 6px;
}

.progress-text {
  font-weight: 600;
  color: #6366f1;
}

.progress-detail {
  font-size: 12px;
  color: #94a3b8;
  margin-top: 6px;
  text-align: right;
}

.task-actions {
  display: flex;
  justify-content: flex-end;
  margin-top: auto;
}

.task-detail {
  padding: 8px 0;
}

.comment-section {
  max-height: 200px;
  overflow-y: auto;
}

.comment-item {
  padding: 10px 12px;
  background: #f8fafc;
  border-radius: 6px;
  margin-bottom: 8px;
}

.comment-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 4px;
  font-size: 13px;
}

.comment-time {
  color: #94a3b8;
  font-size: 12px;
}

.comment-content {
  color: #334155;
  font-size: 14px;
}

.empty-comments {
  text-align: center;
  color: #94a3b8;
  padding: 20px;
}

.detail-header {
  margin-bottom: 8px;
}

.status-stats {
  margin-bottom: 16px;
}

.status-card {
  text-align: center;
  padding: 8px 0;

  &.not-started {
    background: #f8fafc !important;
    .status-num { color: #64748b; }
  }
  &.in-progress {
    background: #fffbeb !important;
    .status-num { color: #f59e0b; }
  }
  &.submitted {
    background: #eff6ff !important;
    .status-num { color: #3b82f6; }
  }
  &.overdue {
    background: #fef2f2 !important;
    .status-num { color: #ef4444; }
  }
  &.graded {
    background: #f0fdf4 !important;
    .status-num { color: #22c55e; }
  }
}

.status-num {
  font-size: 28px;
  font-weight: 700;
  line-height: 1.2;
}

.status-label {
  font-size: 13px;
  color: #64748b;
  margin-top: 4px;
}

.detail-actions {
  display: flex;
  gap: 12px;
  margin-bottom: 16px;
}

.submission-detail {
  padding: 8px 0;
}

.text-muted {
  color: #94a3b8;
}

.wrong-questions-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 16px;
  max-height: 300px;
  overflow-y: auto;
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
    font-size: 16px;
    font-weight: 600;
    color: #1e293b;
    margin-bottom: 8px;
  }

  .wq-answers {
    display: flex;
    gap: 16px;
    font-size: 13px;
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
    font-size: 12px;
    color: #92400e;
    margin-bottom: 8px;
  }

  .wq-rods {
    display: flex;
    align-items: center;
    gap: 8px;
    flex-wrap: wrap;

    .wq-rods-label {
      font-size: 12px;
      color: #64748b;
    }
  }
}

.no-wrong-questions {
  text-align: center;
  padding: 30px;
  color: #10b981;
  font-size: 16px;
  background: #f0fdf4;
  border-radius: 8px;
}

.grading-section {
  margin-top: 8px;
}

.grading-actions {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
}

.history-grade {
  margin-top: 8px;
}

.grade-record {
  padding: 12px;
  background: #f8fafc;
  border-radius: 8px;
}

.grade-record-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.grade-time {
  font-size: 12px;
  color: #94a3b8;
}

.grade-comment {
  margin: 0;
  color: #334155;
  line-height: 1.6;
  font-size: 14px;
}

.reassign-student {
  margin-left: 8px;
}
</style>
