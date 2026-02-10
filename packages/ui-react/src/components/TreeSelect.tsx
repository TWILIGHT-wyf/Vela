import React, { forwardRef, useMemo, useState } from 'react'

export interface TreeSelectOption {
  label: React.ReactNode
  value: string | number
  disabled?: boolean
  children?: TreeSelectOption[]
}

export interface TreeSelectProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, 'onChange' | 'defaultValue'> {
  value?: string | number
  defaultValue?: string | number
  options?: TreeSelectOption[]
  onChange?: (value: string | number) => void
  disabled?: boolean
  clearable?: boolean
}

export const TreeSelect = forwardRef<HTMLDivElement, TreeSelectProps>(
  (
    {
      value: controlledValue,
      defaultValue,
      options = [],
      onChange,
      disabled = false,
      clearable = true,
      style,
      ...props
    },
    ref,
  ) => {
    const [internalValue, setInternalValue] = useState<string | number | undefined>(defaultValue)
    const value = controlledValue ?? internalValue

    const flattenedOptions = useMemo(() => {
      const walk = (
        items: TreeSelectOption[],
        level: number,
      ): Array<{ label: React.ReactNode; value: string | number; disabled?: boolean }> => {
        const result: Array<{
          label: React.ReactNode
          value: string | number
          disabled?: boolean
        }> = []
        for (const item of items) {
          result.push({
            label: `${'  '.repeat(level)}${String(item.label)}`,
            value: item.value,
            disabled: item.disabled,
          })
          if (item.children?.length) {
            result.push(...walk(item.children, level + 1))
          }
        }
        return result
      }
      return walk(
        options.length
          ? options
          : [
              { label: 'Node 1', value: '1', children: [{ label: 'Node 1-1', value: '1-1' }] },
              { label: 'Node 2', value: '2' },
            ],
        0,
      )
    }, [options])

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
        <select
          value={value ?? ''}
          disabled={disabled}
          onChange={(e) => handleChange(e.target.value)}
          style={{
            height: '36px',
            border: '1px solid #d9d9d9',
            borderRadius: '4px',
            padding: '0 10px',
            minWidth: '200px',
            backgroundColor: disabled ? '#f5f5f5' : '#fff',
          }}
        >
          <option value="">Please select</option>
          {flattenedOptions.map((option) => (
            <option key={option.value} value={option.value} disabled={option.disabled}>
              {option.label}
            </option>
          ))}
        </select>
        {clearable && !!value && !disabled && (
          <button
            type="button"
            onClick={() => handleChange('')}
            style={{ border: 'none', background: 'transparent', color: '#999', cursor: 'pointer' }}
          >
            Clear
          </button>
        )}
      </div>
    )
  },
)

TreeSelect.displayName = 'TreeSelect'
