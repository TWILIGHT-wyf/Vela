<template>
  <div class="animation-pane">
    <el-scrollbar class="panel-scrollbar">
      <div class="panel-content">
        <div class="preview-stage">
          <div class="stage-content">
            <div class="preview-target" :key="replayKey" :class="previewClass">Preview</div>
          </div>
          <div class="stage-hint">鼠标悬停下方列表预览效果</div>
        </div>

        <div class="section-title">动画预设</div>
        <div class="animation-grid">
          <div
            v-for="a in animations"
            :key="a.name"
            class="anim-card"
            :class="{ active: currentAnimation?.name === a.name }"
            @mouseenter="triggerPreview(a.className)"
            @mouseleave="cancelPreview()"
            @click="selectAnimation(a)"
          >
            <div class="anim-icon">{{ a.label[0] }}</div>
            <div class="anim-info">
              <div class="anim-label">{{ a.label }}</div>
              <div class="anim-desc">{{ a.desc }}</div>
            </div>
            <div v-if="currentAnimation?.name === a.name" class="active-indicator"></div>
          </div>
        </div>

        <div v-if="currentAnimation" class="config-card">
          <div class="card-header">参数配置</div>

          <el-form label-position="top" size="small" class="modern-form">
            <el-form-item label="触发方式">
              <el-select v-model="currentAnimation.trigger" class="modern-select" @change="handleUpdate">
                <el-option label="页面初始化 (Init)" value="init" />
                <el-option label="鼠标悬停时 (Hover)" value="hover" />
                <el-option label="点击时 (Click)" value="click" />
                <el-option label="元素可见时 (Visible)" value="visible" />
              </el-select>
            </el-form-item>

            <div class="form-row">
              <el-form-item label="时长 (s)">
                <el-input-number
                  v-model="currentAnimation.duration"
                  :min="0.1"
                  :max="10"
                  :step="0.1"
                  :controls="false"
                  class="modern-input"
                  @change="handleUpdate"
                />
              </el-form-item>
              <el-form-item label="延迟 (s)">
                <el-input-number
                  v-model="currentAnimation.delay"
                  :min="0"
                  :max="10"
                  :step="0.1"
                  :controls="false"
                  class="modern-input"
                  @change="handleUpdate"
                />
              </el-form-item>
            </div>

            <el-form-item label="重复次数">
              <div class="radio-group-wrapper">
                <el-radio-group
                  v-model="currentAnimation.iterations"
                  size="small"
                  @change="handleUpdate"
                >
                  <el-radio-button :label="1">1次</el-radio-button>
                  <el-radio-button :label="2">2次</el-radio-button>
                  <el-radio-button :label="3">3次</el-radio-button>
                  <el-radio-button label="infinite">循环</el-radio-button>
                </el-radio-group>
              </div>
            </el-form-item>

            <el-form-item label="缓动函数">
              <el-select
                v-model="currentAnimation.easing"
                class="modern-select"
                @change="handleUpdate"
              >
                <el-option label="平滑" value="ease" />
                <el-option label="匀速" value="linear" />
                <el-option label="渐入" value="ease-in" />
                <el-option label="渐出" value="ease-out" />
                <el-option label="弹跳" value="cubic-bezier(0.68, -0.55, 0.27, 1.55)" />
              </el-select>
            </el-form-item>
          </el-form>
        </div>
      </div>
    </el-scrollbar>
  </div>
</template>

<script setup lang="ts">
import { animations, useAnimationPreview, useAnimationSelection } from '../composables/useAnimation'
import { useComponent } from '@/stores/component'

const componentStore = useComponent()
const { triggerPreview, cancelPreview, previewClass, replayKey } = useAnimationPreview()
const { currentAnimation, selectAnimation } = useAnimationSelection()

function handleUpdate() {
  componentStore.syncToProjectStore()
}
</script>

<style scoped>
.animation-pane {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.panel-scrollbar {
  flex: 1;
}

.panel-content {
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.preview-stage {
  background: var(--el-fill-color-light);
  border-radius: 12px;
  padding: 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 120px;
  border: 1px solid var(--el-border-color-light);
}

.stage-content {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
}

.preview-target {
  padding: 10px 24px;
  background: linear-gradient(135deg, #409eff, #67c23a);
  color: white;
  border-radius: 8px;
  font-weight: 600;
  font-size: 14px;
  box-shadow: 0 4px 12px rgba(64, 158, 255, 0.3);
}

.stage-hint {
  margin-top: 16px;
  font-size: 11px;
  color: var(--el-text-color-placeholder);
}

.section-title {
  font-size: 12px;
  font-weight: 600;
  color: var(--el-text-color-secondary);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.animation-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
}

.anim-card {
  position: relative;
  background: white;
  border: 1px solid var(--el-border-color-light);
  border-radius: 8px;
  padding: 10px;
  display: flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
  transition: all 0.2s;
}

.anim-card:hover {
  border-color: var(--el-color-primary);
  background-color: var(--el-color-primary-light-9);
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.05);
}

.anim-card.active {
  border-color: var(--el-color-primary);
  background-color: var(--el-color-primary-light-8);
}

.anim-icon {
  width: 32px;
  height: 32px;
  background-color: var(--el-fill-color-light);
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  color: var(--el-text-color-secondary);
  font-size: 14px;
}

.anim-card.active .anim-icon {
  background-color: white;
  color: var(--el-color-primary);
}

.anim-info {
  flex: 1;
  overflow: hidden;
}

.anim-label {
  font-size: 13px;
  font-weight: 500;
  color: var(--el-text-color-primary);
  margin-bottom: 2px;
}

.anim-desc {
  font-size: 10px;
  color: var(--el-text-color-placeholder);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.active-indicator {
  position: absolute;
  top: 6px;
  right: 6px;
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background-color: var(--el-color-primary);
}

.config-card {
  background: var(--el-fill-color-light);
  border-radius: 12px;
  padding: 16px;
  border: 1px solid var(--el-border-color-light);
}

.card-header {
  font-size: 13px;
  font-weight: 600;
  color: var(--el-text-color-primary);
  margin-bottom: 16px;
  border-bottom: 1px solid var(--el-border-color-lighter);
  padding-bottom: 8px;
}

.modern-form :deep(.el-form-item) {
  margin-bottom: 16px;
}

.modern-form :deep(.el-form-item__label) {
  font-size: 12px;
  color: var(--el-text-color-secondary);
  padding-bottom: 6px;
}

.modern-form :deep(.el-form-item__content) {
  width: 100%;
}

.modern-input :deep(.el-input__wrapper),
.modern-select :deep(.el-input__wrapper) {
  background-color: white;
  box-shadow: none !important;
  border-radius: 8px;
  padding: 4px 11px;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.radio-group-wrapper {
  width: 100%;
}

.radio-group-wrapper :deep(.el-radio-group) {
  width: 100%;
  display: flex;
}

.radio-group-wrapper :deep(.el-radio-button) {
  flex: 1;
}

.radio-group-wrapper :deep(.el-radio-button__inner) {
  width: 100%;
  padding: 8px 0;
  border-radius: 0;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}
.anim-fade {
  animation: fadeIn 0.8s ease both;
}

@keyframes zoomIn {
  0% {
    transform: scale(0.3);
    opacity: 0;
  }
  60% {
    opacity: 1;
  }
  100% {
    transform: scale(1);
  }
}
.anim-zoom {
  animation: zoomIn 0.7s cubic-bezier(0.4, 0, 0.2, 1) both;
}

@keyframes slideLeft {
  0% {
    transform: translateX(40px);
    opacity: 0;
  }
  100% {
    transform: translateX(0);
    opacity: 1;
  }
}
.anim-slide-left {
  animation: slideLeft 0.6s ease-out both;
}

@keyframes slideUp {
  0% {
    transform: translateY(40px);
    opacity: 0;
  }
  100% {
    transform: translateY(0);
    opacity: 1;
  }
}
.anim-slide-up {
  animation: slideUp 0.6s ease-out both;
}

@keyframes bounceIn {
  0% {
    transform: scale(0.5);
    opacity: 0;
  }
  60% {
    transform: scale(1.1);
    opacity: 1;
  }
  80% {
    transform: scale(0.95);
  }
  100% {
    transform: scale(1);
  }
}
.anim-bounce {
  animation: bounceIn 0.7s cubic-bezier(0.68, -0.55, 0.27, 1.55) both;
}

@keyframes rotateIn {
  0% {
    transform: rotate(-180deg);
    opacity: 0;
  }
  100% {
    transform: rotate(0deg);
    opacity: 1;
  }
}
.anim-rotate {
  animation: rotateIn 0.7s ease-out both;
}
</style>
