<script lang="ts">
import { vMultiSelect } from '@vela/ui'
import { defineMaterial } from '../../utils'

export default defineMaterial(vMultiSelect, {
  name: 'MultiSelect',
  connectEvent: true,
  fillContainer: true,
})
</script>
