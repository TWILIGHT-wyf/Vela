import React, { forwardRef } from 'react'

type ContainerTag =
  | 'div'
  | 'section'
  | 'article'
  | 'main'
  | 'aside'
  | 'header'
  | 'footer'
  | 'nav'
  | 'form'

export interface ContainerProps extends React.HTMLAttributes<HTMLElement> {
  tag?: ContainerTag
  ariaLabel?: string
  width?: number | string
  height?: number | string
  maxWidth?: number | string
  padding?: number | string
  centered?: boolean
}

export const Container = forwardRef<HTMLElement, ContainerProps>(
  (
    { tag = 'div', ariaLabel, width, height, maxWidth, padding, centered, style, children, ...props },
    ref,
  ) => {
    const combinedStyle: React.CSSProperties = {
      width: typeof width === 'number' ? `${width}px` : width,
      height: typeof height === 'number' ? `${height}px` : height,
      maxWidth: typeof maxWidth === 'number' ? `${maxWidth}px` : maxWidth,
      padding: typeof padding === 'number' ? `${padding}px` : padding,
      margin: centered ? '0 auto' : undefined,
      ...style,
    }

    const Tag = tag as React.ElementType
    return React.createElement(
      Tag,
      {
        ...props,
        ref: ref as React.Ref<HTMLElement>,
        style: combinedStyle,
        'aria-label': ariaLabel || undefined,
      },
      children,
    )
  },
)

Container.displayName = 'Container'
