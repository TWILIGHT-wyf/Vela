<script lang="ts">
import { radarChart } from '@vela/ui'
import { defineMaterial } from '../../utils'

export default defineMaterial(radarChart, {
  name: 'RadarChart',
  connectData: true,
  connectEvent: true,
  fillContainer: true,
})
</script>
