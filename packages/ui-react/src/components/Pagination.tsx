import React, { forwardRef, useState, useEffect, useCallback } from 'react'

export interface PaginationProps extends React.HTMLAttributes<HTMLDivElement> {
  /** 当前页码 */
  currentPage?: number
  /** 每页条数 */
  pageSize?: number
  /** 总条数 */
  total?: number
  /** 可选每页条数 */
  pageSizes?: number[]
  /** 是否显示背景色 */
  background?: boolean
  /** 小尺寸 */
  small?: boolean
  /** 背景色 */
  backgroundColor?: string
  /** 页码变更回调 */
  onPageChange?: (page: number) => void
  /** 每页条数变更回调 */
  onSizeChange?: (size: number) => void
}

export const Pagination = forwardRef<HTMLDivElement, PaginationProps>(
  (
    {
      currentPage = 1,
      pageSize = 10,
      total = 100,
      pageSizes = [10, 20, 50, 100],
      background = true,
      small = false,
      backgroundColor = 'transparent',
      onPageChange,
      onSizeChange,
      style,
      ...rest
    },
    ref,
  ) => {
    const [page, setPage] = useState(currentPage)
    const [size, setSize] = useState(pageSize)

    useEffect(() => {
      setPage(currentPage)
    }, [currentPage])
    useEffect(() => {
      setSize(pageSize)
    }, [pageSize])

    const totalPages = Math.max(1, Math.ceil(total / size))

    const handlePageChange = useCallback(
      (newPage: number) => {
        if (newPage < 1 || newPage > totalPages) return
        setPage(newPage)
        onPageChange?.(newPage)
      },
      [totalPages, onPageChange],
    )

    const handleSizeChange = useCallback(
      (e: React.ChangeEvent<HTMLSelectElement>) => {
        const newSize = Number(e.target.value)
        setSize(newSize)
        setPage(1)
        onSizeChange?.(newSize)
        onPageChange?.(1)
      },
      [onSizeChange, onPageChange],
    )

    // 生成可见页码
    const getVisiblePages = (): (number | '...')[] => {
      if (totalPages <= 7) {
        return Array.from({ length: totalPages }, (_, i) => i + 1)
      }
      const pages: (number | '...')[] = [1]
      if (page > 3) pages.push('...')
      const start = Math.max(2, page - 1)
      const end = Math.min(totalPages - 1, page + 1)
      for (let i = start; i <= end; i++) pages.push(i)
      if (page < totalPages - 2) pages.push('...')
      pages.push(totalPages)
      return pages
    }

    const btnBase: React.CSSProperties = {
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      minWidth: small ? '24px' : '28px',
      height: small ? '24px' : '28px',
      padding: '0 6px',
      margin: '0 2px',
      border: background ? 'none' : '1px solid #dcdfe6',
      borderRadius: '4px',
      cursor: 'pointer',
      fontSize: small ? '12px' : '13px',
      lineHeight: '1',
      transition: 'all 0.15s',
      fontFamily: 'inherit',
    }

    const activeBg = '#409eff'

    return (
      <div
        ref={ref}
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          gap: '8px',
          padding: '8px',
          backgroundColor,
          ...style,
        }}
        {...rest}
      >
        {/* Prev */}
        <button
          style={{
            ...btnBase,
            backgroundColor: background ? '#f0f2f5' : '#fff',
            color: page <= 1 ? '#c0c4cc' : '#303133',
            cursor: page <= 1 ? 'not-allowed' : 'pointer',
          }}
          disabled={page <= 1}
          onClick={() => handlePageChange(page - 1)}
          aria-label="Previous page"
        >
          &lt;
        </button>

        {/* Page numbers */}
        {getVisiblePages().map((p, i) =>
          p === '...' ? (
            <span key={`ellipsis-${i}`} style={{ ...btnBase, cursor: 'default', border: 'none' }}>
              …
            </span>
          ) : (
            <button
              key={p}
              style={{
                ...btnBase,
                backgroundColor: p === page ? activeBg : background ? '#f0f2f5' : '#fff',
                color: p === page ? '#fff' : '#303133',
                fontWeight: p === page ? 600 : 400,
              }}
              onClick={() => handlePageChange(p)}
              aria-current={p === page ? 'page' : undefined}
            >
              {p}
            </button>
          ),
        )}

        {/* Next */}
        <button
          style={{
            ...btnBase,
            backgroundColor: background ? '#f0f2f5' : '#fff',
            color: page >= totalPages ? '#c0c4cc' : '#303133',
            cursor: page >= totalPages ? 'not-allowed' : 'pointer',
          }}
          disabled={page >= totalPages}
          onClick={() => handlePageChange(page + 1)}
          aria-label="Next page"
        >
          &gt;
        </button>

        {/* Size selector */}
        {pageSizes.length > 0 && (
          <select
            value={size}
            onChange={handleSizeChange}
            style={{
              height: small ? '24px' : '28px',
              borderRadius: '4px',
              border: '1px solid #dcdfe6',
              fontSize: small ? '12px' : '13px',
              padding: '0 4px',
              outline: 'none',
            }}
          >
            {pageSizes.map((s) => (
              <option key={s} value={s}>
                {s} 条/页
              </option>
            ))}
          </select>
        )}

        {/* Total */}
        <span style={{ fontSize: small ? '12px' : '13px', color: '#606266' }}>共 {total} 条</span>
      </div>
    )
  },
)

Pagination.displayName = 'Pagination'
