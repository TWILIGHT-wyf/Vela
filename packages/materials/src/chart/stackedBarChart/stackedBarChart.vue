<script lang="ts">
import { stackedBarChart } from '@vela/ui'
import { defineMaterial } from '../../utils'

export default defineMaterial(stackedBarChart, {
  name: 'StackedBarChart',
  connectData: true,
  connectEvent: true,
  fillContainer: true,
})
</script>
