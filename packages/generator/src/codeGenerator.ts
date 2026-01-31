/**
 * 统一代码生成入口
 * 支持 Vue3 和 React 双框架代码生成
 */

import type { Component } from './components'
import type { IRComponent } from './types/ir'
import { transformToIRComponent } from './transformer/schema-to-ir'
import { Vue3Generator, generateVue3Code } from './generators/vue3-generator'
import { ReactGenerator, generateReactCode, generateReactFiles } from './generators/react-generator'
import {
  generateReactProject,
  type ReactProject,
  type ReactExportOptions,
  type GeneratedFile as ReactGeneratedFile,
} from './generators/react-project-generator'

// ============================================================
// 类型定义
// ============================================================

export type Framework = 'vue3' | 'react'

export interface GeneratorOptions {
  /** 目标框架 */
  framework: Framework
  /** 是否使用 TypeScript */
  typescript?: boolean
  /** 组件名称 */
  componentName?: string
  /** 是否格式化输出 */
  format?: boolean
}

export interface GeneratedCode {
  /** 主代码文件内容 */
  code: string
  /** 额外文件 (如 CSS) */
  extraFiles?: Record<string, string>
  /** IR 中间表示 (用于调试) */
  ir?: IRComponent
}

export interface ProjectGeneratorOptions extends GeneratorOptions {
  /** 路由模式 (React) */
  router?: 'react-router' | 'tanstack-router'
  /** 状态管理 (React) */
  stateManagement?: 'zustand' | 'jotai' | 'redux' | 'none'
  /** CSS 模块 (React) */
  cssModules?: boolean
  /** ESLint/Prettier 配置 */
  lint?: boolean
}

export interface Page {
  id: string
  name: string
  route?: string
  components: Component[]
}

export interface Project {
  name: string
  description?: string
  pages: Page[]
}

// ============================================================
// 代码生成 API
// ============================================================

/**
 * 生成单个组件/页面的代码
 *
 * @example
 * ```ts
 * // 生成 Vue3 代码
 * const { code } = generateCode(components, { framework: 'vue3' })
 *
 * // 生成 React 代码
 * const { code, extraFiles } = generateCode(components, { framework: 'react' })
 * ```
 */
export function generateCode(
  components: Component[],
  options: GeneratorOptions
): GeneratedCode {
  const { framework, componentName = 'Page', typescript = true } = options

  // 转换为 IR
  const ir = transformToIRComponent(components, componentName)

  // 根据框架生成代码
  switch (framework) {
    case 'vue3': {
      const code = generateVue3Code(ir)
      return { code, ir }
    }

    case 'react': {
      const { tsx, css } = generateReactFiles(ir)
      return {
        code: tsx,
        extraFiles: { [`${componentName}.module.css`]: css },
        ir,
      }
    }

    default:
      throw new Error(`Unsupported framework: ${framework}`)
  }
}

/**
 * 生成完整项目的代码文件列表
 *
 * @example
 * ```ts
 * const files = generateProjectFiles(project, {
 *   framework: 'react',
 *   typescript: true,
 *   router: 'react-router',
 * })
 *
 * for (const file of files) {
 *   console.log(file.path, file.content)
 * }
 * ```
 */
export function generateProjectFiles(
  project: Project,
  options: ProjectGeneratorOptions
): { path: string; content: string }[] {
  const { framework } = options

  switch (framework) {
    case 'vue3': {
      // Vue3 项目使用现有的 projectGenerator
      // 这里导入会在 index.ts 中统一处理
      throw new Error('Vue3 project generation should use generateProjectSourceFiles from projectGenerator')
    }

    case 'react': {
      const reactProject: ReactProject = {
        name: project.name,
        description: project.description,
        pages: project.pages,
      }

      const reactOptions: ReactExportOptions = {
        typescript: options.typescript ?? true,
        cssModules: options.cssModules ?? true,
        router: options.router ?? 'react-router',
        stateManagement: options.stateManagement ?? 'zustand',
      }

      return generateReactProject(reactProject, reactOptions)
    }

    default:
      throw new Error(`Unsupported framework: ${framework}`)
  }
}

// ============================================================
// 高级 API
// ============================================================

/**
 * 获取特定框架的生成器实例
 * 用于需要更多控制的场景
 */
export function getGenerator(framework: Framework) {
  switch (framework) {
    case 'vue3':
      return new Vue3Generator()
    case 'react':
      return new ReactGenerator()
    default:
      throw new Error(`Unsupported framework: ${framework}`)
  }
}

/**
 * 将 Component 数组转换为 IR 中间表示
 * 用于调试或自定义处理
 */
export function toIR(components: Component[], componentName?: string): IRComponent {
  return transformToIRComponent(components, componentName || 'Component')
}

// ============================================================
// 导出类型和子模块
// ============================================================

export type { Component, ActionConfig, DataBinding, DataSourceConfig } from './components'
export type {
  IRNode,
  IRComponent,
  IRProp,
  IRDirective,
  IREvent,
  IRSlot,
  IRScriptContext,
  IRStyleContext,
} from './types/ir'

export { transformToIRComponent, transformNodes, transformNode } from './transformer/schema-to-ir'
export { Vue3Generator, generateVue3Code } from './generators/vue3-generator'
export { ReactGenerator, generateReactCode, generateReactFiles } from './generators/react-generator'
export { generateReactProject } from './generators/react-project-generator'
