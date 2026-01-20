import { defineConfig } from 'vitepress'

export default defineConfig({
  title: '@twi1i9ht/visual-lib',
  description: '数据可视化组件库 - 图表、KPI、布局、地图等组件',

  // Vercel 部署到根域名用 '/'，GitHub Pages 用 '/visual-lib/'
  base: '/',

  themeConfig: {
    logo: '/logo.svg',

    nav: [
      { text: '指南', link: '/guide/getting-started' },
      { text: '组件', link: '/components/chart/line-chart' },
      { text: 'GitHub', link: 'https://github.com/TWILIGHT-wyf/vela-lowcode-editor' },
    ],

    sidebar: {
      '/guide/': [
        {
          text: '指南',
          items: [
            { text: '快速开始', link: '/guide/getting-started' },
            { text: '安装', link: '/guide/installation' },
            { text: '主题定制', link: '/guide/theming' },
          ],
        },
      ],
      '/components/': [
        {
          text: '图表组件',
          collapsed: false,
          items: [
            { text: 'LineChart 折线图', link: '/components/chart/line-chart' },
            { text: 'BarChart 柱状图', link: '/components/chart/bar-chart' },
            { text: 'PieChart 饼图', link: '/components/chart/pie-chart' },
            { text: 'DoughnutChart 环形图', link: '/components/chart/doughnut-chart' },
            { text: 'RadarChart 雷达图', link: '/components/chart/radar-chart' },
            { text: 'GaugeChart 仪表盘', link: '/components/chart/gauge-chart' },
            { text: 'FunnelChart 漏斗图', link: '/components/chart/funnel-chart' },
            { text: 'ScatterChart 散点图', link: '/components/chart/scatter-chart' },
            { text: 'SankeyChart 桑基图', link: '/components/chart/sankey-chart' },
            { text: 'StackedBarChart 堆叠柱状图', link: '/components/chart/stacked-bar-chart' },
          ],
        },
        {
          text: 'KPI 组件',
          collapsed: false,
          items: [
            { text: 'vText 文本', link: '/components/kpi/text' },
            { text: 'vBox 盒子', link: '/components/kpi/box' },
            { text: 'vStat 统计卡片', link: '/components/kpi/stat' },
            { text: 'vProgress 进度条', link: '/components/kpi/progress' },
            { text: 'vCountUp 数字滚动', link: '/components/kpi/count-up' },
          ],
        },
        {
          text: '布局组件',
          collapsed: false,
          items: [
            { text: 'vFlex 弹性布局', link: '/components/layout/flex' },
            { text: 'vGrid 网格布局', link: '/components/layout/grid' },
            { text: 'vRow 行', link: '/components/layout/row' },
            { text: 'vCol 列', link: '/components/layout/col' },
            { text: 'vPanel 面板', link: '/components/layout/panel' },
            { text: 'vTabs 标签页', link: '/components/layout/tabs' },
            { text: 'vModal 弹窗', link: '/components/layout/modal' },
            { text: 'vBadge 徽章', link: '/components/layout/badge' },
          ],
        },
        {
          text: '地图组件',
          collapsed: false,
          items: [
            { text: 'vMap 地图容器', link: '/components/map/map' },
            { text: 'vMarker 标记点', link: '/components/map/marker' },
            { text: 'vHeatLayer 热力图层', link: '/components/map/heat-layer' },
            { text: 'vClusterLayer 聚合图层', link: '/components/map/cluster-layer' },
            { text: 'vGeoJsonLayer GeoJSON图层', link: '/components/map/geojson-layer' },
            { text: 'vTileLayer 瓦片图层', link: '/components/map/tile-layer' },
            { text: 'vVectorLayer 矢量图层', link: '/components/map/vector-layer' },
            { text: 'vLegend 图例', link: '/components/map/legend' },
            { text: 'vScale 比例尺', link: '/components/map/scale' },
            { text: 'vLayers 图层控制', link: '/components/map/layers' },
          ],
        },
        {
          text: '数据组件',
          collapsed: true,
          items: [
            { text: 'vTable 表格', link: '/components/data/table' },
            { text: 'vList 列表', link: '/components/data/list' },
            { text: 'vTimeline 时间线', link: '/components/data/timeline' },
            { text: 'vCardGrid 卡片网格', link: '/components/data/card-grid' },
            { text: 'vPivot 透视表', link: '/components/data/pivot' },
          ],
        },
        {
          text: '控件组件',
          collapsed: true,
          items: [
            { text: 'vSelect 下拉选择', link: '/components/controls/select' },
            { text: 'vMultiSelect 多选', link: '/components/controls/multi-select' },
            { text: 'vDateRange 日期范围', link: '/components/controls/date-range' },
            { text: 'vSearchBox 搜索框', link: '/components/controls/search-box' },
            { text: 'vSlider 滑块', link: '/components/controls/slider' },
            { text: 'vSwitch 开关', link: '/components/controls/switch' },
            { text: 'vCheckboxGroup 复选框组', link: '/components/controls/checkbox-group' },
            { text: 'vButtonGroup 按钮组', link: '/components/controls/button-group' },
          ],
        },
      ],
    },

    socialLinks: [{ icon: 'github', link: 'https://github.com/TWILIGHT-wyf/vela-lowcode-editor' }],

    footer: {
      message: 'Released under the MIT License.',
      copyright: 'Copyright © 2024-present TWILIGHT-wyf',
    },

    search: {
      provider: 'local',
    },
  },
})
