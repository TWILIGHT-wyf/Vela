<script lang="ts">
import { vCountUp } from '@vela/ui'
import { defineMaterial } from '../../utils'

export default defineMaterial(vCountUp, {
  name: 'CountUp',
  connectEvent: true,
  fillContainer: true,
})
</script>
