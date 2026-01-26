<script lang="ts">
import { vStat } from '@vela/ui'
import { defineMaterial } from '../../utils'

export default defineMaterial(vStat, {
  name: 'Stat',
  connectEvent: true,
  fillContainer: true,
})
</script>
