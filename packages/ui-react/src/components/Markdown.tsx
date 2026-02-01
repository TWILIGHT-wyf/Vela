import React, { forwardRef, useMemo } from 'react'

export interface MarkdownProps extends React.HTMLAttributes<HTMLDivElement> {
  content: string
  sanitize?: boolean
}

/**
 * Simple Markdown renderer
 * Note: For production, consider using a library like react-markdown
 */
export const Markdown = forwardRef<HTMLDivElement, MarkdownProps>(
  ({ content, sanitize = true, style, className, ...props }, ref) => {
    const html = useMemo(() => {
      let text = content || ''

      // Basic sanitization
      if (sanitize) {
        text = text
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;')
      }

      // Headers
      text = text.replace(/^### (.+)$/gm, '<h3>$1</h3>')
      text = text.replace(/^## (.+)$/gm, '<h2>$1</h2>')
      text = text.replace(/^# (.+)$/gm, '<h1>$1</h1>')

      // Bold and Italic
      text = text.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      text = text.replace(/\*(.+?)\*/g, '<em>$1</em>')
      text = text.replace(/__(.+?)__/g, '<strong>$1</strong>')
      text = text.replace(/_(.+?)_/g, '<em>$1</em>')

      // Code
      text = text.replace(/`(.+?)`/g, '<code>$1</code>')

      // Links
      text = text.replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>')

      // Line breaks
      text = text.replace(/\n\n/g, '</p><p>')
      text = text.replace(/\n/g, '<br/>')

      // Lists
      text = text.replace(/^\- (.+)$/gm, '<li>$1</li>')
      text = text.replace(/(<li>.*<\/li>\n?)+/g, '<ul>$&</ul>')

      // Wrap in paragraph
      text = `<p>${text}</p>`

      return text
    }, [content, sanitize])

    return (
      <div
        ref={ref}
        className={`vela-markdown ${className || ''}`}
        style={{
          lineHeight: 1.6,
          ...style,
        }}
        dangerouslySetInnerHTML={{ __html: html }}
        {...props}
      />
    )
  }
)

Markdown.displayName = 'Markdown'
