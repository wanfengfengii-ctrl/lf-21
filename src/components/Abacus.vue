<template>
  <div class="abacus-container">
    <div class="abacus-with-sign">
      <div 
        class="sign-indicator"
        :class="{ 'negative': isNegative, 'clickable': interactive, 'error': isSignError }"
        @click="handleSignClick"
      >
        <span class="sign-text">{{ isNegative ? '−' : '+' }}</span>
        <span class="sign-label">负</span>
      </div>

      <div class="abacus-frame" :class="{ 'highlighted': highlightedRod !== null }">
        <div class="abacus-top-beam"></div>
        <div class="abacus-rods">
          <div
            v-for="(rod, index) in rods"
            :key="index"
            class="rod-wrapper"
            :class="{ 
              'highlighted': highlightedRod === index, 
              'decimal-mark': isDecimalRod(index),
              'error': isErrorRod(index)
            }"
          >
            <div class="rod-label">{{ TOTAL_RODS - index }}</div>
            
            <div class="upper-section">
              <div class="rod-line upper-rod"></div>
              <div class="beads-container upper-beads">
                <div
                  v-for="beadIdx in 2"
                  :key="'upper-' + beadIdx"
                  class="bead upper-bead"
                  :class="{ active: beadIdx <= rod.upper, clickable: interactive }"
                  @mousedown="startDrag($event, index, 'upper', 1 - beadIdx + 1)"
                  @click="handleUpperBeadClick(index, beadIdx - 1)"
                >
                  <div class="bead-body"></div>
                  <div class="bead-shine"></div>
                </div>
              </div>
            </div>

            <div class="middle-beam"></div>

            <div class="lower-section">
              <div class="rod-line lower-rod"></div>
              <div class="beads-container lower-beads">
                <div
                  v-for="beadIdx in 5"
                  :key="'lower-' + beadIdx"
                  class="bead lower-bead"
                  :class="{ active: beadIdx > 5 - rod.lower, clickable: interactive }"
                  @mousedown="startDrag($event, index, 'lower', beadIdx - 1)"
                  @click="handleLowerBeadClick(index, beadIdx - 1)"
                >
                  <div class="bead-body"></div>
                  <div class="bead-shine"></div>
                </div>
              </div>
            </div>

            <div class="rod-value">{{ getRodValue(rod) }}</div>
          </div>
        </div>
        <div class="decimal-point" v-if="showDecimal">
          <div class="decimal-dot">.</div>
        </div>
      </div>
    </div>
    
    <div v-if="showValue" class="abacus-value">
      当前值：<span class="value-number" :class="{ negative: isNegative }">{{ displayValue }}</span>
    </div>

    <div v-if="errorMessage" class="error-banner">
      <n-alert type="error" :show-icon="true">
        {{ errorMessage }}
      </n-alert>
    </div>

    <div v-if="errorRods.length > 0 || isSignError" class="error-rods-info">
      <n-alert type="warning" :show-icon="true">
        <template #header>拨珠错误档位</template>
        <div class="error-rods-list">
          <n-tag v-if="isSignError" type="error" class="error-tag">
            符号位错误（应为{{ signErrorExpected ? '负数' : '正数' }}）
          </n-tag>
          <n-tag 
            v-for="rodIdx in errorRods" 
            :key="rodIdx" 
            type="error" 
            class="error-tag"
          >
            第 {{ TOTAL_RODS - rodIdx }} 档
          </n-tag>
        </div>
      </n-alert>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onUnmounted } from 'vue'
import { NAlert, NTag } from 'naive-ui'
import type { BeadState } from '../types/abacus'
import { TOTAL_RODS, getRodValue as getRodValueFn, formatNumber, getAbacusValue } from '../utils/abacus'

const props = withDefaults(defineProps<{
  rods: BeadState[]
  decimalPosition?: number
  isNegative?: boolean
  interactive?: boolean
  highlightedRod?: number | null
  errorRods?: number[]
  isSignError?: boolean
  signErrorExpected?: boolean
  showValue?: boolean
  showDecimal?: boolean
  errorMessage?: string
}>(), {
  decimalPosition: 6,
  isNegative: false,
  interactive: true,
  highlightedRod: null,
  errorRods: () => [],
  isSignError: false,
  signErrorExpected: false,
  showValue: true,
  showDecimal: true,
  errorMessage: ''
})

const emit = defineEmits<{
  (e: 'beadClick', rodIndex: number, type: 'upper' | 'lower', beadIndex: number): void
  (e: 'beadDrag', rodIndex: number, type: 'upper' | 'lower', value: number): void
  (e: 'toggleSign'): void
}>()

const isDragging = ref(false)
const dragRodIndex = ref(0)
const dragType = ref<'upper' | 'lower'>('lower')
const dragStartY = ref(0)
const dragStartValue = ref(0)

const displayValue = computed(() => {
  const state = {
    rods: props.rods,
    decimalPosition: props.decimalPosition,
    isNegative: props.isNegative
  }
  const val = getAbacusValue(state)
  return formatNumber(Math.abs(val))
})

function isDecimalRod(index: number): boolean {
  return index === props.decimalPosition
}

function isErrorRod(index: number): boolean {
  return props.errorRods.includes(index)
}

function getRodValue(rod: BeadState): number {
  return getRodValueFn(rod)
}

function handleUpperBeadClick(rodIndex: number, beadIndex: number) {
  if (!props.interactive) return
  emit('beadClick', rodIndex, 'upper', beadIndex)
}

function handleLowerBeadClick(rodIndex: number, beadIndex: number) {
  if (!props.interactive) return
  emit('beadClick', rodIndex, 'lower', beadIndex)
}

function handleSignClick() {
  if (!props.interactive) return
  emit('toggleSign')
}

function startDrag(event: MouseEvent, rodIndex: number, type: 'upper' | 'lower', _beadIndex: number) {
  if (!props.interactive) return
  event.preventDefault()
  
  isDragging.value = true
  dragRodIndex.value = rodIndex
  dragType.value = type
  dragStartY.value = event.clientY
  
  const rod = props.rods[rodIndex]
  dragStartValue.value = type === 'upper' ? rod.upper : rod.lower
  
  document.addEventListener('mousemove', handleDrag)
  document.addEventListener('mouseup', stopDrag)
}

function handleDrag(event: MouseEvent) {
  if (!isDragging.value) return
  
  const deltaY = event.clientY - dragStartY.value
  const beadHeight = 24
  
  let newValue: number
  if (dragType.value === 'upper') {
    const delta = Math.round(deltaY / beadHeight)
    newValue = Math.max(0, Math.min(1, dragStartValue.value - delta))
  } else {
    const delta = Math.round(deltaY / beadHeight)
    newValue = Math.max(0, Math.min(4, dragStartValue.value - delta))
  }
  
  emit('beadDrag', dragRodIndex.value, dragType.value, newValue)
}

function stopDrag() {
  isDragging.value = false
  document.removeEventListener('mousemove', handleDrag)
  document.removeEventListener('mouseup', stopDrag)
}

onUnmounted(() => {
  document.removeEventListener('mousemove', handleDrag)
  document.removeEventListener('mouseup', stopDrag)
})
</script>

<style scoped>
.abacus-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 20px;
  user-select: none;
}

.abacus-with-sign {
  display: flex;
  align-items: center;
  gap: 12px;
}

.sign-indicator {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 50px;
  height: 200px;
  background: linear-gradient(145deg, #8B4513 0%, #654321 50%, #8B4513 100%);
  border-radius: 10px;
  border: 3px solid #5D3A1A;
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.3);
  transition: all 0.3s ease;
}

.sign-indicator.clickable {
  cursor: pointer;
}

.sign-indicator.clickable:hover {
  transform: scale(1.05);
  box-shadow: 0 5px 20px rgba(0, 0, 0, 0.4);
}

.sign-indicator.negative .sign-text {
  color: #ff4d4f;
  text-shadow: 0 0 10px rgba(255, 77, 79, 0.5);
}

.sign-indicator.error {
  border-color: #ff4d4f;
  box-shadow: 0 0 15px rgba(255, 77, 79, 0.6);
  animation: pulse-error 1s infinite;
}

@keyframes pulse-error {
  0%, 100% { box-shadow: 0 0 15px rgba(255, 77, 79, 0.6); }
  50% { box-shadow: 0 0 25px rgba(255, 77, 79, 0.9); }
}

.sign-text {
  font-size: 36px;
  font-weight: bold;
  color: #52c41a;
  line-height: 1;
  margin-bottom: 4px;
}

.sign-label {
  font-size: 12px;
  color: #DEB887;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.5);
}

.abacus-frame {
  position: relative;
  background: linear-gradient(145deg, #8B4513 0%, #654321 50%, #8B4513 100%);
  border-radius: 12px;
  padding: 20px 15px;
  box-shadow: 
    0 10px 30px rgba(0, 0, 0, 0.4),
    inset 0 2px 4px rgba(255, 255, 255, 0.1),
    inset 0 -2px 4px rgba(0, 0, 0, 0.3);
  border: 4px solid #5D3A1A;
}

.abacus-frame.highlighted {
  box-shadow: 
    0 10px 30px rgba(0, 0, 0, 0.4),
    inset 0 2px 4px rgba(255, 255, 255, 0.1),
    inset 0 -2px 4px rgba(0, 0, 0, 0.3),
    0 0 20px rgba(64, 158, 255, 0.5);
}

.abacus-top-beam {
  height: 12px;
  background: linear-gradient(180deg, #A0522D 0%, #8B4513 100%);
  border-radius: 4px 4px 0 0;
  margin-bottom: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
}

.abacus-rods {
  display: flex;
  gap: 8px;
  padding: 0 10px;
}

.rod-wrapper {
  display: flex;
  flex-direction: column;
  align-items: center;
  position: relative;
  width: 40px;
  transition: all 0.3s ease;
}

.rod-wrapper.highlighted {
  transform: scale(1.05);
}

.rod-wrapper.highlighted .rod-line {
  box-shadow: 0 0 8px rgba(64, 158, 255, 0.8);
}

.rod-wrapper.error {
  animation: shake 0.5s ease-in-out;
}

.rod-wrapper.error .rod-line {
  box-shadow: 0 0 10px rgba(255, 77, 79, 0.9);
  background: linear-gradient(90deg, #ff4d4f 0%, #ff7875 50%, #ff4d4f 100%);
}

.rod-wrapper.error .rod-value {
  color: #ff4d4f;
  font-weight: bold;
}

@keyframes shake {
  0%, 100% { transform: translateX(0); }
  25% { transform: translateX(-3px); }
  75% { transform: translateX(3px); }
}

.rod-wrapper.decimal-mark::after {
  content: '';
  position: absolute;
  bottom: -20px;
  width: 8px;
  height: 8px;
  background: #FFD700;
  border-radius: 50%;
  box-shadow: 0 0 4px rgba(255, 215, 0, 0.8);
}

.rod-label {
  font-size: 11px;
  color: #DEB887;
  margin-bottom: 6px;
  font-weight: bold;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.5);
}

.upper-section,
.lower-section {
  position: relative;
  display: flex;
  justify-content: center;
}

.upper-section {
  height: 60px;
}

.lower-section {
  height: 130px;
}

.rod-line {
  position: absolute;
  width: 4px;
  height: 100%;
  background: linear-gradient(90deg, #B8860B 0%, #DAA520 50%, #B8860B 100%);
  border-radius: 2px;
  z-index: 1;
  box-shadow: 0 0 2px rgba(0, 0, 0, 0.3);
}

.beads-container {
  position: relative;
  z-index: 2;
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 36px;
}

.upper-beads {
  justify-content: flex-start;
  padding-top: 2px;
}

.lower-beads {
  justify-content: flex-end;
  padding-bottom: 2px;
}

.bead {
  width: 34px;
  height: 22px;
  margin: 1px 0;
  position: relative;
  cursor: default;
  transition: transform 0.15s ease-out;
}

.bead.clickable {
  cursor: pointer;
}

.bead-body {
  width: 100%;
  height: 100%;
  background: linear-gradient(145deg, #DC143C 0%, #B22222 50%, #8B0000 100%);
  border-radius: 50% / 40%;
  box-shadow: 
    inset 0 2px 4px rgba(255, 255, 255, 0.3),
    inset 0 -2px 4px rgba(0, 0, 0, 0.3),
    0 2px 4px rgba(0, 0, 0, 0.2);
  border: 1px solid #8B0000;
}

.bead.active .bead-body {
  background: linear-gradient(145deg, #FF6B6B 0%, #DC143C 50%, #B22222 100%);
}

.bead-shine {
  position: absolute;
  top: 3px;
  left: 8px;
  width: 12px;
  height: 4px;
  background: rgba(255, 255, 255, 0.4);
  border-radius: 50%;
  filter: blur(1px);
}

.middle-beam {
  width: 100%;
  height: 10px;
  background: linear-gradient(180deg, #A0522D 0%, #8B4513 100%);
  margin: 4px 0;
  border-radius: 2px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
}

.rod-value {
  font-size: 14px;
  font-weight: bold;
  color: #FFD700;
  margin-top: 8px;
  text-shadow: 0 1px 3px rgba(0, 0, 0, 0.5);
  min-height: 18px;
}

.decimal-point {
  position: absolute;
  bottom: 10px;
  display: flex;
  justify-content: center;
  width: 100%;
}

.decimal-dot {
  font-size: 24px;
  color: #FFD700;
  font-weight: bold;
}

.abacus-value {
  margin-top: 20px;
  font-size: 18px;
  color: #333;
  background: #f5f5f5;
  padding: 10px 20px;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.value-number {
  font-weight: bold;
  color: #2c3e50;
  font-size: 24px;
  margin-left: 8px;
  font-family: 'Courier New', monospace;
}

.value-number.negative {
  color: #ff4d4f;
}

.error-banner {
  margin-top: 16px;
  width: 100%;
  max-width: 500px;
}

.error-rods-info {
  margin-top: 12px;
  width: 100%;
  max-width: 500px;
}

.error-rods-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 8px;
}

.error-tag {
  margin: 0 !important;
}
</style>
