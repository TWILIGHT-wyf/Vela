import React, { forwardRef } from 'react'

export interface BreadcrumbItem {
  label: string
  pageId?: string
  url?: string
}

export interface BreadcrumbProps extends React.HTMLAttributes<HTMLElement> {
  /** 面包屑项列表 */
  items?: BreadcrumbItem[]
  /** 分隔符 */
  separator?: string
  /** 字号 */
  fontSize?: number
  /** 文字颜色 */
  color?: string
  /** 当前项颜色 */
  activeColor?: string
  /** 链接颜色 */
  linkColor?: string
  /** 点击项回调 */
  onItemClick?: (item: BreadcrumbItem) => void
}

const defaultItems: BreadcrumbItem[] = [{ label: '首页', pageId: 'home' }, { label: '当前页面' }]

export const Breadcrumb = forwardRef<HTMLElement, BreadcrumbProps>(
  (
    {
      items,
      separator = '/',
      fontSize = 14,
      color = '#606266',
      activeColor = '#909399',
      linkColor = '#409eff',
      onItemClick,
      style,
      ...rest
    },
    ref,
  ) => {
    const displayItems = items && items.length > 0 ? items : defaultItems

    const containerStyle: React.CSSProperties = {
      display: 'flex',
      alignItems: 'center',
      flexWrap: 'wrap',
      gap: '4px',
      padding: '8px 16px',
      fontSize: `${fontSize}px`,
      color,
      ...style,
    }

    return (
      <nav ref={ref} style={containerStyle} aria-label="breadcrumb" {...rest}>
        {displayItems.map((item, index) => {
          const isLast = index === displayItems.length - 1

          return (
            <React.Fragment key={index}>
              {isLast ? (
                <span style={{ color: activeColor }}>{item.label}</span>
              ) : (
                <a
                  style={{
                    color: linkColor,
                    cursor: 'pointer',
                    textDecoration: 'none',
                  }}
                  onClick={() => onItemClick?.(item)}
                  onMouseEnter={(e) => {
                    ;(e.target as HTMLAnchorElement).style.textDecoration = 'underline'
                  }}
                  onMouseLeave={(e) => {
                    ;(e.target as HTMLAnchorElement).style.textDecoration = 'none'
                  }}
                >
                  {item.label}
                </a>
              )}
              {!isLast && <span style={{ color, margin: '0 4px' }}>{separator}</span>}
            </React.Fragment>
          )
        })}
      </nav>
    )
  },
)

Breadcrumb.displayName = 'Breadcrumb'
