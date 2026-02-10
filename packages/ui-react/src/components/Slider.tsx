import React, { forwardRef, useState, useRef, useEffect, useCallback } from 'react'

export type SliderMark = React.ReactNode

export interface SliderProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'onChange'> {
  value?: number
  defaultValue?: number
  min?: number
  max?: number
  step?: number
  onChange?: (value: number) => void
  onAfterChange?: (value: number) => void
  disabled?: boolean
  showTooltip?: boolean
  marks?: Record<number, SliderMark>
  trackColor?: string
  railColor?: string
}

export const Slider = forwardRef<HTMLDivElement, SliderProps>(
  (
    {
      value: controlledValue,
      defaultValue = 0,
      min = 0,
      max = 100,
      step = 1,
      onChange,
      onAfterChange,
      disabled = false,
      showTooltip = true,
      marks,
      trackColor = '#1890ff',
      railColor = '#e8e8e8',
      style,
      ...props
    },
    ref,
  ) => {
    const [internalValue, setInternalValue] = useState(defaultValue)
    const [isDragging, setIsDragging] = useState(false)
    const [showTip, setShowTip] = useState(false)
    const railRef = useRef<HTMLDivElement>(null)

    const value = controlledValue ?? internalValue
    const percentage = ((value - min) / (max - min)) * 100

    const updateValue = useCallback(
      (clientX: number) => {
        if (!railRef.current || disabled) return

        const rect = railRef.current.getBoundingClientRect()
        const percent = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width))
        let newValue = min + percent * (max - min)

        // Apply step
        newValue = Math.round(newValue / step) * step
        newValue = Math.max(min, Math.min(max, newValue))

        if (controlledValue === undefined) {
          setInternalValue(newValue)
        }
        onChange?.(newValue)
      },
      [min, max, step, disabled, onChange, controlledValue],
    )

    const handleMouseDown = (e: React.MouseEvent) => {
      if (disabled) return
      setIsDragging(true)
      setShowTip(true)
      updateValue(e.clientX)
    }

    useEffect(() => {
      if (!isDragging) return

      const handleMouseMove = (e: MouseEvent) => {
        updateValue(e.clientX)
      }

      const handleMouseUp = () => {
        setIsDragging(false)
        setShowTip(false)
        onAfterChange?.(value)
      }

      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)

      return () => {
        document.removeEventListener('mousemove', handleMouseMove)
        document.removeEventListener('mouseup', handleMouseUp)
      }
    }, [isDragging, updateValue, onAfterChange, value])

    return (
      <div
        ref={ref}
        style={{
          position: 'relative',
          width: '100%',
          height: '32px',
          display: 'flex',
          alignItems: 'center',
          cursor: disabled ? 'not-allowed' : 'pointer',
          opacity: disabled ? 0.6 : 1,
          ...style,
        }}
        {...props}
      >
        {/* Rail */}
        <div
          ref={railRef}
          onMouseDown={handleMouseDown}
          style={{
            position: 'relative',
            width: '100%',
            height: '4px',
            backgroundColor: railColor,
            borderRadius: '2px',
          }}
        >
          {/* Track */}
          <div
            style={{
              position: 'absolute',
              left: 0,
              top: 0,
              height: '100%',
              width: `${percentage}%`,
              backgroundColor: trackColor,
              borderRadius: '2px',
            }}
          />

          {/* Handle */}
          <div
            onMouseEnter={() => !isDragging && setShowTip(true)}
            onMouseLeave={() => !isDragging && setShowTip(false)}
            style={{
              position: 'absolute',
              left: `${percentage}%`,
              top: '50%',
              transform: 'translate(-50%, -50%)',
              width: '14px',
              height: '14px',
              backgroundColor: '#fff',
              border: `2px solid ${trackColor}`,
              borderRadius: '50%',
              cursor: disabled ? 'not-allowed' : 'grab',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
            }}
          >
            {/* Tooltip */}
            {showTooltip && showTip && (
              <div
                style={{
                  position: 'absolute',
                  bottom: '100%',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  marginBottom: '8px',
                  padding: '4px 8px',
                  backgroundColor: 'rgba(0,0,0,0.75)',
                  color: '#fff',
                  fontSize: '12px',
                  borderRadius: '4px',
                  whiteSpace: 'nowrap',
                }}
              >
                {value}
              </div>
            )}
          </div>

          {/* Marks */}
          {marks &&
            Object.entries(marks).map(([markValue, label]) => {
              const markPercent = ((Number(markValue) - min) / (max - min)) * 100
              return (
                <div
                  key={markValue}
                  style={{
                    position: 'absolute',
                    left: `${markPercent}%`,
                    top: '12px',
                    transform: 'translateX(-50%)',
                    fontSize: '12px',
                    color: '#666',
                  }}
                >
                  {label}
                </div>
              )
            })}
        </div>
      </div>
    )
  },
)

Slider.displayName = 'Slider'
