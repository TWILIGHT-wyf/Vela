/// <reference types="vite/client" />

// Vite ?raw 导入的类型声明
declare module '*?raw' {
  const content: string
  export default content
}

declare module '*.ts?raw' {
  const content: string
  export default content
}
