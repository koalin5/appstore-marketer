import { useState, useRef, useEffect } from 'react'
import type { TextConfig } from '../types'
import { FONT_OPTIONS } from '../presets/colors'

interface TextOverlayProps {
  text: TextConfig
  width: number
  onTextDrag: (verticalPosition: number) => void
}

export default function TextOverlay({
  text,
  width,
  onTextDrag,
}: TextOverlayProps) {
  const [isDragging, setIsDragging] = useState(false)
  const textRef = useRef<HTMLDivElement>(null)

  const fontSize = text.size <= 60 ? 48 : text.size <= 80 ? 64 : 80
  const fontFamily = FONT_OPTIONS.find((f) => f.id === text.font)?.family || FONT_OPTIONS[1].family
  const textColor = text.color === 'white' ? '#FFFFFF' : text.color === 'black' ? '#000000' : '#000000'

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true)
    e.preventDefault()
    e.stopPropagation()
  }

  useEffect(() => {
    if (!isDragging) return

    const handleMouseMove = (e: MouseEvent) => {
      const container = document.querySelector('[data-canvas-container]')
      if (!container) return

      const rect = container.getBoundingClientRect()
      const relativeY = (e.clientY - rect.top) / rect.height
      const yPercent = relativeY * 100

      // Constrain to top third of canvas
      const constrainedY = Math.max(5, Math.min(33, yPercent))
      onTextDrag(constrainedY)
    }

    const handleMouseUp = () => {
      setIsDragging(false)
    }

    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseup', handleMouseUp)

    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
    }
  }, [isDragging, onTextDrag])

  return (
    <div
      ref={textRef}
      className="absolute pointer-events-auto"
      style={{
        left: text.align === 'left' ? 60 : text.align === 'center' ? '50%' : 'auto',
        right: text.align === 'right' ? 60 : 'auto',
        top: `${text.verticalPosition}%`,
        transform:
          text.align === 'center'
            ? 'translate(-50%, -50%)'
            : text.align === 'right'
            ? 'translate(0, -50%)'
            : 'translate(0, -50%)',
        fontFamily,
        fontSize: `${fontSize}px`,
        color: textColor,
        fontWeight: 700,
        textAlign: text.align,
        maxWidth: width - 120,
        lineHeight: 1.2,
        whiteSpace: 'nowrap',
        cursor: isDragging ? 'grabbing' : 'grab',
        zIndex: 1000,
      }}
      onMouseDown={handleMouseDown}
    >
      {text.content || 'Your headline here'}
    </div>
  )
}
