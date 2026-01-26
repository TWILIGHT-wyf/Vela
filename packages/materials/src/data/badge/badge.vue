<script lang="ts">
import { vBadge } from '@vela/ui'
import { defineMaterial } from '../../utils'

export default defineMaterial(vBadge, {
  name: 'Badge',
  connectEvent: true,
  fillContainer: true,
})
</script>
