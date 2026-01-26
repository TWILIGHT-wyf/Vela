<script lang="ts">
/**
 * GaugeChart - 仪表盘组件
 *
 * 使用 defineMaterial HOC 包装，自动处理：
 * - 数据源连接 (connectData)
 * - 事件系统连接 (connectEvent)
 * - Props 响应式更新
 */
import { gaugeChart } from '@vela/ui'
import { defineMaterial } from '../../utils'

export default defineMaterial(gaugeChart, {
  name: 'GaugeChart',
  connectData: true,
  connectEvent: true,
  fillContainer: true,
})
</script>
