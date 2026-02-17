import axios, { AxiosError } from 'axios'
import { ElMessage } from 'element-plus'

const http = axios.create({
  baseURL: import.meta.env.VITE_API_BASE || '/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// 请求拦截器
http.interceptors.request.use(
  (config) => {
    // 注入 token（如有）
    const token = localStorage.getItem('vela_token')
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    console.error('[HTTP] Request interceptor error:', error)
    return Promise.reject(error)
  },
)

// 响应拦截器
http.interceptors.response.use(
  (response) => response,
  (error: AxiosError<{ message?: string }>) => {
    if (error.code === 'ECONNABORTED') {
      ElMessage.error('请求超时，请检查网络连接')
    } else if (!error.response) {
      ElMessage.error('网络连接失败，请检查服务器是否启动')
    } else {
      const status = error.response.status
      const serverMsg = error.response.data?.message

      switch (status) {
        case 400:
          ElMessage.error(serverMsg || '请求参数错误')
          break
        case 401:
          ElMessage.error('认证已过期，请重新登录')
          break
        case 403:
          ElMessage.error('没有权限执行此操作')
          break
        case 404:
          // 404 不弹 toast，由业务层处理
          break
        case 500:
          ElMessage.error(serverMsg || '服务器内部错误')
          break
        default:
          ElMessage.error(serverMsg || `请求失败 (${status})`)
      }
    }

    return Promise.reject(error)
  },
)

export default http
