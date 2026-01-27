import type { Slide } from '../types'

interface SlideManagerProps {
  slides: Slide[]
  currentSlideIndex: number
  onSlideSelect: (index: number) => void
  onSlideAdd: () => void
  onSlideDuplicate: (index: number) => void
  onSlideDelete: (index: number) => void
}

export default function SlideManager({
  slides,
  currentSlideIndex,
  onSlideSelect,
  onSlideAdd,
  onSlideDuplicate,
  onSlideDelete,
}: SlideManagerProps) {
  return (
    <div className="flex items-center gap-2 p-4 bg-gray-50 border-t">
      <button
        onClick={onSlideAdd}
        className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 text-sm font-medium"
      >
        + Add Slide
      </button>
      <div className="flex gap-2 overflow-x-auto flex-1">
        {slides.map((slide, index) => (
          <div
            key={slide.id}
            className={`relative flex-shrink-0 w-24 h-16 rounded border-2 cursor-pointer ${
              index === currentSlideIndex
                ? 'border-blue-500'
                : 'border-gray-300 hover:border-gray-400'
            }`}
            onClick={() => onSlideSelect(index)}
          >
            <div className="absolute inset-0 bg-white rounded flex items-center justify-center text-xs text-gray-500">
              {index + 1}
            </div>
            <div className="absolute top-1 right-1 flex gap-1">
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  onSlideDuplicate(index)
                }}
                className="w-5 h-5 bg-gray-600 text-white rounded text-xs hover:bg-gray-700"
                title="Duplicate"
              >
                ⧉
              </button>
              {slides.length > 1 && (
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    onSlideDelete(index)
                  }}
                  className="w-5 h-5 bg-red-500 text-white rounded text-xs hover:bg-red-600"
                  title="Delete"
                >
                  ×
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
