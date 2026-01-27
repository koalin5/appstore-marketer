import { get, set, del } from 'idb-keyval'
import type { Project } from '../types'

const PROJECTS_KEY = 'ios-screenshot-projects'
const CURRENT_PROJECT_KEY = 'ios-screenshot-current-project'

export async function saveProject(project: Project): Promise<void> {
  const projects = await getProjects()
  const existingIndex = projects.findIndex((p) => p.id === project.id)
  
  if (existingIndex >= 0) {
    projects[existingIndex] = project
  } else {
    projects.push(project)
  }
  
  localStorage.setItem(PROJECTS_KEY, JSON.stringify(projects))
  localStorage.setItem(CURRENT_PROJECT_KEY, project.id)
}

export async function getProjects(): Promise<Project[]> {
  const data = localStorage.getItem(PROJECTS_KEY)
  return data ? JSON.parse(data) : []
}

export async function getProject(id: string): Promise<Project | null> {
  const projects = await getProjects()
  return projects.find((p) => p.id === id) || null
}

export async function deleteProject(id: string): Promise<void> {
  const projects = await getProjects()
  const filtered = projects.filter((p) => p.id !== id)
  localStorage.setItem(PROJECTS_KEY, JSON.stringify(filtered))
  
  // Delete associated assets
  const project = projects.find((p) => p.id === id)
  if (project) {
    for (const slide of project.slides) {
      if (slide.screenshotRef) {
        await del(`screenshot-${slide.id}`)
      }
      if (slide.background.imageRef) {
        await del(`bg-image-${slide.id}`)
      }
    }
  }
}

export async function getCurrentProjectId(): Promise<string | null> {
  return localStorage.getItem(CURRENT_PROJECT_KEY)
}

export async function setCurrentProjectId(id: string): Promise<void> {
  localStorage.setItem(CURRENT_PROJECT_KEY, id)
}

export async function saveScreenshot(slideId: string, blob: Blob): Promise<void> {
  await set(`screenshot-${slideId}`, blob)
}

export async function getScreenshot(slideId: string): Promise<Blob | undefined> {
  return await get(`screenshot-${slideId}`)
}

export async function saveBackgroundImage(slideId: string, blob: Blob): Promise<void> {
  await set(`bg-image-${slideId}`, blob)
}

export async function getBackgroundImage(slideId: string): Promise<Blob | undefined> {
  return await get(`bg-image-${slideId}`)
}

export function createNewProject(name: string = 'Untitled Project'): Project {
  return {
    id: crypto.randomUUID(),
    name,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    slides: [
      {
        id: crypto.randomUUID(),
        background: {
          type: 'solid',
          color: '#F0F4F8',
        },
        text: {
          content: 'Your headline here',
          font: 'inter',
          size: 96,
          color: 'black',
          align: 'center',
          verticalPosition: 12,
        },
        device: {
          model: 'iphone-16-pro-max',
          angle: 'straight',
          verticalPosition: 35,
        },
        screenshotRef: null,
      },
    ],
  }
}
