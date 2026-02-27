import { useState, useEffect, useCallback } from 'react'
import type { Project } from './types'
import Editor from './components/Editor'
import ProjectSidebar from './components/ProjectSidebar'
import {
  getProjects,
  getProject,
  saveProject,
  deleteProject,
  createNewProject,
  getCurrentProjectId,
  setCurrentProjectId,
  saveAppIcon,
} from './utils/storage'

function App() {
  const [projects, setProjects] = useState<Project[]>([])
  const [currentProjectId, setCurrentProjectIdState] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function init() {
      let allProjects = await getProjects()
      let activeId = await getCurrentProjectId()

      if (allProjects.length === 0) {
        const newProject = createNewProject('My App')
        await saveProject(newProject)
        allProjects = [newProject]
        activeId = newProject.id
      }

      if (!activeId || !allProjects.find((p) => p.id === activeId)) {
        activeId = allProjects[0].id
      }

      await setCurrentProjectId(activeId!)
      setProjects(allProjects)
      setCurrentProjectIdState(activeId)
      setIsLoading(false)
    }
    init()
  }, [])

  const handleSelectProject = useCallback(async (id: string) => {
    await setCurrentProjectId(id)
    setCurrentProjectIdState(id)
  }, [])

  const handleCreateProject = useCallback(async () => {
    const newProject = createNewProject('Untitled App')
    await saveProject(newProject)
    await setCurrentProjectId(newProject.id)
    setProjects((prev) => [...prev, newProject])
    setCurrentProjectIdState(newProject.id)
  }, [])

  const handleRenameProject = useCallback(async (id: string, newName: string) => {
    const project = await getProject(id)
    if (!project) return
    const updated = { ...project, name: newName, updatedAt: Date.now() }
    await saveProject(updated)
    setProjects((prev) => prev.map((p) => (p.id === id ? updated : p)))
  }, [])

  const handleDeleteProject = useCallback(async (id: string) => {
    await deleteProject(id)
    setProjects((prev) => {
      const remaining = prev.filter((p) => p.id !== id)
      if (id === currentProjectId && remaining.length > 0) {
        const nextId = remaining[0].id
        setCurrentProjectId(nextId)
        setCurrentProjectIdState(nextId)
      }
      return remaining
    })
  }, [currentProjectId])

  const handleUpdateAppIcon = useCallback(async (id: string, file: File) => {
    await saveAppIcon(id, file)
    const project = await getProject(id)
    if (!project) return
    const updated = { ...project, appIcon: id, updatedAt: Date.now() }
    await saveProject(updated)
    setProjects((prev) => prev.map((p) => (p.id === id ? updated : p)))
  }, [])

  const handleProjectUpdated = useCallback((updatedProject: Project) => {
    setProjects((prev) => prev.map((p) => (p.id === updatedProject.id ? updatedProject : p)))
  }, [])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="text-gray-400 text-sm">Loading...</div>
      </div>
    )
  }

  return (
    <div className="h-screen flex">
      <ProjectSidebar
        projects={projects}
        currentProjectId={currentProjectId}
        onSelectProject={handleSelectProject}
        onCreateProject={handleCreateProject}
        onRenameProject={handleRenameProject}
        onDeleteProject={handleDeleteProject}
        onUpdateAppIcon={handleUpdateAppIcon}
      />
      {currentProjectId && (
        <Editor
          key={currentProjectId}
          projectId={currentProjectId}
          onProjectUpdated={handleProjectUpdated}
        />
      )}
    </div>
  )
}

export default App
