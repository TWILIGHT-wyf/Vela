import type { MaterialMeta } from '@vela/core/types'

const meta: MaterialMeta = {
  name: 'State',
  title: '状态管理',
  version: '1.0.0',
  category: '高级',
  props: {
    initialState: {
      name: 'initialState',
      label: '初始状态',
      setter: 'JsonSetter',
      defaultValue: {},
      group: '数据',
    },
    persist: {
      name: 'persist',
      label: '持久化',
      setter: 'BooleanSetter',
      defaultValue: false,
      group: '存储',
    },
    storageKey: {
      name: 'storageKey',
      label: '存储键',
      setter: 'StringSetter',
      defaultValue: '',
      group: '存储',
    },
  },
  events: ['onChange'],
  defaultSize: {
    width: 100,
    height: 40,
  },
}

export default meta
