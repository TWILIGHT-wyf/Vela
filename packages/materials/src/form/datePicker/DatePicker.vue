<script lang="ts">
import { vDatePicker } from '@vela/ui'
import { defineMaterial } from '../../utils'

export default defineMaterial(vDatePicker, {
  name: 'DatePicker',
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
