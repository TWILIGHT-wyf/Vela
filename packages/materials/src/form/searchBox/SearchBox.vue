<script lang="ts">
import { vSearchBox } from '@vela/ui'
import { defineMaterial } from '../../utils'

export default defineMaterial(vSearchBox, {
  name: 'SearchBox',
  connectEvent: true,
  fillContainer: true,
})
</script>
