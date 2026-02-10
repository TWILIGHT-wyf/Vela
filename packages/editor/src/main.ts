import { createApp } from 'vue'
import { createPinia } from 'pinia'
// 导入 Element Plus
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
// 按需导入 Element Plus 样式（配合 unplugin-vue-components 自动导入组件）
import 'element-plus/es/components/message/style/css'
import 'element-plus/es/components/notification/style/css'
import 'element-plus/es/components/message-box/style/css'
import 'element-plus/es/components/loading/style/css'
import App from './App.vue'
import router from './router'
import './styles/animations.css'
import './styles/theme.css'

// 导入物料包
import { componentMap } from '@vela/materials'
import { RESERVED_COMPONENT_NAMES } from '@vela/core/contracts'

const app = createApp(App)

// 注册 Element Plus
app.use(ElementPlus)
app.use(createPinia())
app.use(router)

// Reserved names imported from @vela/core/contracts (RESERVED_COMPONENT_NAMES)
const RESERVED_NAMES = RESERVED_COMPONENT_NAMES

// 异步加载 Element Plus Icons 和注册物料组件
const initializeComponents = async () => {
  // 1. 先加载并注册 Element Plus 图标
  const ElementPlusIconsVue = await import('@element-plus/icons-vue')
  const iconNames = new Set<string>()

  for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
    if (key !== 'default') {
      app.component(key, component as Parameters<typeof app.component>[1])
      iconNames.add(key)
    }
  }

  // 2. 注册物料组件（使用 Lc 前缀避免冲突）
  for (const [name, component] of Object.entries(componentMap)) {
    // 如果是保留名或图标名，加 Lc 前缀
    const needsPrefix = RESERVED_NAMES.has(name) || iconNames.has(name)
    const finalName = needsPrefix ? `Lc${name}` : name

    // 关键修复：先检查是否已注册
    if (!app.component(finalName)) {
      app.component(finalName, component)
      if (needsPrefix) {
        console.log(`[Material] Registered with prefix: "${name}" -> "${finalName}"`)
      }
    }
  }

  console.log('[Main] All components registered successfully')
}

// 初始化组件后再挂载应用
initializeComponents().then(() => {
  app.mount('#app')
})
