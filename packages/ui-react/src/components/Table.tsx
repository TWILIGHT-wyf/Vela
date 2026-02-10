import React, { forwardRef } from 'react'

export interface TableColumnSchema {
  prop: string
  label: React.ReactNode
  width?: number | string
  align?: 'left' | 'center' | 'right'
}

/**
 * React-specific column type (extends canonical schema with render function)
 */
export interface TableColumn<T = unknown> {
  /** @canonical Maps to `prop` from schema */
  key: string
  /** @canonical Maps to `label` from schema */
  title: React.ReactNode
  /** @deprecated Use `key` or canonical `prop` */
  dataIndex?: string
  width?: number | string
  align?: 'left' | 'center' | 'right'
  render?: (value: unknown, record: T, index: number) => React.ReactNode
}

/**
 * Normalize a canonical TableColumnSchema to React's TableColumn format.
 */
function normalizeColumn(col: TableColumnSchema | TableColumn): TableColumn {
  if ('prop' in col && !('key' in col)) {
    // Canonical schema column → React column
    return {
      key: col.prop,
      title: col.label,
      dataIndex: col.prop,
      width: col.width,
      align: col.align,
    }
  }
  // Already React-native column
  return col as TableColumn
}

export interface TableProps<T = unknown>
  extends Omit<React.HTMLAttributes<HTMLTableElement>, 'children'> {
  /** @canonical Schema prop name (array of {prop, label}) */
  columns?: (TableColumnSchema | TableColumn<T>)[]
  /** @canonical Schema prop name */
  data?: T[]
  /** @deprecated Use `data` */
  dataSource?: T[]
  rowKey?: string | ((record: T) => string)
  loading?: boolean
  /** @canonical Schema prop name */
  border?: boolean
  /** @deprecated Use `border` */
  bordered?: boolean
  /** @canonical Schema prop name */
  stripe?: boolean
  /** @deprecated Use `stripe` */
  striped?: boolean
  size?: 'small' | 'default' | 'medium' | 'large'
  emptyText?: React.ReactNode
  maxHeight?: number | string
}

export const Table = forwardRef<HTMLTableElement, TableProps>(
  (
    {
      columns: rawColumns = [],
      data,
      dataSource,
      rowKey = 'id',
      loading = false,
      border,
      bordered = false,
      stripe,
      striped = false,
      size = 'medium',
      emptyText = 'No Data',
      maxHeight,
      style,
      ...props
    },
    ref,
  ) => {
    // Canonical props take priority
    const resolvedData = data ?? dataSource ?? []
    const resolvedBordered = border ?? bordered
    const resolvedStriped = stripe ?? striped
    const columns = rawColumns.map(normalizeColumn)
    const getRowKey = (record: unknown, index: number): string => {
      if (typeof rowKey === 'function') {
        return rowKey(record)
      }
      return (record as Record<string, unknown>)[rowKey]?.toString() ?? index.toString()
    }

    const getValue = (record: unknown, dataIndex?: string): unknown => {
      if (!dataIndex) return undefined
      return (record as Record<string, unknown>)[dataIndex]
    }

    const paddingMap = {
      small: '8px 12px',
      default: '10px 14px',
      medium: '12px 16px',
      large: '16px 20px',
    }

    const cellStyle: React.CSSProperties = {
      padding: paddingMap[size],
      borderBottom: '1px solid #f0f0f0',
      ...(resolvedBordered && { border: '1px solid #f0f0f0' }),
    }

    return (
      <div
        style={{
          position: 'relative',
          ...(maxHeight
            ? {
                maxHeight: typeof maxHeight === 'number' ? `${maxHeight}px` : maxHeight,
                overflowY: 'auto',
              }
            : {}),
          ...style,
        }}
      >
        {loading && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              backgroundColor: 'rgba(255,255,255,0.8)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 1,
            }}
          >
            Loading...
          </div>
        )}
        <table
          ref={ref}
          style={{
            width: '100%',
            borderCollapse: 'collapse',
            backgroundColor: '#fff',
          }}
          {...props}
        >
          <thead>
            <tr>
              {columns.map((col) => (
                <th
                  key={col.key}
                  style={{
                    ...cellStyle,
                    textAlign: col.align ?? 'left',
                    width: col.width,
                    backgroundColor: '#fafafa',
                    fontWeight: 500,
                  }}
                >
                  {col.title}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {resolvedData.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length}
                  style={{ ...cellStyle, textAlign: 'center', color: '#999' }}
                >
                  {emptyText}
                </td>
              </tr>
            ) : (
              resolvedData.map((record, index) => (
                <tr
                  key={getRowKey(record, index)}
                  style={{
                    backgroundColor: resolvedStriped && index % 2 === 1 ? '#fafafa' : undefined,
                  }}
                >
                  {columns.map((col) => {
                    const value = getValue(record, col.dataIndex)
                    return (
                      <td
                        key={col.key}
                        style={{
                          ...cellStyle,
                          textAlign: col.align ?? 'left',
                          width: col.width,
                        }}
                      >
                        {col.render ? col.render(value, record, index) : (value as React.ReactNode)}
                      </td>
                    )
                  })}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    )
  },
)

Table.displayName = 'Table'
