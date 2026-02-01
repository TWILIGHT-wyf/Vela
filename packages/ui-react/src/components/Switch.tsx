import React, { forwardRef, useState } from 'react'

export interface SwitchProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'onChange'> {
  checked?: boolean
  defaultChecked?: boolean
  onChange?: (checked: boolean) => void
  disabled?: boolean
  size?: 'small' | 'medium' | 'large'
  checkedText?: React.ReactNode
  uncheckedText?: React.ReactNode
  activeColor?: string
  inactiveColor?: string
}

export const Switch = forwardRef<HTMLDivElement, SwitchProps>(
  ({
    checked: controlledChecked,
    defaultChecked = false,
    onChange,
    disabled = false,
    size = 'medium',
    checkedText,
    uncheckedText,
    activeColor = '#1890ff',
    inactiveColor = '#d9d9d9',
    style,
    ...props
  }, ref) => {
    const [internalChecked, setInternalChecked] = useState(defaultChecked)
    const isChecked = controlledChecked ?? internalChecked

    const sizeMap = {
      small: { width: 28, height: 16, dotSize: 12 },
      medium: { width: 44, height: 22, dotSize: 18 },
      large: { width: 56, height: 28, dotSize: 24 },
    }

    const { width, height, dotSize } = sizeMap[size]
    const dotOffset = 2
    const translateX = isChecked ? width - dotSize - dotOffset * 2 : 0

    const handleClick = () => {
      if (disabled) return
      const newValue = !isChecked
      if (controlledChecked === undefined) {
        setInternalChecked(newValue)
      }
      onChange?.(newValue)
    }

    return (
      <div
        ref={ref}
        onClick={handleClick}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '8px',
          cursor: disabled ? 'not-allowed' : 'pointer',
          opacity: disabled ? 0.6 : 1,
          ...style,
        }}
        {...props}
      >
        <div
          style={{
            position: 'relative',
            width: `${width}px`,
            height: `${height}px`,
            backgroundColor: isChecked ? activeColor : inactiveColor,
            borderRadius: `${height}px`,
            transition: 'background-color 0.2s',
          }}
        >
          {/* Dot */}
          <div
            style={{
              position: 'absolute',
              top: `${dotOffset}px`,
              left: `${dotOffset}px`,
              width: `${dotSize}px`,
              height: `${dotSize}px`,
              backgroundColor: '#fff',
              borderRadius: '50%',
              transition: 'transform 0.2s',
              transform: `translateX(${translateX}px)`,
              boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
            }}
          />
          {/* Text inside switch */}
          {(checkedText || uncheckedText) && (
            <span
              style={{
                position: 'absolute',
                top: '50%',
                transform: 'translateY(-50%)',
                left: isChecked ? '6px' : undefined,
                right: isChecked ? undefined : '6px',
                fontSize: size === 'small' ? '10px' : '12px',
                color: '#fff',
              }}
            >
              {isChecked ? checkedText : uncheckedText}
            </span>
          )}
        </div>
      </div>
    )
  }
)

Switch.displayName = 'Switch'
