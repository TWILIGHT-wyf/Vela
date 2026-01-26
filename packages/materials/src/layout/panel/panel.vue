<script lang="ts">
import { vPanel } from '@vela/ui'
import { defineMaterial } from '../../utils'

export default defineMaterial(vPanel, {
  name: 'Panel',
  connectEvent: true,
  fillContainer: true,
})
</script>
