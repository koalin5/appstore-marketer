import { useState } from 'react'

interface ExportPanelProps {
  slideCount: number
  isExporting: boolean
  localeCount: number
  onExportCurrent: () => void
  onExportAll: () => void
  onExportAllLocales: () => void
}

export default function ExportPanel({
  slideCount,
  isExporting,
  localeCount,
  onExportCurrent,
  onExportAll,
  onExportAllLocales,
}: ExportPanelProps) {
  const [showMenu, setShowMenu] = useState(false)

  const handleExportCurrent = () => {
    setShowMenu(false)
    onExportCurrent()
  }

  const handleExportAll = () => {
    setShowMenu(false)
    onExportAll()
  }

  const handleExportAllLocales = () => {
    setShowMenu(false)
    onExportAllLocales()
  }

  return (
    <div className="relative">
      <button
        onClick={() => setShowMenu(!showMenu)}
        disabled={isExporting}
        className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-lg text-sm font-medium hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        <span>⬇</span>
        {isExporting ? 'Exporting...' : 'Export'}
      </button>

      {showMenu && !isExporting && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setShowMenu(false)}
          />

          {/* Dropdown menu */}
          <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 z-50 overflow-hidden">
            <button
              onClick={handleExportCurrent}
              className="w-full px-4 py-3 text-left text-sm hover:bg-gray-50 transition-colors flex items-center gap-2"
            >
              <span>📄</span>
              Export Current
            </button>
            <button
              onClick={handleExportAll}
              className="w-full px-4 py-3 text-left text-sm hover:bg-gray-50 transition-colors flex items-center gap-2 border-t border-gray-100"
            >
              <span>📦</span>
              Export All ({slideCount})
            </button>
            {localeCount > 1 && (
              <button
                onClick={handleExportAllLocales}
                className="w-full px-4 py-3 text-left text-sm hover:bg-gray-50 transition-colors flex items-center gap-2 border-t border-gray-100"
              >
                <span>🌐</span>
                Export All Locales ({localeCount})
              </button>
            )}
          </div>
        </>
      )}
    </div>
  )
}
