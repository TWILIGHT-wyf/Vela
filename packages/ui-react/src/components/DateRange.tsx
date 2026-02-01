import React, { forwardRef, useState, useRef, useEffect } from 'react'

export interface DateRangeValue {
  start?: Date | string
  end?: Date | string
}

export interface DateRangeProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'onChange'> {
  value?: DateRangeValue
  defaultValue?: DateRangeValue
  onChange?: (value: DateRangeValue) => void
  placeholder?: [string, string]
  disabled?: boolean
  allowClear?: boolean
  format?: string
  separator?: React.ReactNode
  size?: 'small' | 'medium' | 'large'
}

const formatDate = (date: Date | string | undefined, format: string): string => {
  if (!date) return ''
  const d = typeof date === 'string' ? new Date(date) : date
  if (isNaN(d.getTime())) return ''

  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')

  return format
    .replace('YYYY', String(year))
    .replace('MM', month)
    .replace('DD', day)
}

const parseDate = (str: string): Date | undefined => {
  if (!str) return undefined
  const d = new Date(str)
  return isNaN(d.getTime()) ? undefined : d
}

export const DateRange = forwardRef<HTMLDivElement, DateRangeProps>(
  ({
    value: controlledValue,
    defaultValue = {},
    onChange,
    placeholder = ['Start date', 'End date'],
    disabled = false,
    allowClear = true,
    format = 'YYYY-MM-DD',
    separator = '~',
    size = 'medium',
    style,
    ...props
  }, ref) => {
    const [internalValue, setInternalValue] = useState<DateRangeValue>(defaultValue)
    const [isStartOpen, setIsStartOpen] = useState(false)
    const [isEndOpen, setIsEndOpen] = useState(false)
    const containerRef = useRef<HTMLDivElement>(null)

    const value = controlledValue ?? internalValue

    const sizeMap = {
      small: { height: '28px', fontSize: '12px' },
      medium: { height: '36px', fontSize: '14px' },
      large: { height: '44px', fontSize: '16px' },
    }

    const { height, fontSize } = sizeMap[size]

    useEffect(() => {
      const handleClickOutside = (e: MouseEvent) => {
        if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
          setIsStartOpen(false)
          setIsEndOpen(false)
        }
      }
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    const handleStartChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = { ...value, start: e.target.value || undefined }
      if (controlledValue === undefined) {
        setInternalValue(newValue)
      }
      onChange?.(newValue)
    }

    const handleEndChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = { ...value, end: e.target.value || undefined }
      if (controlledValue === undefined) {
        setInternalValue(newValue)
      }
      onChange?.(newValue)
    }

    const handleClear = (e: React.MouseEvent) => {
      e.stopPropagation()
      const newValue = { start: undefined, end: undefined }
      if (controlledValue === undefined) {
        setInternalValue(newValue)
      }
      onChange?.(newValue)
    }

    const inputStyle: React.CSSProperties = {
      border: 'none',
      outline: 'none',
      fontSize,
      backgroundColor: 'transparent',
      textAlign: 'center',
      width: '110px',
    }

    return (
      <div
        ref={(el) => {
          (containerRef as React.MutableRefObject<HTMLDivElement | null>).current = el
          if (typeof ref === 'function') ref(el)
          else if (ref) ref.current = el
        }}
        style={{
          position: 'relative',
          display: 'inline-flex',
          alignItems: 'center',
          height,
          padding: '0 12px',
          border: '1px solid #d9d9d9',
          borderRadius: '4px',
          backgroundColor: disabled ? '#f5f5f5' : '#fff',
          opacity: disabled ? 0.6 : 1,
          gap: '8px',
          ...style,
        }}
        {...props}
      >
        {/* Calendar Icon */}
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#999"
          strokeWidth="2"
        >
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
          <line x1="16" y1="2" x2="16" y2="6" />
          <line x1="8" y1="2" x2="8" y2="6" />
          <line x1="3" y1="10" x2="21" y2="10" />
        </svg>

        {/* Start Date Input */}
        <input
          type="date"
          value={value.start ? (typeof value.start === 'string' ? value.start : value.start.toISOString().split('T')[0]) : ''}
          onChange={handleStartChange}
          placeholder={placeholder[0]}
          disabled={disabled}
          style={inputStyle}
        />

        {/* Separator */}
        <span style={{ color: '#999', fontSize }}>{separator}</span>

        {/* End Date Input */}
        <input
          type="date"
          value={value.end ? (typeof value.end === 'string' ? value.end : value.end.toISOString().split('T')[0]) : ''}
          onChange={handleEndChange}
          placeholder={placeholder[1]}
          disabled={disabled}
          style={inputStyle}
        />

        {/* Clear Button */}
        {allowClear && (value.start || value.end) && (
          <span
            onClick={handleClear}
            style={{
              color: '#999',
              cursor: 'pointer',
              fontSize: '12px',
              marginLeft: '4px',
            }}
          >
            ×
          </span>
        )}
      </div>
    )
  }
)

DateRange.displayName = 'DateRange'
