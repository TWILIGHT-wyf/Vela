import React, { forwardRef, useState } from 'react'

export interface ImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  fallback?: string
  preview?: boolean
  fit?: 'fill' | 'contain' | 'cover' | 'none' | 'scale-down'
  placeholder?: React.ReactNode
}

export const Image = forwardRef<HTMLImageElement, ImageProps>(
  ({
    src,
    alt = '',
    fallback = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><rect fill="%23f0f0f0" width="100" height="100"/><text x="50%" y="50%" fill="%23999" text-anchor="middle" dy=".3em">No Image</text></svg>',
    preview = false,
    fit = 'cover',
    placeholder,
    style,
    ...props
  }, ref) => {
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(false)
    const [showPreview, setShowPreview] = useState(false)

    const handleLoad = () => {
      setLoading(false)
    }

    const handleError = () => {
      setLoading(false)
      setError(true)
    }

    const imageSrc = error ? fallback : src

    return (
      <>
        <div style={{ position: 'relative', display: 'inline-block', ...style }}>
          {loading && placeholder && (
            <div
              style={{
                position: 'absolute',
                inset: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: '#f5f5f5',
              }}
            >
              {placeholder}
            </div>
          )}
          <img
            ref={ref}
            src={imageSrc}
            alt={alt}
            onLoad={handleLoad}
            onError={handleError}
            onClick={preview ? () => setShowPreview(true) : undefined}
            style={{
              objectFit: fit,
              cursor: preview ? 'zoom-in' : undefined,
              opacity: loading ? 0 : 1,
              transition: 'opacity 0.3s',
            }}
            {...props}
          />
        </div>

        {/* Preview Modal */}
        {showPreview && preview && (
          <div
            onClick={() => setShowPreview(false)}
            style={{
              position: 'fixed',
              inset: 0,
              backgroundColor: 'rgba(0,0,0,0.8)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 2000,
              cursor: 'zoom-out',
            }}
          >
            <img
              src={imageSrc}
              alt={alt}
              style={{ maxWidth: '90%', maxHeight: '90%', objectFit: 'contain' }}
            />
          </div>
        )}
      </>
    )
  }
)

Image.displayName = 'Image'
