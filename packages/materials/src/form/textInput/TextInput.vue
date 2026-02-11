<script lang="ts">
import { vTextInput } from '@vela/ui'
import { defineMaterial } from '../../utils'

export default defineMaterial(vTextInput, {
  name: 'TextInput',
  connectEvent: true,
  fillContainer: true,
  propsAdapter: (props) => {
    const nextProps = { ...props }
    if (nextProps.modelValue === undefined) {
      if (nextProps.value !== undefined) {
        nextProps.modelValue = nextProps.value
      } else if (nextProps.defaultValue !== undefined) {
        nextProps.modelValue = nextProps.defaultValue
      }
    }
    return nextProps
  },
})
</script>
