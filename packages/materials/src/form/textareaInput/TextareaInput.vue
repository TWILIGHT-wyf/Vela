<script lang="ts">
import { vTextareaInput } from '@vela/ui'
import { defineMaterial } from '../../utils'

export default defineMaterial(vTextareaInput, {
  name: 'TextareaInput',
  connectEvent: true,
  fillContainer: true,
  propsAdapter: (props) => {
    const nextProps = { ...props }
    if (nextProps.modelValue === undefined && nextProps.defaultValue !== undefined) {
      nextProps.modelValue = nextProps.defaultValue
    }
    return nextProps
  },
})
</script>
