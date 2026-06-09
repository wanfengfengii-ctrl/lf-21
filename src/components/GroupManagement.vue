<template>
  <div class="group-management">
    <div class="page-header">
      <h2 class="page-title">班级分组</h2>
      <div class="header-actions">
        <n-button type="primary" @click="showAddModal = true">
          <template #icon>
            <span>+</span>
          </template>
          创建班级
        </n-button>
      </div>
    </div>

    <div class="group-list">
      <n-grid :cols="3" :x-gap="20" :y-gap="20">
        <n-gi v-for="group in allGroups" :key="group.id">
          <n-card :bordered="false" class="group-card" hoverable>
            <div class="group-header">
              <div class="group-color" :style="{ background: group.color || '#1890ff' }"></div>
              <div class="group-title">
                <h3 class="group-name">{{ group.name }}</h3>
                <p class="group-desc">{{ group.description || '暂无描述' }}</p>
              </div>
            </div>

            <n-divider style="margin: 12px 0" />

            <div class="group-stats">
              <div class="stat">
                <span class="stat-num">{{ group.studentIds.length }}</span>
                <span class="stat-label">学生</span>
              </div>
              <div class="stat">
                <span class="stat-num">{{ getGroupTaskCount(group.id) }}</span>
                <span class="stat-label">任务</span>
              </div>
              <div class="stat">
                <span class="stat-num">{{ getGroupAvgAccuracy(group.id) }}%</span>
                <span class="stat-label">正确率</span>
              </div>
            </div>

            <div class="group-actions">
              <n-button size="small" @click="viewGroup(group)">查看详情</n-button>
              <n-button size="small" @click="editGroup(group)" style="margin-left: 8px">
                编辑
              </n-button>
              <n-popconfirm @positive-click="deleteGroup(group)">
                <template #trigger>
                  <n-button size="small" type="error" style="margin-left: 8px">
                    删除
                  </n-button>
                </template>
                确定要删除这个班级吗？
              </n-popconfirm>
            </div>
          </n-card>
        </n-gi>
      </n-grid>
    </div>

    <n-modal v-model:show="showAddModal" preset="card" :title="isEditing ? '编辑班级' : '创建班级'" style="width: 500px">
      <n-form label-placement="top" :model="formData">
        <n-form-item label="班级名称">
          <n-input v-model:value="formData.name" placeholder="请输入班级名称" />
        </n-form-item>
        <n-form-item label="班级描述">
          <n-input v-model:value="formData.description" type="textarea" placeholder="请输入班级描述" :rows="3" />
        </n-form-item>
        <n-form-item label="标识颜色">
          <n-color-picker v-model:value="formData.color" :modes="['hex']" />
        </n-form-item>
      </n-form>
      <template #footer>
        <n-button @click="showAddModal = false">取消</n-button>
        <n-button type="primary" @click="submitForm">确定</n-button>
      </template>
    </n-modal>

    <n-modal v-model:show="showDetailModal" preset="card" :title="currentGroup?.name || '班级详情'" style="width: 700px">
      <div v-if="currentGroup" class="group-detail">
        <n-tabs v-model:value="detailTab" type="line">
          <n-tab-pane name="students" tab="学生列表">
            <div class="tab-content">
              <div class="add-student-bar">
                <n-select
                  v-model:value="selectedStudentToAdd"
                  :options="availableStudents"
                  placeholder="选择学生添加到班级"
                  filterable
                  style="flex: 1; margin-right: 12px"
                />
                <n-button type="primary" :disabled="!selectedStudentToAdd" @click="addStudentToCurrentGroup">
                  添加
                </n-button>
              </div>

              <n-data-table
                :columns="studentColumns"
                :data="groupStudents"
                :pagination="{ pageSize: 5 }"
                :row-key="row => row.id"
                size="small"
                style="margin-top: 16px"
              />
            </div>
          </n-tab-pane>

          <n-tab-pane name="tasks" tab="班级任务">
            <div class="tab-content">
              <n-empty v-if="groupTasks.length === 0" description="暂无任务" />
              <div v-else class="task-list">
                <div v-for="task in groupTasks" :key="task.id" class="task-item">
                  <div class="task-info">
                    <div class="task-title">{{ task.title }}</div>
                    <div class="task-meta">
                      <n-tag size="small" :type="task.config.type === 'level' ? 'success' : 'info'">
                        {{ task.config.type === 'level' ? '关卡作业' : '练习任务' }}
                      </n-tag>
                      <span v-if="task.deadline" class="deadline">
                        截止: {{ formatDate(task.deadline) }}
                      </span>
                    </div>
                  </div>
                  <div class="task-progress">
                    完成率: {{ getTaskCompletionRate(task.id) }}%
                  </div>
                </div>
              </div>
            </div>
          </n-tab-pane>

          <n-tab-pane name="stats" tab="班级统计">
            <div class="tab-content">
              <n-grid :cols="3" :x-gap="16" style="margin-bottom: 20px">
                <n-gi>
                  <n-card size="small" :bordered="false" class="mini-stat">
                    <div class="mini-stat-num">{{ groupStudents.length }}</div>
                    <div class="mini-stat-label">学生人数</div>
                  </n-card>
                </n-gi>
                <n-gi>
                  <n-card size="small" :bordered="false" class="mini-stat">
                    <div class="mini-stat-num">{{ getGroupAvgAccuracy(currentGroup.id) }}%</div>
                    <div class="mini-stat-label">平均正确率</div>
                  </n-card>
                </n-gi>
                <n-gi>
                  <n-card size="small" :bordered="false" class="mini-stat">
                    <div class="mini-stat-num">{{ getGroupTotalQuestions(currentGroup.id) }}</div>
                    <div class="mini-stat-label">总答题数</div>
                  </n-card>
                </n-gi>
              </n-grid>
            </div>
          </n-tab-pane>
        </n-tabs>
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
  NColorPicker,
  NDivider,
  NPopconfirm,
  NTabs,
  NTabPane,
  NSelect,
  NDataTable,
  NAvatar,
  NTag,
  NEmpty,
  useMessage
} from 'naive-ui'
import { useTeacherStore } from '../stores/teacher'
import type { StudentGroup, Student } from '../types/teacher'

const teacherStore = useTeacherStore()
const message = useMessage()

const showAddModal = ref(false)
const showDetailModal = ref(false)
const isEditing = ref(false)
const currentGroup = ref<StudentGroup | null>(null)
const detailTab = ref('students')
const selectedStudentToAdd = ref<string | null>(null)

const formData = reactive({
  name: '',
  description: '',
  color: '#1890ff'
})

const allGroups = computed(() => teacherStore.allGroups)
const allStudents = computed(() => teacherStore.allStudents)

const availableStudents = computed(() => {
  if (!currentGroup.value) return []
  return allStudents.value
    .filter(s => !s.groupIds.includes(currentGroup.value!.id))
    .map(s => ({
      label: `${s.realName} (${s.username})`,
      value: s.id
    }))
})

const groupStudents = computed(() => {
  if (!currentGroup.value) return []
  return allStudents.value.filter(s => s.groupIds.includes(currentGroup.value!.id))
})

const groupTasks = computed(() => {
  if (!currentGroup.value) return []
  return teacherStore.tasks.filter(t => t.assignedGroupIds.includes(currentGroup.value!.id))
})

const studentColumns = [
  {
    title: '姓名',
    key: 'name',
    width: 200,
    render: (row: Student) =>
      h('div', { style: 'display: flex; align-items: center; gap: 10px' }, [
        h(NAvatar, { round: true, size: 28 }, { default: () => row.realName.charAt(0) }),
        h('span', row.realName)
      ])
  },
  { title: '账号', key: 'username', width: 150 },
  { title: '答题数', key: 'totalQuestions', width: 100 },
  { title: '星星', key: 'stars', width: 80 },
  {
    title: '操作',
    key: 'actions',
    width: 80,
    render: (row: Student) =>
      h(NButton, { size: 'tiny', type: 'error', onClick: () => removeStudent(row) }, {
        default: () => '移出'
      })
  }
]

function getGroupTaskCount(groupId: string): number {
  return teacherStore.tasks.filter(t => t.assignedGroupIds.includes(groupId)).length
}

function getGroupAvgAccuracy(groupId: string): number {
  const students = allStudents.value.filter(s => s.groupIds.includes(groupId))
  if (students.length === 0) return 0
  const total = students.reduce((sum, s) => {
    const acc = s.totalQuestions > 0 ? (s.correctQuestions / s.totalQuestions) * 100 : 0
    return sum + acc
  }, 0)
  return Math.round(total / students.length)
}

function getGroupTotalQuestions(groupId: string): number {
  const students = allStudents.value.filter(s => s.groupIds.includes(groupId))
  return students.reduce((sum, s) => sum + s.totalQuestions, 0)
}

function getTaskCompletionRate(taskId: string): number {
  return teacherStore.getTaskCompletionRate(taskId)
}

function formatDate(timestamp: number): string {
  return new Date(timestamp).toLocaleDateString('zh-CN')
}

function viewGroup(group: StudentGroup) {
  currentGroup.value = group
  detailTab.value = 'students'
  selectedStudentToAdd.value = null
  showDetailModal.value = true
}

function editGroup(group: StudentGroup) {
  isEditing.value = true
  formData.name = group.name
  formData.description = group.description || ''
  formData.color = group.color || '#1890ff'
  showAddModal.value = true
}

function deleteGroup(group: StudentGroup) {
  teacherStore.deleteGroup(group.id)
  message.success('删除成功')
}

function submitForm() {
  if (!formData.name.trim()) {
    message.warning('请输入班级名称')
    return
  }

  if (isEditing.value && currentGroup.value) {
    teacherStore.updateGroup(currentGroup.value.id, {
      name: formData.name,
      description: formData.description,
      color: formData.color
    })
    message.success('更新成功')
  } else {
    const newGroup = teacherStore.addGroup({
      name: formData.name,
      description: formData.description,
      color: formData.color
    })
    currentGroup.value = newGroup
    message.success('创建成功')
  }

  showAddModal.value = false
  resetForm()
}

function resetForm() {
  formData.name = ''
  formData.description = ''
  formData.color = '#1890ff'
  isEditing.value = false
}

function addStudentToCurrentGroup() {
  if (!currentGroup.value || !selectedStudentToAdd.value) return

  teacherStore.addStudentToGroup(selectedStudentToAdd.value, currentGroup.value.id)
  selectedStudentToAdd.value = null
  message.success('添加成功')
}

function removeStudent(student: Student) {
  if (!currentGroup.value) return
  teacherStore.removeStudentFromGroup(student.id, currentGroup.value.id)
  message.success('已移出班级')
}
</script>

<style scoped>
.group-management {
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

.group-card {
  height: 100%;
}

.group-header {
  display: flex;
  align-items: flex-start;
  gap: 12px;
}

.group-color {
  width: 8px;
  height: 36px;
  border-radius: 4px;
  flex-shrink: 0;
}

.group-title {
  flex: 1;
}

.group-name {
  font-size: 18px;
  font-weight: 600;
  color: #1e293b;
  margin: 0;
}

.group-desc {
  font-size: 13px;
  color: #64748b;
  margin: 4px 0 0 0;
}

.group-stats {
  display: flex;
  justify-content: space-around;
  padding: 8px 0;
}

.stat {
  text-align: center;
}

.stat-num {
  display: block;
  font-size: 20px;
  font-weight: 700;
  color: #6366f1;
}

.stat-label {
  font-size: 12px;
  color: #64748b;
}

.group-actions {
  display: flex;
  justify-content: flex-end;
  margin-top: 12px;
}

.group-detail {
  padding: 8px 0;
}

.tab-content {
  padding-top: 16px;
}

.add-student-bar {
  display: flex;
  align-items: center;
}

.task-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.task-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background: #f8fafc;
  border-radius: 8px;
}

.task-info {
  flex: 1;
}

.task-title {
  font-size: 15px;
  font-weight: 500;
  color: #1e293b;
}

.task-meta {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-top: 6px;
}

.deadline {
  font-size: 12px;
  color: #f59e0b;
}

.task-progress {
  font-size: 14px;
  font-weight: 500;
  color: #10b981;
}

.mini-stat {
  text-align: center;
  background: #f8fafc !important;
}

.mini-stat-num {
  font-size: 22px;
  font-weight: 700;
  color: #6366f1;
}

.mini-stat-label {
  font-size: 12px;
  color: #64748b;
  margin-top: 4px;
}
</style>
