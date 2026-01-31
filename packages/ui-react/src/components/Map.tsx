import React, { forwardRef } from 'react'

export interface MapProps extends React.HTMLAttributes<HTMLDivElement> {
  center?: [number, number]
  zoom?: number
  markers?: Array<{
    position: [number, number]
    title?: string
    popup?: React.ReactNode
  }>
  tileUrl?: string
}

/**
 * Map component placeholder
 * In a real implementation, this would integrate with a mapping library like Leaflet or Mapbox
 */
export const Map = forwardRef<HTMLDivElement, MapProps>(
  ({
    center = [0, 0],
    zoom = 10,
    markers = [],
    tileUrl,
    style,
    children,
    ...props
  }, ref) => {
    return (
      <div
        ref={ref}
        style={{
          width: '100%',
          height: '400px',
          backgroundColor: '#e8e8e8',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: '8px',
          position: 'relative',
          ...style,
        }}
        {...props}
      >
        <div style={{ textAlign: 'center', color: '#666' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>🗺️</div>
          <div>Map Component</div>
          <div style={{ fontSize: '12px', marginTop: '8px' }}>
            Center: [{center[0]}, {center[1]}] | Zoom: {zoom}
          </div>
          {markers.length > 0 && (
            <div style={{ fontSize: '12px', marginTop: '4px' }}>
              {markers.length} marker(s)
            </div>
          )}
        </div>
        {children}
      </div>
    )
  }
)

Map.displayName = 'Map'
