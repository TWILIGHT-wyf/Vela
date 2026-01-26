<script lang="ts">
import { vProgress } from '@vela/ui'
import { defineMaterial } from '../../utils'

export default defineMaterial(vProgress, {
  name: 'Progress',
  connectEvent: true,
  fillContainer: true,
})
</script>
