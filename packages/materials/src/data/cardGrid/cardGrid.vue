<script lang="ts">
import { vCardGrid } from '@vela/ui'
import { defineMaterial } from '../../utils'

export default defineMaterial(vCardGrid, {
  name: 'CardGrid',
  connectData: true,
  connectEvent: true,
  fillContainer: true,
})
</script>
