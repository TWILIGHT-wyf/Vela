<script lang="ts">
import { barChart } from '@vela/ui'
import { defineMaterial } from '../../utils'

export default defineMaterial(barChart, {
  name: 'BarChart',
  connectData: true,
  connectEvent: true,
  fillContainer: true,
})
</script>
