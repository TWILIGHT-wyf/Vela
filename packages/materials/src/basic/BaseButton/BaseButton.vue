<script lang="ts">
import { vBaseButton } from '@vela/ui'
import { defineMaterial } from '../../utils'

// 直接导出 HOC 组件，避免额外的模板包装导致 slot 上下文丢失
export default defineMaterial(vBaseButton, {
  name: 'BaseButton',
  connectEvent: true,
  fillContainer: false,
})
</script>
