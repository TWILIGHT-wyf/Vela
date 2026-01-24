<script lang="ts">
import { vKpiCard } from '@vela/ui'
import { defineMaterial } from '../../utils'

export default defineMaterial(vKpiCard, {
  name: 'KpiCard',
  connectData: true,
  connectEvent: true,
  fillContainer: true,
})
</script>
