import React, { forwardRef } from 'react'

export interface TextProps extends React.HTMLAttributes<HTMLDivElement> {
  /** @canonical Schema prop name */
  content?: string
  /** @deprecated Use `content` — kept for backward compatibility */
  value?: string | number
  fontSize?: number | string
  fontWeight?: number | string
  color?: string
  textAlign?: 'left' | 'center' | 'right' | 'justify'
  letterSpacing?: number | string
  lineHeight?: number | string
}

export const Text = forwardRef<HTMLDivElement, TextProps>(
  (
    {
      content,
      value,
      fontSize,
      fontWeight,
      color,
      textAlign,
      letterSpacing,
      lineHeight,
      style,
      children,
      ...props
    },
    ref,
  ) => {
    // Canonical `content` takes priority over legacy `value`
    const displayText = content ?? (value != null ? String(value) : undefined)

    const combinedStyle: React.CSSProperties = {
      fontSize: typeof fontSize === 'number' ? `${fontSize}px` : fontSize,
      fontWeight,
      color,
      textAlign,
      letterSpacing: typeof letterSpacing === 'number' ? `${letterSpacing}px` : letterSpacing,
      lineHeight: typeof lineHeight === 'number' ? `${lineHeight}px` : lineHeight,
      ...style,
    }

    return (
      <div ref={ref} style={combinedStyle} {...props}>
        {displayText ?? children}
      </div>
    )
  },
)

Text.displayName = 'Text'
