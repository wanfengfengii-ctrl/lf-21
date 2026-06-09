<template>
  <div class="teacher-center">
    <div class="teacher-layout">
      <aside class="sidebar">
        <div class="teacher-info">
          <div class="teacher-avatar">
            <n-avatar round :size="48">
              {{ currentTeacher?.realName?.charAt(0) || '师' }}
            </n-avatar>
          </div>
          <div class="teacher-detail">
            <div class="teacher-name">{{ currentTeacher?.realName }}</div>
            <div class="teacher-role">{{ currentTeacher?.role === 'teacher' ? '教师' : '家长' }}</div>
          </div>
        </div>

        <n-menu
          :value="activeMenu"
          :options="menuOptions"
          @update:value="handleMenuChange"
          class="side-menu"
        />

        <div class="sidebar-footer">
          <n-button 
            v-if="!isStudentMode" 
            block 
            size="small" 
            @click="showStudentSwitch = true"
          >
            切换学生视角
          </n-button>
          <n-button 
            v-else 
            block 
            size="small" 
            type="primary" 
            @click="exitStudentMode"
          >
            返回教师端
          </n-button>
        </div>
      </aside>

      <main class="main-content">
        <StudentManagement v-if="activeMenu === 'students'" />
        <GroupManagement v-else-if="activeMenu === 'groups'" />
        <TaskManagement v-else-if="activeMenu === 'tasks'" />
        <LearningReportPanel v-else-if="activeMenu === 'reports'" />
        <LeaderboardPanel v-else-if="activeMenu === 'leaderboard'" />
        <DataExportPanel v-else-if="activeMenu === 'export'" />
        <StudentTaskView v-else-if="activeMenu === 'student-tasks'" />
      </main>
    </div>

    <n-modal v-model:show="showStudentSwitch" preset="card" title="选择学生视角" style="width: 500px">
      <n-select
        v-model:value="selectedStudentId"
        :options="studentOptions"
        placeholder="选择要切换的学生"
        style="margin-bottom: 16px"
      />
      <template #footer>
        <n-button @click="showStudentSwitch = false">取消</n-button>
        <n-button type="primary" :disabled="!selectedStudentId" @click="enterStudentMode">
          进入学生视角
        </n-button>
      </template>
    </n-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useTeacherStore } from '../stores/teacher'
import { NMenu, NAvatar, NButton, NModal, NSelect } from 'naive-ui'
import StudentManagement from './StudentManagement.vue'
import GroupManagement from './GroupManagement.vue'
import TaskManagement from './TaskManagement.vue'
import LearningReportPanel from './LearningReportPanel.vue'
import LeaderboardPanel from './LeaderboardPanel.vue'
import DataExportPanel from './DataExportPanel.vue'
import StudentTaskView from './StudentTaskView.vue'

const teacherStore = useTeacherStore()

const activeMenu = ref('students')
const showStudentSwitch = ref(false)
const selectedStudentId = ref<string | null>(null)
const isStudentMode = ref(false)

const currentTeacher = computed(() => teacherStore.currentTeacher)

const menuOptions = computed(() => {
  if (isStudentMode.value) {
    return [
      {
        label: '我的任务',
        key: 'student-tasks'
      }
    ]
  }
  return [
    {
      label: '学生管理',
      key: 'students',
      icon: () => '👥'
    },
    {
      label: '班级分组',
      key: 'groups',
      icon: () => '🏫'
    },
    {
      label: '任务作业',
      key: 'tasks',
      icon: () => '📝'
    },
    {
      label: '学习报告',
      key: 'reports',
      icon: () => '📊'
    },
    {
      label: '排行榜',
      key: 'leaderboard',
      icon: () => '🏆'
    },
    {
      label: '数据导出',
      key: 'export',
      icon: () => '📥'
    }
  ]
})

const studentOptions = computed(() => {
  return teacherStore.students.map(s => ({
    label: `${s.realName} (${s.username})`,
    value: s.id
  }))
})

function handleMenuChange(key: string) {
  activeMenu.value = key
}

function enterStudentMode() {
  if (selectedStudentId.value) {
    teacherStore.loginAsStudent(selectedStudentId.value)
    isStudentMode.value = true
    activeMenu.value = 'student-tasks'
    showStudentSwitch.value = false
  }
}

function exitStudentMode() {
  teacherStore.logoutStudent()
  isStudentMode.value = false
  activeMenu.value = 'students'
}
</script>

<style scoped>
.teacher-center {
  width: 100%;
  height: 100%;
}

.teacher-layout {
  display: flex;
  height: calc(100vh - 180px);
  min-height: 600px;
  background: #fff;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
}

.sidebar {
  width: 240px;
  background: #f8fafc;
  border-right: 1px solid #e2e8f0;
  display: flex;
  flex-direction: column;
}

.teacher-info {
  padding: 20px 16px;
  display: flex;
  align-items: center;
  gap: 12px;
  border-bottom: 1px solid #e2e8f0;
}

.teacher-avatar {
  flex-shrink: 0;
}

.teacher-detail {
  flex: 1;
  min-width: 0;
}

.teacher-name {
  font-size: 16px;
  font-weight: 600;
  color: #1e293b;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.teacher-role {
  font-size: 12px;
  color: #64748b;
  margin-top: 2px;
}

.side-menu {
  flex: 1;
  padding: 12px 8px;
  border-right: none !important;
  background: transparent !important;
}

.sidebar-footer {
  padding: 16px;
  border-top: 1px solid #e2e8f0;
}

.main-content {
  flex: 1;
  padding: 24px;
  overflow-y: auto;
}
</style>
