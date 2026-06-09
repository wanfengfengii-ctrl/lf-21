<template>
  <div class="data-export-panel">
    <div class="page-header">
      <h2 class="page-title">数据导出</h2>
    </div>

    <n-grid :cols="2" :x-gap="24">
      <n-gi>
        <n-card :bordered="false" title="导出设置">
          <n-form label-placement="top" :model="exportOptions">
            <n-form-item label="导出格式">
              <n-radio-group v-model:value="exportOptions.format">
                <n-radio value="csv">CSV 表格</n-radio>
                <n-radio value="json">JSON 数据</n-radio>
              </n-radio-group>
            </n-form-item>

            <n-form-item label="包含内容">
              <n-checkbox-group v-model:value="selectedContent">
                <n-checkbox value="scores">成绩数据</n-checkbox>
                <n-checkbox value="progress">学习进度</n-checkbox>
                <n-checkbox value="wrongQuestions">错题数据</n-checkbox>
              </n-checkbox-group>
            </n-form-item>

            <n-form-item label="时间范围">
              <n-date-picker
                v-model:value="dateRange"
                type="daterange"
                placeholder="选择日期范围"
              />
            </n-form-item>

            <n-form-item label="筛选班级">
              <n-select
                v-model:value="selectedGroups"
                multiple
                :options="groupOptions"
                placeholder="选择班级（留空则导出全部）"
                clearable
              />
            </n-form-item>

            <n-form-item label="筛选学生">
              <n-select
                v-model:value="selectedStudents"
                multiple
                filterable
                :options="studentOptions"
                placeholder="选择学生（留空则导出全部）"
                clearable
              />
            </n-form-item>
          </n-form>

          <div class="export-actions">
            <n-button type="primary" block size="large" @click="handleExport">
              <template #icon>
                <span>📥</span>
              </template>
              导出数据
            </n-button>
          </div>
        </n-card>
      </n-gi>

      <n-gi>
        <n-card :bordered="false" title="导出预览">
          <div class="preview-section">
            <div class="preview-item">
              <span class="preview-label">学生人数:</span>
              <span class="preview-value">{{ previewStats.studentCount }} 人</span>
            </div>
            <div class="preview-item">
              <span class="preview-label">成绩记录:</span>
              <span class="preview-value">{{ previewStats.scoreCount }} 条</span>
            </div>
            <div class="preview-item">
              <span class="preview-label">错题数量:</span>
              <span class="preview-value">{{ previewStats.wrongCount }} 条</span>
            </div>
            <div class="preview-item">
              <span class="preview-label">预计文件大小:</span>
              <span class="preview-value">{{ previewStats.fileSize }}</span>
            </div>
          </div>

          <n-divider />

          <div class="preview-tips">
            <h4>导出说明</h4>
            <ul>
              <li>CSV 格式可用 Excel 打开查看</li>
              <li>JSON 格式包含完整结构化数据</li>
              <li>错题数据包含题目、学生答案、错误描述</li>
              <li>学习进度包含关卡完成情况和薄弱环节分析</li>
            </ul>
          </div>

          <n-divider />

          <div class="recent-exports">
            <h4>最近导出</h4>
            <div class="export-list">
              <div v-for="(item, idx) in recentExports" :key="idx" class="export-item">
                <div class="export-icon">📊</div>
                <div class="export-info">
                  <div class="export-name">{{ item.name }}</div>
                  <div class="export-meta">{{ item.time }} · {{ item.size }}</div>
                </div>
                <n-button size="tiny" text>下载</n-button>
              </div>
              <div v-if="recentExports.length === 0" class="empty-exports">
                暂无导出记录
              </div>
            </div>
          </div>
        </n-card>
      </n-gi>
    </n-grid>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, reactive } from 'vue'
import {
  NCard,
  NGrid,
  NGi,
  NForm,
  NFormItem,
  NRadioGroup,
  NRadio,
  NCheckboxGroup,
  NCheckbox,
  NDatePicker,
  NSelect,
  NButton,
  NDivider,
  useMessage
} from 'naive-ui'
import { useTeacherStore } from '../stores/teacher'
import type { ExportOptions } from '../types/teacher'

const teacherStore = useTeacherStore()
const message = useMessage()

const exportOptions = reactive<ExportOptions>({
  format: 'csv',
  includeScores: true,
  includeWrongQuestions: false,
  includeProgress: false
})

const selectedContent = ref<string[]>(['scores'])
const dateRange = ref<[number, number] | null>(null)
const selectedGroups = ref<string[]>([])
const selectedStudents = ref<string[]>([])

const recentExports = ref([
  { name: '三年级一班-成绩报告.csv', time: '昨天 14:30', size: '24KB' },
  { name: '期中学习报告.json', time: '3天前', size: '156KB' }
])

const groupOptions = computed(() =>
  teacherStore.allGroups.map(g => ({ label: g.name, value: g.id }))
)

const studentOptions = computed(() =>
  teacherStore.allStudents.map(s => ({
    label: `${s.realName} (${s.username})`,
    value: s.id
  }))
)

const previewStats = computed(() => {
  let studentCount = teacherStore.allStudents.length

  if (selectedGroups.value.length > 0) {
    const studentIds = new Set<string>()
    for (const gid of selectedGroups.value) {
      const group = teacherStore.getGroupById(gid)
      if (group) {
        group.studentIds.forEach(sid => studentIds.add(sid))
      }
    }
    studentCount = studentIds.size
  }

  if (selectedStudents.value.length > 0) {
    studentCount = selectedStudents.value.length
  }

  return {
    studentCount,
    scoreCount: studentCount,
    wrongCount: Math.floor(studentCount * 3.5),
    fileSize: exportOptions.format === 'csv' ? `${studentCount * 2}KB` : `${studentCount * 8}KB`
  }
})

function handleExport() {
  const opts: ExportOptions = {
    format: exportOptions.format,
    includeScores: selectedContent.value.includes('scores'),
    includeWrongQuestions: selectedContent.value.includes('wrongQuestions'),
    includeProgress: selectedContent.value.includes('progress')
  }

  if (dateRange.value) {
    opts.dateRange = {
      start: dateRange.value[0],
      end: dateRange.value[1]
    }
  }

  if (!opts.includeScores && !opts.includeWrongQuestions && !opts.includeProgress) {
    message.warning('请至少选择一项导出内容')
    return
  }

  teacherStore.downloadExport(opts, `学习数据_${Date.now()}`)
  message.success('导出成功')

  recentExports.value.unshift({
    name: `学习数据导出_${Date.now()}.${opts.format}`,
    time: '刚刚',
    size: previewStats.value.fileSize
  })

  if (recentExports.value.length > 5) {
    recentExports.value = recentExports.value.slice(0, 5)
  }
}
</script>

<style scoped>
.data-export-panel {
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

.export-actions {
  margin-top: 24px;
}

.preview-section {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.preview-item {
  display: flex;
  justify-content: space-between;
  padding: 10px 12px;
  background: #f8fafc;
  border-radius: 6px;
}

.preview-label {
  color: #64748b;
  font-size: 14px;
}

.preview-value {
  color: #1e293b;
  font-weight: 600;
  font-size: 14px;
}

.preview-tips h4,
.recent-exports h4 {
  margin: 0 0 12px 0;
  font-size: 15px;
  font-weight: 600;
  color: #1e293b;
}

.preview-tips ul {
  margin: 0;
  padding-left: 20px;
  color: #64748b;
  font-size: 13px;
  line-height: 2;
}

.export-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.export-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 12px;
  background: #f8fafc;
  border-radius: 6px;
}

.export-icon {
  font-size: 24px;
}

.export-info {
  flex: 1;
}

.export-name {
  font-size: 13px;
  font-weight: 500;
  color: #334155;
}

.export-meta {
  font-size: 12px;
  color: #94a3b8;
  margin-top: 2px;
}

.empty-exports {
  text-align: center;
  color: #94a3b8;
  padding: 20px;
  font-size: 13px;
}
</style>
