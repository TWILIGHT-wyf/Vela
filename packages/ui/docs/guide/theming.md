# 主题定制

## 图表主题

图表组件基于 ECharts，支持通过 `option` prop 完全自定义配置。

### 修改颜色

```vue
<script setup>
import { lineChart } from '@twi1i9ht/visual-lib'
</script>

<template>
  <lineChart
    :data="[150, 230, 224, 218, 135, 147, 260]"
    line-color="#ff6b6b"
    :show-area="true"
    :area-opacity="0.3"
  />
</template>
```

### 使用 ECharts option 完全自定义

```vue
<script setup>
import { lineChart } from '@twi1i9ht/visual-lib'

const customOption = {
  color: ['#ff6b6b', '#4ecdc4'],
  grid: {
    left: '10%',
    right: '10%',
  },
  xAxis: {
    type: 'category',
    data: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
  },
  yAxis: {
    type: 'value',
  },
  series: [
    {
      type: 'line',
      data: [120, 200, 150, 80, 70],
      smooth: true,
    },
  ],
}
</script>

<template>
  <lineChart :option="customOption" />
</template>
```

## 地图主题

当前组件库不内置地图组件。若业务项目自行集成 Leaflet，可按 Leaflet 官方方式定制瓦片图层与主题。

## CSS 变量

部分组件支持通过 CSS 变量定制样式：

```css
:root {
  /* KPI 组件 */
  --v-stat-value-color: #333;
  --v-stat-label-color: #666;

  /* 进度条 */
  --v-progress-bg: #e9ecef;
  --v-progress-fill: #5470c6;
}
```
