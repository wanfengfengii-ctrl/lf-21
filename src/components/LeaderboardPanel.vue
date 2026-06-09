<template>
  <div class="leaderboard-panel">
    <div class="page-header">
      <h2 class="page-title">排行榜</h2>
      <div class="header-actions">
        <n-select
          v-model:value="selectedGroup"
          :options="groupOptions"
          placeholder="选择班级"
          clearable
          style="width: 200px; margin-right: 12px"
        />
        <n-select
          v-model:value="rankType"
          :options="rankTypeOptions"
          style="width: 140px"
        />
      </div>
    </div>

    <div class="podium-section">
      <div class="podium">
        <div v-if="topThree[1]" class="podium-item second">
          <div class="podium-avatar">
            <n-avatar round :size="60" style="background: #94a3b8">
              {{ topThree[1].studentName.charAt(0) }}
            </n-avatar>
            <div class="rank-badge">2</div>
          </div>
          <div class="podium-info">
            <div class="podium-name">{{ topThree[1].studentName }}</div>
            <div class="podium-score">{{ topThree[1].score }} 分</div>
            <div class="podium-class" v-if="topThree[1].groupName">
              {{ topThree[1].groupName }}
            </div>
          </div>
          <div class="podium-stand" style="height: 140px"></div>
        </div>

        <div v-if="topThree[0]" class="podium-item first">
          <div class="podium-avatar">
            <n-avatar round :size="72" style="background: #fbbf24">
              {{ topThree[0].studentName.charAt(0) }}
            </n-avatar>
            <div class="rank-badge gold">1</div>
            <div class="crown">👑</div>
          </div>
          <div class="podium-info">
            <div class="podium-name">{{ topThree[0].studentName }}</div>
            <div class="podium-score">{{ topThree[0].score }} 分</div>
            <div class="podium-class" v-if="topThree[0].groupName">
              {{ topThree[0].groupName }}
            </div>
          </div>
          <div class="podium-stand gold" style="height: 180px"></div>
        </div>

        <div v-if="topThree[2]" class="podium-item third">
          <div class="podium-avatar">
            <n-avatar round :size="54" style="background: #cd7f32">
              {{ topThree[2].studentName.charAt(0) }}
            </n-avatar>
            <div class="rank-badge bronze">3</div>
          </div>
          <div class="podium-info">
            <div class="podium-name">{{ topThree[2].studentName }}</div>
            <div class="podium-score">{{ topThree[2].score }} 分</div>
            <div class="podium-class" v-if="topThree[2].groupName">
              {{ topThree[2].groupName }}
            </div>
          </div>
          <div class="podium-stand" style="height: 110px"></div>
        </div>
      </div>
    </div>

    <n-card :bordered="false" class="list-card">
      <n-data-table
        :columns="columns"
        :data="restList"
        :pagination="{ pageSize: 10 }"
        :row-key="row => row.studentId"
        size="small"
      />
    </n-card>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, h } from 'vue'
import { NCard, NSelect, NAvatar, NDataTable } from 'naive-ui'
import { useTeacherStore } from '../stores/teacher'
import type { LeaderboardEntry } from '../types/teacher'

const teacherStore = useTeacherStore()

const selectedGroup = ref<string | null>(null)
const rankType = ref('score')

const groupOptions = computed(() => [
  { label: '全部', value: '' },
  ...teacherStore.allGroups.map(g => ({ label: g.name, value: g.id }))
])

const rankTypeOptions = [
  { label: '综合得分', value: 'score' },
  { label: '正确率', value: 'accuracy' },
  { label: '答题数量', value: 'totalQuestions' },
  { label: '星星数量', value: 'stars' }
]

const leaderboard = computed(() => {
  let list = teacherStore.getLeaderboard(selectedGroup.value || undefined, 20)

  if (rankType.value === 'accuracy') {
    list = [...list].sort((a, b) => b.accuracy - a.accuracy)
    list.forEach((item, idx) => {
      item.rank = idx + 1
      item.score = item.accuracy
    })
  } else if (rankType.value === 'totalQuestions') {
    list = [...list].sort((a, b) => b.totalQuestions - a.totalQuestions)
    list.forEach((item, idx) => {
      item.rank = idx + 1
      item.score = item.totalQuestions
    })
  } else if (rankType.value === 'stars') {
    list = [...list].sort((a, b) => b.stars - a.stars)
    list.forEach((item, idx) => {
      item.rank = idx + 1
      item.score = item.stars
    })
  }

  return list
})

const topThree = computed(() => leaderboard.value.slice(0, 3))
const restList = computed(() => leaderboard.value.slice(3))

const columns = [
  {
    title: '排名',
    key: 'rank',
    width: 80,
    render: (row: LeaderboardEntry) =>
      h('div', { class: 'rank-cell rank-' + row.rank }, String(row.rank))
  },
  {
    title: '学生',
    key: 'studentName',
    width: 200,
    render: (row: LeaderboardEntry) =>
      h('div', { style: 'display: flex; align-items: center; gap: 10px' }, [
        h(NAvatar, { round: true, size: 32 }, { default: () => row.studentName.charAt(0) }),
        h('div', [
          h('div', { class: 'name' }, row.studentName),
          row.groupName ? h('div', { class: 'group' }, row.groupName) : null
        ])
      ])
  },
  {
    title: '得分',
    key: 'score',
    width: 120,
    render: (row: LeaderboardEntry) =>
      h('div', { class: 'score-cell' }, [
        h('span', { class: 'score-num' }, String(row.score)),
        h('span', { class: 'score-label' }, '分')
      ])
  },
  { title: '正确率', key: 'accuracy', width: 100 },
  { title: '答题数', key: 'totalQuestions', width: 100 },
  { title: '星星', key: 'stars', width: 80 }
]
</script>

<style scoped>
.leaderboard-panel {
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

.podium-section {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 16px;
  padding: 40px 20px 30px;
  margin-bottom: 24px;
}

.podium {
  display: flex;
  justify-content: center;
  align-items: flex-end;
  gap: 20px;
  min-height: 280px;
}

.podium-item {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.podium-item.first {
  order: 2;
}

.podium-item.second {
  order: 1;
}

.podium-item.third {
  order: 3;
}

.podium-avatar {
  position: relative;
  margin-bottom: 12px;
}

.rank-badge {
  position: absolute;
  bottom: -4px;
  right: -4px;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: #94a3b8;
  color: white;
  font-size: 14px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;

  &.gold {
    background: #fbbf24;
  }

  &.bronze {
    background: #cd7f32;
  }
}

.crown {
  position: absolute;
  top: -20px;
  left: 50%;
  transform: translateX(-50%);
  font-size: 28px;
}

.podium-info {
  text-align: center;
  color: white;
  margin-bottom: 12px;
}

.podium-name {
  font-size: 16px;
  font-weight: 600;
}

.podium-score {
  font-size: 20px;
  font-weight: 700;
  margin-top: 4px;
}

.podium-class {
  font-size: 12px;
  opacity: 0.8;
  margin-top: 2px;
}

.podium-stand {
  width: 100px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 8px 8px 0 0;
  display: flex;
  align-items: flex-end;
  justify-content: center;
  padding-bottom: 8px;
  color: white;
  font-weight: 600;

  &.gold {
    background: rgba(251, 191, 36, 0.3);
  }
}

.list-card {
  padding: 0;
}

.rank-cell {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: #f1f5f9;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 14px;
  color: #64748b;

  &.rank-1 {
    background: #fef3c7;
    color: #d97706;
  }

  &.rank-2 {
    background: #f1f5f9;
    color: #475569;
  }

  &.rank-3 {
    background: #fed7aa;
    color: #c2410c;
  }
}

.name {
  font-size: 14px;
  font-weight: 500;
  color: #1e293b;
}

.group {
  font-size: 12px;
  color: #64748b;
}

.score-cell {
  display: flex;
  align-items: baseline;
  gap: 4px;
}

.score-num {
  font-size: 18px;
  font-weight: 700;
  color: #6366f1;
}

.score-label {
  font-size: 12px;
  color: #64748b;
}
</style>
