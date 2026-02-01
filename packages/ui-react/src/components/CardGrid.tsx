import React, { forwardRef } from 'react'

export interface CardGridItem {
  id: string | number
  title?: React.ReactNode
  description?: React.ReactNode
  cover?: string
  extra?: React.ReactNode
  [key: string]: unknown
}

export interface CardGridProps extends React.HTMLAttributes<HTMLDivElement> {
  data: CardGridItem[]
  columns?: number
  gap?: number
  cardStyle?: React.CSSProperties
  renderCard?: (item: CardGridItem, index: number) => React.ReactNode
  onCardClick?: (item: CardGridItem, index: number) => void
  loading?: boolean
  emptyText?: React.ReactNode
}

export const CardGrid = forwardRef<HTMLDivElement, CardGridProps>(
  ({
    data,
    columns = 3,
    gap = 16,
    cardStyle,
    renderCard,
    onCardClick,
    loading = false,
    emptyText = 'No data',
    style,
    ...props
  }, ref) => {
    if (loading) {
      return (
        <div
          ref={ref}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '40px',
            color: '#999',
            ...style,
          }}
          {...props}
        >
          Loading...
        </div>
      )
    }

    if (data.length === 0) {
      return (
        <div
          ref={ref}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '40px',
            color: '#999',
            ...style,
          }}
          {...props}
        >
          {emptyText}
        </div>
      )
    }

    const defaultCardRender = (item: CardGridItem) => (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          height: '100%',
        }}
      >
        {item.cover && (
          <div
            style={{
              width: '100%',
              height: '160px',
              overflow: 'hidden',
              borderRadius: '4px 4px 0 0',
            }}
          >
            <img
              src={item.cover}
              alt=""
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
              }}
            />
          </div>
        )}
        <div style={{ padding: '12px', flex: 1 }}>
          {item.title && (
            <div
              style={{
                fontSize: '16px',
                fontWeight: 500,
                color: '#333',
                marginBottom: '8px',
              }}
            >
              {item.title}
            </div>
          )}
          {item.description && (
            <div
              style={{
                fontSize: '14px',
                color: '#666',
                lineHeight: 1.5,
              }}
            >
              {item.description}
            </div>
          )}
        </div>
        {item.extra && (
          <div
            style={{
              padding: '12px',
              borderTop: '1px solid #f0f0f0',
            }}
          >
            {item.extra}
          </div>
        )}
      </div>
    )

    return (
      <div
        ref={ref}
        style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${columns}, 1fr)`,
          gap: `${gap}px`,
          ...style,
        }}
        {...props}
      >
        {data.map((item, index) => (
          <div
            key={item.id}
            onClick={() => onCardClick?.(item, index)}
            style={{
              backgroundColor: '#fff',
              borderRadius: '4px',
              border: '1px solid #e8e8e8',
              overflow: 'hidden',
              cursor: onCardClick ? 'pointer' : 'default',
              transition: 'box-shadow 0.2s',
              ...cardStyle,
            }}
            onMouseEnter={(e) => {
              if (onCardClick) {
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)'
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.boxShadow = ''
            }}
          >
            {renderCard ? renderCard(item, index) : defaultCardRender(item)}
          </div>
        ))}
      </div>
    )
  }
)

CardGrid.displayName = 'CardGrid'
