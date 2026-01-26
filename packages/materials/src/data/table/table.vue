<script lang="ts">
import { vTable } from '@vela/ui'
import { defineMaterial } from '../../utils'

export default defineMaterial(vTable, {
  name: 'Table',
  connectData: true,
  connectEvent: true,
  fillContainer: true,
})
</script>
