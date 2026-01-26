<script lang="ts">
import { scatterChart } from '@vela/ui'
import { defineMaterial } from '../../utils'

export default defineMaterial(scatterChart, {
  name: 'ScatterChart',
  connectData: true,
  connectEvent: true,
  fillContainer: true,
})
</script>
