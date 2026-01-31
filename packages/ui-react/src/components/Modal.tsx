import React, { forwardRef, useEffect, useRef } from 'react'

export interface ModalProps {
  open?: boolean
  title?: React.ReactNode
  footer?: React.ReactNode | null
  onOk?: () => void
  onCancel?: () => void
  width?: number | string
  centered?: boolean
  closable?: boolean
  maskClosable?: boolean
  destroyOnClose?: boolean
  zIndex?: number
  children?: React.ReactNode
  style?: React.CSSProperties
  bodyStyle?: React.CSSProperties
}

export const Modal = forwardRef<HTMLDivElement, ModalProps>(
  ({
    open = false,
    title,
    footer,
    onOk,
    onCancel,
    width = 520,
    centered = false,
    closable = true,
    maskClosable = true,
    destroyOnClose = false,
    zIndex = 1000,
    children,
    style,
    bodyStyle,
  }, ref) => {
    const contentRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
      if (open) {
        document.body.style.overflow = 'hidden'
      } else {
        document.body.style.overflow = ''
      }
      return () => {
        document.body.style.overflow = ''
      }
    }, [open])

    if (!open && destroyOnClose) {
      return null
    }

    const handleMaskClick = (e: React.MouseEvent) => {
      if (maskClosable && e.target === e.currentTarget) {
        onCancel?.()
      }
    }

    const defaultFooter = (
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
        <button
          onClick={onCancel}
          style={{
            padding: '8px 16px',
            border: '1px solid #d9d9d9',
            borderRadius: '4px',
            cursor: 'pointer',
            backgroundColor: '#fff',
          }}
        >
          Cancel
        </button>
        <button
          onClick={onOk}
          style={{
            padding: '8px 16px',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            backgroundColor: '#1890ff',
            color: '#fff',
          }}
        >
          OK
        </button>
      </div>
    )

    return (
      <div
        ref={ref}
        style={{
          position: 'fixed',
          inset: 0,
          zIndex,
          display: open ? 'block' : 'none',
        }}
      >
        {/* Mask */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundColor: 'rgba(0,0,0,0.45)',
          }}
          onClick={handleMaskClick}
        />
        {/* Modal Content */}
        <div
          style={{
            position: 'absolute',
            top: centered ? '50%' : '100px',
            left: '50%',
            transform: centered ? 'translate(-50%, -50%)' : 'translateX(-50%)',
            width: typeof width === 'number' ? `${width}px` : width,
            backgroundColor: '#fff',
            borderRadius: '8px',
            boxShadow: '0 6px 16px rgba(0,0,0,0.15)',
            ...style,
          }}
          ref={contentRef}
        >
          {/* Header */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '16px 24px',
              borderBottom: '1px solid #f0f0f0',
            }}
          >
            <div style={{ fontSize: '16px', fontWeight: 500 }}>{title}</div>
            {closable && (
              <button
                onClick={onCancel}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '16px',
                  cursor: 'pointer',
                  padding: '4px',
                  color: '#999',
                }}
              >
                ×
              </button>
            )}
          </div>
          {/* Body */}
          <div style={{ padding: '24px', ...bodyStyle }}>
            {children}
          </div>
          {/* Footer */}
          {footer !== null && (
            <div
              style={{
                padding: '16px 24px',
                borderTop: '1px solid #f0f0f0',
              }}
            >
              {footer ?? defaultFooter}
            </div>
          )}
        </div>
      </div>
    )
  }
)

Modal.displayName = 'Modal'
