<script lang="ts">
import { vGroup } from '@vela/ui'
import { defineMaterial } from '../../utils'

export default defineMaterial(vGroup, {
  name: 'Group',
  connectEvent: true,
  fillContainer: true,
})
</script>
