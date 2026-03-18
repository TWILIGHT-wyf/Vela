import React, { forwardRef, useEffect, useImperativeHandle, useRef } from 'react'

export interface HtmlProps extends React.HTMLAttributes<HTMLDivElement> {
  content: string
  sanitize?: boolean
  allowScripts?: boolean
}

/**
 * HTML content renderer with optional sanitization
 */
export const Html = forwardRef<HTMLDivElement, HtmlProps>(
  ({ content, sanitize = true, allowScripts = false, style, className, ...props }, ref) => {
    const containerRef = useRef<HTMLDivElement>(null)

    useImperativeHandle(ref, () => containerRef.current as HTMLDivElement, [])

    useEffect(() => {
      if (!containerRef.current || !allowScripts) return

      // Execute scripts if allowed
      const scripts = containerRef.current.querySelectorAll('script')
      scripts.forEach((script) => {
        const newScript = document.createElement('script')
        Array.from(script.attributes).forEach((attr) => {
          newScript.setAttribute(attr.name, attr.value)
        })
        newScript.textContent = script.textContent
        script.parentNode?.replaceChild(newScript, script)
      })
    }, [content, allowScripts])

    const sanitizedContent = React.useMemo(() => {
      if (!sanitize) return content

      // Basic XSS prevention
      let html = content || ''

      // Remove dangerous tags
      html = html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      html = html.replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
      html = html.replace(/on\w+\s*=/gi, 'data-blocked-event=')
      html = html.replace(/javascript:/gi, 'blocked:')

      return html
    }, [content, sanitize])

    return (
      <div
        ref={containerRef}
        className={`vela-html ${className || ''}`}
        style={{
          ...style,
        }}
        dangerouslySetInnerHTML={{ __html: sanitizedContent }}
        {...props}
      />
    )
  },
)

Html.displayName = 'Html'
