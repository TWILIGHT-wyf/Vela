import { NodeSchema, getNodeComponent } from '../types/schema'
import { MaterialMeta } from '../types/material'

/**
 * 业务逻辑校验器
 */
export class Validator {
  /**
   * 校验节点是否合法
   * @param node 待校验节点
   * @param parent 父节点
   * @param metaMap 物料元数据映射
   */
  static validateNode(
    node: NodeSchema,
    parent: NodeSchema | null,
    metaMap: Record<string, MaterialMeta>,
  ): void {
    const component = getNodeComponent(node)
    const meta = component ? metaMap[component] : undefined

    // 1. 物料存在性校验
    // (可选，因为有时允许未知组件)

    // 2. 容器校验
    if (node.children && node.children.length > 0) {
      if (meta && meta.isContainer === false) {
        throw new Error(
          `Component '${component}' is not a container and cannot have children.`,
        )
      }
    }

    // 3. 父子关系约束 (例如：TabItem 只能放在 Tabs 里)
    // 这需要 MaterialMeta 支持 nesting rules
  }

  /**
   * 校验操作是否合法
   */
  static validateInsert(
    parent: NodeSchema,
    _node: NodeSchema,
    metaMap: Record<string, MaterialMeta>,
  ) {
    const parentComponent = getNodeComponent(parent)
    const parentMeta = parentComponent ? metaMap[parentComponent] : undefined
    if (parentMeta && parentMeta.isContainer === false) {
      throw new Error(`Cannot insert into non-container '${parentComponent}'`)
    }
  }
}
