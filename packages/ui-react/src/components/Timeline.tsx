import React, { forwardRef } from 'react'

export interface TimelineItem {
  id: string | number
  title?: React.ReactNode
  content?: React.ReactNode
  time?: React.ReactNode
  color?: string
  icon?: React.ReactNode
}

export interface TimelineProps extends React.HTMLAttributes<HTMLDivElement> {
  items: TimelineItem[]
  mode?: 'left' | 'right' | 'alternate'
  pending?: React.ReactNode
  reverse?: boolean
}

export const Timeline = forwardRef<HTMLDivElement, TimelineProps>(
  ({
    items,
    mode = 'left',
    pending,
    reverse = false,
    style,
    ...props
  }, ref) => {
    const displayItems = reverse ? [...items].reverse() : items
    const allItems = pending
      ? [...displayItems, { id: '__pending__', title: pending, color: '#999' }]
      : displayItems

    const getAlignment = (index: number): 'left' | 'right' => {
      if (mode === 'left') return 'left'
      if (mode === 'right') return 'right'
      return index % 2 === 0 ? 'left' : 'right'
    }

    return (
      <div
        ref={ref}
        style={{
          position: 'relative',
          ...style,
        }}
        {...props}
      >
        {allItems.map((item, index) => {
          const alignment = getAlignment(index)
          const isLast = index === allItems.length - 1
          const isPending = item.id === '__pending__'

          return (
            <div
              key={item.id}
              style={{
                display: 'flex',
                flexDirection: mode === 'alternate' ? 'row' : undefined,
                justifyContent: mode === 'alternate'
                  ? alignment === 'left' ? 'flex-start' : 'flex-end'
                  : undefined,
                position: 'relative',
                paddingBottom: isLast ? 0 : '24px',
              }}
            >
              {/* Left content for alternate mode */}
              {mode === 'alternate' && alignment === 'right' && (
                <div
                  style={{
                    flex: 1,
                    paddingRight: '24px',
                    textAlign: 'right',
                  }}
                >
                  {item.time && (
                    <div style={{ fontSize: '12px', color: '#999', marginBottom: '4px' }}>
                      {item.time}
                    </div>
                  )}
                </div>
              )}

              {/* Timeline line and dot */}
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  width: mode === 'alternate' ? '24px' : undefined,
                  marginRight: mode === 'left' ? '16px' : undefined,
                  marginLeft: mode === 'right' ? '16px' : undefined,
                }}
              >
                {/* Dot or Icon */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: item.icon ? '24px' : '12px',
                    height: item.icon ? '24px' : '12px',
                    borderRadius: '50%',
                    backgroundColor: item.icon ? 'transparent' : (item.color || '#1890ff'),
                    border: item.icon ? `2px solid ${item.color || '#1890ff'}` : 'none',
                    flexShrink: 0,
                    zIndex: 1,
                  }}
                >
                  {item.icon && (
                    <span style={{ color: item.color || '#1890ff', fontSize: '12px' }}>
                      {item.icon}
                    </span>
                  )}
                </div>

                {/* Connecting line */}
                {!isLast && (
                  <div
                    style={{
                      width: '2px',
                      flex: 1,
                      backgroundColor: isPending ? '#e8e8e8' : '#e8e8e8',
                      marginTop: '4px',
                      minHeight: '20px',
                    }}
                  />
                )}
              </div>

              {/* Content */}
              <div
                style={{
                  flex: mode === 'alternate' ? 1 : undefined,
                  paddingLeft: mode === 'alternate' && alignment === 'left' ? '24px' : undefined,
                  paddingRight: mode === 'alternate' && alignment === 'right' ? '24px' : undefined,
                  textAlign: mode === 'alternate' && alignment === 'right' ? 'right' : 'left',
                }}
              >
                {/* Time (for left/right modes) */}
                {mode !== 'alternate' && item.time && (
                  <div
                    style={{
                      fontSize: '12px',
                      color: '#999',
                      marginBottom: '4px',
                    }}
                  >
                    {item.time}
                  </div>
                )}

                {/* Time (for alternate mode, left alignment) */}
                {mode === 'alternate' && alignment === 'left' && item.time && (
                  <div
                    style={{
                      fontSize: '12px',
                      color: '#999',
                      marginBottom: '4px',
                    }}
                  >
                    {item.time}
                  </div>
                )}

                {/* Title */}
                {item.title && (
                  <div
                    style={{
                      fontSize: '14px',
                      fontWeight: 500,
                      color: isPending ? '#999' : '#333',
                      marginBottom: item.content ? '8px' : 0,
                    }}
                  >
                    {item.title}
                  </div>
                )}

                {/* Content */}
                {item.content && (
                  <div
                    style={{
                      fontSize: '14px',
                      color: '#666',
                      lineHeight: 1.6,
                    }}
                  >
                    {item.content}
                  </div>
                )}
              </div>

              {/* Right time for alternate mode */}
              {mode === 'alternate' && alignment === 'left' && (
                <div style={{ flex: 1 }} />
              )}
            </div>
          )
        })}
      </div>
    )
  }
)

Timeline.displayName = 'Timeline'
