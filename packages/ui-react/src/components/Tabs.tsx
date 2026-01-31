import React, { forwardRef, useState } from 'react'

export interface TabPaneProps {
  key: string
  label: React.ReactNode
  disabled?: boolean
  children?: React.ReactNode
}

export interface TabsProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'onChange'> {
  activeKey?: string
  defaultActiveKey?: string
  onChange?: (key: string) => void
  type?: 'line' | 'card'
  centered?: boolean
  children?: React.ReactElement<TabPaneProps> | React.ReactElement<TabPaneProps>[]
}

export const TabPane: React.FC<TabPaneProps> = ({ children }) => {
  return <>{children}</>
}

TabPane.displayName = 'TabPane'

export const Tabs = forwardRef<HTMLDivElement, TabsProps>(
  ({
    activeKey: controlledActiveKey,
    defaultActiveKey,
    onChange,
    type = 'line',
    centered = false,
    style,
    children,
    ...props
  }, ref) => {
    const tabs = React.Children.toArray(children).filter(
      (child): child is React.ReactElement<TabPaneProps> =>
        React.isValidElement(child)
    )

    const firstKey = tabs[0]?.key?.toString() ?? ''
    const [internalActiveKey, setInternalActiveKey] = useState(defaultActiveKey ?? firstKey)
    const activeKey = controlledActiveKey ?? internalActiveKey

    const handleTabClick = (key: string) => {
      if (controlledActiveKey === undefined) {
        setInternalActiveKey(key)
      }
      onChange?.(key)
    }

    const activeTab = tabs.find((tab) => tab.key?.toString() === activeKey)

    return (
      <div ref={ref} style={style} {...props}>
        <div
          style={{
            display: 'flex',
            justifyContent: centered ? 'center' : 'flex-start',
            borderBottom: type === 'line' ? '1px solid #e8e8e8' : undefined,
            gap: type === 'card' ? '4px' : undefined,
          }}
        >
          {tabs.map((tab) => {
            const key = tab.key?.toString() ?? ''
            const isActive = key === activeKey
            const isDisabled = tab.props.disabled

            const getBorderBottom = () => {
              if (type === 'line' && isActive) return '2px solid #1890ff'
              if (type === 'card' && isActive) return '1px solid #fff'
              return undefined
            }

            const tabStyle: React.CSSProperties = {
              padding: '12px 16px',
              cursor: isDisabled ? 'not-allowed' : 'pointer',
              opacity: isDisabled ? 0.5 : 1,
              borderBottom: getBorderBottom(),
              backgroundColor: type === 'card'
                ? isActive ? '#fff' : '#f5f5f5'
                : undefined,
              border: type === 'card' ? '1px solid #e8e8e8' : undefined,
              borderRadius: type === 'card' ? '4px 4px 0 0' : undefined,
              marginBottom: type === 'card' && isActive ? '-1px' : undefined,
              color: isActive ? '#1890ff' : '#666',
              fontWeight: isActive ? 500 : 400,
              transition: 'all 0.3s',
            }

            return (
              <div
                key={key}
                style={tabStyle}
                onClick={() => !isDisabled && handleTabClick(key)}
              >
                {tab.props.label}
              </div>
            )
          })}
        </div>
        <div style={{ padding: '16px 0' }}>
          {activeTab?.props.children}
        </div>
      </div>
    )
  }
)

Tabs.displayName = 'Tabs'
