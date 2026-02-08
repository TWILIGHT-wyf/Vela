<script lang="ts">
import { vBox } from '@vela/ui'
import { defineMaterial } from '../../utils'

export default defineMaterial(vBox, {
  name: 'Box',
  connectData: true,
  connectEvent: true,
  fillContainer: true,
})
</script>
