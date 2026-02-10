import React, { forwardRef } from 'react'

export interface ButtonProps
  extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'type' | 'color'> {
  /** 按钮文字 */
  text?: string
  /** 按钮主题类型 */
  type?: 'primary' | 'success' | 'warning' | 'danger' | 'info' | 'text' | 'default'
  /** 尺寸 */
  size?: 'large' | 'default' | 'small'
  /** 朴素模式 */
  plain?: boolean
  /** 圆角模式 */
  round?: boolean
  /** 圆形按钮 */
  circle?: boolean
  /** 禁用 */
  disabled?: boolean
  /** 加载中 */
  loading?: boolean
  /** 图标名称 */
  icon?: string
  /** 宽度 */
  width?: string | number
  /** 高度 */
  height?: string | number
  /** 背景色 */
  backgroundColor?: string
  /** 文字颜色 */
  color?: string
  /** 字号 */
  fontSize?: number | string
  /** 字重 */
  fontWeight?: number | string
  /** 圆角 */
  borderRadius?: number | string
  /** 内边距 */
  padding?: string
}

const TYPE_COLORS: Record<string, { bg: string; border: string; text: string }> = {
  primary: { bg: '#409eff', border: '#409eff', text: '#fff' },
  success: { bg: '#67c23a', border: '#67c23a', text: '#fff' },
  warning: { bg: '#e6a23c', border: '#e6a23c', text: '#fff' },
  danger: { bg: '#f56c6c', border: '#f56c6c', text: '#fff' },
  info: { bg: '#909399', border: '#909399', text: '#fff' },
  text: { bg: 'transparent', border: 'transparent', text: '#409eff' },
  default: { bg: '#fff', border: '#dcdfe6', text: '#606266' },
}

const SIZE_MAP: Record<string, { height: string; padding: string; fontSize: string }> = {
  large: { height: '40px', padding: '12px 20px', fontSize: '14px' },
  default: { height: '32px', padding: '8px 16px', fontSize: '14px' },
  small: { height: '24px', padding: '5px 12px', fontSize: '12px' },
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      text = '按钮',
      type = 'primary',
      size = 'default',
      plain = false,
      round = false,
      circle = false,
      disabled = false,
      loading = false,
      width,
      height,
      backgroundColor,
      color,
      fontSize,
      fontWeight,
      borderRadius,
      padding,
      style,
      children,
      onClick,
      ...rest
    },
    ref,
  ) => {
    const themeColors = TYPE_COLORS[type] || TYPE_COLORS.default
    const sizePreset = SIZE_MAP[size] || SIZE_MAP.default

    const combinedStyle: React.CSSProperties = {
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '6px',
      cursor: disabled || loading ? 'not-allowed' : 'pointer',
      border: `1px solid ${themeColors.border}`,
      outline: 'none',
      transition: 'all 0.2s ease',
      whiteSpace: 'nowrap',
      lineHeight: '1',
      // size presets
      height: sizePreset.height,
      padding: padding ?? sizePreset.padding,
      fontSize:
        fontSize != null
          ? typeof fontSize === 'number'
            ? `${fontSize}px`
            : fontSize
          : sizePreset.fontSize,
      // theme
      backgroundColor: backgroundColor ?? (plain ? 'transparent' : themeColors.bg),
      color: color ?? (plain ? themeColors.bg : themeColors.text),
      borderColor: backgroundColor ?? themeColors.border,
      // shape
      borderRadius:
        borderRadius != null
          ? typeof borderRadius === 'number'
            ? `${borderRadius}px`
            : borderRadius
          : circle
            ? '50%'
            : round
              ? '20px'
              : '4px',
      fontWeight: fontWeight ?? 500,
      opacity: disabled ? 0.6 : 1,
      // overrides
      ...(width != null ? { width: typeof width === 'number' ? `${width}px` : width } : {}),
      ...(height != null ? { height: typeof height === 'number' ? `${height}px` : height } : {}),
      ...style,
    }

    const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
      if (!disabled && !loading) {
        onClick?.(e)
      }
    }

    return (
      <button ref={ref} style={combinedStyle} disabled={disabled} onClick={handleClick} {...rest}>
        {loading && (
          <span
            style={{
              display: 'inline-block',
              width: '14px',
              height: '14px',
              border: '2px solid currentColor',
              borderTopColor: 'transparent',
              borderRadius: '50%',
              animation: 'vela-btn-spin 0.6s linear infinite',
            }}
          />
        )}
        {children ?? text}
      </button>
    )
  },
)

Button.displayName = 'Button'
