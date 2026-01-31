import React, { forwardRef } from 'react'

export interface VideoProps extends React.VideoHTMLAttributes<HTMLVideoElement> {
  poster?: string
  fit?: 'fill' | 'contain' | 'cover' | 'none' | 'scale-down'
}

export const Video = forwardRef<HTMLVideoElement, VideoProps>(
  ({ src, poster, fit = 'contain', style, ...props }, ref) => {
    return (
      <video
        ref={ref}
        src={src}
        poster={poster}
        style={{
          objectFit: fit,
          ...style,
        }}
        {...props}
      />
    )
  }
)

Video.displayName = 'Video'
