import React, { forwardRef } from 'react'

export interface IframeProps extends React.HTMLAttributes<HTMLDivElement> {
  /** iframe 地址 */
  url?: string
  /** iframe 标题 */
  title?: string
  /** sandbox 属性 */
  sandbox?: string
  /** allow 属性 */
  allow?: string
  /** 占位文字 */
  placeholder?: string
  /** 是否显示遮罩（编辑模式防穿透） */
  showMask?: boolean
  /** 背景色 */
  backgroundColor?: string
  /** 圆角 */
  borderRadius?: number
  /** 边框 */
  border?: string
  /** 不透明度 (0-100) */
  opacity?: number
}

export const Iframe = forwardRef<HTMLDivElement, IframeProps>(
  (
    {
      url = '',
      title = 'iframe',
      sandbox,
      allow,
      placeholder = '请设置 iframe 地址',
      showMask = true,
      backgroundColor = '#ffffff',
      borderRadius = 0,
      border = '1px solid #dcdfe6',
      opacity = 100,
      style,
      ...rest
    },
    ref,
  ) => {
    const containerStyle: React.CSSProperties = {
      position: 'relative',
      width: '100%',
      height: '100%',
      backgroundColor,
      borderRadius: `${borderRadius}px`,
      overflow: 'hidden',
      border,
      ...style,
    }

    const iframeStyle: React.CSSProperties = {
      width: '100%',
      height: '100%',
      border: 'none',
      opacity: opacity / 100,
    }

    const placeholderStyle: React.CSSProperties = {
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      width: '100%',
      height: '100%',
      color: '#909399',
      fontSize: '14px',
      gap: '8px',
      backgroundColor: '#f5f7fa',
    }

    const maskStyle: React.CSSProperties = {
      position: 'absolute',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      background: 'transparent',
      zIndex: 1,
      pointerEvents: 'auto',
    }

    return (
      <div ref={ref} style={containerStyle} {...rest}>
        {url ? (
          <>
            <iframe
              src={url}
              style={iframeStyle}
              title={title}
              sandbox={sandbox}
              allow={allow}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
            {showMask && <div style={maskStyle} />}
          </>
        ) : (
          <div style={placeholderStyle}>
            <svg
              width="48"
              height="48"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#c0c4cc"
              strokeWidth="2"
            >
              <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
              <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
            </svg>
            <span>{placeholder}</span>
          </div>
        )}
      </div>
    )
  },
)

Iframe.displayName = 'Iframe'
