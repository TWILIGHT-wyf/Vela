<script lang="ts">
import { vCheckbox } from '@vela/ui'
import { defineMaterial } from '../../utils'

export default defineMaterial(vCheckbox, {
  name: 'Checkbox',
  connectEvent: true,
  fillContainer: true,
  propsAdapter: (props) => {
    const nextProps = { ...props }
    if (nextProps.modelValue === undefined) {
      if (nextProps.checked !== undefined) {
        nextProps.modelValue = nextProps.checked
      } else if (nextProps.value !== undefined) {
        nextProps.modelValue = nextProps.value
      } else if (nextProps.defaultValue !== undefined) {
        nextProps.modelValue = nextProps.defaultValue
      }
    }
    return nextProps
  },
})
</script>
