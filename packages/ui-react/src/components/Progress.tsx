import React, { forwardRef } from 'react'

export interface ProgressProps extends React.HTMLAttributes<HTMLDivElement> {
  /** @canonical Schema prop name */
  percentage?: number
  /** @deprecated Use `percentage` */
  percent?: number
  /** @canonical Schema prop name */
  barColor?: string
  /** @deprecated Use `barColor` */
  strokeColor?: string
  /** @canonical Schema prop name */
  trackColor?: string
  /** @deprecated Use `trackColor` */
  trailColor?: string
  strokeWidth?: number
  /** @canonical Schema prop name */
  showText?: boolean
  /** @deprecated Use `showText` */
  showInfo?: boolean
  /** @canonical Text format pattern, e.g. '{percentage}%' */
  textFormat?: string
  /** Legacy: custom format function */
  format?: (percent: number) => string
}

export const Progress = forwardRef<HTMLDivElement, ProgressProps>(
  (
    {
      percentage,
      percent,
      barColor,
      strokeColor = '#1890ff',
      trackColor,
      trailColor = '#f5f5f5',
      strokeWidth = 8,
      showText,
      showInfo = true,
      textFormat,
      format,
      style,
      ...props
    },
    ref,
  ) => {
    // Canonical props take priority
    const resolvedPercent = percentage ?? percent ?? 0
    const resolvedBarColor = barColor ?? strokeColor
    const resolvedTrailColor = trackColor ?? trailColor
    const resolvedShowText = showText ?? showInfo
    const normalizedPercent = Math.min(100, Math.max(0, resolvedPercent))

    const formatDisplay = (pct: number): string => {
      if (format) return format(pct)
      if (textFormat) return textFormat.replace('{percentage}', String(pct))
      return `${pct}%`
    }

    return (
      <div ref={ref} style={{ display: 'flex', alignItems: 'center', ...style }} {...props}>
        <div
          style={{
            flex: 1,
            height: `${strokeWidth}px`,
            backgroundColor: resolvedTrailColor,
            borderRadius: `${strokeWidth / 2}px`,
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              width: `${normalizedPercent}%`,
              height: '100%',
              backgroundColor: resolvedBarColor,
              borderRadius: `${strokeWidth / 2}px`,
              transition: 'width 0.3s ease',
            }}
          />
        </div>
        {resolvedShowText && (
          <span style={{ marginLeft: '8px', fontSize: '14px', color: '#666' }}>
            {formatDisplay(normalizedPercent)}
          </span>
        )}
      </div>
    )
  },
)

Progress.displayName = 'Progress'
