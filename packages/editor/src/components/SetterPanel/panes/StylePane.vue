<template>
  <div class="style-pane">
    <el-empty v-if="!node" description="请选择一个组件" :image-size="80">
      <template #image>
        <el-icon :size="64"><Select /></el-icon>
      </template>
    </el-empty>

    <el-form v-else label-position="top" size="default" class="style-form">
      <el-collapse v-model="activeNames" class="style-collapse">
        <!-- 尺寸 -->
        <el-collapse-item title="尺寸" name="size">
          <el-form-item label="宽度">
            <el-input v-model="nodeStyle.width" placeholder="auto / 100px / 50%">
              <template #append>
                <el-select v-model="widthUnit" style="width: 80px">
                  <el-option label="px" value="px" />
                  <el-option label="%" value="%" />
                  <el-option label="auto" value="auto" />
                </el-select>
              </template>
            </el-input>
          </el-form-item>

          <el-form-item label="高度">
            <el-input v-model="nodeStyle.height" placeholder="auto / 100px / 50%">
              <template #append>
                <el-select v-model="heightUnit" style="width: 80px">
                  <el-option label="px" value="px" />
                  <el-option label="%" value="%" />
                  <el-option label="auto" value="auto" />
                </el-select>
              </template>
            </el-input>
          </el-form-item>
        </el-collapse-item>

        <!-- 定位 -->
        <el-collapse-item title="定位" name="position">
          <el-form-item label="定位方式">
            <el-select v-model="nodeStyle.position" clearable>
              <el-option label="相对定位" value="relative" />
              <el-option label="绝对定位" value="absolute" />
              <el-option label="固定定位" value="fixed" />
              <el-option label="静态" value="static" />
            </el-select>
          </el-form-item>

          <template v-if="nodeStyle.position === 'absolute' || nodeStyle.position === 'fixed'">
            <el-form-item label="Left">
              <el-input v-model="nodeStyle.left" placeholder="0px" />
            </el-form-item>
            <el-form-item label="Top">
              <el-input v-model="nodeStyle.top" placeholder="0px" />
            </el-form-item>
          </template>
        </el-collapse-item>

        <!-- 外观 -->
        <el-collapse-item title="外观" name="appearance">
          <el-form-item label="背景色">
            <el-color-picker v-model="nodeStyle.backgroundColor" show-alpha />
          </el-form-item>

          <el-form-item label="文字颜色">
            <el-color-picker v-model="nodeStyle.color" show-alpha />
          </el-form-item>

          <el-form-item label="边框">
            <el-input v-model="nodeStyle.border" placeholder="1px solid #ddd" />
          </el-form-item>

          <el-form-item label="圆角">
            <el-input v-model="nodeStyle.borderRadius" placeholder="4px" />
          </el-form-item>

          <el-form-item label="透明度">
            <el-slider v-model="opacityValue" :min="0" :max="100" @input="updateOpacity" />
          </el-form-item>
        </el-collapse-item>

        <!-- 间距 -->
        <el-collapse-item title="间距" name="spacing">
          <el-form-item label="外边距 (Margin)">
            <el-input v-model="nodeStyle.margin" placeholder="10px 20px" />
          </el-form-item>

          <el-form-item label="内边距 (Padding)">
            <el-input v-model="nodeStyle.padding" placeholder="10px 20px" />
          </el-form-item>
        </el-collapse-item>

        <!-- 字体 -->
        <el-collapse-item title="字体" name="font">
          <el-form-item label="字体大小">
            <el-input v-model="nodeStyle.fontSize" placeholder="14px" />
          </el-form-item>

          <el-form-item label="字体粗细">
            <el-select v-model="nodeStyle.fontWeight" clearable>
              <el-option label="正常" value="normal" />
              <el-option label="粗体" value="bold" />
              <el-option label="100" value="100" />
              <el-option label="400" value="400" />
              <el-option label="600" value="600" />
              <el-option label="900" value="900" />
            </el-select>
          </el-form-item>

          <el-form-item label="文本对齐">
            <el-select v-model="nodeStyle.textAlign" clearable>
              <el-option label="左对齐" value="left" />
              <el-option label="居中" value="center" />
              <el-option label="右对齐" value="right" />
            </el-select>
          </el-form-item>
        </el-collapse-item>
      </el-collapse>
    </el-form>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import type { NodeSchema } from '@vela/core'
import { Select } from '@element-plus/icons-vue'

interface Props {
  node?: NodeSchema | null
}

const props = defineProps<Props>()

const activeNames = ref(['size', 'appearance'])
const widthUnit = ref('px')
const heightUnit = ref('px')
const opacityValue = ref(100)

// 响应式样式对象
const nodeStyle = computed(() => {
  if (!props.node || !props.node.style) {
    return {}
  }
  return props.node.style as Record<string, any>
})

// 监听透明度值
watch(
  () => props.node?.style?.opacity,
  (val) => {
    if (val !== undefined) {
      // Cast to unknown first to avoid TS error about overlapping types
      opacityValue.value = parseFloat(val as unknown as string) * 100
    }
  },
  { immediate: true },
)

const updateOpacity = (val: number | number[]) => {
  const opacity = Array.isArray(val) ? val[0] : val
  if (props.node && props.node.style) {
    props.node.style.opacity = (opacity / 100).toString()
  }
}
</script>

<style scoped>
.style-pane {
  padding: 16px;
}

.style-form {
  width: 100%;
}

.style-collapse {
  border: none;
}

.style-collapse :deep(.el-collapse-item__header) {
  font-weight: 500;
  padding-left: 0;
}

.style-collapse :deep(.el-collapse-item__content) {
  padding-left: 0;
}

.style-form :deep(.el-form-item) {
  margin-bottom: 16px;
}

.style-form :deep(.el-form-item__label) {
  font-size: 13px;
  color: var(--el-text-color-regular);
}
</style>
