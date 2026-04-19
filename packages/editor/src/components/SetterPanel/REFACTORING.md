# SetterPanel 重构完成报告

## 重构概述

已将旧的 `siderBar` 目录迁移整合到新的 `SetterPanel` 架构中。

## 新架构结构

```
packages/editor/src/components/SetterPanel/
├── composables/              # [新建] 纯逻辑 Hook
│   ├── useAnimation.ts       # 动画预览和选择逻辑
│   ├── useEvents.ts          # 事件配置管理
│   └── useRelations.ts       # 组件关系和树形结构
├── panes/                    # 面板组件
│   ├── AnimationPane.vue     # [新建] 动画配置面板
│   ├── EventPane.vue         # [更新] 事件配置面板（使用新事件系统）
│   ├── PropsPane.vue         # [保持] 属性面板
│   ├── RelationsPane.vue      # [新建] 组件关系和布局配置
│   └── StylePane.vue         # [保持] 样式面板
├── setters/                  # 属性设置器组件
│   ├── BooleanSetter.vue
│   ├── ColorSetter.vue
│   ├── NumberSetter.vue
│   ├── SelectSetter.vue
│   └── StringSetter.vue
└── SetterPanel.vue           # [更新] 主容器，5个 Tab
```

## Tab 结构

新的 SetterPanel 包含 5 个 Tab:

1. **属性** - 组件基础属性配置
2. **样式** - 样式配置（尺寸、定位、外观等）
3. **事件** - 事件配置（点击、悬停、双击等）
4. **动画** - 动画效果配置
5. **联动** - 组件关系、结构树、布局配置

## 核心变更

### 1. 类型系统更新

**@vela/core/types/schema.ts**

```typescript
export interface NodeSchema {
  // ... 现有字段
  animation?: {
    name: string
    class: string
    duration: number
    delay: number
    iterationCount: number | string
    timingFunction: string
    trigger: 'load' | 'hover' | 'click'
  }
}
```

**@vela/core/types/action.ts**

```typescript
export interface BaseAction {
  id: string // 新增
  type: string
  condition?: boolean | JSExpression
  delay?: number
}

export type ActionSchema =
  | OpenUrlAction
  | NavigateAction
  | UpdateStateAction
  | AlertAction // 新增
  | CustomScriptAction // 新增
  | BaseAction
```

### 2. Composables 提取

**useAnimation.ts**

- `useAnimationPreview()` - 动画预览逻辑
- `useAnimationSelection()` - 动画选择和配置
- `animations` - 动画预设列表

**useEvents.ts**

- `useEventConfiguration()` - 事件配置管理
- 支持点击、悬停、双击事件
- 支持多种动作类型（showToast、openUrl、navigate、runScript）

**useRelations.ts**

- `useComponentHierarchy()` - 组件层级关系
- `useTreeOperations()` - 树形结构管理
- `useLayoutConfig()` - 布局配置管理
- `useDialogState()` - 对话框状态管理

### 3. 新增面板组件

**AnimationPane.vue**

- 动画预设网格展示
- 实时预览效果
- 动画参数配置（时长、延迟、重复次数、缓动函数）
- 触发方式选择（load、hover、click）

**RelationsPane.vue**

- 组件结构树可视化
- 拖拽建立父子关系
- 容器布局配置（Free、Flex、Grid）
- 布局参数调整（间距、对齐、列数）

### 4. 更新面板组件

**EventPane.vue**

- 重构为使用新的事件系统
- 支持多种触发器（点击、悬停）
- 支持多种动作类型
- 每个动作类型有对应的参数配置

### 5. SetterPanel 主容器更新

```vue
<el-tabs v-model="activeTab" class="setter-tabs" stretch>
  <el-tab-pane label="属性" name="props">
    <PropsPane />
  </el-tab-pane>
  <el-tab-pane label="样式" name="style">
    <StylePane />
  </el-tab-pane>
  <el-tab-pane label="事件" name="events">
    <EventPane />
  </el-tab-pane>
  <el-tab-pane label="动画" name="animation">
    <AnimationPane />
  </el-tab-pane>
  <el-tab-pane label="联动" name="relations">
    <RelationsPane />
  </el-tab-pane>
</el-tabs>
```

## 保留的旧目录

以下目录暂时保留，后续可清理：

```
packages/editor/src/components/siderBar/
├── suggestion/      # 建议与差异处理逻辑
└── relations/DataBindingPanel.vue  # 数据绑定面板（独立组件）
```

## 使用示例

### 在 Editor.vue 中使用

```typescript
import SetterPanel from '@/components/SetterPanel/SetterPanel.vue'

// 事件系统初始化
import { provideComponentEvents } from '@/components/SetterPanel/composables/useEvents'
provideComponentEvents()
```

### 在组件中使用

```vue
<template>
  <SetterPanel />
</template>
```

## 测试要点

1. **动画面板**
   - 预览功能正常
   - 动画选择生效
   - 参数配置正确同步到 store

2. **事件面板**
   - 添加/删除事件
   - 动作类型切换
   - 参数配置正确

3. **联动面板**
   - 组件树正确显示
   - 拖拽建立父子关系
   - 布局配置生效

4. **数据同步**
   - 所有配置正确同步到 NodeSchema
   - store 更新触发响应式更新
   - 历史记录正常工作

## 后续优化建议

1. **清理旧代码**
   - 删除 siderBar/properties（已迁移到 PropsPane）
   - 删除 siderBar/animation（已迁移到 AnimationPane）
   - 删除 siderBar/relations（已迁移到 RelationsPane）
   - 删除 siderBar/events（已迁移到 EventPane）

2. **功能增强**
   - 添加数据绑定面板到 RelationsPane
   - 支持更多动画预设
   - 支持自定义事件名称
   - 添加条件渲染配置

3. **性能优化**
   - 大型组件树的虚拟滚动
   - 动画预览的节流优化
   - 事件配置的防抖提交

## 兼容性

- ✅ 向后兼容现有 NodeSchema 结构
- ✅ 不影响其他模块
- ✅ 支持旧版事件配置自动迁移
- ✅ AI 功能保持不变（suggestion 目录保留）
