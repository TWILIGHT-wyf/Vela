<template>
  <div class="v-stat-card" :style="containerStyle">
    <!-- Header -->
    <div v-if="header?.title" class="v-stat-card__header">
      <span class="v-stat-card__title" :style="titleStyle">{{ header.title }}</span>
      <i
        v-if="header.tooltip"
        class="v-stat-card__tooltip-icon el-icon-info"
        :title="header.tooltip"
        >ℹ️</i
      >
    </div>

    <!-- Content -->
    <div class="v-stat-card__content">
      <div class="v-stat-card__value-wrapper">
        <span v-if="content?.prefix" class="v-stat-card__prefix">{{ content.prefix }}</span>
        <span class="v-stat-card__value" :style="valueStyle">{{ formattedValue }}</span>
        <span v-if="content?.suffix" class="v-stat-card__suffix">{{ content.suffix }}</span>
      </div>
    </div>

    <!-- Footer / Trend -->
    <div v-if="footer?.trend" class="v-stat-card__footer">
      <div class="v-stat-card__trend" :class="`is-${footer.trend.type || 'normal'}`">
        <span v-if="footer.trend.label" class="trend-label">{{ footer.trend.label }}</span>
        <span class="trend-value">{{ footer.trend.value }}</span>
        <span class="trend-icon">
          {{ footer.trend.type === 'up' ? '↑' : footer.trend.type === 'down' ? '↓' : '-' }}
        </span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, type CSSProperties } from 'vue'

export interface StatHeader {
  title?: string
  tooltip?: string
}

export interface StatContent {
  value?: number | string
  prefix?: string
  suffix?: string
  precision?: number // 小数精度
  separator?: boolean // 千分位
}

export interface StatTrend {
  value?: string
  label?: string
  type?: 'up' | 'down' | 'normal'
}

export interface StatFooter {
  trend?: StatTrend
}

export interface StatStyle {
  background?: {
    color?: string
    image?: string
  }
  border?: {
    width?: number
    color?: string
    radius?: number
  }
  padding?: number
  shadow?: string

  // 具体的文字样式
  titleColor?: string
  titleSize?: number
  valueColor?: string
  valueSize?: number
  valueWeight?: number | string
}

const props = withDefaults(
  defineProps<{
    header?: StatHeader
    content?: StatContent
    footer?: StatFooter
    styleConfig?: StatStyle
  }>(),
  {
    header: () => ({}),
    content: () => ({ value: 0 }),
    footer: () => ({}),
    styleConfig: () => ({}),
  },
)

// 格式化数值
const formattedValue = computed(() => {
  let val = props.content.value

  if (typeof val === 'number') {
    // 精度处理
    if (props.content.precision !== undefined) {
      val = val.toFixed(props.content.precision)
    }
    // 千分位
    if (props.content.separator) {
      val = Number(val).toLocaleString()
    }
  }

  return val
})

// 容器样式
const containerStyle = computed<CSSProperties>(() => {
  const { styleConfig } = props
  return {
    backgroundColor: styleConfig.background?.color || '#fff',
    backgroundImage: styleConfig.background?.image
      ? `url(${styleConfig.background.image})`
      : undefined,
    borderWidth:
      styleConfig.border?.width !== undefined ? `${styleConfig.border.width}px` : undefined,
    borderColor: styleConfig.border?.color,
    borderStyle: styleConfig.border?.width ? 'solid' : undefined,
    borderRadius:
      styleConfig.border?.radius !== undefined ? `${styleConfig.border.radius}px` : '4px',
    padding: styleConfig.padding !== undefined ? `${styleConfig.padding}px` : '16px',
    boxShadow: styleConfig.shadow || '0 2px 12px 0 rgba(0,0,0,0.1)',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    height: '100%',
    boxSizing: 'border-box',
  }
})

const titleStyle = computed<CSSProperties>(() => ({
  color: props.styleConfig.titleColor || '#909399',
  fontSize: props.styleConfig.titleSize ? `${props.styleConfig.titleSize}px` : '14px',
}))

const valueStyle = computed<CSSProperties>(() => ({
  color: props.styleConfig.valueColor || '#303133',
  fontSize: props.styleConfig.valueSize ? `${props.styleConfig.valueSize}px` : '24px',
  fontWeight: props.styleConfig.valueWeight || 'bold',
  fontFamily:
    'Helvetica Neue, Helvetica, PingFang SC, Hiragino Sans GB, Microsoft YaHei, Arial, sans-serif',
}))
</script>

<style scoped>
.v-stat-card__header {
  display: flex;
  align-items: center;
  margin-bottom: 8px;
}

.v-stat-card__tooltip-icon {
  margin-left: 4px;
  cursor: help;
  font-size: 12px;
  color: #909399;
}

.v-stat-card__content {
  flex: 1;
  display: flex;
  align-items: center;
}

.v-stat-card__value-wrapper {
  display: flex;
  align-items: baseline;
}

.v-stat-card__prefix,
.v-stat-card__suffix {
  font-size: 14px;
  color: #606266;
  margin: 0 4px;
}

.v-stat-card__footer {
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid #ebeef5;
}

.v-stat-card__trend {
  display: flex;
  align-items: center;
  font-size: 12px;
}

.v-stat-card__trend.is-up {
  color: #f56c6c;
}
.v-stat-card__trend.is-down {
  color: #67c23a;
}
.v-stat-card__trend.is-normal {
  color: #909399;
}

.trend-label {
  margin-right: 8px;
}
.trend-icon {
  margin-left: 4px;
  font-weight: bold;
}
</style>
