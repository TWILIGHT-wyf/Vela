<script lang="ts">
import { vTimeline } from '@vela/ui'
import { defineMaterial } from '../../utils'

export default defineMaterial(vTimeline, {
  name: 'Timeline',
  connectEvent: true,
  fillContainer: true,
})
</script>
