import { useState } from 'react'
import { COMMON_LOCALES } from '../utils/locale'

interface LocaleManagerProps {
  locales: string[]
  defaultLocale: string | undefined
  onAddLocale: (code: string) => void
  onRemoveLocale: (code: string) => void
  onSetDefaultLocale: (code: string) => void
  onClose: () => void
}

export default function LocaleManager({
  locales,
  defaultLocale,
  onAddLocale,
  onRemoveLocale,
  onSetDefaultLocale,
  onClose,
}: LocaleManagerProps) {
  const [selectedCode, setSelectedCode] = useState('')

  const availableLocales = COMMON_LOCALES.filter((l) => !locales.includes(l.code))

  const handleAdd = () => {
    if (!selectedCode) return
    onAddLocale(selectedCode)
    setSelectedCode('')
  }

  const getLocaleName = (code: string) => {
    return COMMON_LOCALES.find((l) => l.code === code)?.name ?? code
  }

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/20 z-40" onClick={onClose} />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div
          className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
            <h2 className="text-sm font-semibold text-gray-900">Localization</h2>
            <button
              onClick={onClose}
              className="p-1 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </button>
          </div>

          {/* Locale list */}
          <div className="px-5 py-3 max-h-60 overflow-y-auto">
            {locales.length === 0 ? (
              <p className="text-sm text-gray-400 py-2">
                No locales added yet. Add your first language below.
              </p>
            ) : (
              <div className="space-y-1">
                {locales.map((code) => (
                  <div
                    key={code}
                    className="flex items-center justify-between py-2 px-2.5 rounded-lg hover:bg-gray-50 group"
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="text-sm font-medium text-gray-800">{code}</span>
                      <span className="text-xs text-gray-400">{getLocaleName(code)}</span>
                      {code === defaultLocale && (
                        <span className="text-[10px] font-semibold uppercase tracking-wider text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded">
                          Default
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      {code !== defaultLocale && (
                        <button
                          onClick={() => onSetDefaultLocale(code)}
                          className="px-2 py-1 text-[11px] font-medium text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                          title="Set as default"
                        >
                          Set default
                        </button>
                      )}
                      <button
                        onClick={() => onRemoveLocale(code)}
                        className="p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
                        title="Remove locale"
                      >
                        <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                          <path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                        </svg>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Add locale */}
          <div className="px-5 py-4 border-t border-gray-100 bg-gray-50/50">
            <div className="flex gap-2">
              <select
                value={selectedCode}
                onChange={(e) => setSelectedCode(e.target.value)}
                className="flex-1 px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-gray-900 focus:border-transparent"
              >
                <option value="">Select language...</option>
                {availableLocales.map((l) => (
                  <option key={l.code} value={l.code}>
                    {l.name} ({l.code})
                  </option>
                ))}
              </select>
              <button
                onClick={handleAdd}
                disabled={!selectedCode}
                className="px-4 py-2 bg-gray-900 text-white rounded-lg text-sm font-medium hover:bg-gray-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                Add
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
