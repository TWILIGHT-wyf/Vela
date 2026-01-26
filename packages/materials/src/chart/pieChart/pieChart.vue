<script lang="ts">
/**
 * PieChart - 饼图组件
 *
 * 使用 defineMaterial HOC 包装，自动处理：
 * - 数据源连接 (connectData)
 * - 事件系统连接 (connectEvent)
 * - Props 响应式更新
 */
import { pieChart } from '@vela/ui'
import { defineMaterial } from '../../utils'

export default defineMaterial(pieChart, {
  name: 'PieChart',
  connectData: true,
  connectEvent: true,
  fillContainer: true,
})
</script>
