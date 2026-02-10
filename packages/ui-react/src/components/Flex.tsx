import React, { forwardRef } from 'react'

export interface FlexProps extends React.HTMLAttributes<HTMLDivElement> {
  /** @canonical Schema prop name */
  flexDirection?: 'row' | 'row-reverse' | 'column' | 'column-reverse'
  /** @canonical Schema prop name (flex-start/flex-end values) */
  justifyContent?:
    | 'flex-start'
    | 'center'
    | 'flex-end'
    | 'space-between'
    | 'space-around'
    | 'space-evenly'
  /** @canonical Schema prop name (flex-start/flex-end values) */
  alignItems?: 'flex-start' | 'center' | 'flex-end' | 'stretch' | 'baseline'
  /** @canonical Schema prop name */
  flexWrap?: 'nowrap' | 'wrap' | 'wrap-reverse'
  /** @deprecated Use `flexDirection` */
  direction?: 'row' | 'row-reverse' | 'column' | 'column-reverse'
  /** @deprecated Use `justifyContent` */
  justify?: string
  /** @deprecated Use `alignItems` */
  align?: string
  /** @deprecated Use `flexWrap` */
  wrap?: 'nowrap' | 'wrap' | 'wrap-reverse'
  gap?: number | string
  vertical?: boolean
  padding?: number | string
  backgroundColor?: string
  borderRadius?: number | string
  minHeight?: number | string
}

export const Flex = forwardRef<HTMLDivElement, FlexProps>(
  (
    {
      flexDirection,
      justifyContent,
      alignItems,
      flexWrap,
      direction,
      justify = 'start',
      align = 'stretch',
      wrap = 'nowrap',
      gap,
      vertical = false,
      padding,
      backgroundColor,
      borderRadius,
      minHeight,
      style,
      children,
      ...props
    },
    ref,
  ) => {
    // Map short-form values to CSS values (for legacy props)
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

    // Canonical props take priority over legacy short-form props
    const resolvedDirection = flexDirection ?? direction ?? (vertical ? 'column' : 'row')
    const resolvedJustify = justifyContent ?? justifyMap[justify] ?? justify
    const resolvedAlign = alignItems ?? alignMap[align] ?? align
    const resolvedWrap = flexWrap ?? wrap

    const combinedStyle: React.CSSProperties = {
      display: 'flex',
      flexDirection: resolvedDirection,
      justifyContent: resolvedJustify,
      alignItems: resolvedAlign,
      flexWrap: resolvedWrap,
      gap: typeof gap === 'number' ? `${gap}px` : gap,
      padding: typeof padding === 'number' ? `${padding}px` : padding,
      backgroundColor,
      borderRadius: typeof borderRadius === 'number' ? `${borderRadius}px` : borderRadius,
      minHeight: typeof minHeight === 'number' ? `${minHeight}px` : minHeight,
      ...style,
    }

    return (
      <div ref={ref} style={combinedStyle} {...props}>
        {children}
      </div>
    )
  },
)

Flex.displayName = 'Flex'
