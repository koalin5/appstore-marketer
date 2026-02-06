import type { FontOption } from '../types'
import { FONT_OPTIONS } from '../presets/colors'

interface FontPickerProps {
  font: FontOption
  onChange: (font: FontOption) => void
  label?: string
}

export default function FontPicker({ font, onChange, label = 'Font' }: FontPickerProps) {
  return (
    <div>
      <label className="block text-sm text-gray-600 font-medium mb-2">{label}</label>
      <select
        value={font}
        onChange={(e) => onChange(e.target.value as FontOption)}
        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:bg-white transition-all"
      >
        {FONT_OPTIONS.map((option) => (
          <option key={option.id} value={option.id}>
            {option.name}
          </option>
        ))}
      </select>
    </div>
  )
}
