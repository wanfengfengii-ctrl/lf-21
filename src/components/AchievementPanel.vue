<template>
  <div class="achievement-panel">
    <div class="achievement-header">
      <div class="achievement-stats">
        <n-tag type="warning" size="large">
          🏆 已解锁 {{ unlockedCount }} / {{ totalCount }}
        </n-tag>
      </div>
    </div>

    <div class="achievement-grid">
      <div
        v-for="achievement in achievements"
        :key="achievement.id"
        class="achievement-card"
        :class="{ unlocked: achievement.unlocked, locked: !achievement.unlocked }"
      >
        <div class="achievement-icon">
          {{ achievement.icon }}
        </div>
        <div class="achievement-info">
          <h4 class="achievement-name">{{ achievement.name }}</h4>
          <p class="achievement-desc">{{ achievement.description }}</p>
          <div class="achievement-progress">
            <n-progress
              type="line"
              :percentage="Math.min(100, Math.round((achievement.progress / achievement.target) * 100))"
              :show-indicator="false"
              :height="6"
              :status="achievement.unlocked ? 'success' : 'info'"
            />
            <span class="progress-text">{{ achievement.progress }} / {{ achievement.target }}</span>
          </div>
        </div>
        <div class="achievement-badge" v-if="achievement.unlocked">
          ✓
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { NTag, NProgress } from 'naive-ui'
import { useLevelStore } from '../stores/level'

const levelStore = useLevelStore()

const achievements = computed(() => levelStore.achievements)
const unlockedCount = computed(() => levelStore.unlockedAchievements)
const totalCount = computed(() => levelStore.achievements.length)
</script>

<style scoped>
.achievement-panel {
  width: 100%;
}

.achievement-header {
  text-align: center;
  margin-bottom: 20px;
}

.achievement-stats {
  display: flex;
  justify-content: center;
}

.achievement-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 12px;
  max-height: 500px;
  overflow-y: auto;
  padding-right: 8px;
}

.achievement-card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background: #f9f9f9;
  border-radius: 10px;
  border: 2px solid transparent;
  transition: all 0.3s ease;
  position: relative;
}

.achievement-card.unlocked {
  background: linear-gradient(135deg, #fffbe6 0%, #ffffff 100%);
  border-color: #fadb14;
}

.achievement-card.locked {
  opacity: 0.6;
}

.achievement-icon {
  font-size: 36px;
  width: 50px;
  height: 50px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: white;
  border-radius: 50%;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  flex-shrink: 0;
}

.achievement-card.unlocked .achievement-icon {
  animation: iconPulse 2s ease-in-out infinite;
}

@keyframes iconPulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.1); }
}

.achievement-info {
  flex: 1;
  min-width: 0;
}

.achievement-name {
  font-size: 14px;
  font-weight: bold;
  color: #333;
  margin: 0 0 4px 0;
}

.achievement-desc {
  font-size: 12px;
  color: #666;
  margin: 0 0 8px 0;
  line-height: 1.4;
}

.achievement-progress {
  display: flex;
  align-items: center;
  gap: 8px;
}

.achievement-progress .n-progress {
  flex: 1;
}

.progress-text {
  font-size: 11px;
  color: #999;
  min-width: 50px;
  text-align: right;
}

.achievement-badge {
  position: absolute;
  top: 8px;
  right: 8px;
  width: 20px;
  height: 20px;
  background: #52c41a;
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: bold;
}
</style>
