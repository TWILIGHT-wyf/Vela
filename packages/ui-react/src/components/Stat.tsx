import React, { forwardRef } from 'react'

export interface StatProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: string
  value?: string | number
  prefix?: string
  suffix?: string
  precision?: number
  valueStyle?: React.CSSProperties
  titleStyle?: React.CSSProperties
}

export const Stat = forwardRef<HTMLDivElement, StatProps>(
  ({ title, value, prefix, suffix, precision, valueStyle, titleStyle, style, ...props }, ref) => {
    const formattedValue = typeof value === 'number' && precision !== undefined
      ? value.toFixed(precision)
      : value

    return (
      <div ref={ref} style={{ textAlign: 'center', ...style }} {...props}>
        {title && (
          <div style={{ color: '#666', fontSize: '14px', marginBottom: '8px', ...titleStyle }}>
            {title}
          </div>
        )}
        <div style={{ fontSize: '24px', fontWeight: 600, ...valueStyle }}>
          {prefix}
          {formattedValue}
          {suffix}
        </div>
      </div>
    )
  }
)

Stat.displayName = 'Stat'
