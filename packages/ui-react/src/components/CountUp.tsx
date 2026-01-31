import React, { forwardRef, useEffect, useState, useRef } from 'react'

export interface CountUpProps extends React.HTMLAttributes<HTMLSpanElement> {
  value: number
  duration?: number
  decimals?: number
  prefix?: string
  suffix?: string
  separator?: string
}

export const CountUp = forwardRef<HTMLSpanElement, CountUpProps>(
  ({ value, duration = 2000, decimals = 0, prefix = '', suffix = '', separator = ',', style, ...props }, ref) => {
    const [displayValue, setDisplayValue] = useState(0)
    const startTimeRef = useRef<number | null>(null)
    const rafRef = useRef<number | null>(null)

    useEffect(() => {
      const animate = (timestamp: number) => {
        if (!startTimeRef.current) {
          startTimeRef.current = timestamp
        }

        const elapsed = timestamp - startTimeRef.current
        const progress = Math.min(elapsed / duration, 1)

        // Ease-out cubic
        const easeOutCubic = 1 - Math.pow(1 - progress, 3)
        const currentValue = easeOutCubic * value

        setDisplayValue(currentValue)

        if (progress < 1) {
          rafRef.current = requestAnimationFrame(animate)
        }
      }

      startTimeRef.current = null
      rafRef.current = requestAnimationFrame(animate)

      return () => {
        if (rafRef.current) {
          cancelAnimationFrame(rafRef.current)
        }
      }
    }, [value, duration])

    const formatNumber = (num: number): string => {
      const fixed = num.toFixed(decimals)
      const parts = fixed.split('.')
      parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, separator)
      return parts.join('.')
    }

    return (
      <span ref={ref} style={style} {...props}>
        {prefix}{formatNumber(displayValue)}{suffix}
      </span>
    )
  }
)

CountUp.displayName = 'CountUp'
