import React, { forwardRef, useState, useRef, useEffect } from 'react'

export interface SelectOption {
  label: React.ReactNode
  value: string | number
  disabled?: boolean
}

export interface SelectProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'onChange'> {
  value?: string | number
  defaultValue?: string | number
  options: SelectOption[]
  onChange?: (value: string | number) => void
  placeholder?: string
  disabled?: boolean
  allowClear?: boolean
  size?: 'small' | 'medium' | 'large'
}

export const Select = forwardRef<HTMLDivElement, SelectProps>(
  ({
    value: controlledValue,
    defaultValue,
    options,
    onChange,
    placeholder = 'Please select',
    disabled = false,
    allowClear = false,
    size = 'medium',
    style,
    ...props
  }, ref) => {
    const [internalValue, setInternalValue] = useState<string | number | undefined>(defaultValue)
    const [isOpen, setIsOpen] = useState(false)
    const containerRef = useRef<HTMLDivElement>(null)

    const value = controlledValue ?? internalValue
    const selectedOption = options.find((opt) => opt.value === value)

    const heightMap = {
      small: '28px',
      medium: '36px',
      large: '44px',
    }

    useEffect(() => {
      const handleClickOutside = (e: MouseEvent) => {
        if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
          setIsOpen(false)
        }
      }
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    const handleSelect = (opt: SelectOption) => {
      if (opt.disabled) return
      if (controlledValue === undefined) {
        setInternalValue(opt.value)
      }
      onChange?.(opt.value)
      setIsOpen(false)
    }

    const handleClear = (e: React.MouseEvent) => {
      e.stopPropagation()
      if (controlledValue === undefined) {
        setInternalValue(undefined)
      }
      onChange?.('' as string)
    }

    return (
      <div
        ref={(el) => {
          (containerRef as React.MutableRefObject<HTMLDivElement | null>).current = el
          if (typeof ref === 'function') ref(el)
          else if (ref) ref.current = el
        }}
        style={{ position: 'relative', display: 'inline-block', ...style }}
        {...props}
      >
        <div
          onClick={() => !disabled && setIsOpen(!isOpen)}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            height: heightMap[size],
            padding: '0 12px',
            border: '1px solid #d9d9d9',
            borderRadius: '4px',
            cursor: disabled ? 'not-allowed' : 'pointer',
            backgroundColor: disabled ? '#f5f5f5' : '#fff',
            opacity: disabled ? 0.6 : 1,
            minWidth: '120px',
          }}
        >
          <span style={{ color: selectedOption ? '#333' : '#999' }}>
            {selectedOption?.label ?? placeholder}
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            {allowClear && value && (
              <span
                onClick={handleClear}
                style={{ color: '#999', fontSize: '12px', cursor: 'pointer' }}
              >
                ×
              </span>
            )}
            <span style={{ color: '#999', fontSize: '10px' }}>▼</span>
          </span>
        </div>

        {isOpen && (
          <div
            style={{
              position: 'absolute',
              top: '100%',
              left: 0,
              right: 0,
              marginTop: '4px',
              backgroundColor: '#fff',
              border: '1px solid #e8e8e8',
              borderRadius: '4px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
              zIndex: 1000,
              maxHeight: '200px',
              overflowY: 'auto',
            }}
          >
            {options.map((opt) => (
              <div
                key={opt.value}
                onClick={() => handleSelect(opt)}
                style={{
                  padding: '8px 12px',
                  cursor: opt.disabled ? 'not-allowed' : 'pointer',
                  backgroundColor: opt.value === value ? '#e6f7ff' : undefined,
                  color: opt.disabled ? '#999' : '#333',
                  opacity: opt.disabled ? 0.6 : 1,
                }}
                onMouseEnter={(e) => {
                  if (!opt.disabled) e.currentTarget.style.backgroundColor = '#f5f5f5'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = opt.value === value ? '#e6f7ff' : ''
                }}
              >
                {opt.label}
              </div>
            ))}
          </div>
        )}
      </div>
    )
  }
)

Select.displayName = 'Select'
