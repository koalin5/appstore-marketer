import { useState, useEffect, useRef } from 'react'
import type { Project } from '../types'
import { getAppIcon } from '../utils/storage'

interface ProjectSidebarProps {
  projects: Project[]
  currentProjectId: string | null
  onSelectProject: (id: string) => void
  onCreateProject: () => void
  onRenameProject: (id: string, newName: string) => void
  onDeleteProject: (id: string) => void
  onUpdateAppIcon: (id: string, file: File) => void
}

function getPlaceholderColor(id: string): string {
  let hash = 0
  for (let i = 0; i < id.length; i++) {
    hash = id.charCodeAt(i) + ((hash << 5) - hash)
  }
  const hue = ((hash % 360) + 360) % 360
  return `hsl(${hue}, 50%, 55%)`
}

export default function ProjectSidebar({
  projects,
  currentProjectId,
  onSelectProject,
  onCreateProject,
  onRenameProject,
  onDeleteProject,
  onUpdateAppIcon,
}: ProjectSidebarProps) {
  const [iconUrls, setIconUrls] = useState<Record<string, string>>({})
  const [editingProjectId, setEditingProjectId] = useState<string | null>(null)
  const [editingName, setEditingName] = useState('')
  const [contextMenuProjectId, setContextMenuProjectId] = useState<string | null>(null)
  const renameInputRef = useRef<HTMLInputElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const iconTargetProjectId = useRef<string | null>(null)

  // Load app icon blobs as object URLs
  useEffect(() => {
    let cancelled = false
    const newUrls: Record<string, string> = {}

    async function loadIcons() {
      for (const project of projects) {
        if (project.appIcon) {
          const blob = await getAppIcon(project.id)
          if (blob && !cancelled) {
            newUrls[project.id] = URL.createObjectURL(blob)
          }
        }
      }
      if (!cancelled) {
        setIconUrls((prev) => {
          // Revoke old URLs
          Object.values(prev).forEach(URL.revokeObjectURL)
          return newUrls
        })
      }
    }

    loadIcons()
    return () => {
      cancelled = true
    }
  }, [projects])

  // Cleanup URLs on unmount
  useEffect(() => {
    return () => {
      Object.values(iconUrls).forEach(URL.revokeObjectURL)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Focus rename input when editing starts
  useEffect(() => {
    if (editingProjectId && renameInputRef.current) {
      renameInputRef.current.focus()
      renameInputRef.current.select()
    }
  }, [editingProjectId])

  const commitRename = () => {
    if (editingProjectId && editingName.trim()) {
      onRenameProject(editingProjectId, editingName.trim())
    }
    setEditingProjectId(null)
    setEditingName('')
  }

  const cancelRename = () => {
    setEditingProjectId(null)
    setEditingName('')
  }

  const startRename = (project: Project) => {
    setContextMenuProjectId(null)
    setEditingProjectId(project.id)
    setEditingName(project.name)
  }

  const startChangeIcon = (projectId: string) => {
    setContextMenuProjectId(null)
    iconTargetProjectId.current = projectId
    fileInputRef.current?.click()
  }

  const handleIconFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file && iconTargetProjectId.current) {
      onUpdateAppIcon(iconTargetProjectId.current, file)
    }
    e.target.value = ''
  }

  const handleDelete = (project: Project) => {
    setContextMenuProjectId(null)
    if (projects.length <= 1) return
    const confirmed = window.confirm(`Delete "${project.name}"? This cannot be undone.`)
    if (confirmed) {
      onDeleteProject(project.id)
    }
  }

  const sortedProjects = [...projects].sort((a, b) => b.updatedAt - a.updatedAt)

  return (
    <div className="w-60 bg-white border-r border-gray-200 flex flex-col h-full flex-shrink-0">
      {/* Header */}
      <div className="px-4 py-4 flex items-center justify-between flex-shrink-0">
        <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Projects</span>
        <button
          onClick={onCreateProject}
          className="w-7 h-7 flex items-center justify-center rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-500 hover:text-gray-700 transition-colors"
          title="New project"
        >
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
            <path d="M8 3v10M3 8h10" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          </svg>
        </button>
      </div>

      {/* Project list */}
      <div className="flex-1 overflow-y-auto px-2 pb-4">
        {sortedProjects.map((project) => {
          const isActive = project.id === currentProjectId
          const isEditing = project.id === editingProjectId
          const iconUrl = iconUrls[project.id]
          const firstLetter = (project.name || 'U')[0].toUpperCase()

          return (
            <div key={project.id} className="relative">
              <button
                onClick={() => {
                  if (!isEditing) onSelectProject(project.id)
                }}
                onContextMenu={(e) => {
                  e.preventDefault()
                  setContextMenuProjectId(contextMenuProjectId === project.id ? null : project.id)
                }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all group ${
                  isActive
                    ? 'bg-gray-100'
                    : 'hover:bg-gray-50'
                }`}
              >
                {/* App icon / placeholder */}
                <div
                  className="w-9 h-9 rounded-xl flex-shrink-0 flex items-center justify-center overflow-hidden"
                  style={iconUrl ? undefined : { backgroundColor: getPlaceholderColor(project.id) }}
                >
                  {iconUrl ? (
                    <img src={iconUrl} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-white font-semibold text-sm">{firstLetter}</span>
                  )}
                </div>

                {/* Name or rename input */}
                <div className="flex-1 min-w-0">
                  {isEditing ? (
                    <input
                      ref={renameInputRef}
                      value={editingName}
                      onChange={(e) => setEditingName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') commitRename()
                        if (e.key === 'Escape') cancelRename()
                      }}
                      onBlur={commitRename}
                      className="w-full px-1.5 py-0.5 bg-white border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-gray-900 focus:border-transparent outline-none"
                      onClick={(e) => e.stopPropagation()}
                    />
                  ) : (
                    <div className="truncate text-sm font-medium text-gray-800">
                      {project.name}
                    </div>
                  )}
                  <div className="text-[11px] text-gray-400 truncate">
                    {project.slides.length} slide{project.slides.length !== 1 ? 's' : ''}
                  </div>
                </div>

                {/* Three-dot menu button */}
                {!isEditing && (
                  <div
                    className={`flex-shrink-0 w-6 h-6 flex items-center justify-center rounded-md transition-colors ${
                      contextMenuProjectId === project.id
                        ? 'bg-gray-200 text-gray-600'
                        : 'opacity-0 group-hover:opacity-100 hover:bg-gray-200 text-gray-400 hover:text-gray-600'
                    }`}
                    onClick={(e) => {
                      e.stopPropagation()
                      setContextMenuProjectId(contextMenuProjectId === project.id ? null : project.id)
                    }}
                  >
                    <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                      <circle cx="8" cy="3.5" r="1.2" fill="currentColor" />
                      <circle cx="8" cy="8" r="1.2" fill="currentColor" />
                      <circle cx="8" cy="12.5" r="1.2" fill="currentColor" />
                    </svg>
                  </div>
                )}
              </button>

              {/* Context menu */}
              {contextMenuProjectId === project.id && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setContextMenuProjectId(null)}
                  />
                  <div className="absolute right-2 top-full -mt-1 w-40 bg-white rounded-lg shadow-lg border border-gray-200 z-50 overflow-hidden py-1">
                    <button
                      onClick={() => startRename(project)}
                      className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      Rename
                    </button>
                    <button
                      onClick={() => startChangeIcon(project.id)}
                      className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      Change Icon
                    </button>
                    {projects.length > 1 && (
                      <button
                        onClick={() => handleDelete(project)}
                        className="w-full px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50 transition-colors"
                      >
                        Delete
                      </button>
                    )}
                  </div>
                </>
              )}
            </div>
          )
        })}
      </div>

      {/* Hidden file input for icon upload */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleIconFileChange}
      />
    </div>
  )
}
