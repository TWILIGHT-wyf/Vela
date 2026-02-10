import React, { forwardRef, useState } from 'react'

export interface CheckboxOption {
  label: React.ReactNode
  value: string | number
  disabled?: boolean
}

export interface CheckboxGroupProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, 'onChange' | 'defaultValue'> {
  value?: (string | number)[]
  defaultValue?: (string | number)[]
  options: CheckboxOption[]
  onChange?: (value: (string | number)[]) => void
  disabled?: boolean
  direction?: 'horizontal' | 'vertical'
  gap?: number
}

export const CheckboxGroup = forwardRef<HTMLDivElement, CheckboxGroupProps>(
  (
    {
      value: controlledValue,
      defaultValue = [],
      options,
      onChange,
      disabled = false,
      direction = 'horizontal',
      gap = 16,
      style,
      ...props
    },
    ref,
  ) => {
    const [internalValue, setInternalValue] = useState<(string | number)[]>(defaultValue)
    const value = controlledValue ?? internalValue

    const handleChange = (optValue: string | number) => {
      const isChecked = value.includes(optValue)
      const newValue = isChecked ? value.filter((v) => v !== optValue) : [...value, optValue]

      if (controlledValue === undefined) {
        setInternalValue(newValue)
      }
      onChange?.(newValue)
    }

    return (
      <div
        ref={ref}
        style={{
          display: 'flex',
          flexDirection: direction === 'vertical' ? 'column' : 'row',
          flexWrap: 'wrap',
          gap: `${gap}px`,
          ...style,
        }}
        {...props}
      >
        {options.map((opt) => {
          const isChecked = value.includes(opt.value)
          const isDisabled = disabled || opt.disabled

          return (
            <label
              key={opt.value}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                cursor: isDisabled ? 'not-allowed' : 'pointer',
                opacity: isDisabled ? 0.6 : 1,
                fontSize: '14px',
                color: '#333',
              }}
            >
              <span
                onClick={() => !isDisabled && handleChange(opt.value)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '16px',
                  height: '16px',
                  border: `1px solid ${isChecked ? '#1890ff' : '#d9d9d9'}`,
                  borderRadius: '2px',
                  backgroundColor: isChecked ? '#1890ff' : '#fff',
                  transition: 'all 0.2s',
                }}
              >
                {isChecked && (
                  <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                    <path
                      d="M1 4L3.5 6.5L9 1"
                      stroke="white"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                )}
              </span>
              <span>{opt.label}</span>
            </label>
          )
        })}
      </div>
    )
  },
)

CheckboxGroup.displayName = 'CheckboxGroup'
