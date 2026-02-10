import React, { forwardRef, useCallback, useState } from 'react'

export interface NumberInputProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, 'onChange' | 'defaultValue'> {
  value?: number
  defaultValue?: number
  onChange?: (value: number | undefined) => void
  placeholder?: string
  disabled?: boolean
  size?: 'small' | 'default' | 'medium' | 'large'
  min?: number
  max?: number
  step?: number
  precision?: number
  controls?: boolean
}

export const NumberInput = forwardRef<HTMLDivElement, NumberInputProps>(
  (
    {
      value: controlledValue,
      defaultValue,
      onChange,
      placeholder = 'Please input number',
      disabled = false,
      size = 'medium',
      min,
      max,
      step = 1,
      precision,
      controls = true,
      style,
      ...props
    },
    ref,
  ) => {
    const [internalValue, setInternalValue] = useState<number | undefined>(defaultValue)
    const value = controlledValue ?? internalValue

    const sizeMap = {
      small: { height: '28px', fontSize: '12px', padding: '0 8px' },
      default: { height: '32px', fontSize: '14px', padding: '0 10px' },
      medium: { height: '36px', fontSize: '14px', padding: '0 12px' },
      large: { height: '44px', fontSize: '16px', padding: '0 14px' },
    }

    const sizePreset = sizeMap[size]

    const normalizeValue = useCallback(
      (nextValue: number) => {
        let normalized = nextValue

        if (typeof min === 'number') {
          normalized = Math.max(min, normalized)
        }
        if (typeof max === 'number') {
          normalized = Math.min(max, normalized)
        }
        if (typeof precision === 'number' && Number.isFinite(precision)) {
          normalized = Number(normalized.toFixed(precision))
        }

        return normalized
      },
      [min, max, precision],
    )

    const commitValue = useCallback(
      (nextValue: number | undefined) => {
        const normalized = typeof nextValue === 'number' ? normalizeValue(nextValue) : undefined
        if (controlledValue === undefined) {
          setInternalValue(normalized)
        }
        onChange?.(normalized)
      },
      [controlledValue, normalizeValue, onChange],
    )

    const handleTextChange = (nextText: string) => {
      if (!nextText) {
        commitValue(undefined)
        return
      }

      const parsed = Number(nextText)
      if (Number.isNaN(parsed)) {
        return
      }

      commitValue(parsed)
    }

    const handleStep = (direction: -1 | 1) => {
      const base = typeof value === 'number' ? value : 0
      commitValue(base + direction * step)
    }

    return (
      <div
        ref={ref}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          width: '100%',
          ...style,
        }}
        {...props}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            width: '100%',
            height: sizePreset.height,
            border: '1px solid #d9d9d9',
            borderRadius: '4px',
            backgroundColor: disabled ? '#f5f5f5' : '#fff',
            opacity: disabled ? 0.6 : 1,
            overflow: 'hidden',
          }}
        >
          <input
            type="number"
            value={value ?? ''}
            placeholder={placeholder}
            disabled={disabled}
            min={min}
            max={max}
            step={step}
            onChange={(e) => handleTextChange(e.target.value)}
            style={{
              flex: 1,
              height: '100%',
              border: 'none',
              outline: 'none',
              padding: sizePreset.padding,
              fontSize: sizePreset.fontSize,
              backgroundColor: 'transparent',
              minWidth: 0,
            }}
          />
          {controls && (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                height: '100%',
                borderLeft: '1px solid #ececec',
              }}
            >
              <button
                type="button"
                disabled={disabled}
                onClick={() => handleStep(1)}
                style={{
                  width: '26px',
                  flex: 1,
                  border: 'none',
                  background: 'transparent',
                  cursor: disabled ? 'not-allowed' : 'pointer',
                  fontSize: '12px',
                  color: '#666',
                }}
              >
                +
              </button>
              <button
                type="button"
                disabled={disabled}
                onClick={() => handleStep(-1)}
                style={{
                  width: '26px',
                  flex: 1,
                  border: 'none',
                  borderTop: '1px solid #ececec',
                  background: 'transparent',
                  cursor: disabled ? 'not-allowed' : 'pointer',
                  fontSize: '12px',
                  color: '#666',
                }}
              >
                -
              </button>
            </div>
          )}
        </div>
      </div>
    )
  },
)

NumberInput.displayName = 'NumberInput'
