import React, { forwardRef } from 'react'

export interface NavButtonProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'color'> {
  /** 按钮文字 */
  label?: string
  /** 是否显示文字 */
  showLabel?: boolean
  /** 图标（SVG 内容或 emoji） */
  icon?: string
  /** 图标大小 */
  iconSize?: number
  /** 背景色 */
  backgroundColor?: string
  /** 文字颜色 */
  color?: string
  /** 圆角 */
  borderRadius?: number
  /** 水平内边距 */
  paddingX?: number
  /** 垂直内边距 */
  paddingY?: number
  /** 字号 */
  fontSize?: number
  /** 是否显示阴影 */
  shadow?: boolean
}

// 默认箭头图标
const ArrowRightIcon = ({
  size = 20,
  color = 'currentColor',
}: {
  size?: number
  color?: string
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M5 12h14M12 5l7 7-7 7" />
  </svg>
)

export const NavButton = forwardRef<HTMLDivElement, NavButtonProps>(
  (
    {
      label = '跳转',
      showLabel = true,
      iconSize = 20,
      backgroundColor = '#409eff',
      color = '#ffffff',
      borderRadius = 8,
      paddingX = 24,
      paddingY = 12,
      fontSize = 14,
      shadow = false,
      style,
      onClick,
      ...rest
    },
    ref,
  ) => {
    const containerStyle: React.CSSProperties = {
      display: 'inline-flex',
      alignItems: 'center',
      gap: '8px',
      backgroundColor,
      color,
      borderRadius: `${borderRadius}px`,
      padding: `${paddingY}px ${paddingX}px`,
      fontSize: `${fontSize}px`,
      fontWeight: 500,
      cursor: 'pointer',
      transition: 'all 0.2s ease',
      boxShadow: shadow ? '0 2px 8px rgba(0,0,0,0.15)' : 'none',
      userSelect: 'none',
      ...style,
    }

    return (
      <div ref={ref} style={containerStyle} onClick={onClick} {...rest}>
        <ArrowRightIcon size={iconSize} color={color} />
        {showLabel && <span style={{ whiteSpace: 'nowrap' }}>{label}</span>}
      </div>
    )
  },
)

NavButton.displayName = 'NavButton'
