import type { MaterialMeta } from '@vela/core/types'

const meta: MaterialMeta = {
  name: 'Scripting',
  componentName: 'Scripting',
  title: '脚本',
  version: '1.0.0',
  category: '高级',
  props: {
    code: {
      name: 'code',
      label: 'JavaScript代码',
      setter: 'JsonSetter',
      defaultValue: '',
      group: '代码',
    },
    autoRun: {
      name: 'autoRun',
      label: '自动执行',
      setter: 'BooleanSetter',
      defaultValue: false,
      group: '执行',
    },
  },
  events: ['onExecute', 'onError'],
  defaultSize: {
    width: 100,
    height: 40,
  },
}

export default meta
