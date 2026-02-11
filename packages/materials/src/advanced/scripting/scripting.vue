<template>
  <BaseScripting v-bind="componentProps" @execute="executeScript" />
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { vScripting as BaseScripting, useDataSource, extractWithFallback } from '@vela/ui'

type DataSourceLike = {
  scriptField?: string
  [key: string]: unknown
}

const props = withDefaults(
  defineProps<{
    code?: string
    script?: string
    scriptCode?: string
    autoRun?: boolean
    title?: string
    showCode?: boolean
    showControls?: boolean
    showPlaceholder?: boolean
    placeholder?: string
    padding?: number
    backgroundColor?: string
    textColor?: string
    fontSize?: number
    lineHeight?: number
    borderRadius?: number
    border?: string
    fontFamily?: string
    dataSource?: DataSourceLike
  }>(),
  {
    code: '',
    script: '',
    scriptCode: '',
    autoRun: false,
    title: '脚本执行器',
    showCode: true,
    showControls: true,
    showPlaceholder: true,
    placeholder: '点击执行按钮运行脚本',
    padding: 16,
    backgroundColor: '#1e1e1e',
    textColor: '#d4d4d4',
    fontSize: 14,
    lineHeight: 1.6,
    borderRadius: 4,
    border: '1px solid #3c3c3c',
    fontFamily: 'Consolas, Monaco, "Courier New", monospace',
  },
)

const emit = defineEmits<{
  execute: [code: string]
  error: [message: string]
}>()

const dataSourceRef = computed(() => props.dataSource)
const { data: dataSourceData } = useDataSource(dataSourceRef)

const resolvedScriptCode = computed(() => {
  if (dataSourceData.value) {
    const scriptField = props.dataSource?.scriptField || 'script'
    return extractWithFallback<string>(dataSourceData.value, scriptField, '')
  }
  return String(
    props.scriptCode ||
      props.script ||
      props.code ||
      '// 请输入 JavaScript 代码\nconsole.log("Hello World");',
  )
})

const output = ref('')
const error = ref('')

function executeScript() {
  output.value = ''
  error.value = ''

  const code = resolvedScriptCode.value
  if (!code.trim()) {
    const message = '脚本内容为空'
    error.value = message
    emit('error', message)
    return
  }

  try {
    const logs: string[] = []
    const sandboxConsole = {
      log: (...args: unknown[]) => logs.push(args.map((arg) => String(arg)).join(' ')),
      error: (...args: unknown[]) =>
        logs.push(`Error: ${args.map((arg) => String(arg)).join(' ')}`),
      warn: (...args: unknown[]) =>
        logs.push(`Warning: ${args.map((arg) => String(arg)).join(' ')}`),
    }

    const fn = new Function('console', code)
    fn(sandboxConsole)
    output.value = logs.join('\n') || '执行成功(无输出)'
    emit('execute', code)
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    error.value = message
    emit('error', message)
  }
}

watch(
  () => [resolvedScriptCode.value, props.autoRun],
  () => {
    if (props.autoRun) {
      executeScript()
    }
  },
  { immediate: true },
)

const componentProps = computed(() => ({
  title: props.title,
  scriptCode: resolvedScriptCode.value,
  output: output.value,
  error: error.value,
  autoRun: props.autoRun,
  showCode: props.showCode,
  showControls: props.showControls,
  showPlaceholder: props.showPlaceholder,
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
