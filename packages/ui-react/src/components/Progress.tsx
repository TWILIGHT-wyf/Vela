import React, { forwardRef } from 'react'

export interface ProgressProps extends React.HTMLAttributes<HTMLDivElement> {
  percent: number
  strokeColor?: string
  trailColor?: string
  strokeWidth?: number
  showInfo?: boolean
  format?: (percent: number) => string
}

export const Progress = forwardRef<HTMLDivElement, ProgressProps>(
  ({
    percent,
    strokeColor = '#1890ff',
    trailColor = '#f5f5f5',
    strokeWidth = 8,
    showInfo = true,
    format,
    style,
    ...props
  }, ref) => {
    const normalizedPercent = Math.min(100, Math.max(0, percent))

    return (
      <div ref={ref} style={{ display: 'flex', alignItems: 'center', ...style }} {...props}>
        <div
          style={{
            flex: 1,
            height: `${strokeWidth}px`,
            backgroundColor: trailColor,
            borderRadius: `${strokeWidth / 2}px`,
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              width: `${normalizedPercent}%`,
              height: '100%',
              backgroundColor: strokeColor,
              borderRadius: `${strokeWidth / 2}px`,
              transition: 'width 0.3s ease',
            }}
          />
        </div>
        {showInfo && (
          <span style={{ marginLeft: '8px', fontSize: '14px', color: '#666' }}>
            {format ? format(normalizedPercent) : `${normalizedPercent}%`}
          </span>
        )}
      </div>
    )
  }
)

Progress.displayName = 'Progress'
