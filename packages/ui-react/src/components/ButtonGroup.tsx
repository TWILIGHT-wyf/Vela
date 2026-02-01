import React, { forwardRef, useState } from 'react'

export interface ButtonGroupOption {
  label: React.ReactNode
  value: string | number
  disabled?: boolean
  icon?: React.ReactNode
}

export interface ButtonGroupProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'onChange'> {
  value?: string | number
  defaultValue?: string | number
  options: ButtonGroupOption[]
  onChange?: (value: string | number) => void
  disabled?: boolean
  size?: 'small' | 'medium' | 'large'
  type?: 'default' | 'primary' | 'outline'
}

export const ButtonGroup = forwardRef<HTMLDivElement, ButtonGroupProps>(
  ({
    value: controlledValue,
    defaultValue,
    options,
    onChange,
    disabled = false,
    size = 'medium',
    type = 'default',
    style,
    ...props
  }, ref) => {
    const [internalValue, setInternalValue] = useState<string | number | undefined>(defaultValue)
    const value = controlledValue ?? internalValue

    const sizeMap = {
      small: { height: '28px', padding: '0 12px', fontSize: '12px' },
      medium: { height: '36px', padding: '0 16px', fontSize: '14px' },
      large: { height: '44px', padding: '0 20px', fontSize: '16px' },
    }

    const { height, padding, fontSize } = sizeMap[size]

    const handleClick = (optValue: string | number) => {
      if (controlledValue === undefined) {
        setInternalValue(optValue)
      }
      onChange?.(optValue)
    }

    const getButtonStyle = (opt: ButtonGroupOption, index: number): React.CSSProperties => {
      const isSelected = value === opt.value
      const isDisabled = disabled || opt.disabled
      const isFirst = index === 0
      const isLast = index === options.length - 1

      const baseStyle: React.CSSProperties = {
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '6px',
        height,
        padding,
        fontSize,
        border: '1px solid',
        cursor: isDisabled ? 'not-allowed' : 'pointer',
        opacity: isDisabled ? 0.6 : 1,
        transition: 'all 0.2s',
        borderRadius: 0,
        marginLeft: index > 0 ? '-1px' : 0,
      }

      // Border radius
      if (isFirst) {
        baseStyle.borderTopLeftRadius = '4px'
        baseStyle.borderBottomLeftRadius = '4px'
      }
      if (isLast) {
        baseStyle.borderTopRightRadius = '4px'
        baseStyle.borderBottomRightRadius = '4px'
      }

      // Colors based on type and selected state
      if (type === 'primary') {
        if (isSelected) {
          baseStyle.backgroundColor = '#1890ff'
          baseStyle.borderColor = '#1890ff'
          baseStyle.color = '#fff'
        } else {
          baseStyle.backgroundColor = '#fff'
          baseStyle.borderColor = '#d9d9d9'
          baseStyle.color = '#333'
        }
      } else if (type === 'outline') {
        if (isSelected) {
          baseStyle.backgroundColor = '#e6f7ff'
          baseStyle.borderColor = '#1890ff'
          baseStyle.color = '#1890ff'
        } else {
          baseStyle.backgroundColor = '#fff'
          baseStyle.borderColor = '#d9d9d9'
          baseStyle.color = '#333'
        }
      } else {
        if (isSelected) {
          baseStyle.backgroundColor = '#f0f0f0'
          baseStyle.borderColor = '#d9d9d9'
          baseStyle.color = '#333'
        } else {
          baseStyle.backgroundColor = '#fff'
          baseStyle.borderColor = '#d9d9d9'
          baseStyle.color = '#333'
        }
      }

      return baseStyle
    }

    return (
      <div
        ref={ref}
        style={{
          display: 'inline-flex',
          ...style,
        }}
        {...props}
      >
        {options.map((opt, index) => (
          <button
            key={opt.value}
            type="button"
            disabled={disabled || opt.disabled}
            onClick={() => !disabled && !opt.disabled && handleClick(opt.value)}
            style={getButtonStyle(opt, index)}
          >
            {opt.icon}
            <span>{opt.label}</span>
          </button>
        ))}
      </div>
    )
  }
)

ButtonGroup.displayName = 'ButtonGroup'
