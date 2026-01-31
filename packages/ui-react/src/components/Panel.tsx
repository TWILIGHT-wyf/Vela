import React, { forwardRef } from 'react'

export interface PanelProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'title'> {
  title?: React.ReactNode
  extra?: React.ReactNode
  bordered?: boolean
  hoverable?: boolean
  loading?: boolean
  bodyStyle?: React.CSSProperties
  headerStyle?: React.CSSProperties
}

export const Panel = forwardRef<HTMLDivElement, PanelProps>(
  ({
    title,
    extra,
    bordered = true,
    hoverable = false,
    loading = false,
    bodyStyle,
    headerStyle,
    style,
    children,
    ...props
  }, ref) => {
    const containerStyle: React.CSSProperties = {
      backgroundColor: '#fff',
      borderRadius: '8px',
      border: bordered ? '1px solid #e8e8e8' : undefined,
      transition: 'box-shadow 0.3s',
      ...(hoverable && { cursor: 'pointer' }),
      ...style,
    }

    return (
      <div
        ref={ref}
        style={containerStyle}
        onMouseEnter={(e) => {
          if (hoverable) {
            e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.15)'
          }
        }}
        onMouseLeave={(e) => {
          if (hoverable) {
            e.currentTarget.style.boxShadow = 'none'
          }
        }}
        {...props}
      >
        {(title || extra) && (
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '12px 16px',
              borderBottom: '1px solid #f0f0f0',
              ...headerStyle,
            }}
          >
            <div style={{ fontWeight: 500, fontSize: '16px' }}>{title}</div>
            {extra && <div>{extra}</div>}
          </div>
        )}
        <div style={{ padding: '16px', position: 'relative', ...bodyStyle }}>
          {loading && (
            <div
              style={{
                position: 'absolute',
                inset: 0,
                backgroundColor: 'rgba(255,255,255,0.8)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              Loading...
            </div>
          )}
          {children}
        </div>
      </div>
    )
  }
)

Panel.displayName = 'Panel'
