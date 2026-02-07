/**
 * Component Property Type Definitions
 * Shared types for component props to ensure consistency between UI and Materials
 */

/**
 * Table Column Configuration
 */
export interface TableColumn {
  prop: string
  label: string
  width?: number | string
  minWidth?: number | string
  align?: 'left' | 'center' | 'right'
  sortable?: boolean
  fixed?: boolean | 'left' | 'right'
  type?: 'index' | 'selection'
}
