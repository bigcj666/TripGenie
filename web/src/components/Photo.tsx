import { useState } from 'react'

interface PhotoProps {
  src: string
  alt: string
  className?: string
}

export function Photo({ src, alt, className }: PhotoProps): React.ReactElement {
  const [failed, setFailed] = useState(false)
  if (!src || failed) {
    return (
      <span className={`ph ${className ?? ''}`} aria-hidden="true">
        {alt.slice(0, 1)}
      </span>
    )
  }
  return <img className={className} src={src} alt={alt} onError={() => setFailed(true)} />
}
