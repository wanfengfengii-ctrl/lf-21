<template>
  <div class="student-management">
    <div class="page-header">
      <h2 class="page-title">学生管理</h2>
      <div class="header-actions">
        <n-input
          v-model:value="searchKeyword"
          placeholder="搜索学生姓名/账号"
          clearable
          style="width: 240px; margin-right: 12px"
        />
        <n-select
          v-model:value="filterGroup"
          :options="groupOptions"
          placeholder="按班级筛选"
          clearable
          style="width: 180px; margin-right: 12px"
        />
        <n-button type="primary" @click="showAddModal = true">
          <template #icon>
            <span>+</span>
          </template>
          添加学生
        </n-button>
      </div>
    </div>

    <n-card class="stats-card" :bordered="false">
      <n-grid :cols="4" :x-gap="24">
        <n-gi>
          <div class="stat-item">
            <div class="stat-value">{{ allStudents.length }}</div>
            <div class="stat-label">学生总数</div>
          </div>
        </n-gi>
        <n-gi>
          <div class="stat-item">
            <div class="stat-value">{{ allGroups.length }}</div>
            <div class="stat-label">班级数量</div>
          </div>
        </n-gi>
        <n-gi>
          <div class="stat-item">
            <div class="stat-value">{{ averageAccuracy }}%</div>
            <div class="stat-label">平均正确率</div>
          </div>
        </n-gi>
        <n-gi>
          <div class="stat-item">
            <div class="stat-value">{{ totalQuestions }}</div>
            <div class="stat-label">总答题数</div>
          </div>
        </n-gi>
      </n-grid>
    </n-card>

    <n-data-table
      :columns="columns"
      :data="filteredStudents"
      :pagination="pagination"
      :row-key="row => row.id"
      class="student-table"
    />

    <n-modal v-model:show="showAddModal" preset="card" :title="isEditing ? '编辑学生' : '添加学生'" style="width: 500px">
      <n-form label-placement="top" :model="formData">
        <n-form-item label="学生姓名">
          <n-input v-model:value="formData.realName" placeholder="请输入学生姓名" />
        </n-form-item>
        <n-form-item label="登录账号">
          <n-input v-model:value="formData.username" placeholder="请输入登录账号" />
        </n-form-item>
        <n-form-item label="初始密码">
          <n-input v-model:value="formData.password" placeholder="请输入初始密码" type="password" show-password-on="click" />
        </n-form-item>
        <n-form-item label="年级">
          <n-input v-model:value="formData.grade" placeholder="如：三年级" />
        </n-form-item>
        <n-form-item label="所属班级">
          <n-select
            v-model:value="formData.groupIds"
            multiple
            :options="groupOptions"
            placeholder="选择班级（可多选）"
          />
        </n-form-item>
      </n-form>
      <template #footer>
        <n-button @click="showAddModal = false">取消</n-button>
        <n-button type="primary" @click="submitForm">确定</n-button>
      </template>
    </n-modal>

    <n-modal v-model:show="showDetailModal" preset="card" title="学生详情" style="width: 600px">
      <div v-if="currentStudent" class="student-detail">
        <div class="detail-header">
          <n-avatar round :size="64">
            {{ currentStudent.realName.charAt(0) }}
          </n-avatar>
          <div class="detail-info">
            <h3>{{ currentStudent.realName }}</h3>
            <p>{{ currentStudent.grade || '未设置年级' }} · {{ currentStudent.username }}</p>
          </div>
        </div>

        <n-divider />

        <n-grid :cols="3" :x-gap="16" class="detail-stats">
          <n-gi>
            <n-card size="small" :bordered="false" class="stat-card">
              <div class="stat-num">{{ currentStudent.stars }}</div>
              <div class="stat-text">获得星星</div>
            </n-card>
          </n-gi>
          <n-gi>
            <n-card size="small" :bordered="false" class="stat-card">
              <div class="stat-num">{{ studentProgress.accuracy }}%</div>
              <div class="stat-text">正确率</div>
            </n-card>
          </n-gi>
          <n-gi>
            <n-card size="small" :bordered="false" class="stat-card">
              <div class="stat-num">{{ studentProgress.completedLevels }}</div>
              <div class="stat-text">完成关卡</div>
            </n-card>
          </n-gi>
        </n-grid>

        <n-divider title="薄弱环节" />
        <div class="weak-section">
          <n-tag
            v-for="(op, idx) in studentProgress.weakOperations.slice(0, 3)"
            :key="idx"
            type="warning"
            style="margin-right: 8px"
          >
            {{ op.operator }}: {{ op.accuracy }}%
          </n-tag>
        </div>

        <n-divider title="教师评语" />
        <div class="comment-section">
          <div v-for="comment in studentComments" :key="comment.id" class="comment-item">
            <div class="comment-header">
              <n-tag size="small" :type="getCommentType(comment.type)">
                {{ getCommentTypeLabel(comment.type) }}
              </n-tag>
              <span class="comment-time">{{ formatDate(comment.createdAt) }}</span>
            </div>
            <div class="comment-content">{{ comment.content }}</div>
          </div>
          <div v-if="studentComments.length === 0" class="empty-comments">
            暂无评语
          </div>

          <div class="add-comment">
            <n-select
              v-model:value="newCommentType"
              :options="commentTypeOptions"
              style="width: 120px; margin-right: 8px"
            />
            <n-input
              v-model:value="newCommentContent"
              placeholder="输入评语..."
              style="flex: 1"
            />
            <n-button type="primary" @click="addComment" style="margin-left: 8px">
              发送
            </n-button>
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
  NDataTable,
  NInput,
  NSelect,
  NButton,
  NModal,
  NForm,
  NFormItem,
  NAvatar,
  NTag,
  NDivider,
  NGrid,
  NGi,
  useMessage
} from 'naive-ui'
import { useTeacherStore } from '../stores/teacher'
import type { Student, TeacherComment } from '../types/teacher'

const teacherStore = useTeacherStore()
const message = useMessage()

const searchKeyword = ref('')
const filterGroup = ref<string | null>(null)
const showAddModal = ref(false)
const showDetailModal = ref(false)
const isEditing = ref(false)
const currentStudent = ref<Student | null>(null)
const newCommentContent = ref('')
const newCommentType = ref<'encouragement' | 'suggestion' | 'correction' | 'general'>('encouragement')

const formData = reactive({
  realName: '',
  username: '',
  password: '',
  grade: '',
  groupIds: [] as string[]
})

const allStudents = computed(() => teacherStore.allStudents)
const allGroups = computed(() => teacherStore.allGroups)

const groupOptions = computed(() =>
  allGroups.value.map(g => ({ label: g.name, value: g.id }))
)

const commentTypeOptions = [
  { label: '鼓励', value: 'encouragement' },
  { label: '建议', value: 'suggestion' },
  { label: '纠正', value: 'correction' },
  { label: '通用', value: 'general' }
]

const filteredStudents = computed(() => {
  let list = allStudents.value

  if (searchKeyword.value) {
    const kw = searchKeyword.value.toLowerCase()
    list = list.filter(
      s => s.realName.toLowerCase().includes(kw) || s.username.toLowerCase().includes(kw)
    )
  }

  if (filterGroup.value) {
    list = list.filter(s => s.groupIds.includes(filterGroup.value!))
  }

  return list
})

const pagination = computed(() => ({
  pageSize: 10,
  itemCount: filteredStudents.value.length
}))

const columns = [
  {
    title: '头像',
    key: 'avatar',
    width: 80,
    render: (row: Student) =>
      h(NAvatar, { round: true, size: 36 }, { default: () => row.realName.charAt(0) })
  },
  { title: '姓名', key: 'realName', width: 100 },
  { title: '账号', key: 'username', width: 120 },
  { title: '年级', key: 'grade', width: 100 },
  {
    title: '班级',
    key: 'groups',
    width: 200,
    render: (row: Student) =>
      h(
        'div',
        { class: 'group-tags' },
        row.groupIds.map(gid =>
          h(NTag, { key: gid, size: 'small', color: getGroupColor(gid) }, {
            default: () => getGroupName(gid)
          })
        )
      )
  },
  { title: '答题数', key: 'totalQuestions', width: 100 },
  { title: '星星', key: 'stars', width: 80 },
  {
    title: '操作',
    key: 'actions',
    width: 220,
    fixed: 'right' as const,
    render: (row: Student) =>
      h('div', { class: 'action-buttons' }, [
        h(NButton, { size: 'small', onClick: () => viewStudent(row) }, { default: () => '详情' }),
        h(NButton, { size: 'small', style: 'margin-left: 8px', onClick: () => editStudent(row) }, { default: () => '编辑' }),
        h(NButton, { size: 'small', type: 'error', style: 'margin-left: 8px', onClick: () => deleteStudent(row) }, { default: () => '删除' })
      ])
  }
]

const totalQuestions = computed(() =>
  allStudents.value.reduce((sum, s) => sum + s.totalQuestions, 0)
)

const averageAccuracy = computed(() => {
  if (allStudents.value.length === 0) return 0
  const total = allStudents.value.reduce((sum, s) => {
    const acc = s.totalQuestions > 0 ? (s.correctQuestions / s.totalQuestions) * 100 : 0
    return sum + acc
  }, 0)
  return Math.round(total / allStudents.value.length)
})

const studentProgress = computed(() => {
  if (!currentStudent.value) {
    return {
      accuracy: 0,
      completedLevels: 0,
      weakOperations: []
    }
  }
  return teacherStore.getStudentProgress(currentStudent.value.id)
})

const studentComments = computed(() => {
  if (!currentStudent.value) return []
  return teacherStore.getCommentsByStudent(currentStudent.value.id)
})

function getGroupName(id: string): string {
  return allGroups.value.find(g => g.id === id)?.name || '未分组'
}

function getGroupColor(id: string): any {
  return allGroups.value.find(g => g.id === id)?.color || '#1890ff'
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

function formatDate(timestamp: number): string {
  return new Date(timestamp).toLocaleString('zh-CN')
}

function viewStudent(student: Student) {
  currentStudent.value = student
  newCommentContent.value = ''
  showDetailModal.value = true
}

function editStudent(student: Student) {
  isEditing.value = true
  formData.realName = student.realName
  formData.username = student.username
  formData.password = student.password
  formData.grade = student.grade || ''
  formData.groupIds = [...student.groupIds]
  showAddModal.value = true
}

function deleteStudent(student: Student) {
  if (confirm(`确定要删除学生 "${student.realName}" 吗？`)) {
    teacherStore.deleteStudent(student.id)
    message.success('删除成功')
  }
}

function submitForm() {
  if (!formData.realName || !formData.username) {
    message.warning('请填写姓名和账号')
    return
  }

  if (isEditing.value && currentStudent.value) {
    teacherStore.updateStudent(currentStudent.value.id, {
      realName: formData.realName,
      username: formData.username,
      password: formData.password,
      grade: formData.grade,
      groupIds: formData.groupIds
    })
    message.success('更新成功')
  } else {
    const newStudent = teacherStore.addStudent({
      realName: formData.realName,
      username: formData.username,
      password: formData.password || '123456',
      grade: formData.grade,
      groupIds: formData.groupIds
    })
    message.success('添加成功')
    currentStudent.value = newStudent
  }

  showAddModal.value = false
  resetForm()
}

function resetForm() {
  formData.realName = ''
  formData.username = ''
  formData.password = ''
  formData.grade = ''
  formData.groupIds = []
  isEditing.value = false
}

function addComment() {
  if (!currentStudent.value || !newCommentContent.value.trim()) return

  teacherStore.addComment({
    studentId: currentStudent.value.id,
    content: newCommentContent.value.trim(),
    type: newCommentType.value
  })

  newCommentContent.value = ''
  message.success('评语已发送')
}
</script>

<style scoped>
.student-management {
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

.stats-card {
  margin-bottom: 20px;
}

.stat-item {
  text-align: center;
}

.stat-value {
  font-size: 28px;
  font-weight: 700;
  color: #6366f1;
}

.stat-label {
  font-size: 13px;
  color: #64748b;
  margin-top: 4px;
}

.student-table {
  background: #fff;
  border-radius: 8px;
}

.group-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.student-detail {
  padding: 8px 0;
}

.detail-header {
  display: flex;
  align-items: center;
  gap: 16px;
}

.detail-info h3 {
  margin: 0;
  font-size: 20px;
  color: #1e293b;
}

.detail-info p {
  margin: 4px 0 0 0;
  color: #64748b;
  font-size: 14px;
}

.detail-stats {
  margin-top: 8px;
}

.stat-card {
  text-align: center;
  background: #f8fafc !important;
}

.stat-num {
  font-size: 24px;
  font-weight: 700;
  color: #6366f1;
}

.stat-text {
  font-size: 12px;
  color: #64748b;
  margin-top: 4px;
}

.weak-section {
  padding: 8px 0;
}

.comment-section {
  max-height: 300px;
  overflow-y: auto;
}

.comment-item {
  padding: 12px;
  background: #f8fafc;
  border-radius: 8px;
  margin-bottom: 8px;
}

.comment-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 6px;
}

.comment-time {
  font-size: 12px;
  color: #94a3b8;
}

.comment-content {
  color: #334155;
  font-size: 14px;
  line-height: 1.5;
}

.empty-comments {
  text-align: center;
  color: #94a3b8;
  padding: 20px;
}

.add-comment {
  display: flex;
  align-items: center;
  margin-top: 12px;
}
</style>
