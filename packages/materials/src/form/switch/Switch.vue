<script lang="ts">
import { vSwitch } from '@vela/ui'
import { defineMaterial } from '../../utils'

export default defineMaterial(vSwitch, {
  name: 'Switch',
  connectEvent: true,
  fillContainer: true,
})
</script>
