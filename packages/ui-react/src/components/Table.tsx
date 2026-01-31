import React, { forwardRef } from 'react'

export interface TableColumn<T = unknown> {
  key: string
  title: React.ReactNode
  dataIndex?: string
  width?: number | string
  align?: 'left' | 'center' | 'right'
  render?: (value: unknown, record: T, index: number) => React.ReactNode
}

export interface TableProps<T = unknown> extends Omit<React.HTMLAttributes<HTMLTableElement>, 'children'> {
  columns: TableColumn<T>[]
  dataSource: T[]
  rowKey?: string | ((record: T) => string)
  loading?: boolean
  bordered?: boolean
  striped?: boolean
  size?: 'small' | 'medium' | 'large'
  emptyText?: React.ReactNode
}

export const Table = forwardRef<HTMLTableElement, TableProps>(
  ({
    columns,
    dataSource,
    rowKey = 'id',
    loading = false,
    bordered = false,
    striped = false,
    size = 'medium',
    emptyText = 'No Data',
    style,
    ...props
  }, ref) => {
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
      medium: '12px 16px',
      large: '16px 20px',
    }

    const cellStyle: React.CSSProperties = {
      padding: paddingMap[size],
      borderBottom: '1px solid #f0f0f0',
      ...(bordered && { border: '1px solid #f0f0f0' }),
    }

    return (
      <div style={{ position: 'relative', ...style }}>
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
            {dataSource.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length}
                  style={{ ...cellStyle, textAlign: 'center', color: '#999' }}
                >
                  {emptyText}
                </td>
              </tr>
            ) : (
              dataSource.map((record, index) => (
                <tr
                  key={getRowKey(record, index)}
                  style={{
                    backgroundColor: striped && index % 2 === 1 ? '#fafafa' : undefined,
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
                        {col.render
                          ? col.render(value, record, index)
                          : (value as React.ReactNode)}
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
  }
)

Table.displayName = 'Table'
