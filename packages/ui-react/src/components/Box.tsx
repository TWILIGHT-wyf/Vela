import React, { forwardRef } from 'react'

export interface BoxProps extends React.HTMLAttributes<HTMLDivElement> {
  padding?: number | string
  margin?: number | string
  background?: string
  borderRadius?: number | string
  border?: string
  shadow?: string
}

export const Box = forwardRef<HTMLDivElement, BoxProps>(
  ({ padding, margin, background, borderRadius, border, shadow, style, children, ...props }, ref) => {
    const combinedStyle: React.CSSProperties = {
      padding: typeof padding === 'number' ? `${padding}px` : padding,
      margin: typeof margin === 'number' ? `${margin}px` : margin,
      background,
      borderRadius: typeof borderRadius === 'number' ? `${borderRadius}px` : borderRadius,
      border,
      boxShadow: shadow,
      ...style,
    }

    return (
      <div ref={ref} style={combinedStyle} {...props}>
        {children}
      </div>
    )
  }
)

Box.displayName = 'Box'
