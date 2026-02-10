import React, { forwardRef, useMemo, useState } from 'react'

export interface CascaderOption {
  label: React.ReactNode
  value: string | number
  disabled?: boolean
  children?: CascaderOption[]
}

export interface CascaderProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, 'onChange' | 'defaultValue'> {
  value?: Array<string | number>
  defaultValue?: Array<string | number>
  options?: CascaderOption[]
  onChange?: (value: Array<string | number>) => void
  disabled?: boolean
  clearable?: boolean
}

export const Cascader = forwardRef<HTMLDivElement, CascaderProps>(
  (
    {
      value: controlledValue,
      defaultValue = [],
      options = [],
      onChange,
      disabled = false,
      clearable = true,
      style,
      ...props
    },
    ref,
  ) => {
    const [internalValue, setInternalValue] = useState<Array<string | number>>(defaultValue)
    const value = controlledValue ?? internalValue

    const resolvedOptions = useMemo(
      () =>
        options.length
          ? options
          : [
              {
                label: 'Option 1',
                value: '1',
                children: [
                  { label: 'Option 1-1', value: '1-1' },
                  { label: 'Option 1-2', value: '1-2' },
                ],
              },
            ],
      [options],
    )

    const level1Options = resolvedOptions
    const selectedLevel1 = level1Options.find((item) => String(item.value) === String(value[0]))
    const level2Options = selectedLevel1?.children || []

    const updateValue = (next: Array<string | number>) => {
      if (controlledValue === undefined) {
        setInternalValue(next)
      }
      onChange?.(next)
    }

    return (
      <div
        ref={ref}
        style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', ...style }}
        {...props}
      >
        <select
          value={value[0] ?? ''}
          disabled={disabled}
          onChange={(e) => updateValue(e.target.value ? [e.target.value] : [])}
          style={{
            height: '36px',
            border: '1px solid #d9d9d9',
            borderRadius: '4px',
            padding: '0 10px',
            minWidth: '140px',
            backgroundColor: disabled ? '#f5f5f5' : '#fff',
          }}
        >
          <option value="">Level 1</option>
          {level1Options.map((item) => (
            <option key={item.value} value={item.value} disabled={item.disabled}>
              {item.label}
            </option>
          ))}
        </select>
        <select
          value={value[1] ?? ''}
          disabled={disabled || !selectedLevel1}
          onChange={(e) => updateValue(value[0] ? [value[0], e.target.value] : [])}
          style={{
            height: '36px',
            border: '1px solid #d9d9d9',
            borderRadius: '4px',
            padding: '0 10px',
            minWidth: '140px',
            backgroundColor: disabled ? '#f5f5f5' : '#fff',
          }}
        >
          <option value="">Level 2</option>
          {level2Options.map((item) => (
            <option key={item.value} value={item.value} disabled={item.disabled}>
              {item.label}
            </option>
          ))}
        </select>
        {clearable && value.length > 0 && !disabled && (
          <button
            type="button"
            onClick={() => updateValue([])}
            style={{ border: 'none', background: 'transparent', color: '#999', cursor: 'pointer' }}
          >
            Clear
          </button>
        )}
      </div>
    )
  },
)

Cascader.displayName = 'Cascader'
