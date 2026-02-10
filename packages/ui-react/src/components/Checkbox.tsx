import React, { forwardRef, useEffect, useRef, useState } from 'react'

export interface CheckboxProps
  extends Omit<React.HTMLAttributes<HTMLLabelElement>, 'onChange' | 'defaultValue'> {
  checked?: boolean
  defaultChecked?: boolean
  onChange?: (checked: boolean) => void
  disabled?: boolean
  label?: React.ReactNode
  indeterminate?: boolean
  size?: 'small' | 'default' | 'medium' | 'large'
}

export const Checkbox = forwardRef<HTMLLabelElement, CheckboxProps>(
  (
    {
      checked: controlledChecked,
      defaultChecked = false,
      onChange,
      disabled = false,
      label = 'Checkbox',
      indeterminate = false,
      size = 'medium',
      style,
      ...props
    },
    ref,
  ) => {
    const [internalChecked, setInternalChecked] = useState(defaultChecked)
    const checked = controlledChecked ?? internalChecked
    const inputRef = useRef<HTMLInputElement>(null)

    const sizeMap = {
      small: { box: 14, fontSize: '12px' },
      default: { box: 16, fontSize: '14px' },
      medium: { box: 16, fontSize: '14px' },
      large: { box: 18, fontSize: '16px' },
    }
    const sizePreset = sizeMap[size]

    useEffect(() => {
      if (inputRef.current) {
        inputRef.current.indeterminate = indeterminate
      }
    }, [indeterminate])

    const handleChange = (nextChecked: boolean) => {
      if (disabled) {
        return
      }
      if (controlledChecked === undefined) {
        setInternalChecked(nextChecked)
      }
      onChange?.(nextChecked)
    }

    return (
      <label
        ref={ref}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '8px',
          cursor: disabled ? 'not-allowed' : 'pointer',
          opacity: disabled ? 0.6 : 1,
          userSelect: 'none',
          ...style,
        }}
        {...props}
      >
        <input
          ref={inputRef}
          type="checkbox"
          checked={checked}
          disabled={disabled}
          onChange={(e) => handleChange(e.target.checked)}
          style={{
            width: `${sizePreset.box}px`,
            height: `${sizePreset.box}px`,
            margin: 0,
          }}
        />
        <span style={{ fontSize: sizePreset.fontSize }}>{label}</span>
      </label>
    )
  },
)

Checkbox.displayName = 'Checkbox'
