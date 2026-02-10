import React, { forwardRef, useState } from 'react'

export interface TextInputProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, 'onChange' | 'defaultValue'> {
  value?: string
  defaultValue?: string
  onChange?: (value: string) => void
  placeholder?: string
  disabled?: boolean
  clearable?: boolean
  type?: 'text' | 'password' | 'email' | 'tel' | 'url'
  size?: 'small' | 'default' | 'medium' | 'large'
  maxlength?: number
  showWordLimit?: boolean
}

export const TextInput = forwardRef<HTMLDivElement, TextInputProps>(
  (
    {
      value: controlledValue,
      defaultValue = '',
      onChange,
      placeholder = 'Please input',
      disabled = false,
      clearable = true,
      type = 'text',
      size = 'medium',
      maxlength,
      showWordLimit = false,
      style,
      ...props
    },
    ref,
  ) => {
    const [internalValue, setInternalValue] = useState(defaultValue)
    const value = controlledValue ?? internalValue

    const sizeMap = {
      small: { height: '28px', fontSize: '12px', padding: '0 8px' },
      default: { height: '32px', fontSize: '14px', padding: '0 10px' },
      medium: { height: '36px', fontSize: '14px', padding: '0 12px' },
      large: { height: '44px', fontSize: '16px', padding: '0 14px' },
    }

    const sizePreset = sizeMap[size]

    const handleChange = (nextValue: string) => {
      if (controlledValue === undefined) {
        setInternalValue(nextValue)
      }
      onChange?.(nextValue)
    }

    const handleClear = () => handleChange('')

    return (
      <div
        ref={ref}
        style={{
          display: 'inline-flex',
          flexDirection: 'column',
          width: '100%',
          gap: '4px',
          ...style,
        }}
        {...props}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            height: sizePreset.height,
            padding: sizePreset.padding,
            border: '1px solid #d9d9d9',
            borderRadius: '4px',
            backgroundColor: disabled ? '#f5f5f5' : '#fff',
            opacity: disabled ? 0.6 : 1,
          }}
        >
          <input
            type={type}
            value={value}
            placeholder={placeholder}
            disabled={disabled}
            maxLength={maxlength}
            onChange={(e) => handleChange(e.target.value)}
            style={{
              flex: 1,
              border: 'none',
              outline: 'none',
              fontSize: sizePreset.fontSize,
              backgroundColor: 'transparent',
              minWidth: 0,
            }}
          />
          {clearable && value && !disabled && (
            <button
              type="button"
              onClick={handleClear}
              style={{
                border: 'none',
                background: 'transparent',
                color: '#999',
                cursor: 'pointer',
                padding: 0,
                marginLeft: '6px',
                fontSize: '12px',
                lineHeight: 1,
              }}
            >
              ×
            </button>
          )}
        </div>
        {showWordLimit && typeof maxlength === 'number' && (
          <span style={{ color: '#999', fontSize: '12px', textAlign: 'right' }}>
            {value.length}/{maxlength}
          </span>
        )}
      </div>
    )
  },
)

TextInput.displayName = 'TextInput'
