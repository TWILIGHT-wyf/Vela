import { createRouter, createWebHistory } from 'vue-router'

// 路由懒加载，优化首屏性能
const Dashboard = () => import('@/views/dashboard.vue')
const Editor = () => import('@/views/editor.vue')
const Preview = () => import('@/views/Preview.vue')

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'Dashboard',
      component: Dashboard,
      meta: { title: '项目工作台' },
    },
    {
      path: '/editor/:id?',
      name: 'Editor',
      component: Editor,
      meta: { title: 'Vela Engine' },
    },
    {
      path: '/preview',
      name: 'Preview',
      component: Preview,
      meta: { title: '预览' },
    },
  ],
})

export default router
