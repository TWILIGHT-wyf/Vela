import React, { forwardRef } from 'react'

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  /** @canonical Schema prop name */
  value?: string | number
  /** @deprecated Use `value` */
  count?: number | string
  /** @canonical Schema prop name */
  isDot?: boolean
  /** @deprecated Use `isDot` */
  dot?: boolean
  /** Semantic color type (canonical) */
  type?: 'primary' | 'success' | 'warning' | 'danger' | 'info'
  /** Custom badge color */
  color?: string
  hidden?: boolean
  offset?: [number, number]
  showZero?: boolean
  /** @canonical Schema prop name */
  max?: number
  /** @deprecated Use `max` */
  overflowCount?: number
}

const TYPE_COLOR_MAP: Record<string, string> = {
  primary: '#409eff',
  success: '#67c23a',
  warning: '#e6a23c',
  danger: '#f56c6c',
  info: '#909399',
}

export const Badge = forwardRef<HTMLSpanElement, BadgeProps>(
  (
    {
      value,
      count,
      isDot,
      dot = false,
      type,
      color = '#ff4d4f',
      hidden = false,
      offset,
      showZero = false,
      max,
      overflowCount = 99,
      style,
      children,
      ...props
    },
    ref,
  ) => {
    // Canonical props take priority
    const resolvedCount = value ?? count
    const resolvedDot = isDot ?? dot
    const resolvedMax = max ?? overflowCount
    const resolvedColor = type ? (TYPE_COLOR_MAP[type] ?? color) : color
    const displayCount =
      typeof resolvedCount === 'number'
        ? resolvedCount > resolvedMax
          ? `${resolvedMax}+`
          : resolvedCount
        : resolvedCount

    const shouldShow =
      !hidden && (resolvedDot || (resolvedCount !== undefined && (resolvedCount !== 0 || showZero)))

    return (
      <span ref={ref} style={{ position: 'relative', display: 'inline-flex', ...style }} {...props}>
        {children}
        {shouldShow && (
          <span
            style={{
              position: 'absolute',
              top: offset?.[1] ?? 0,
              right: offset?.[0] ?? 0,
              transform: 'translate(50%, -50%)',
              backgroundColor: resolvedColor,
              color: '#fff',
              fontSize: resolvedDot ? 0 : '12px',
              fontWeight: 500,
              minWidth: resolvedDot ? '8px' : '20px',
              height: resolvedDot ? '8px' : '20px',
              borderRadius: resolvedDot ? '50%' : '10px',
              padding: resolvedDot ? 0 : '0 6px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 0 0 1px #fff',
            }}
          >
            {!resolvedDot && displayCount}
          </span>
        )}
      </span>
    )
  },
)

Badge.displayName = 'Badge'
