import React, { forwardRef, useState, useRef, useCallback } from 'react'

export interface SearchBoxProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'onChange'> {
  value?: string
  defaultValue?: string
  onChange?: (value: string) => void
  onSearch?: (value: string) => void
  placeholder?: string
  disabled?: boolean
  allowClear?: boolean
  loading?: boolean
  enterButton?: React.ReactNode
  size?: 'small' | 'medium' | 'large'
  debounce?: number
}

export const SearchBox = forwardRef<HTMLDivElement, SearchBoxProps>(
  ({
    value: controlledValue,
    defaultValue = '',
    onChange,
    onSearch,
    placeholder = 'Search...',
    disabled = false,
    allowClear = true,
    loading = false,
    enterButton,
    size = 'medium',
    debounce = 0,
    style,
    ...props
  }, ref) => {
    const [internalValue, setInternalValue] = useState(defaultValue)
    const debounceRef = useRef<ReturnType<typeof setTimeout>>()

    const value = controlledValue ?? internalValue

    const sizeMap = {
      small: { height: '28px', fontSize: '12px', padding: '0 8px' },
      medium: { height: '36px', fontSize: '14px', padding: '0 12px' },
      large: { height: '44px', fontSize: '16px', padding: '0 16px' },
    }

    const { height, fontSize, padding } = sizeMap[size]

    const handleChange = useCallback((newValue: string) => {
      if (controlledValue === undefined) {
        setInternalValue(newValue)
      }

      if (debounce > 0) {
        if (debounceRef.current) {
          clearTimeout(debounceRef.current)
        }
        debounceRef.current = setTimeout(() => {
          onChange?.(newValue)
        }, debounce)
      } else {
        onChange?.(newValue)
      }
    }, [controlledValue, onChange, debounce])

    const handleSearch = () => {
      onSearch?.(value)
    }

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter') {
        handleSearch()
      }
    }

    const handleClear = () => {
      handleChange('')
      onSearch?.('')
    }

    return (
      <div
        ref={ref}
        style={{
          display: 'inline-flex',
          alignItems: 'stretch',
          ...style,
        }}
        {...props}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            flex: 1,
            height,
            padding,
            border: '1px solid #d9d9d9',
            borderRadius: enterButton ? '4px 0 0 4px' : '4px',
            backgroundColor: disabled ? '#f5f5f5' : '#fff',
            opacity: disabled ? 0.6 : 1,
          }}
        >
          {/* Search Icon */}
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#999"
            strokeWidth="2"
            style={{ marginRight: '8px', flexShrink: 0 }}
          >
            <circle cx="11" cy="11" r="8" />
            <path d="M21 21l-4.35-4.35" />
          </svg>

          <input
            type="text"
            value={value}
            onChange={(e) => handleChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            disabled={disabled}
            style={{
              flex: 1,
              border: 'none',
              outline: 'none',
              fontSize,
              backgroundColor: 'transparent',
              minWidth: '100px',
            }}
          />

          {/* Loading Spinner */}
          {loading && (
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              style={{
                marginLeft: '8px',
                animation: 'spin 1s linear infinite',
              }}
            >
              <circle
                cx="12"
                cy="12"
                r="10"
                stroke="#1890ff"
                strokeWidth="2"
                fill="none"
                strokeDasharray="31.4 31.4"
                strokeLinecap="round"
              />
              <style>
                {`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}
              </style>
            </svg>
          )}

          {/* Clear Button */}
          {allowClear && value && !loading && (
            <span
              onClick={handleClear}
              style={{
                marginLeft: '8px',
                color: '#999',
                cursor: 'pointer',
                fontSize: '12px',
              }}
            >
              ×
            </span>
          )}
        </div>

        {/* Enter Button */}
        {enterButton && (
          <button
            type="button"
            onClick={handleSearch}
            disabled={disabled}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              height,
              padding: '0 16px',
              border: '1px solid #1890ff',
              borderLeft: 'none',
              borderRadius: '0 4px 4px 0',
              backgroundColor: '#1890ff',
              color: '#fff',
              fontSize,
              cursor: disabled ? 'not-allowed' : 'pointer',
              opacity: disabled ? 0.6 : 1,
            }}
          >
            {enterButton === true ? (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8" />
                <path d="M21 21l-4.35-4.35" />
              </svg>
            ) : (
              enterButton
            )}
          </button>
        )}
      </div>
    )
  }
)

SearchBox.displayName = 'SearchBox'
