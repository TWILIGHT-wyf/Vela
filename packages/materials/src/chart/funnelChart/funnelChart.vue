<script lang="ts">
import { funnelChart } from '@vela/ui'
import { defineMaterial } from '../../utils'

export default defineMaterial(funnelChart, {
  name: 'FunnelChart',
  connectData: true,
  connectEvent: true,
  fillContainer: true,
})
</script>
