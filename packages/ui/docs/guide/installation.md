# 安装

## 包管理器安装

::: code-group

```bash [pnpm]
pnpm add @twi1i9ht/visual-lib
```

```bash [npm]
npm install @twi1i9ht/visual-lib
```

```bash [yarn]
yarn add @twi1i9ht/visual-lib
```

:::

## Peer Dependencies

`@twi1i9ht/visual-lib` 对以下库有 peer dependency 要求：

| 依赖          | 版本                             | 说明                       |
| ------------- | -------------------------------- | -------------------------- |
| `vue`         | `^3.3.0`                         | 必需                       |
| `echarts`     | `^5.0.0 \|\| ^6.0.0`             | 图表组件需要               |
| `vue-echarts` | `^6.0.0 \|\| ^7.0.0 \|\| ^8.0.0` | 图表组件需要               |
| `leaflet`     | `^1.9.0`                         | 业务项目使用地图能力时可选 |

### 安装图表依赖

如果使用图表组件（lineChart、barChart 等）：

```bash
pnpm add echarts vue-echarts
```

### 安装地图依赖（可选）

如果你的业务项目需要使用 Leaflet 地图能力：

```bash
pnpm add leaflet
```

## 样式引入

### Leaflet 样式

使用 Leaflet 地图能力时，需要在入口文件引入 Leaflet CSS：

```ts
// main.ts
import 'leaflet/dist/leaflet.css'
```

## TypeScript 支持

组件库提供完整的 TypeScript 类型定义，无需额外安装 `@types` 包。

```ts
import type { TableColumn } from '@twi1i9ht/visual-lib'
```

## CDN 使用

::: warning 注意
CDN 方式暂不推荐，建议使用包管理器安装以获得完整的类型支持和 Tree-shaking。
:::

```html
<script src="https://unpkg.com/vue@3"></script>
<script src="https://unpkg.com/echarts@5"></script>
<script src="https://unpkg.com/vue-echarts@6"></script>
<script src="https://unpkg.com/@twi1i9ht/visual-lib"></script>
```

## 版本兼容性

| visual-lib 版本 | Vue 版本 | Node.js 版本 |
| --------------- | -------- | ------------ |
| 1.x             | 3.3+     | 18+          |

## 常见问题

### 图表不显示？

确保已安装 `echarts` 和 `vue-echarts`，并且组件容器有明确的宽高。

### 地图空白？

该组件库当前不内置地图组件。如业务中使用 Leaflet，请检查：

1. 已引入 `leaflet/dist/leaflet.css`
2. 地图容器有明确的宽高
3. 瓦片图层 URL 可访问
