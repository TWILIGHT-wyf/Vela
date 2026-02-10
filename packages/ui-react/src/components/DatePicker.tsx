import React, { forwardRef, useState } from 'react'

export interface DatePickerProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, 'onChange' | 'defaultValue'> {
  value?: string
  defaultValue?: string
  onChange?: (value: string) => void
  disabled?: boolean
  clearable?: boolean
  placeholder?: string
}

export const DatePicker = forwardRef<HTMLDivElement, DatePickerProps>(
  (
    {
      value: controlledValue,
      defaultValue = '',
      onChange,
      disabled = false,
      clearable = true,
      placeholder = 'Please select date',
      style,
      ...props
    },
    ref,
  ) => {
    const [internalValue, setInternalValue] = useState(defaultValue)
    const value = controlledValue ?? internalValue

    const handleChange = (nextValue: string) => {
      if (controlledValue === undefined) {
        setInternalValue(nextValue)
      }
      onChange?.(nextValue)
    }

    return (
      <div
        ref={ref}
        style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', ...style }}
        {...props}
      >
        <input
          type="date"
          value={value}
          disabled={disabled}
          onChange={(e) => handleChange(e.target.value)}
          style={{
            height: '36px',
            border: '1px solid #d9d9d9',
            borderRadius: '4px',
            padding: '0 12px',
            backgroundColor: disabled ? '#f5f5f5' : '#fff',
            opacity: disabled ? 0.6 : 1,
            minWidth: '180px',
          }}
          placeholder={placeholder}
        />
        {clearable && !!value && !disabled && (
          <button
            type="button"
            onClick={() => handleChange('')}
            style={{
              border: 'none',
              background: 'transparent',
              color: '#999',
              cursor: 'pointer',
            }}
          >
            Clear
          </button>
        )}
      </div>
    )
  },
)

DatePicker.displayName = 'DatePicker'
