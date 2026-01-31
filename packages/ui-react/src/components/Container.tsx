import React, { forwardRef } from 'react'

export interface ContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  width?: number | string
  height?: number | string
  maxWidth?: number | string
  padding?: number | string
  centered?: boolean
}

export const Container = forwardRef<HTMLDivElement, ContainerProps>(
  ({ width, height, maxWidth, padding, centered, style, children, ...props }, ref) => {
    const combinedStyle: React.CSSProperties = {
      width: typeof width === 'number' ? `${width}px` : width,
      height: typeof height === 'number' ? `${height}px` : height,
      maxWidth: typeof maxWidth === 'number' ? `${maxWidth}px` : maxWidth,
      padding: typeof padding === 'number' ? `${padding}px` : padding,
      margin: centered ? '0 auto' : undefined,
      ...style,
    }

    return (
      <div ref={ref} style={combinedStyle} {...props}>
        {children}
      </div>
    )
  }
)

Container.displayName = 'Container'
