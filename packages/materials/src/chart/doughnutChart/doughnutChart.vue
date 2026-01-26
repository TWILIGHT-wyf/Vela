<script lang="ts">
import { doughnutChart } from '@vela/ui'
import { defineMaterial } from '../../utils'

export default defineMaterial(doughnutChart, {
  name: 'DoughnutChart',
  connectData: true,
  connectEvent: true,
  fillContainer: true,
})
</script>
