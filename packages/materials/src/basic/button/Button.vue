<script lang="ts">
import { vButton } from '@vela/ui'
import { defineMaterial } from '../../utils'

export default defineMaterial(vButton, {
  name: 'Button',
  connectEvent: true,
  // Keep button sizing driven by its own root element to avoid editor/runtime
  // box-model drift caused by an extra 100% wrapper layer.
  fillContainer: false,
})
</script>
