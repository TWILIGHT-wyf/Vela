<script lang="ts">
import { vSelect } from '@vela/ui'
import { defineMaterial } from '../../utils'

/**
 * Select - 下拉选择组件
 *
 * 使用 propsAdapter 将 options 转换为 vSelect 期望的格式
 * 支持自定义 labelField 和 valueField
 */
export default defineMaterial(vSelect, {
  name: 'Select',
  connectEvent: true,
  fillContainer: true,
  propsAdapter: (props) => {
    const { options, labelField, valueField, ...rest } = props as {
      options?: unknown[]
      labelField?: string
      valueField?: string
      [key: string]: unknown
    }
    const nextProps: Record<string, unknown> = { ...rest }

    if (nextProps.modelValue === undefined) {
      if (nextProps.value !== undefined) {
        nextProps.modelValue = nextProps.value
      } else if (nextProps.defaultValue !== undefined) {
        nextProps.modelValue = nextProps.defaultValue
      }
    }

    if (!options) {
      return { ...nextProps, options: [] }
    }

    const labelKey = labelField || 'label'
    const valueKey = valueField || 'value'

    const transformedOptions = options.map((item) => {
      // Handle primitive types (array of strings/numbers)
      if (typeof item !== 'object' || item === null) {
        return { label: String(item), value: item }
      }
      // Handle object types
      const obj = item as Record<string, unknown>
      return {
        label: obj[labelKey],
        value: obj[valueKey],
        disabled: obj.disabled,
      }
    })

    return { ...nextProps, options: transformedOptions }
  },
})
</script>
