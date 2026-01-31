import React, { forwardRef } from 'react'

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  count?: number | string
  dot?: boolean
  color?: string
  offset?: [number, number]
  showZero?: boolean
  overflowCount?: number
}

export const Badge = forwardRef<HTMLSpanElement, BadgeProps>(
  ({
    count,
    dot = false,
    color = '#ff4d4f',
    offset,
    showZero = false,
    overflowCount = 99,
    style,
    children,
    ...props
  }, ref) => {
    const displayCount = typeof count === 'number'
      ? count > overflowCount ? `${overflowCount}+` : count
      : count

    const shouldShow = dot || (count !== undefined && (count !== 0 || showZero))

    return (
      <span
        ref={ref}
        style={{ position: 'relative', display: 'inline-flex', ...style }}
        {...props}
      >
        {children}
        {shouldShow && (
          <span
            style={{
              position: 'absolute',
              top: offset?.[1] ?? 0,
              right: offset?.[0] ?? 0,
              transform: 'translate(50%, -50%)',
              backgroundColor: color,
              color: '#fff',
              fontSize: dot ? 0 : '12px',
              fontWeight: 500,
              minWidth: dot ? '8px' : '20px',
              height: dot ? '8px' : '20px',
              borderRadius: dot ? '50%' : '10px',
              padding: dot ? 0 : '0 6px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 0 0 1px #fff',
            }}
          >
            {!dot && displayCount}
          </span>
        )}
      </span>
    )
  }
)

Badge.displayName = 'Badge'
