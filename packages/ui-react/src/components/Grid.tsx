import React, { forwardRef } from 'react'

export interface GridProps extends React.HTMLAttributes<HTMLDivElement> {
  columns?: number | string
  rows?: number | string
  gap?: number | string
  rowGap?: number | string
  columnGap?: number | string
  autoFlow?: 'row' | 'column' | 'dense' | 'row dense' | 'column dense'
  alignItems?: 'start' | 'end' | 'center' | 'stretch'
  justifyItems?: 'start' | 'end' | 'center' | 'stretch'
}

export const Grid = forwardRef<HTMLDivElement, GridProps>(
  ({
    columns,
    rows,
    gap,
    rowGap,
    columnGap,
    autoFlow,
    alignItems,
    justifyItems,
    style,
    children,
    ...props
  }, ref) => {
    const combinedStyle: React.CSSProperties = {
      display: 'grid',
      gridTemplateColumns: typeof columns === 'number' ? `repeat(${columns}, 1fr)` : columns,
      gridTemplateRows: typeof rows === 'number' ? `repeat(${rows}, 1fr)` : rows,
      gap: typeof gap === 'number' ? `${gap}px` : gap,
      rowGap: typeof rowGap === 'number' ? `${rowGap}px` : rowGap,
      columnGap: typeof columnGap === 'number' ? `${columnGap}px` : columnGap,
      gridAutoFlow: autoFlow,
      alignItems,
      justifyItems,
      ...style,
    }

    return (
      <div ref={ref} style={combinedStyle} {...props}>
        {children}
      </div>
    )
  }
)

Grid.displayName = 'Grid'
