import React, { forwardRef, useState } from 'react'

type AutoSize = boolean | { minRows?: number; maxRows?: number }

export interface TextareaInputProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, 'onChange' | 'defaultValue'> {
  value?: string
  defaultValue?: string
  onChange?: (value: string) => void
  placeholder?: string
  disabled?: boolean
  size?: 'small' | 'default' | 'medium' | 'large'
  rows?: number
  autosize?: AutoSize
  maxlength?: number
  showWordLimit?: boolean
  resize?: 'none' | 'both' | 'horizontal' | 'vertical'
}

export const TextareaInput = forwardRef<HTMLDivElement, TextareaInputProps>(
  (
    {
      value: controlledValue,
      defaultValue = '',
      onChange,
      placeholder = 'Please input',
      disabled = false,
      size = 'medium',
      rows = 4,
      autosize = false,
      maxlength,
      showWordLimit = false,
      resize = 'vertical',
      style,
      ...props
    },
    ref,
  ) => {
    const [internalValue, setInternalValue] = useState(defaultValue)
    const value = controlledValue ?? internalValue

    const sizeMap = {
      small: { fontSize: '12px', padding: '6px 8px' },
      default: { fontSize: '14px', padding: '8px 10px' },
      medium: { fontSize: '14px', padding: '10px 12px' },
      large: { fontSize: '16px', padding: '12px 14px' },
    }

    const sizePreset = sizeMap[size]
    const minRows = typeof autosize === 'object' ? autosize.minRows : undefined
    const maxRows = typeof autosize === 'object' ? autosize.maxRows : undefined
    const effectiveRows = minRows ?? rows

    const handleChange = (nextValue: string) => {
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
          flexDirection: 'column',
          width: '100%',
          gap: '4px',
          ...style,
        }}
        {...props}
      >
        <textarea
          value={value}
          rows={effectiveRows}
          placeholder={placeholder}
          disabled={disabled}
          maxLength={maxlength}
          onChange={(e) => handleChange(e.target.value)}
          style={{
            width: '100%',
            border: '1px solid #d9d9d9',
            borderRadius: '4px',
            fontSize: sizePreset.fontSize,
            padding: sizePreset.padding,
            resize,
            outline: 'none',
            backgroundColor: disabled ? '#f5f5f5' : '#fff',
            opacity: disabled ? 0.6 : 1,
            minHeight: typeof autosize === 'boolean' && autosize ? `${rows * 24}px` : undefined,
            maxHeight: typeof maxRows === 'number' ? `${maxRows * 24}px` : undefined,
            boxSizing: 'border-box',
          }}
        />
        {showWordLimit && typeof maxlength === 'number' && (
          <span style={{ color: '#999', fontSize: '12px', textAlign: 'right' }}>
            {value.length}/{maxlength}
          </span>
        )}
      </div>
    )
  },
)

TextareaInput.displayName = 'TextareaInput'
