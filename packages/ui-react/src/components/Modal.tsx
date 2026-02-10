import React, { forwardRef, useEffect, useRef } from 'react'

export interface ModalProps {
  /** @canonical Schema prop name */
  visible?: boolean
  /** @deprecated Use `visible` */
  open?: boolean
  title?: React.ReactNode
  footer?: React.ReactNode | null
  onOk?: () => void
  onCancel?: () => void
  width?: number | string
  centered?: boolean
  closable?: boolean
  /** @canonical Schema prop name */
  closeOnClickModal?: boolean
  /** @deprecated Use `closeOnClickModal` */
  maskClosable?: boolean
  fullscreen?: boolean
  showFooter?: boolean
  cancelText?: string
  confirmText?: string
  destroyOnClose?: boolean
  zIndex?: number
  children?: React.ReactNode
  style?: React.CSSProperties
  bodyStyle?: React.CSSProperties
}

export const Modal = forwardRef<HTMLDivElement, ModalProps>(
  (
    {
      visible,
      open = false,
      title,
      footer,
      onOk,
      onCancel,
      width = 520,
      centered = false,
      closable = true,
      closeOnClickModal,
      maskClosable = true,
      fullscreen = false,
      showFooter,
      cancelText = 'Cancel',
      confirmText = 'OK',
      destroyOnClose = false,
      zIndex = 1000,
      children,
      style,
      bodyStyle,
    },
    ref,
  ) => {
    // Canonical props take priority
    const resolvedOpen = visible ?? open
    const resolvedMaskClosable = closeOnClickModal ?? maskClosable
    const contentRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
      if (resolvedOpen) {
        document.body.style.overflow = 'hidden'
      } else {
        document.body.style.overflow = ''
      }
      return () => {
        document.body.style.overflow = ''
      }
    }, [resolvedOpen])

    if (!resolvedOpen && destroyOnClose) {
      return null
    }

    const handleMaskClick = (e: React.MouseEvent) => {
      if (resolvedMaskClosable && e.target === e.currentTarget) {
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
          {cancelText}
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
          {confirmText}
        </button>
      </div>
    )

    // Determine if footer should be shown
    const shouldShowFooter = showFooter !== undefined ? showFooter : footer !== null

    return (
      <div
        ref={ref}
        style={{
          position: 'fixed',
          inset: fullscreen ? 0 : undefined,
          ...(fullscreen ? {} : { top: 0, left: 0, right: 0, bottom: 0 }),
          zIndex,
          display: resolvedOpen ? 'block' : 'none',
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
            width: fullscreen ? '100vw' : typeof width === 'number' ? `${width}px` : width,
            height: fullscreen ? '100vh' : undefined,
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
          <div style={{ padding: '24px', ...bodyStyle }}>{children}</div>
          {/* Footer */}
          {shouldShowFooter && (
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
  },
)

Modal.displayName = 'Modal'
