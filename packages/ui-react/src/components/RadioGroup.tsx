import React, { forwardRef, useState } from 'react'

export interface RadioOption {
  label: React.ReactNode
  value: string | number | boolean
  disabled?: boolean
}

export interface RadioGroupProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, 'onChange' | 'defaultValue'> {
  value?: string | number | boolean
  defaultValue?: string | number | boolean
  options?: RadioOption[]
  onChange?: (value: string | number | boolean) => void
  disabled?: boolean
  size?: 'small' | 'default' | 'medium' | 'large'
  direction?: 'horizontal' | 'vertical'
  optionType?: 'default' | 'button'
  gap?: number
}

export const RadioGroup = forwardRef<HTMLDivElement, RadioGroupProps>(
  (
    {
      value: controlledValue,
      defaultValue,
      options = [],
      onChange,
      disabled = false,
      size = 'medium',
      direction = 'horizontal',
      optionType = 'default',
      gap = 12,
      style,
      ...props
    },
    ref,
  ) => {
    const [internalValue, setInternalValue] = useState<string | number | boolean | undefined>(
      defaultValue,
    )
    const value = controlledValue ?? internalValue

    const sizeMap = {
      small: { fontSize: '12px', padding: '4px 8px' },
      default: { fontSize: '14px', padding: '5px 10px' },
      medium: { fontSize: '14px', padding: '6px 12px' },
      large: { fontSize: '16px', padding: '8px 14px' },
    }
    const sizePreset = sizeMap[size]

    const resolvedOptions = options.length
      ? options
      : [
          { label: 'Option A', value: 'a' },
          { label: 'Option B', value: 'b' },
        ]

    const handleChange = (nextValue: string | number | boolean, optionDisabled?: boolean) => {
      if (disabled || optionDisabled) {
        return
      }
      if (controlledValue === undefined) {
        setInternalValue(nextValue)
      }
      onChange?.(nextValue)
    }

    return (
      <div
        ref={ref}
        style={{
          display: 'inline-flex',
          flexDirection: direction === 'vertical' ? 'column' : 'row',
          gap: `${gap}px`,
          ...style,
        }}
        {...props}
      >
        {resolvedOptions.map((option) => {
          const checked = option.value === value
          const optionDisabled = disabled || option.disabled

          if (optionType === 'button') {
            return (
              <button
                key={String(option.value)}
                type="button"
                disabled={optionDisabled}
                onClick={() => handleChange(option.value, option.disabled)}
                style={{
                  border: `1px solid ${checked ? '#1890ff' : '#d9d9d9'}`,
                  backgroundColor: checked ? '#e6f7ff' : '#fff',
                  color: checked ? '#1890ff' : '#333',
                  borderRadius: '4px',
                  cursor: optionDisabled ? 'not-allowed' : 'pointer',
                  opacity: optionDisabled ? 0.6 : 1,
                  padding: sizePreset.padding,
                  fontSize: sizePreset.fontSize,
                }}
              >
                {option.label}
              </button>
            )
          }

          return (
            <label
              key={String(option.value)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                cursor: optionDisabled ? 'not-allowed' : 'pointer',
                opacity: optionDisabled ? 0.6 : 1,
                fontSize: sizePreset.fontSize,
              }}
            >
              <input
                type="radio"
                checked={checked}
                disabled={optionDisabled}
                onChange={() => handleChange(option.value, option.disabled)}
                style={{ margin: 0 }}
              />
              <span>{option.label}</span>
            </label>
          )
        })}
      </div>
    )
  },
)

RadioGroup.displayName = 'RadioGroup'
