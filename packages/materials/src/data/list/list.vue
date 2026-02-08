<script lang="ts">
import { vList } from '@vela/ui'
import { defineMaterial } from '../../utils'

export default defineMaterial(vList, {
  name: 'List',
  connectData: true,
  connectEvent: true,
  fillContainer: true,
})
</script>
