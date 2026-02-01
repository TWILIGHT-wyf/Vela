import React, { forwardRef, useState, useRef, useEffect } from 'react'

export interface MultiSelectOption {
  label: React.ReactNode
  value: string | number
  disabled?: boolean
}

export interface MultiSelectProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'onChange'> {
  value?: (string | number)[]
  defaultValue?: (string | number)[]
  options: MultiSelectOption[]
  onChange?: (value: (string | number)[]) => void
  placeholder?: string
  disabled?: boolean
  allowClear?: boolean
  maxTagCount?: number
  size?: 'small' | 'medium' | 'large'
}

export const MultiSelect = forwardRef<HTMLDivElement, MultiSelectProps>(
  ({
    value: controlledValue,
    defaultValue = [],
    options,
    onChange,
    placeholder = 'Please select',
    disabled = false,
    allowClear = false,
    maxTagCount = 3,
    size = 'medium',
    style,
    ...props
  }, ref) => {
    const [internalValue, setInternalValue] = useState<(string | number)[]>(defaultValue)
    const [isOpen, setIsOpen] = useState(false)
    const containerRef = useRef<HTMLDivElement>(null)

    const value = controlledValue ?? internalValue
    const selectedOptions = options.filter((opt) => value.includes(opt.value))

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

    const handleSelect = (opt: MultiSelectOption) => {
      if (opt.disabled) return
      const isSelected = value.includes(opt.value)
      const newValue = isSelected
        ? value.filter((v) => v !== opt.value)
        : [...value, opt.value]

      if (controlledValue === undefined) {
        setInternalValue(newValue)
      }
      onChange?.(newValue)
    }

    const handleRemove = (e: React.MouseEvent, optValue: string | number) => {
      e.stopPropagation()
      const newValue = value.filter((v) => v !== optValue)
      if (controlledValue === undefined) {
        setInternalValue(newValue)
      }
      onChange?.(newValue)
    }

    const handleClear = (e: React.MouseEvent) => {
      e.stopPropagation()
      if (controlledValue === undefined) {
        setInternalValue([])
      }
      onChange?.([])
    }

    const displayTags = selectedOptions.slice(0, maxTagCount)
    const hiddenCount = selectedOptions.length - maxTagCount

    return (
      <div
        ref={(el) => {
          (containerRef as React.MutableRefObject<HTMLDivElement | null>).current = el
          if (typeof ref === 'function') ref(el)
          else if (ref) ref.current = el
        }}
        style={{ position: 'relative', display: 'inline-block', minWidth: '200px', ...style }}
        {...props}
      >
        <div
          onClick={() => !disabled && setIsOpen(!isOpen)}
          style={{
            display: 'flex',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '4px',
            minHeight: heightMap[size],
            padding: '4px 32px 4px 8px',
            border: '1px solid #d9d9d9',
            borderRadius: '4px',
            cursor: disabled ? 'not-allowed' : 'pointer',
            backgroundColor: disabled ? '#f5f5f5' : '#fff',
            opacity: disabled ? 0.6 : 1,
            position: 'relative',
          }}
        >
          {selectedOptions.length === 0 ? (
            <span style={{ color: '#999' }}>{placeholder}</span>
          ) : (
            <>
              {displayTags.map((opt) => (
                <span
                  key={opt.value}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    padding: '2px 8px',
                    backgroundColor: '#f0f0f0',
                    borderRadius: '2px',
                    fontSize: '12px',
                  }}
                >
                  {opt.label}
                  <span
                    onClick={(e) => handleRemove(e, opt.value)}
                    style={{ cursor: 'pointer', color: '#999' }}
                  >
                    ×
                  </span>
                </span>
              ))}
              {hiddenCount > 0 && (
                <span
                  style={{
                    padding: '2px 8px',
                    backgroundColor: '#f0f0f0',
                    borderRadius: '2px',
                    fontSize: '12px',
                  }}
                >
                  +{hiddenCount}
                </span>
              )}
            </>
          )}

          {/* Clear & Arrow */}
          <span
            style={{
              position: 'absolute',
              right: '8px',
              top: '50%',
              transform: 'translateY(-50%)',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
            }}
          >
            {allowClear && value.length > 0 && (
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
            {options.map((opt) => {
              const isSelected = value.includes(opt.value)
              return (
                <div
                  key={opt.value}
                  onClick={() => handleSelect(opt)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '8px 12px',
                    cursor: opt.disabled ? 'not-allowed' : 'pointer',
                    backgroundColor: isSelected ? '#e6f7ff' : undefined,
                    color: opt.disabled ? '#999' : '#333',
                    opacity: opt.disabled ? 0.6 : 1,
                  }}
                  onMouseEnter={(e) => {
                    if (!opt.disabled && !isSelected) {
                      e.currentTarget.style.backgroundColor = '#f5f5f5'
                    }
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = isSelected ? '#e6f7ff' : ''
                  }}
                >
                  <span
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: '14px',
                      height: '14px',
                      border: `1px solid ${isSelected ? '#1890ff' : '#d9d9d9'}`,
                      borderRadius: '2px',
                      backgroundColor: isSelected ? '#1890ff' : '#fff',
                    }}
                  >
                    {isSelected && (
                      <svg width="8" height="6" viewBox="0 0 8 6" fill="none">
                        <path d="M1 3L3 5L7 1" stroke="white" strokeWidth="1.5" />
                      </svg>
                    )}
                  </span>
                  <span>{opt.label}</span>
                </div>
              )
            })}
          </div>
        )}
      </div>
    )
  }
)

MultiSelect.displayName = 'MultiSelect'
