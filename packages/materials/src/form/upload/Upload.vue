<script lang="ts">
import { vUpload } from '@vela/ui'
import { defineMaterial } from '../../utils'

export default defineMaterial(vUpload, {
  name: 'Upload',
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
