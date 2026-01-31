import React, { forwardRef } from 'react'

export interface ListProps<T = unknown> extends Omit<React.HTMLAttributes<HTMLDivElement>, 'children'> {
  dataSource: T[]
  renderItem: (item: T, index: number) => React.ReactNode
  rowKey?: string | ((item: T, index: number) => string)
  loading?: boolean
  bordered?: boolean
  split?: boolean
  size?: 'small' | 'medium' | 'large'
  emptyText?: React.ReactNode
  header?: React.ReactNode
  footer?: React.ReactNode
  grid?: {
    columns?: number
    gutter?: number
  }
}

export const List = forwardRef<HTMLDivElement, ListProps>(
  ({
    dataSource,
    renderItem,
    rowKey = 'id',
    loading = false,
    bordered = false,
    split = true,
    size = 'medium',
    emptyText = 'No Data',
    header,
    footer,
    grid,
    style,
    ...props
  }, ref) => {
    const getRowKey = (item: unknown, index: number): string => {
      if (typeof rowKey === 'function') {
        return rowKey(item, index)
      }
      return (item as Record<string, unknown>)[rowKey]?.toString() ?? index.toString()
    }

    const paddingMap = {
      small: '8px 0',
      medium: '12px 0',
      large: '16px 0',
    }

    const containerStyle: React.CSSProperties = {
      backgroundColor: '#fff',
      borderRadius: bordered ? '8px' : undefined,
      border: bordered ? '1px solid #e8e8e8' : undefined,
      ...style,
    }

    const isGrid = !!grid

    return (
      <div ref={ref} style={containerStyle} {...props}>
        {header && (
          <div
            style={{
              padding: '12px 16px',
              borderBottom: '1px solid #f0f0f0',
              fontWeight: 500,
            }}
          >
            {header}
          </div>
        )}

        <div style={{ position: 'relative' }}>
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

          {dataSource.length === 0 ? (
            <div style={{ padding: '32px', textAlign: 'center', color: '#999' }}>
              {emptyText}
            </div>
          ) : isGrid ? (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: `repeat(${grid.columns ?? 4}, 1fr)`,
                gap: `${grid.gutter ?? 16}px`,
                padding: '16px',
              }}
            >
              {dataSource.map((item, index) => (
                <div key={getRowKey(item, index)}>{renderItem(item, index)}</div>
              ))}
            </div>
          ) : (
            <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
              {dataSource.map((item, index) => (
                <li
                  key={getRowKey(item, index)}
                  style={{
                    padding: paddingMap[size],
                    paddingLeft: bordered ? '16px' : '0',
                    paddingRight: bordered ? '16px' : '0',
                    borderBottom: split && index < dataSource.length - 1 ? '1px solid #f0f0f0' : undefined,
                  }}
                >
                  {renderItem(item, index)}
                </li>
              ))}
            </ul>
          )}
        </div>

        {footer && (
          <div
            style={{
              padding: '12px 16px',
              borderTop: '1px solid #f0f0f0',
            }}
          >
            {footer}
          </div>
        )}
      </div>
    )
  }
)

List.displayName = 'List'
