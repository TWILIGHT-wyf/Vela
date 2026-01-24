<script lang="ts">
import { vGridBox } from '@vela/ui'
import { defineMaterial } from '../../utils'

export default defineMaterial(vGridBox, {
  name: 'GridBox',
  connectEvent: true,
  fillContainer: true,
})
</script>
