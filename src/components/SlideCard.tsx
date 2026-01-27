import { useRef } from 'react'
import type { Slide } from '../types'
import Canvas from './Canvas'

interface SlideCardProps {
  slide: Slide
  isSelected: boolean
  onSelect: () => void
  onDelete: () => void
}

export default function SlideCard({
  slide,
  isSelected,
  onSelect,
  onDelete,
}: SlideCardProps) {
  const cardRef = useRef<HTMLDivElement>(null)

  return (
    <div
      ref={cardRef}
      data-slide-id={slide.id}
      className={`relative group cursor-pointer transition-all rounded-lg overflow-hidden ${
        isSelected ? 'ring-2 ring-blue-500 ring-offset-1' : 'hover:ring-1 hover:ring-gray-300'
      }`}
      onClick={onSelect}
    >
      <div className="bg-white rounded-lg shadow-sm">
        <Canvas slide={slide} />
      </div>
      
      {/* Delete button */}
      {slide.id && (
        <button
          onClick={(e) => {
            e.stopPropagation()
            if (confirm('Delete this slide?')) {
              onDelete()
            }
          }}
          className="absolute top-1 right-1 w-6 h-6 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-sm font-bold hover:bg-red-600 shadow-md z-50"
          title="Delete slide"
        >
          ×
        </button>
      )}
    </div>
  )
}
