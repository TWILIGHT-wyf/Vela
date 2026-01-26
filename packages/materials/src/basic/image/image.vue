<script lang="ts">
import { vImage } from '@vela/ui'
import { defineMaterial } from '../../utils'

export default defineMaterial(vImage, {
  name: 'Image',
  connectEvent: true,
  fillContainer: true,
})
</script>
