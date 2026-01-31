import React, { forwardRef } from 'react'

export interface TextProps extends React.HTMLAttributes<HTMLSpanElement> {
  value?: string | number
  fontSize?: number | string
  fontWeight?: number | string
  color?: string
  textAlign?: 'left' | 'center' | 'right'
}

export const Text = forwardRef<HTMLSpanElement, TextProps>(
  ({ value, fontSize, fontWeight, color, textAlign, style, children, ...props }, ref) => {
    const combinedStyle: React.CSSProperties = {
      fontSize: typeof fontSize === 'number' ? `${fontSize}px` : fontSize,
      fontWeight,
      color,
      textAlign,
      ...style,
    }

    return (
      <span ref={ref} style={combinedStyle} {...props}>
        {value ?? children}
      </span>
    )
  }
)

Text.displayName = 'Text'
