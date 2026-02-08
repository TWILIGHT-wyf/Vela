import type { MaterialMeta } from '@vela/core/types'

const meta: MaterialMeta = {
  name: 'Trigger',
  title: '触发器',
  version: '1.0.0',
  category: '高级',
  props: {
    type: {
      name: 'type',
      label: '触发类型',
      setter: 'SelectSetter',
      setterProps: {
        options: [
          { label: '点击', value: 'click' },
          { label: '定时', value: 'timer' },
          { label: '条件', value: 'condition' },
        ],
      },
      defaultValue: 'click',
      group: '基础',
    },
    interval: {
      name: 'interval',
      label: '间隔(毫秒)',
      setter: 'NumberSetter',
      defaultValue: 1000,
      group: '定时',
    },
    condition: {
      name: 'condition',
      label: '条件表达式',
      setter: 'StringSetter',
      defaultValue: '',
      group: '条件',
    },
  },
  events: ['onTrigger'],
  defaultSize: {
    width: 100,
    height: 40,
  },
}

export default meta
