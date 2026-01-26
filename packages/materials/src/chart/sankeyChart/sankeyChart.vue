<script lang="ts">
import { sankeyChart } from '@vela/ui'
import { defineMaterial } from '../../utils'

export default defineMaterial(sankeyChart, {
  name: 'SankeyChart',
  connectData: true,
  connectEvent: true,
  fillContainer: true,
})
</script>
