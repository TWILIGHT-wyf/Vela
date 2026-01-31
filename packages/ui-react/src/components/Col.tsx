import React, { forwardRef } from 'react'

export interface ColProps extends React.HTMLAttributes<HTMLDivElement> {
  span?: number
  offset?: number
  push?: number
  pull?: number
  flex?: string | number
}

export const Col = forwardRef<HTMLDivElement, ColProps>(
  ({ span, offset, push, pull, flex, style, children, ...props }, ref) => {
    const combinedStyle: React.CSSProperties = {
      boxSizing: 'border-box',
      ...(span !== undefined && { width: `${(span / 24) * 100}%` }),
      ...(offset !== undefined && { marginLeft: `${(offset / 24) * 100}%` }),
      ...(push !== undefined && { left: `${(push / 24) * 100}%`, position: 'relative' as const }),
      ...(pull !== undefined && { right: `${(pull / 24) * 100}%`, position: 'relative' as const }),
      ...(flex !== undefined && { flex: typeof flex === 'number' ? `${flex} ${flex} auto` : flex }),
      ...style,
    }

    return (
      <div ref={ref} style={combinedStyle} {...props}>
        {children}
      </div>
    )
  }
)

Col.displayName = 'Col'
