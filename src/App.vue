<template>
  <div class="app">
    <header class="app-header">
      <h1 class="app-title">交互算盘</h1>
      <p class="app-subtitle">四则运算拨珠演示与练习</p>
    </header>

    <n-tabs v-model:value="activeTab" type="line" class="main-tabs">
      <n-tab-pane name="demo" tab="演示模式">
        <div class="tab-content">
          <div class="abacus-section">
            <Abacus
              :rods="abacusStore.abacusState.rods"
              :decimal-position="abacusStore.abacusState.decimalPosition"
              :is-negative="abacusStore.isNegative"
              :interactive="true"
              :highlighted-rod="abacusStore.highlightedRod"
              :error-rods="abacusStore.errorRods"
              :error-message="abacusStore.errorMessage"
              @bead-click="handleBeadClick"
              @bead-drag="handleBeadDrag"
              @toggle-sign="handleToggleSign"
            />
          </div>
          <div class="panel-section">
            <DemoPanel />
          </div>
        </div>
      </n-tab-pane>

      <n-tab-pane name="practice" tab="练习模式">
        <div class="tab-content">
          <div class="abacus-section">
            <Abacus
              :rods="abacusStore.abacusState.rods"
              :decimal-position="abacusStore.abacusState.decimalPosition"
              :is-negative="abacusStore.isNegative"
              :interactive="true"
              :highlighted-rod="abacusStore.highlightedRod"
              :error-rods="practiceStore.errorRodIndices"
              :is-sign-error="practiceStore.isSignError"
              :sign-error-expected="practiceStore.signErrorExpected"
              @bead-click="handlePracticeBeadClick"
              @bead-drag="handlePracticeBeadDrag"
              @toggle-sign="handlePracticeToggleSign"
            />
            <div class="practice-actions">
              <n-button @click="checkPracticeAnswer" v-if="practiceStore.isAnswering">
                检查拨珠结果
              </n-button>
              <n-button @click="showAnswerOnAbacus" v-if="practiceStore.currentQuestion && practiceStore.showResult">
                在算盘上显示答案
              </n-button>
              <n-button @click="clearAbacus">清空算盘</n-button>
            </div>
          </div>
          <div class="panel-section">
            <PracticePanel />
          </div>
        </div>
      </n-tab-pane>
    </n-tabs>

    <footer class="app-footer">
      <p>上珠一颗代表 5，下珠一颗代表 1 | 点击或拖拽算珠进行操作</p>
    </footer>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { NTabs, NTabPane, NButton } from 'naive-ui'
import Abacus from './components/Abacus.vue'
import DemoPanel from './components/DemoPanel.vue'
import PracticePanel from './components/PracticePanel.vue'
import { useAbacusStore } from './stores/abacus'
import { usePracticeStore } from './stores/practice'

const abacusStore = useAbacusStore()
const practiceStore = usePracticeStore()

const activeTab = ref('demo')

function handleBeadClick(rodIndex: number, type: 'upper' | 'lower', beadIndex: number) {
  abacusStore.clickBead(rodIndex, type, beadIndex)
}

function handleBeadDrag(rodIndex: number, type: 'upper' | 'lower', value: number) {
  abacusStore.dragBead(rodIndex, type, value)
}

function handleToggleSign() {
  abacusStore.toggleNegative()
}

function handlePracticeBeadClick(rodIndex: number, type: 'upper' | 'lower', beadIndex: number) {
  abacusStore.clickBead(rodIndex, type, beadIndex)
  practiceStore.clearOperationErrors()
}

function handlePracticeBeadDrag(rodIndex: number, type: 'upper' | 'lower', value: number) {
  abacusStore.dragBead(rodIndex, type, value)
  practiceStore.clearOperationErrors()
}

function handlePracticeToggleSign() {
  abacusStore.toggleNegative()
  practiceStore.clearOperationErrors()
}

function checkPracticeAnswer() {
  practiceStore.checkAbacusAnswer(abacusStore.abacusState)
}

function showAnswerOnAbacus() {
  if (practiceStore.currentQuestion) {
    abacusStore.setNumber(practiceStore.currentQuestion.answer)
  }
}

function clearAbacus() {
  abacusStore.resetAbacus()
  if (activeTab.value === 'practice') {
    practiceStore.clearOperationErrors()
  }
}

watch(activeTab, (newTab) => {
  if (newTab === 'practice') {
    abacusStore.resetAbacus()
    practiceStore.clearOperationErrors()
  }
})
</script>

<style scoped>
.app {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.app-header {
  text-align: center;
  margin-bottom: 20px;
}

.app-title {
  font-size: 36px;
  font-weight: bold;
  color: white;
  margin: 0;
  text-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
}

.app-subtitle {
  font-size: 16px;
  color: rgba(255, 255, 255, 0.8);
  margin: 8px 0 0 0;
}

.main-tabs {
  width: 100%;
  max-width: 1200px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
  padding: 20px;
}

.tab-content {
  display: flex;
  gap: 24px;
  flex-wrap: wrap;
  justify-content: center;
  padding-top: 20px;
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

.practice-actions {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
  justify-content: center;
}

.app-footer {
  margin-top: 20px;
  text-align: center;
  color: rgba(255, 255, 255, 0.7);
  font-size: 14px;
}

.app-footer p {
  margin: 0;
}

@media (max-width: 900px) {
  .tab-content {
    flex-direction: column;
  }
  
  .abacus-section,
  .panel-section {
    min-width: 100%;
    max-width: 100%;
  }
}
</style>
