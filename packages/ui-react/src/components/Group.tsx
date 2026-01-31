import React, { forwardRef } from 'react'

export interface GroupProps extends React.HTMLAttributes<HTMLDivElement> {
  gap?: number | string
  direction?: 'horizontal' | 'vertical'
}

export const Group = forwardRef<HTMLDivElement, GroupProps>(
  ({ gap, direction = 'horizontal', style, children, ...props }, ref) => {
    const combinedStyle: React.CSSProperties = {
      display: 'flex',
      flexDirection: direction === 'vertical' ? 'column' : 'row',
      gap: typeof gap === 'number' ? `${gap}px` : gap,
      ...style,
    }

    return (
      <div ref={ref} style={combinedStyle} {...props}>
        {children}
      </div>
    )
  }
)

Group.displayName = 'Group'
