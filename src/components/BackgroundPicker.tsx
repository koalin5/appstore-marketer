import { useRef, useState } from 'react'
import type { BackgroundConfig } from '../types'
import { SOLID_COLORS, GRADIENT_PRESETS } from '../presets/colors'
import { saveBackgroundImage } from '../utils/storage'

interface BackgroundPickerProps {
  background: BackgroundConfig
  onChange: (background: BackgroundConfig) => void
  onApplyToAll?: () => void
}

export default function BackgroundPicker({
  background,
  onChange,
  onApplyToAll,
}: BackgroundPickerProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [customStart, setCustomStart] = useState(background.gradient?.colors[0] || '#FFFFFF')
  const [customEnd, setCustomEnd] = useState(background.gradient?.colors[1] || '#E8F5E9')
  const [gradientDirection, setGradientDirection] = useState(background.gradient?.direction || 180)

  const handleSolidColorSelect = (color: string) => {
    onChange({
      type: 'solid',
      color,
    })
  }

  const handleGradientSelect = (gradient: typeof GRADIENT_PRESETS[0]) => {
    onChange({
      type: 'gradient',
      gradient: {
        colors: gradient.colors,
        direction: gradient.direction,
      },
    })
    setCustomStart(gradient.colors[0])
    setCustomEnd(gradient.colors[1])
    setGradientDirection(gradient.direction)
  }

  const handleCustomGradient = (start: string, end: string, direction: number) => {
    setCustomStart(start)
    setCustomEnd(end)
    setGradientDirection(direction)
    onChange({
      type: 'gradient',
      gradient: {
        colors: [start, end],
        direction,
      },
    })
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const blob = new Blob([file], { type: file.type })
    const imageRef = `bg-image-${crypto.randomUUID()}`
    await saveBackgroundImage(imageRef, blob)

    onChange({
      type: 'image',
      imageRef,
      blur: 0,
    })
  }

  const handleBlurChange = (blur: number) => {
    if (background.type === 'image') {
      onChange({
        ...background,
        blur,
      })
    }
  }

  return (
    <div className="space-y-4">
      {/* Header with Apply to All */}
      <div className="flex items-center justify-between">
        <h3 className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Background</h3>
        {onApplyToAll && (
          <button
            onClick={onApplyToAll}
            className="text-xs text-gray-500 hover:text-gray-900 font-medium transition-colors"
          >
            Apply to all
          </button>
        )}
      </div>

      {/* Type Tabs */}
      <div className="flex gap-1 p-1 bg-gray-100 rounded-lg">
        <button
          onClick={() => onChange({ type: 'solid', color: background.color || '#FFFFFF' })}
          className={`flex-1 px-3 py-2 text-sm font-medium rounded-md transition-all ${
            background.type === 'solid'
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Solid
        </button>
        <button
          onClick={() =>
            onChange({
              type: 'gradient',
              gradient: background.gradient || { colors: [customStart, customEnd], direction: gradientDirection },
            })
          }
          className={`flex-1 px-3 py-2 text-sm font-medium rounded-md transition-all ${
            background.type === 'gradient'
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Gradient
        </button>
        <button
          onClick={() => fileInputRef.current?.click()}
          className={`flex-1 px-3 py-2 text-sm font-medium rounded-md transition-all ${
            background.type === 'image'
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Image
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleImageUpload}
          className="hidden"
        />
      </div>

      {/* Solid Colors */}
      {background.type === 'solid' && (
        <div className="grid grid-cols-5 gap-2">
          {SOLID_COLORS.map((color) => (
            <button
              key={color}
              onClick={() => handleSolidColorSelect(color)}
              className={`aspect-square rounded-xl border-2 transition-all hover:scale-105 ${
                background.color === color 
                  ? 'border-gray-900 ring-2 ring-gray-900 ring-offset-2' 
                  : 'border-gray-200 hover:border-gray-300'
              }`}
              style={{ backgroundColor: color }}
              title={color}
            />
          ))}
        </div>
      )}

      {/* Gradients */}
      {background.type === 'gradient' && (
        <div className="space-y-4">
          <div className="grid grid-cols-5 gap-2">
            {GRADIENT_PRESETS.map((gradient) => (
              <button
                key={gradient.name}
                onClick={() => handleGradientSelect(gradient)}
                className={`aspect-square rounded-xl border-2 transition-all hover:scale-105 ${
                  background.gradient?.colors[0] === gradient.colors[0] &&
                  background.gradient?.colors[1] === gradient.colors[1]
                    ? 'border-gray-900 ring-2 ring-gray-900 ring-offset-2'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                style={{
                  background: `linear-gradient(${gradient.direction}deg, ${gradient.colors.join(', ')})`,
                }}
                title={gradient.name}
              />
            ))}
          </div>

          {/* Custom Colors */}
          <div className="space-y-3 pt-2">
            <div className="text-sm text-gray-600 font-medium">Custom Colors</div>
            <div className="flex gap-3">
              <div className="flex-1">
                <label className="block text-xs text-gray-500 mb-1">Start</label>
                <div className="relative">
                  <input
                    type="color"
                    value={customStart}
                    onChange={(e) => handleCustomGradient(e.target.value, customEnd, gradientDirection)}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  <div
                    className="w-full h-10 rounded-lg border-2 border-gray-200"
                    style={{ backgroundColor: customStart }}
                  />
                </div>
              </div>
              <div className="flex-1">
                <label className="block text-xs text-gray-500 mb-1">End</label>
                <div className="relative">
                  <input
                    type="color"
                    value={customEnd}
                    onChange={(e) => handleCustomGradient(customStart, e.target.value, gradientDirection)}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  <div
                    className="w-full h-10 rounded-lg border-2 border-gray-200"
                    style={{ backgroundColor: customEnd }}
                  />
                </div>
              </div>
            </div>

            {/* Direction */}
            <div>
              <label className="block text-xs text-gray-500 mb-1">Gradient Direction</label>
              <select
                value={gradientDirection}
                onChange={(e) => handleCustomGradient(customStart, customEnd, Number(e.target.value))}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
              >
                <option value={180}>Top to Bottom</option>
                <option value={0}>Bottom to Top</option>
                <option value={90}>Left to Right</option>
                <option value={270}>Right to Left</option>
                <option value={135}>Diagonal ↘</option>
                <option value={225}>Diagonal ↙</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Image Controls */}
      {background.type === 'image' && (
        <div className="space-y-3">
          <button
            onClick={() => fileInputRef.current?.click()}
            className="w-full py-3 border-2 border-dashed border-gray-300 rounded-xl text-sm text-gray-600 hover:border-blue-400 hover:bg-blue-50 transition-colors"
          >
            {background.imageRef ? '✓ Image uploaded - Click to change' : 'Click to upload image'}
          </button>
          
          {background.blur !== undefined && (
            <div>
              <div className="flex justify-between text-xs text-gray-500 mb-1">
                <span>Blur</span>
                <span>{background.blur}px</span>
              </div>
              <input
                type="range"
                min="0"
                max="20"
                value={background.blur}
                onChange={(e) => handleBlurChange(Number(e.target.value))}
                className="w-full accent-gray-900"
              />
            </div>
          )}
        </div>
      )}
    </div>
  )
}
