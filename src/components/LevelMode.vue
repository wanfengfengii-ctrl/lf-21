<template>
  <div class="level-mode">
    <div v-if="!isPlaying && !showResult">
      <LevelSelect @start-level="handleStartLevel" />
    </div>

    <div v-else-if="isPlaying && !showResult" class="game-layout">
      <div class="abacus-section">
        <Abacus
          :rods="abacusStore.abacusState.rods"
          :decimal-position="abacusStore.abacusState.decimalPosition"
          :is-negative="abacusStore.isNegative"
          :interactive="true"
          :highlighted-rod="abacusStore.highlightedRod"
          :error-rods="levelStore.displayErrorRodIndices"
          :is-sign-error="levelStore.displaySignError"
          :sign-error-expected="levelStore.displaySignErrorExpected"
          @bead-click="handleBeadClick"
          @bead-drag="handleBeadDrag"
          @toggle-sign="handleToggleSign"
        />
        <div class="game-options">
          <n-switch
            v-model:value="realTimeEnabled"
            @update:value="handleRealTimeToggle"
            checked-value="on"
            unchecked-value="off"
          >
            <template #checked>🔍 实时纠错</template>
            <template #unchecked>实时纠错</template>
          </n-switch>
        </div>
        <div class="game-actions">
          <n-button
            @click="showAnswerOnAbacus"
            :disabled="!levelStore.canShowAnswer"
            :type="levelStore.canShowAnswer ? 'default' : 'default'"
          >
            {{ levelStore.canShowAnswer ? '显示答案' : '答题中不可查看' }}
          </n-button>
          <n-button @click="clearAbacus">清空算盘</n-button>
          <n-button
            @click="showStandardSteps"
            :disabled="!levelStore.canShowSteps"
          >
            {{ levelStore.canShowSteps ? '查看标准步骤' : '答题中不可查看' }}
          </n-button>
        </div>
        <div class="realtime-tip" v-if="realTimeEnabled && levelStore.isQuestionAnswering">
          <n-alert type="info" :show-icon="true" size="small">
            💡 已开启实时纠错，错误档位会标红提示
          </n-alert>
        </div>
      </div>
      <div class="panel-section">
        <LevelGame
          @exit="handleExitLevel"
          @level-complete="handleLevelComplete"
        />
      </div>
    </div>

    <div v-else-if="showResult" class="result-layout">
      <LevelResult
        @retry="handleRetry"
        @next-level="handleNextLevel"
        @back="handleBackToLevels"
      />
    </div>

    <n-modal v-model:show="showStepsModal" preset="card" title="📖 标准拨珠步骤" style="width: 500px">
      <div v-if="levelStore.currentQuestion" class="steps-modal">
        <div class="steps-question">
          {{ levelStore.currentQuestion.num1 }} {{ levelStore.currentQuestion.operator }} {{ levelStore.currentQuestion.num2 }} = {{ levelStore.currentQuestion.answer }}
        </div>
        <div class="steps-list">
          <div
            v-for="(step, idx) in levelStore.currentQuestion.standardSteps"
            :key="step.id"
            class="step-item"
          >
            <span class="step-number">{{ idx + 1 }}</span>
            <span class="step-desc">{{ step.description }}</span>
          </div>
        </div>
      </div>
    </n-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { NButton, NModal, NSwitch, NAlert } from 'naive-ui'
import Abacus from './Abacus.vue'
import LevelSelect from './LevelSelect.vue'
import LevelGame from './LevelGame.vue'
import LevelResult from './LevelResult.vue'
import { useAbacusStore } from '../stores/abacus'
import { useLevelStore } from '../stores/level'

const abacusStore = useAbacusStore()
const levelStore = useLevelStore()

const showStepsModal = ref(false)
const realTimeEnabled = ref(false)

const isPlaying = computed(() => levelStore.isLevelStarted)
const showResult = computed(() => levelStore.showLevelResult)

function handleRealTimeToggle(value: string) {
  const enabled = value === 'on'
  levelStore.toggleRealTimeCheck(enabled)
  if (enabled && levelStore.isQuestionAnswering) {
    levelStore.realTimeCheckAbacus(abacusStore.abacusState)
  }
}

function handleStartLevel(levelId: number) {
  abacusStore.resetAbacus()
  levelStore.startLevel(levelId)
  
  if (levelStore.currentQuestion) {
    levelStore.addUserReplayFrame(abacusStore.abacusState, '初始状态')
    if (realTimeEnabled.value) {
      levelStore.realTimeCheckAbacus(abacusStore.abacusState)
    }
  }
}

function handleBeadClick(rodIndex: number, type: 'upper' | 'lower', beadIndex: number) {
  abacusStore.clickBead(rodIndex, type, beadIndex)
  
  if (levelStore.isQuestionAnswering) {
    levelStore.addUserReplayFrame(
      abacusStore.abacusState,
      `点击第 ${13 - rodIndex} 档${type === 'upper' ? '上珠' : '下珠'}`
    )
    if (realTimeEnabled.value) {
      levelStore.realTimeCheckAbacus(abacusStore.abacusState)
    }
  }
}

function handleBeadDrag(rodIndex: number, type: 'upper' | 'lower', value: number) {
  abacusStore.dragBead(rodIndex, type, value)
  
  if (levelStore.isQuestionAnswering) {
    levelStore.addUserReplayFrame(
      abacusStore.abacusState,
      `拖动第 ${13 - rodIndex} 档${type === 'upper' ? '上珠' : '下珠'}`
    )
    if (realTimeEnabled.value) {
      levelStore.realTimeCheckAbacus(abacusStore.abacusState)
    }
  }
}

function handleToggleSign() {
  abacusStore.toggleNegative()
  
  if (levelStore.isQuestionAnswering) {
    levelStore.addUserReplayFrame(
      abacusStore.abacusState,
      '切换正负号'
    )
    if (realTimeEnabled.value) {
      levelStore.realTimeCheckAbacus(abacusStore.abacusState)
    }
  }
}

function clearAbacus() {
  abacusStore.resetAbacus()
  if (levelStore.isQuestionAnswering) {
    levelStore.addUserReplayFrame(abacusStore.abacusState, '清空算盘')
    if (realTimeEnabled.value) {
      levelStore.realTimeCheckAbacus(abacusStore.abacusState)
    }
  }
}

function showAnswerOnAbacus() {
  if (levelStore.currentQuestion && levelStore.canShowAnswer) {
    abacusStore.setNumber(levelStore.currentQuestion.answer)
  }
}

function showStandardSteps() {
  if (levelStore.canShowSteps) {
    showStepsModal.value = true
  }
}

function handleExitLevel() {
  abacusStore.resetAbacus()
}

function handleLevelComplete() {
  // Level complete is handled by store
}

function handleRetry() {
  if (levelStore.currentLevel) {
    const levelId = levelStore.currentLevel.id
    abacusStore.resetAbacus()
    levelStore.exitLevel()
    levelStore.startLevel(levelId)
    
    if (levelStore.currentQuestion) {
      levelStore.addUserReplayFrame(abacusStore.abacusState, '初始状态')
      if (realTimeEnabled.value) {
        levelStore.realTimeCheckAbacus(abacusStore.abacusState)
      }
    }
  }
}

function handleNextLevel() {
  if (levelStore.currentLevel) {
    const nextLevelId = levelStore.currentLevel.id + 1
    abacusStore.resetAbacus()
    levelStore.exitLevel()
    levelStore.startLevel(nextLevelId)
    
    if (levelStore.currentQuestion) {
      levelStore.addUserReplayFrame(abacusStore.abacusState, '初始状态')
      if (realTimeEnabled.value) {
        levelStore.realTimeCheckAbacus(abacusStore.abacusState)
      }
    }
  }
}

function handleBackToLevels() {
  abacusStore.resetAbacus()
  levelStore.exitLevel()
}

watch(() => levelStore.currentQuestion, (newQuestion) => {
  if (newQuestion && levelStore.isQuestionAnswering) {
    abacusStore.resetAbacus()
    levelStore.addUserReplayFrame(abacusStore.abacusState, '初始状态')
    if (realTimeEnabled.value) {
      levelStore.realTimeCheckAbacus(abacusStore.abacusState)
    }
  }
})
</script>

<style scoped>
.level-mode {
  width: 100%;
  display: flex;
  justify-content: center;
}

.game-layout {
  display: flex;
  gap: 24px;
  flex-wrap: wrap;
  justify-content: center;
  width: 100%;
  max-width: 1200px;
}

.abacus-section {
  flex: 1;
  min-width: 500px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
}

.panel-section {
  flex: 1;
  min-width: 400px;
  max-width: 600px;
}

.game-actions {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
  justify-content: center;
}

.game-options {
  display: flex;
  justify-content: center;
  align-items: center;
  margin-bottom: 4px;
}

.realtime-tip {
  width: 100%;
  max-width: 500px;
}

.result-layout {
  display: flex;
  justify-content: center;
  width: 100%;
}

.steps-modal {
  padding: 8px 0;
}

.steps-question {
  text-align: center;
  font-size: 20px;
  font-weight: bold;
  color: #333;
  margin-bottom: 16px;
  font-family: 'Courier New', monospace;
}

.steps-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  max-height: 400px;
  overflow-y: auto;
}

.step-item {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 10px 12px;
  background: #f5f5f5;
  border-radius: 8px;
}

.step-number {
  width: 24px;
  height: 24px;
  background: #1890ff;
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: bold;
  flex-shrink: 0;
}

.step-desc {
  font-size: 14px;
  color: #333;
  line-height: 1.5;
  flex: 1;
}

@media (max-width: 900px) {
  .game-layout {
    flex-direction: column;
  }
  
  .abacus-section,
  .panel-section {
    min-width: 100%;
    max-width: 100%;
  }
}
</style>
