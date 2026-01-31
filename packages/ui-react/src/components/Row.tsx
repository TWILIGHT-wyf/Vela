import React, { forwardRef } from 'react'

export interface RowProps extends React.HTMLAttributes<HTMLDivElement> {
  gutter?: number | [number, number]
  justify?: 'start' | 'end' | 'center' | 'space-around' | 'space-between' | 'space-evenly'
  align?: 'top' | 'middle' | 'bottom' | 'stretch'
  wrap?: boolean
}

const alignMap: Record<string, string> = {
  top: 'flex-start',
  middle: 'center',
  bottom: 'flex-end',
  stretch: 'stretch',
}

export const Row = forwardRef<HTMLDivElement, RowProps>(
  ({ gutter, justify = 'start', align = 'top', wrap = true, style, children, ...props }, ref) => {
    const horizontalGutter = Array.isArray(gutter) ? gutter[0] : gutter ?? 0
    const verticalGutter = Array.isArray(gutter) ? gutter[1] : 0

    const combinedStyle: React.CSSProperties = {
      display: 'flex',
      flexWrap: wrap ? 'wrap' : 'nowrap',
      justifyContent: justify === 'start' ? 'flex-start' : justify === 'end' ? 'flex-end' : justify,
      alignItems: alignMap[align] || align,
      marginLeft: horizontalGutter ? `-${horizontalGutter / 2}px` : undefined,
      marginRight: horizontalGutter ? `-${horizontalGutter / 2}px` : undefined,
      rowGap: verticalGutter ? `${verticalGutter}px` : undefined,
      ...style,
    }

    // Clone children to add gutter styles
    const childrenWithGutter = React.Children.map(children, (child) => {
      if (!React.isValidElement(child)) return child

      return React.cloneElement(child as React.ReactElement<{ style?: React.CSSProperties }>, {
        style: {
          ...child.props.style,
          paddingLeft: horizontalGutter ? `${horizontalGutter / 2}px` : undefined,
          paddingRight: horizontalGutter ? `${horizontalGutter / 2}px` : undefined,
        },
      })
    })

    return (
      <div ref={ref} style={combinedStyle} {...props}>
        {childrenWithGutter}
      </div>
    )
  }
)

Row.displayName = 'Row'
