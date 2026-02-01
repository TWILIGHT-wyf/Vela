import React, { forwardRef, useMemo } from 'react'

export interface PivotProps extends React.HTMLAttributes<HTMLDivElement> {
  data: Record<string, unknown>[]
  rows: string[]
  columns: string[]
  values: {
    field: string
    aggregate: 'sum' | 'count' | 'avg' | 'min' | 'max'
    label?: string
  }[]
  showRowTotal?: boolean
  showColumnTotal?: boolean
  loading?: boolean
  emptyText?: React.ReactNode
}

type AggregateFunction = (values: number[]) => number

const aggregateFunctions: Record<string, AggregateFunction> = {
  sum: (values) => values.reduce((a, b) => a + b, 0),
  count: (values) => values.length,
  avg: (values) => values.length > 0 ? values.reduce((a, b) => a + b, 0) / values.length : 0,
  min: (values) => values.length > 0 ? Math.min(...values) : 0,
  max: (values) => values.length > 0 ? Math.max(...values) : 0,
}

export const Pivot = forwardRef<HTMLDivElement, PivotProps>(
  ({
    data,
    rows,
    columns,
    values,
    showRowTotal = true,
    showColumnTotal = true,
    loading = false,
    emptyText = 'No data',
    style,
    ...props
  }, ref) => {
    const pivotData = useMemo(() => {
      if (!data.length || !rows.length || !columns.length || !values.length) {
        return { rowKeys: [], columnKeys: [], cells: new Map(), rowTotals: new Map(), columnTotals: new Map(), grandTotal: 0 }
      }

      const rowKeySet = new Set<string>()
      const columnKeySet = new Set<string>()
      const cellData = new Map<string, number[]>()

      // Collect unique keys and group data
      data.forEach((item) => {
        const rowKey = rows.map((r) => String(item[r] ?? '')).join('|')
        const colKey = columns.map((c) => String(item[c] ?? '')).join('|')

        rowKeySet.add(rowKey)
        columnKeySet.add(colKey)

        const cellKey = `${rowKey}::${colKey}`
        if (!cellData.has(cellKey)) {
          cellData.set(cellKey, [])
        }

        const value = Number(item[values[0].field]) || 0
        cellData.get(cellKey)!.push(value)
      })

      const rowKeys = Array.from(rowKeySet).sort()
      const columnKeys = Array.from(columnKeySet).sort()

      // Calculate aggregated values
      const cells = new Map<string, number>()
      const aggFunc = aggregateFunctions[values[0].aggregate]

      cellData.forEach((vals, key) => {
        cells.set(key, aggFunc(vals))
      })

      // Calculate totals
      const rowTotals = new Map<string, number>()
      const columnTotals = new Map<string, number>()

      rowKeys.forEach((rowKey) => {
        let total = 0
        columnKeys.forEach((colKey) => {
          total += cells.get(`${rowKey}::${colKey}`) || 0
        })
        rowTotals.set(rowKey, total)
      })

      columnKeys.forEach((colKey) => {
        let total = 0
        rowKeys.forEach((rowKey) => {
          total += cells.get(`${rowKey}::${colKey}`) || 0
        })
        columnTotals.set(colKey, total)
      })

      const grandTotal = Array.from(rowTotals.values()).reduce((a, b) => a + b, 0)

      return { rowKeys, columnKeys, cells, rowTotals, columnTotals, grandTotal }
    }, [data, rows, columns, values])

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

    if (data.length === 0 || pivotData.rowKeys.length === 0) {
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

    const cellStyle: React.CSSProperties = {
      padding: '8px 12px',
      borderBottom: '1px solid #e8e8e8',
      borderRight: '1px solid #e8e8e8',
      textAlign: 'right',
      fontSize: '14px',
    }

    const headerStyle: React.CSSProperties = {
      ...cellStyle,
      backgroundColor: '#fafafa',
      fontWeight: 500,
      textAlign: 'center',
    }

    const totalStyle: React.CSSProperties = {
      ...cellStyle,
      backgroundColor: '#f5f5f5',
      fontWeight: 500,
    }

    const formatNumber = (num: number) => {
      return Number.isInteger(num) ? num.toString() : num.toFixed(2)
    }

    return (
      <div
        ref={ref}
        style={{
          overflow: 'auto',
          ...style,
        }}
        {...props}
      >
        <table
          style={{
            width: '100%',
            borderCollapse: 'collapse',
            border: '1px solid #e8e8e8',
          }}
        >
          <thead>
            <tr>
              <th style={headerStyle}>
                {rows.join(' / ')}
              </th>
              {pivotData.columnKeys.map((colKey) => (
                <th key={colKey} style={headerStyle}>
                  {colKey.split('|').join(' / ')}
                </th>
              ))}
              {showRowTotal && (
                <th style={{ ...headerStyle, backgroundColor: '#f0f0f0' }}>
                  Total
                </th>
              )}
            </tr>
          </thead>
          <tbody>
            {pivotData.rowKeys.map((rowKey) => (
              <tr key={rowKey}>
                <td style={{ ...cellStyle, textAlign: 'left', fontWeight: 500 }}>
                  {rowKey.split('|').join(' / ')}
                </td>
                {pivotData.columnKeys.map((colKey) => (
                  <td key={colKey} style={cellStyle}>
                    {formatNumber(pivotData.cells.get(`${rowKey}::${colKey}`) || 0)}
                  </td>
                ))}
                {showRowTotal && (
                  <td style={totalStyle}>
                    {formatNumber(pivotData.rowTotals.get(rowKey) || 0)}
                  </td>
                )}
              </tr>
            ))}
            {showColumnTotal && (
              <tr>
                <td style={{ ...totalStyle, textAlign: 'left' }}>Total</td>
                {pivotData.columnKeys.map((colKey) => (
                  <td key={colKey} style={totalStyle}>
                    {formatNumber(pivotData.columnTotals.get(colKey) || 0)}
                  </td>
                ))}
                {showRowTotal && (
                  <td style={{ ...totalStyle, backgroundColor: '#e8e8e8' }}>
                    {formatNumber(pivotData.grandTotal)}
                  </td>
                )}
              </tr>
            )}
          </tbody>
        </table>
      </div>
    )
  }
)

Pivot.displayName = 'Pivot'
