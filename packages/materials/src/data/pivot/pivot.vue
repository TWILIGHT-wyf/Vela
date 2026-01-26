<script lang="ts">
import { vPivot } from '@vela/ui'
import { defineMaterial } from '../../utils'

export default defineMaterial(vPivot, {
  name: 'Pivot',
  connectData: true,
  connectEvent: true,
  fillContainer: true,
})
</script>
