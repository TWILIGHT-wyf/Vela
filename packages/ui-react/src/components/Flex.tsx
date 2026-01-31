import React, { forwardRef } from 'react'

export interface FlexProps extends React.HTMLAttributes<HTMLDivElement> {
  direction?: 'row' | 'row-reverse' | 'column' | 'column-reverse'
  justify?: 'start' | 'end' | 'center' | 'space-around' | 'space-between' | 'space-evenly'
  align?: 'start' | 'end' | 'center' | 'baseline' | 'stretch'
  wrap?: 'nowrap' | 'wrap' | 'wrap-reverse'
  gap?: number | string
  vertical?: boolean
}

export const Flex = forwardRef<HTMLDivElement, FlexProps>(
  ({
    direction,
    justify = 'start',
    align = 'stretch',
    wrap = 'nowrap',
    gap,
    vertical = false,
    style,
    children,
    ...props
  }, ref) => {
    const justifyMap: Record<string, string> = {
      start: 'flex-start',
      end: 'flex-end',
      center: 'center',
      'space-around': 'space-around',
      'space-between': 'space-between',
      'space-evenly': 'space-evenly',
    }

    const alignMap: Record<string, string> = {
      start: 'flex-start',
      end: 'flex-end',
      center: 'center',
      baseline: 'baseline',
      stretch: 'stretch',
    }

    const combinedStyle: React.CSSProperties = {
      display: 'flex',
      flexDirection: direction || (vertical ? 'column' : 'row'),
      justifyContent: justifyMap[justify] || justify,
      alignItems: alignMap[align] || align,
      flexWrap: wrap,
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

Flex.displayName = 'Flex'
