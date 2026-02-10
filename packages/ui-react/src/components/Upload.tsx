import React, { forwardRef } from 'react'

export interface UploadProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'onChange'> {
  value?: string[]
  onChange?: (value: string[]) => void
  multiple?: boolean
  limit?: number
  disabled?: boolean
  accept?: string
  buttonText?: string
}

export const Upload = forwardRef<HTMLDivElement, UploadProps>(
  (
    {
      value = [],
      onChange,
      multiple = false,
      limit = 3,
      disabled = false,
      accept = '',
      buttonText = 'Upload',
      style,
      ...props
    },
    ref,
  ) => {
    const handleFileChange = (files: FileList | null) => {
      if (!files) {
        return
      }

      const selected = Array.from(files).slice(0, limit)
      const nextValue = selected.map((file) => file.name)
      onChange?.(nextValue)
    }

    return (
      <div
        ref={ref}
        style={{ display: 'inline-flex', flexDirection: 'column', gap: '8px', ...style }}
        {...props}
      >
        <label
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '100px',
            height: '32px',
            borderRadius: '4px',
            backgroundColor: disabled ? '#a0cfff' : '#409eff',
            color: '#fff',
            cursor: disabled ? 'not-allowed' : 'pointer',
            fontSize: '14px',
          }}
        >
          {buttonText}
          <input
            type="file"
            multiple={multiple}
            accept={accept}
            disabled={disabled}
            onChange={(e) => handleFileChange(e.target.files)}
            style={{ display: 'none' }}
          />
        </label>
        {value.length > 0 && (
          <ul style={{ margin: 0, paddingLeft: '18px', color: '#666', fontSize: '12px' }}>
            {value.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        )}
      </div>
    )
  },
)

Upload.displayName = 'Upload'
