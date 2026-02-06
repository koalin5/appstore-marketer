import { get, set, del } from 'idb-keyval'
import type { Project } from '../types'

const PROJECTS_KEY = 'ios-screenshot-projects'
const CURRENT_PROJECT_KEY = 'ios-screenshot-current-project'
const SCREENSHOT_PREFIX = 'screenshot-'
const BG_IMAGE_PREFIX = 'bg-image-'
const DEFAULT_SUB_CAPTION_SIZE = 42

function withTextDefaults(project: Project): Project {
  return {
    ...project,
    slides: project.slides.map((slide) => ({
      ...slide,
      text: {
        ...slide.text,
        showSubCaption: slide.text.showSubCaption ?? false,
        subCaption: slide.text.subCaption ?? '',
        subCaptionFont: slide.text.subCaptionFont ?? slide.text.font,
        subCaptionSize:
          typeof slide.text.subCaptionSize === 'number'
            ? slide.text.subCaptionSize
            : DEFAULT_SUB_CAPTION_SIZE,
      },
    })),
  }
}

function toAssetKey(prefix: string, ref: string): string {
  return ref.startsWith(prefix) ? ref : `${prefix}${ref}`
}

function toLegacyDoublePrefixedKey(prefix: string, ref: string): string | null {
  if (!ref.startsWith(prefix)) return null
  return `${prefix}${ref}`
}

async function readAssetWithLegacyFallback(prefix: string, ref: string): Promise<Blob | undefined> {
  const canonicalKey = toAssetKey(prefix, ref)
  const blob = await get<Blob>(canonicalKey)
  if (blob) return blob

  const legacyKey = toLegacyDoublePrefixedKey(prefix, ref)
  if (!legacyKey) return undefined

  const legacyBlob = await get<Blob>(legacyKey)
  if (!legacyBlob) return undefined

  // Migrate old double-prefixed keys into canonical keys.
  await set(canonicalKey, legacyBlob)
  await del(legacyKey)
  return legacyBlob
}

async function deleteAsset(prefix: string, ref: string): Promise<void> {
  await del(toAssetKey(prefix, ref))

  const legacyKey = toLegacyDoublePrefixedKey(prefix, ref)
  if (legacyKey) {
    await del(legacyKey)
  }
}

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
  const projects = data ? (JSON.parse(data) as Project[]) : []
  return projects.map(withTextDefaults)
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
    const screenshotRefs = new Set<string>()
    const backgroundImageRefs = new Set<string>()

    for (const slide of project.slides) {
      if (slide.screenshotRef) {
        screenshotRefs.add(slide.screenshotRef)
      }
      if (slide.background.type === 'image' && slide.background.imageRef) {
        backgroundImageRefs.add(slide.background.imageRef)
      }
    }

    await Promise.all([
      ...Array.from(screenshotRefs).map((ref) => deleteAsset(SCREENSHOT_PREFIX, ref)),
      ...Array.from(backgroundImageRefs).map((ref) => deleteAsset(BG_IMAGE_PREFIX, ref)),
    ])
  }
}

export async function getCurrentProjectId(): Promise<string | null> {
  return localStorage.getItem(CURRENT_PROJECT_KEY)
}

export async function setCurrentProjectId(id: string): Promise<void> {
  localStorage.setItem(CURRENT_PROJECT_KEY, id)
}

export async function saveScreenshot(slideId: string, blob: Blob): Promise<void> {
  await set(toAssetKey(SCREENSHOT_PREFIX, slideId), blob)
}

export async function getScreenshot(slideId: string): Promise<Blob | undefined> {
  return await readAssetWithLegacyFallback(SCREENSHOT_PREFIX, slideId)
}

export async function deleteScreenshot(slideId: string): Promise<void> {
  await deleteAsset(SCREENSHOT_PREFIX, slideId)
}

export async function saveBackgroundImage(slideId: string, blob: Blob): Promise<void> {
  await set(toAssetKey(BG_IMAGE_PREFIX, slideId), blob)
}

export async function getBackgroundImage(slideId: string): Promise<Blob | undefined> {
  return await readAssetWithLegacyFallback(BG_IMAGE_PREFIX, slideId)
}

export async function deleteBackgroundImage(slideId: string): Promise<void> {
  await deleteAsset(BG_IMAGE_PREFIX, slideId)
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
          showSubCaption: false,
          subCaption: '',
          subCaptionFont: 'inter',
          subCaptionSize: DEFAULT_SUB_CAPTION_SIZE,
        },
        device: {
          model: 'iphone-17-pro-max',
          angle: 'straight',
          verticalPosition: 35,
        },
        screenshotRef: null,
      },
    ],
  }
}
