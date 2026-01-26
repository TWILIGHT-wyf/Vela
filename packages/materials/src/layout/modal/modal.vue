<script lang="ts">
import { vModal } from '@vela/ui'
import { defineMaterial } from '../../utils'

export default defineMaterial(vModal, {
  name: 'Modal',
  connectEvent: true,
  fillContainer: true,
})
</script>
