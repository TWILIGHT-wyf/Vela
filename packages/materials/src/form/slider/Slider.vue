<script lang="ts">
import { vSlider } from '@vela/ui'
import { defineMaterial } from '../../utils'

export default defineMaterial(vSlider, {
  name: 'Slider',
  connectEvent: true,
  fillContainer: true,
})
</script>
