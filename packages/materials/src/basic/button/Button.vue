<script lang="ts">
import { vButton } from '@vela/ui'
import { defineMaterial } from '../../utils'

export default defineMaterial(vButton, {
  name: 'Button',
  connectEvent: true,
  fillContainer: true,
})
</script>
