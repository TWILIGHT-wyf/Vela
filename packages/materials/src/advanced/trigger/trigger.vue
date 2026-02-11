<template>
  <BaseTrigger v-bind="componentProps" @trigger="manualTrigger" @clear="clearLogs" />
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { vTrigger as BaseTrigger } from '@vela/ui'

interface TriggerLog {
  time: string
  message: string
  type: 'info' | 'success' | 'warning' | 'error'
}

const props = withDefaults(
  defineProps<{
    enabled?: boolean
    type?: 'click' | 'timer' | 'condition'
    triggerType?: 'manual' | 'interval'
    interval?: number
    condition?: string
    action?: string
    actionData?: string
    title?: string
    showClearButton?: boolean
    placeholder?: string
    padding?: number
    backgroundColor?: string
    textColor?: string
    fontSize?: number
    lineHeight?: number
    borderRadius?: number
    border?: string
    fontFamily?: string
  }>(),
  {
    enabled: true,
    type: 'click',
    triggerType: undefined,
    interval: 5000,
    condition: '',
    action: 'log',
    actionData: '',
    title: '触发器',
    showClearButton: true,
    placeholder: '暂无执行记录',
    padding: 16,
    backgroundColor: '#1a1a1a',
    textColor: '#e0e0e0',
    fontSize: 13,
    lineHeight: 1.5,
    borderRadius: 4,
    border: '1px solid #3c3c3c',
    fontFamily: 'Consolas, Monaco, "Courier New", monospace',
  },
)

const emit = defineEmits<{
  trigger: [log: TriggerLog]
  clear: []
}>()

const logs = ref<TriggerLog[]>([])
let intervalId: number | undefined

const resolvedTriggerType = computed<'manual' | 'interval'>(() => {
  if (props.triggerType) {
    return props.triggerType
  }
  return props.type === 'timer' ? 'interval' : 'manual'
})

function addLog(message: string, type: TriggerLog['type'] = 'info') {
  const log: TriggerLog = {
    time: new Date().toLocaleTimeString(),
    message,
    type,
  }
  logs.value.unshift(log)
  if (logs.value.length > 50) {
    logs.value = logs.value.slice(0, 50)
  }
  emit('trigger', log)
}

function executeTrigger() {
  if (!props.enabled) {
    addLog('触发器已禁用', 'warning')
    return
  }

  switch (props.action) {
    case 'log':
      addLog(`执行日志: ${props.actionData || '触发器已执行'}`, 'info')
      break
    case 'alert':
      addLog('执行弹窗提示', 'success')
      break
    case 'dispatch':
      addLog(`派发事件: ${props.actionData || ''}`, 'success')
      break
    case 'api':
      addLog(`调用 API: ${props.actionData || ''}`, 'info')
      break
    default:
      addLog(`未知动作类型: ${props.action || 'unknown'}`, 'error')
  }
}

function startInterval() {
  if (intervalId) {
    clearInterval(intervalId)
    intervalId = undefined
  }

  const interval = Number(props.interval) || 0
  if (!props.enabled || resolvedTriggerType.value !== 'interval' || interval <= 0) {
    return
  }

  intervalId = window.setInterval(() => {
    executeTrigger()
  }, interval)
  addLog(`启动定时触发 (间隔: ${interval}ms)`, 'info')
}

function manualTrigger() {
  addLog('手动触发执行', 'success')
  executeTrigger()
}

function clearLogs() {
  logs.value = []
  emit('clear')
}

watch(
  () => [props.enabled, props.interval, props.type, props.triggerType],
  () => {
    startInterval()
  },
)

onMounted(() => {
  addLog('触发器已初始化', 'info')
  startInterval()
})

onBeforeUnmount(() => {
  if (intervalId) {
    clearInterval(intervalId)
  }
})

const componentProps = computed(() => ({
  title: props.title,
  enabled: props.enabled,
  triggerType: resolvedTriggerType.value,
  interval: props.interval,
  action: props.action,
  logs: logs.value,
  showClearButton: props.showClearButton,
  placeholder: props.placeholder,
  padding: props.padding,
  backgroundColor: props.backgroundColor,
  textColor: props.textColor,
  fontSize: props.fontSize,
  lineHeight: props.lineHeight,
  borderRadius: props.borderRadius,
  border: props.border,
  fontFamily: props.fontFamily,
}))
</script>
