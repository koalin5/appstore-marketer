import { useState, useEffect, useRef, useCallback } from 'react'
import { flushSync } from 'react-dom'
import type {
  Project,
  Slide,
  TextConfig,
  BackgroundConfig,
  DeviceConfig,
  ScreenshotTarget,
} from '../types'
import Canvas from './Canvas'
import BackgroundPicker from './BackgroundPicker'
import FontPicker from './FontPicker'
import ExportPanel from './ExportPanel'
import LocaleManager from './LocaleManager'
import {
  saveProject,
  getProject,
  saveScreenshot,
  getScreenshot,
  deleteScreenshot,
  deleteBackgroundImage,
} from '../utils/storage'
import { captureSlideAsPNG, captureSlideAsBlob, exportBlobsAsZIP, exportBlobsByLocaleAsZIP } from '../utils/export'
import { DEVICE_MODELS } from '../presets/colors'
import { SCREENSHOT_TARGET_SPECS, getScreenshotTargetSpec } from '../presets/exportSpecs'
import { validateScreenshotBlob } from '../utils/screenshotValidation'
import { resolveLocalizedText } from '../utils/locale'

const DEFAULT_SUB_CAPTION_SIZE = 42
const DEFAULT_SUB_CAPTION_SPACING = 12
const DEFAULT_HEADLINE_HORIZONTAL_OFFSET = 0
const DEFAULT_DEVICE_VERTICAL_POSITION = 35
const DEFAULT_DEVICE_FRAME_SCALE = 55
const DEFAULT_DEVICE_HORIZONTAL_POSITION = 50
const DEFAULT_IPHONE_DEVICE_MODEL: DeviceConfig['model'] = 'iphone-17-pro'
const ALLOWED_IPHONE_DEVICE_MODELS: DeviceConfig['model'][] = ['iphone-17-pro', 'iphone-16-pro']
const IPHONE_DEVICE_MODELS = DEVICE_MODELS.filter((model) => ALLOWED_IPHONE_DEVICE_MODELS.includes(model.id))

function normalizeIPhoneDeviceModel(model: DeviceConfig['model']): DeviceConfig['model'] {
  if (ALLOWED_IPHONE_DEVICE_MODELS.includes(model)) {
    return model
  }
  if (model === 'iphone-16-pro-max') {
    return 'iphone-16-pro'
  }
  return DEFAULT_IPHONE_DEVICE_MODEL
}

interface EditorProps {
  projectId: string
  projectName?: string
  projectAppIcon?: string
  onProjectUpdated?: (project: Project) => void
}

export default function Editor({ projectId, projectName, projectAppIcon, onProjectUpdated }: EditorProps) {
  const [project, setProject] = useState<Project | null>(null)
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0)
  const [isExporting, setIsExporting] = useState(false)
  const [screenshotValidationMessage, setScreenshotValidationMessage] = useState<string | null>(null)
  const [currentLocale, setCurrentLocale] = useState<string | undefined>(undefined)
  const [showLocaleManager, setShowLocaleManager] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout>>()
  const projectRef = useRef<Project | null>(null)

  useEffect(() => {
    projectRef.current = project
  }, [project])

  useEffect(() => {
    async function loadProject() {
      const loaded = await getProject(projectId)
      if (loaded) {
        setProject(loaded)
        setCurrentLocale(loaded.defaultLocale)
      }
    }
    loadProject()
  }, [projectId])

  // Sync external metadata changes (rename, icon) from sidebar
  useEffect(() => {
    setProject((prev) => {
      if (!prev) return prev
      if (prev.name === projectName && prev.appIcon === projectAppIcon) return prev
      return { ...prev, name: projectName ?? prev.name, appIcon: projectAppIcon }
    })
  }, [projectName, projectAppIcon])

  // Flush pending save on unmount (project switch)
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current)
      }
      if (projectRef.current) {
        saveProject({ ...projectRef.current, updatedAt: Date.now() })
      }
    }
  }, [])

  const autoSave = useCallback(async (updatedProject: Project) => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current)
    }

    saveTimeoutRef.current = setTimeout(async () => {
      updatedProject.updatedAt = Date.now()
      await saveProject(updatedProject)
      onProjectUpdated?.(updatedProject)
    }, 500)
  }, [onProjectUpdated])

  const updateSlide = useCallback(
    (updates: Partial<Slide>) => {
      if (!project) return

      const updatedSlides = [...project.slides]
      updatedSlides[currentSlideIndex] = {
        ...updatedSlides[currentSlideIndex],
        ...updates,
      }

      const updatedProject = { ...project, slides: updatedSlides }
      setProject(updatedProject)
      autoSave(updatedProject)
    },
    [project, currentSlideIndex, autoSave]
  )

  const handleTextChange = useCallback(
    (updates: Partial<TextConfig>) => {
      if (!project) return
      const slide = project.slides[currentSlideIndex]
      const hasLocales = currentLocale && project.locales && project.locales.length > 0

      // Separate translatable fields from styling fields
      const { content, subCaption, ...styleUpdates } = updates
      const hasTranslatableChange = content !== undefined || subCaption !== undefined

      if (hasTranslatableChange && hasLocales && currentLocale) {
        // Update localizedText for the current locale
        const currentEntry = slide.localizedText?.[currentLocale] ?? {
          content: slide.text.content,
          subCaption: slide.text.subCaption,
        }
        const newLocalizedText = {
          ...slide.localizedText,
          [currentLocale]: {
            ...currentEntry,
            ...(content !== undefined ? { content } : {}),
            ...(subCaption !== undefined ? { subCaption } : {}),
          },
        }
        updateSlide({
          text: { ...slide.text, ...styleUpdates },
          localizedText: newLocalizedText,
        })
      } else {
        // Single-locale mode or style-only change
        updateSlide({
          text: { ...slide.text, ...updates },
        })
      }
    },
    [project, currentSlideIndex, currentLocale, updateSlide]
  )

  const handleBackgroundChange = useCallback(
    (background: BackgroundConfig) => {
      updateSlide({ background })
    },
    [updateSlide]
  )

  const handleApplyBackgroundToAll = useCallback(() => {
    if (!project) return
    const currentBackground = project.slides[currentSlideIndex].background
    const updatedSlides = project.slides.map(slide => ({
      ...slide,
      background: currentBackground,
    }))
    const updatedProject = { ...project, slides: updatedSlides }
    setProject(updatedProject)
    autoSave(updatedProject)
  }, [project, currentSlideIndex, autoSave])

  const handleDeviceChange = useCallback(
    (device: Partial<DeviceConfig>) => {
      if (!project) return
      updateSlide({
        device: { ...project.slides[currentSlideIndex].device, ...device },
      })
    },
    [project, currentSlideIndex, updateSlide]
  )

  const handleScreenshotTargetChange = useCallback(
    (target: ScreenshotTarget) => {
      if (!project || project.screenshotTarget === target) return

      const updatedProject = { ...project, screenshotTarget: target }
      setProject(updatedProject)
      autoSave(updatedProject)
    },
    [project, autoSave]
  )

  const handleAddLocale = useCallback((localeCode: string) => {
    if (!project) return
    const existingLocales = project.locales ?? []
    if (existingLocales.includes(localeCode)) return

    const isFirst = existingLocales.length === 0
    const newLocales = [...existingLocales, localeCode]
    const defaultLocale = project.defaultLocale ?? localeCode

    const updatedSlides = project.slides.map(slide => ({
      ...slide,
      localizedText: isFirst
        ? { ...slide.localizedText, [localeCode]: { content: slide.text.content, subCaption: slide.text.subCaption } }
        : { ...slide.localizedText, [localeCode]: { content: '', subCaption: '' } },
    }))

    const updatedProject = { ...project, locales: newLocales, defaultLocale, slides: updatedSlides }
    setProject(updatedProject)
    setCurrentLocale(localeCode)
    autoSave(updatedProject)
  }, [project, autoSave])

  const handleRemoveLocale = useCallback((localeCode: string) => {
    if (!project || !project.locales) return

    const newLocales = project.locales.filter(l => l !== localeCode)
    const updatedSlides = project.slides.map(slide => {
      if (!slide.localizedText) return slide
      const { [localeCode]: _removed, ...rest } = slide.localizedText
      void _removed
      return { ...slide, localizedText: Object.keys(rest).length > 0 ? rest : undefined }
    })

    const updatedProject = newLocales.length === 0
      ? { ...project, locales: undefined, defaultLocale: undefined, slides: updatedSlides }
      : { ...project, locales: newLocales, defaultLocale: newLocales[0], slides: updatedSlides }

    setProject(updatedProject)
    setCurrentLocale(newLocales.length > 0 ? newLocales[0] : undefined)
    autoSave(updatedProject)
  }, [project, autoSave])

  const handleSetDefaultLocale = useCallback((localeCode: string) => {
    if (!project) return
    const updatedProject = { ...project, defaultLocale: localeCode }
    setProject(updatedProject)
    autoSave(updatedProject)
  }, [project, autoSave])

  const currentSlideSnapshot = project?.slides[currentSlideIndex]
  const currentScreenshotTarget = project?.screenshotTarget ?? null
  const currentSlideDeviceModel = currentSlideSnapshot?.device.model ?? null
  const currentSlideScreenshotRef = currentSlideSnapshot?.screenshotRef ?? null
  const currentSlideAllowMismatchedScreenshot = currentSlideSnapshot?.allowMismatchedScreenshot ?? false

  useEffect(() => {
    if (!project || project.screenshotTarget !== 'iphone-6_9') return

    const model = project.slides[currentSlideIndex]?.device.model
    if (!model) return

    const normalizedModel = normalizeIPhoneDeviceModel(model)
    if (normalizedModel !== model) {
      handleDeviceChange({ model: normalizedModel })
    }
  }, [project, currentSlideIndex, handleDeviceChange])

  useEffect(() => {
    let cancelled = false

    async function validateCurrentScreenshot() {
      if (!currentScreenshotTarget || !currentSlideDeviceModel || !currentSlideScreenshotRef) {
        setScreenshotValidationMessage(null)
        return
      }

      const blob = await getScreenshot(currentSlideScreenshotRef)
      if (!blob) {
        if (!cancelled) {
          setScreenshotValidationMessage(null)
        }
        return
      }

      try {
        const validation = await validateScreenshotBlob(blob, currentScreenshotTarget, currentSlideDeviceModel)
        if (cancelled) return
        setScreenshotValidationMessage(validation.isCompatible ? null : validation.message)
      } catch (error) {
        console.error('Failed to validate screenshot dimensions:', error)
        if (!cancelled) {
          setScreenshotValidationMessage('Unable to read screenshot dimensions. Please upload another screenshot.')
        }
      }
    }

    validateCurrentScreenshot()

    return () => {
      cancelled = true
    }
  }, [currentScreenshotTarget, currentSlideDeviceModel, currentSlideScreenshotRef])

  const handleScreenshotUpload = useCallback(
    async (file: File) => {
      if (!project) return

      const screenshotRef = crypto.randomUUID()
      await saveScreenshot(screenshotRef, file)

      updateSlide({ screenshotRef, allowMismatchedScreenshot: false })
    },
    [project, updateSlide]
  )

  const handleSlideAdd = useCallback(() => {
    if (!project) return

    const localizedText = project.locales && project.locales.length > 0
      ? Object.fromEntries(project.locales.map(l => [l, { content: '', subCaption: '' }]))
      : undefined

    const newSlide: Slide = {
      id: crypto.randomUUID(),
      background: { type: 'solid', color: '#F0F4F8' },
      text: {
        content: 'Your headline here',
        font: 'inter',
        size: 96,
        color: 'black',
        align: 'center',
        verticalPosition: 12,
        horizontalOffset: DEFAULT_HEADLINE_HORIZONTAL_OFFSET,
        showSubCaption: false,
        subCaption: '',
        subCaptionFont: 'inter',
        subCaptionSize: DEFAULT_SUB_CAPTION_SIZE,
        subCaptionSpacing: DEFAULT_SUB_CAPTION_SPACING,
      },
      device: {
        model: DEFAULT_IPHONE_DEVICE_MODEL,
        angle: 'straight',
        verticalPosition: DEFAULT_DEVICE_VERTICAL_POSITION,
        frameScale: DEFAULT_DEVICE_FRAME_SCALE,
        horizontalPosition: DEFAULT_DEVICE_HORIZONTAL_POSITION,
        allowOffCanvasPosition: false,
      },
      screenshotRef: null,
      allowMismatchedScreenshot: false,
      localizedText,
    }

    const updatedProject = {
      ...project,
      slides: [...project.slides, newSlide],
    }

    setProject(updatedProject)
    setCurrentSlideIndex(updatedProject.slides.length - 1)
    autoSave(updatedProject)
  }, [project, autoSave])

  const handleSlideDuplicate = useCallback(
    async (index: number) => {
      if (!project) return

      const sourceSlide = project.slides[index]
      const newSlideId = crypto.randomUUID()
      
      // Duplicate the slide (deep-copy localizedText)
      const newSlide: Slide = {
        ...sourceSlide,
        id: newSlideId,
        screenshotRef: null, // Will copy below if exists
        localizedText: sourceSlide.localizedText
          ? Object.fromEntries(Object.entries(sourceSlide.localizedText).map(([k, v]) => [k, { ...v }]))
          : undefined,
      }

      // Copy the screenshot if it exists
      if (sourceSlide.screenshotRef) {
        const screenshotBlob = await getScreenshot(sourceSlide.screenshotRef)
        if (screenshotBlob) {
          const newScreenshotRef = crypto.randomUUID()
          await saveScreenshot(newScreenshotRef, screenshotBlob)
          newSlide.screenshotRef = newScreenshotRef
        }
      }

      const updatedSlides = [...project.slides]
      updatedSlides.splice(index + 1, 0, newSlide)

      const updatedProject = { ...project, slides: updatedSlides }
      setProject(updatedProject)
      setCurrentSlideIndex(index + 1)
      autoSave(updatedProject)
    },
    [project, autoSave]
  )

  const handleSlideDelete = useCallback(
    async (index: number) => {
      if (!project || project.slides.length <= 1) return

      const slideToDelete = project.slides[index]
      const updatedSlides = project.slides.filter((_, i) => i !== index)
      const newIndex = Math.min(currentSlideIndex, updatedSlides.length - 1)

      const updatedProject = { ...project, slides: updatedSlides }
      setProject(updatedProject)
      setCurrentSlideIndex(newIndex)
      autoSave(updatedProject)

      try {
        if (slideToDelete.screenshotRef) {
          const stillReferenced = updatedSlides.some((slide) => slide.screenshotRef === slideToDelete.screenshotRef)
          if (!stillReferenced) {
            await deleteScreenshot(slideToDelete.screenshotRef)
          }
        }

        if (slideToDelete.background.type === 'image' && slideToDelete.background.imageRef) {
          const stillReferenced = updatedSlides.some(
            (slide) => slide.background.type === 'image' && slide.background.imageRef === slideToDelete.background.imageRef
          )
          if (!stillReferenced) {
            await deleteBackgroundImage(slideToDelete.background.imageRef)
          }
        }
      } catch (error) {
        console.error('Failed to clean up deleted slide assets:', error)
      }
    },
    [project, currentSlideIndex, autoSave]
  )

  // Export: capture visible canvas elements directly via snapdom
  const handleExportSingle = useCallback(async () => {
    if (!project) return

    const containers = containerRef.current?.querySelectorAll('[data-canvas-container]')
    const el = containers?.[currentSlideIndex] as HTMLElement | null
    if (!el) return

    setIsExporting(true)
    try {
      await captureSlideAsPNG(el, `screenshot-${currentSlideIndex + 1}.png`, project.screenshotTarget)
    } catch (error) {
      console.error('Export failed:', error)
      alert('Export failed. Please try again.')
    } finally {
      setIsExporting(false)
    }
  }, [currentSlideIndex, project])

  const handleExportAll = useCallback(async () => {
    if (!project) return
    const containers = containerRef.current?.querySelectorAll('[data-canvas-container]')
    if (!containers || containers.length === 0) return

    setIsExporting(true)
    try {
      const blobs: Blob[] = []
      for (let i = 0; i < containers.length; i++) {
        const blob = await captureSlideAsBlob(containers[i] as HTMLElement, project.screenshotTarget)
        blobs.push(blob)
      }
      await exportBlobsAsZIP(blobs)
    } catch (error) {
      console.error('Export failed:', error)
      alert('Export failed. Please try again.')
    } finally {
      setIsExporting(false)
    }
  }, [project])

  const handleExportAllLocales = useCallback(async () => {
    if (!project || !project.locales || project.locales.length === 0) return
    const containers = containerRef.current?.querySelectorAll('[data-canvas-container]')
    if (!containers || containers.length === 0) return

    setIsExporting(true)
    try {
      const blobsByLocale: Record<string, Blob[]> = {}
      const savedLocale = currentLocale

      for (const locale of project.locales) {
        flushSync(() => setCurrentLocale(locale))
        // Small delay to let the DOM update after flushSync
        await new Promise(resolve => setTimeout(resolve, 50))

        const updatedContainers = containerRef.current?.querySelectorAll('[data-canvas-container]')
        const blobs: Blob[] = []
        for (let i = 0; i < (updatedContainers?.length ?? 0); i++) {
          const blob = await captureSlideAsBlob(updatedContainers![i] as HTMLElement, project.screenshotTarget)
          blobs.push(blob)
        }
        blobsByLocale[locale] = blobs
      }

      flushSync(() => setCurrentLocale(savedLocale))
      await exportBlobsByLocaleAsZIP(blobsByLocale)
    } catch (error) {
      console.error('Export failed:', error)
      alert('Export failed. Please try again.')
    } finally {
      setIsExporting(false)
    }
  }, [project, currentLocale])

  if (!project) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="text-gray-400">Loading...</div>
      </div>
    )
  }

  const currentSlide = project.slides[currentSlideIndex]
  const localeCount = project.locales?.length ?? 0
  const resolvedText = resolveLocalizedText(currentSlide, currentLocale, project.defaultLocale)
  const screenshotTargetSpec = getScreenshotTargetSpec(project.screenshotTarget)
  const currentIPhoneModel = normalizeIPhoneDeviceModel(currentSlide.device.model)
  const screenshotWidth = screenshotTargetSpec.defaultSize.width
  const screenshotHeight = screenshotTargetSpec.defaultSize.height
  const textSize = typeof currentSlide.text.size === 'number' ? currentSlide.text.size : 96
  const showSubCaption = currentSlide.text.showSubCaption ?? false
  const subCaptionSize =
    typeof currentSlide.text.subCaptionSize === 'number'
      ? currentSlide.text.subCaptionSize
      : DEFAULT_SUB_CAPTION_SIZE
  const subCaptionSpacing =
    typeof currentSlide.text.subCaptionSpacing === 'number'
      ? currentSlide.text.subCaptionSpacing
      : DEFAULT_SUB_CAPTION_SPACING
  const deviceVerticalPosition =
    typeof currentSlide.device.verticalPosition === 'number'
      ? currentSlide.device.verticalPosition
      : DEFAULT_DEVICE_VERTICAL_POSITION
  const deviceFrameScale =
    typeof currentSlide.device.frameScale === 'number'
      ? currentSlide.device.frameScale
      : DEFAULT_DEVICE_FRAME_SCALE
  const deviceHorizontalPosition =
    typeof currentSlide.device.horizontalPosition === 'number'
      ? currentSlide.device.horizontalPosition
      : DEFAULT_DEVICE_HORIZONTAL_POSITION
  const allowOffCanvasPosition = currentSlide.device.allowOffCanvasPosition ?? false
  const standardVerticalPosition = Math.max(0, Math.min(80, deviceVerticalPosition))
  const headlineVerticalPosition = Math.max(5, Math.min(90, currentSlide.text.verticalPosition))
  const advancedHeadlineHorizontalOffset =
    typeof currentSlide.text.horizontalOffset === 'number'
      ? Math.max(-30, Math.min(30, currentSlide.text.horizontalOffset))
      : DEFAULT_HEADLINE_HORIZONTAL_OFFSET

  return (
    <div className="flex-1 flex flex-col bg-gray-50 min-w-0">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-3 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-xl">✨</span>
              <h1 className="text-lg font-semibold text-gray-900">Screenshot Studio</h1>
            </div>
            <select
              value={project.screenshotTarget}
              onChange={(e) => handleScreenshotTargetChange(e.target.value as ScreenshotTarget)}
              className="px-3 py-1.5 bg-gray-100 border-0 rounded-lg text-sm text-gray-700"
            >
              {SCREENSHOT_TARGET_SPECS.map((target) => (
                <option key={target.id} value={target.id}>
                  {target.name} ({target.defaultSize.width} × {target.defaultSize.height})
                </option>
              ))}
            </select>
            {project.screenshotTarget === 'iphone-6_9' && (
              <select
                value={currentIPhoneModel}
                onChange={(e) => handleDeviceChange({ model: e.target.value as DeviceConfig['model'] })}
                className="px-3 py-1.5 bg-gray-100 border-0 rounded-lg text-sm text-gray-700"
              >
                {IPHONE_DEVICE_MODELS.map((model) => (
                  <option key={model.id} value={model.id}>{model.name}</option>
                ))}
              </select>
            )}
          </div>
          
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-500">
              {project.slides.length} screenshot{project.slides.length !== 1 ? 's' : ''} • {screenshotWidth} × {screenshotHeight}px
            </span>
            <ExportPanel
              slideCount={project.slides.length}
              isExporting={isExporting}
              localeCount={localeCount}
              onExportCurrent={handleExportSingle}
              onExportAll={handleExportAll}
              onExportAllLocales={handleExportAllLocales}
            />
          </div>
        </div>
      </header>

      {/* Toolbar */}
      <div className="bg-white border-b border-gray-200 px-6 py-2 flex-shrink-0">
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleSlideDuplicate(currentSlideIndex)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium text-gray-700 transition-colors"
          >
            <span>📋</span> Duplicate
          </button>
          {project.slides.length > 1 && (
            <button
              onClick={() => handleSlideDelete(currentSlideIndex)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 hover:bg-red-100 rounded-lg text-sm font-medium text-red-600 transition-colors"
            >
              <span>🗑</span> Delete
            </button>
          )}
          
          <div className="w-px h-6 bg-gray-200 mx-2" />
          
          <button
            onClick={() => setCurrentSlideIndex(Math.max(0, currentSlideIndex - 1))}
            disabled={currentSlideIndex === 0}
            className="p-1.5 rounded-lg hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed"
          >
            ‹
          </button>
          <button
            onClick={() => setCurrentSlideIndex(Math.min(project.slides.length - 1, currentSlideIndex + 1))}
            disabled={currentSlideIndex === project.slides.length - 1}
            className="p-1.5 rounded-lg hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed"
          >
            ›
          </button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Main canvas area - shows ALL slides */}
        <div className="flex-1 overflow-auto p-6" ref={containerRef}>
          <div className="flex flex-wrap gap-6 justify-start">
            {project.slides.map((slide, index) => (
              <div
                key={slide.id}
                className="relative group"
              >
                {/* Slide number */}
                <div className="absolute -top-5 left-1/2 -translate-x-1/2 text-xs text-gray-400 font-medium">
                  {index + 1}
                </div>
                
                <div
                  className={`cursor-pointer transition-all rounded-xl ${
                    index === currentSlideIndex
                      ? 'ring-2 ring-blue-500 ring-offset-4'
                      : 'hover:ring-2 hover:ring-gray-300 hover:ring-offset-4'
                  }`}
                  onClick={() => setCurrentSlideIndex(index)}
                >
                  <Canvas slide={slide} screenshotTarget={project.screenshotTarget} scale={0.18} locale={currentLocale} defaultLocale={project.defaultLocale} />
                </div>
              </div>
            ))}

            {/* Add slide button */}
            <button
              onClick={handleSlideAdd}
              className="flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-xl hover:border-gray-400 hover:bg-gray-50 transition-colors"
              style={{ width: screenshotWidth * 0.18, height: screenshotHeight * 0.18 }}
            >
              <span className="text-3xl text-gray-400 mb-1">+</span>
            </button>
          </div>
        </div>

        {/* Right panel - controls */}
        <div className="w-96 bg-gray-50/80 border-l border-gray-200 overflow-y-auto flex-shrink-0">
          <div className="flex flex-col gap-2 p-3">

            {/* ── Screenshot ── */}
            <div className="bg-white rounded-xl p-4">
              <h3 className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-3">Screenshot</h3>

              <div
                onDrop={(e) => {
                  e.preventDefault()
                  const file = e.dataTransfer.files[0]
                  if (file?.type.startsWith('image/')) {
                    handleScreenshotUpload(file)
                  }
                }}
                onDragOver={(e) => e.preventDefault()}
                onClick={() => document.getElementById('screenshot-input')?.click()}
                className={`group relative border-2 border-dashed rounded-xl p-5 text-center cursor-pointer transition-all ${
                  currentSlide.screenshotRef
                    ? 'border-gray-300 bg-gray-50/60 hover:bg-gray-100/60'
                    : 'border-gray-300 bg-white hover:border-gray-400 hover:bg-gray-50/50'
                }`}
              >
                <input
                  id="screenshot-input"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) handleScreenshotUpload(file)
                  }}
                />
                {currentSlide.screenshotRef ? (
                  <div className="flex items-center justify-center gap-2">
                    <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                      <circle cx="8" cy="8" r="6" stroke="#9ca3af" strokeWidth="1.5"/>
                      <path d="M5.5 8L7 9.5L10.5 6" stroke="#9ca3af" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    <span className="text-sm font-medium text-gray-500">Screenshot added</span>
                    <span className="text-xs text-gray-400 ml-1">tap to replace</span>
                  </div>
                ) : (
                  <div>
                    <div className="text-gray-400 mb-1">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="mx-auto">
                        <path d="M12 6v12M6 12h12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                      </svg>
                    </div>
                    <div className="text-sm text-gray-500 font-medium">Drop image or click to upload</div>
                  </div>
                )}
              </div>
              {screenshotValidationMessage && (
                <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2">
                  <div className="text-[11px] font-semibold uppercase tracking-wide text-amber-800 mb-0.5">
                    Screenshot Size Mismatch
                  </div>
                  <div className="text-xs leading-4 text-amber-700">{screenshotValidationMessage}</div>
                  <label className="mt-2 flex items-center gap-2 text-xs text-amber-800 font-medium">
                    <input
                      type="checkbox"
                      checked={currentSlideAllowMismatchedScreenshot}
                      onChange={(e) => updateSlide({ allowMismatchedScreenshot: e.target.checked })}
                      className="h-4 w-4 rounded border-amber-300 accent-amber-600"
                    />
                    Use this screenshot anyway
                  </label>
                </div>
              )}
            </div>

            {/* ── Background ── */}
            <div className="bg-white rounded-xl p-4">
              <BackgroundPicker
                background={currentSlide.background}
                onChange={handleBackgroundChange}
                onApplyToAll={handleApplyBackgroundToAll}
              />
            </div>

            {/* ── Text ── */}
            <div className="bg-white rounded-xl p-4 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Text</h3>
                <button
                  onClick={() => setShowLocaleManager(true)}
                  className="text-[11px] font-medium text-blue-600 hover:text-blue-700 transition-colors"
                >
                  {localeCount > 0
                    ? `${localeCount} locale${localeCount !== 1 ? 's' : ''}`
                    : '+ Localize'}
                </button>
              </div>

              {localeCount > 1 && (
                <div className="flex gap-1 flex-wrap">
                  {project.locales!.map((locale) => (
                    <button
                      key={locale}
                      onClick={() => setCurrentLocale(locale)}
                      className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all ${
                        currentLocale === locale
                          ? 'bg-gray-900 text-white'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {locale}
                    </button>
                  ))}
                </div>
              )}

              <input
                type="text"
                value={resolvedText.content}
                onChange={(e) => handleTextChange({ content: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-white border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-all"
                placeholder={currentLocale ? `Enter ${currentLocale} headline...` : 'Your headline here'}
              />

              <label className="flex items-center gap-2 text-sm text-gray-600 font-medium">
                <input
                  type="checkbox"
                  checked={showSubCaption}
                  onChange={(e) => handleTextChange({ showSubCaption: e.target.checked })}
                  className="h-4 w-4 rounded border-gray-300 accent-gray-900"
                />
                Show sub-caption
              </label>

              {showSubCaption && (
                <div className="space-y-3 rounded-lg border border-gray-200 bg-gray-50/70 p-3">
                  <input
                    type="text"
                    value={resolvedText.subCaption}
                    onChange={(e) => handleTextChange({ subCaption: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-white border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-all"
                    placeholder={currentLocale ? `Enter ${currentLocale} sub-caption...` : 'Add context under the headline'}
                  />

                  <FontPicker
                    font={currentSlide.text.subCaptionFont ?? currentSlide.text.font}
                    onChange={(font) => handleTextChange({ subCaptionFont: font })}
                    label="Sub-caption Font"
                  />

                  <div>
                    <div className="flex justify-between text-xs mb-1.5">
                      <span className="text-gray-500 font-medium">Sub-caption Size</span>
                      <span className="text-gray-400 tabular-nums">{subCaptionSize}%</span>
                    </div>
                    <input
                      type="range"
                      min="25"
                      max="65"
                      value={subCaptionSize}
                      onChange={(e) => handleTextChange({ subCaptionSize: Number(e.target.value) })}
                      className="w-full accent-gray-900"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between text-xs mb-1.5">
                      <span className="text-gray-500 font-medium">Gap from Headline</span>
                      <span className="text-gray-400 tabular-nums">{subCaptionSpacing}%</span>
                    </div>
                    <input
                      type="range"
                      min="6"
                      max="24"
                      value={subCaptionSpacing}
                      onChange={(e) => handleTextChange({ subCaptionSpacing: Number(e.target.value) })}
                      className="w-full accent-gray-900"
                    />
                  </div>
                </div>
              )}

              <FontPicker
                font={currentSlide.text.font}
                onChange={(font) => handleTextChange({ font })}
              />

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <div className="flex justify-between text-xs mb-1.5">
                    <span className="text-gray-500 font-medium">Size</span>
                    <span className="text-gray-400 tabular-nums">{textSize}</span>
                  </div>
                  <input
                    type="range"
                    min="48"
                    max="200"
                    value={textSize}
                    onChange={(e) => handleTextChange({ size: Number(e.target.value) })}
                    className="w-full accent-gray-900"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-xs mb-1.5">
                    <span className="text-gray-500 font-medium">Position</span>
                    <span className="text-gray-400 tabular-nums">{headlineVerticalPosition}%</span>
                  </div>
                  <input
                    type="range"
                    min="5"
                    max="90"
                    value={headlineVerticalPosition}
                    onChange={(e) => handleTextChange({ verticalPosition: Number(e.target.value) })}
                    className="w-full accent-gray-900"
                  />
                </div>
              </div>

              <div className="flex gap-2">
                <div className="flex-1">
                  <span className="block text-xs text-gray-500 font-medium mb-1.5">Color</span>
                  <div className="flex gap-1.5">
                    <button
                      onClick={() => handleTextChange({ color: 'black' })}
                      className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-all ${
                        currentSlide.text.color === 'black'
                          ? 'bg-gray-900 text-white shadow-sm'
                          : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      Dark
                    </button>
                    <button
                      onClick={() => handleTextChange({ color: 'white' })}
                      className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-all ${
                        currentSlide.text.color === 'white'
                          ? 'bg-gray-900 text-white shadow-sm'
                          : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      Light
                    </button>
                  </div>
                </div>
                <div className="flex-1">
                  <span className="block text-xs text-gray-500 font-medium mb-1.5">Align</span>
                  <div className="flex gap-1.5">
                    {(['left', 'center', 'right'] as const).map((align) => (
                      <button
                        key={align}
                        onClick={() => handleTextChange({ align })}
                        className={`flex-1 py-2 rounded-lg text-xs transition-all flex items-center justify-center ${
                          currentSlide.text.align === align
                            ? 'bg-gray-900 text-white shadow-sm'
                            : 'bg-white border border-gray-200 text-gray-500 hover:bg-gray-50'
                        }`}
                        title={align}
                      >
                        <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                          {align === 'left' && (
                            <>
                              <path d="M2 3h12M2 6.5h8M2 10h10M2 13.5h6" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
                            </>
                          )}
                          {align === 'center' && (
                            <>
                              <path d="M2 3h12M4 6.5h8M3 10h10M5 13.5h6" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
                            </>
                          )}
                          {align === 'right' && (
                            <>
                              <path d="M2 3h12M6 6.5h8M4 10h10M8 13.5h6" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
                            </>
                          )}
                        </svg>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* ── Device ── */}
            <div className="bg-white rounded-xl p-4 space-y-4">
              <h3 className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Device</h3>

              <div>
                <span className="block text-xs text-gray-500 font-medium mb-2">Angle</span>
                <div className="grid grid-cols-5 gap-1.5">
                  {([
                    { id: 'straight', transform: 'none' },
                    { id: 'slight-left', transform: 'perspective(50px) rotateY(22deg)' },
                    { id: 'slight-right', transform: 'perspective(50px) rotateY(-22deg)' },
                    { id: 'dramatic-left', transform: 'perspective(32px) rotateY(38deg)' },
                    { id: 'dramatic-right', transform: 'perspective(32px) rotateY(-38deg)' },
                  ] as const).map((angle) => (
                    <button
                      key={angle.id}
                      onClick={() => handleDeviceChange({ angle: angle.id })}
                      className={`py-2.5 rounded-lg flex items-center justify-center transition-all ${
                        currentSlide.device.angle === angle.id
                          ? 'bg-gray-900 text-white shadow-sm'
                          : 'bg-white border border-gray-200 text-gray-500 hover:bg-gray-50'
                      }`}
                      title={angle.id.replace(/-/g, ' ')}
                    >
                      <div style={{ transform: angle.transform, transformStyle: 'preserve-3d' }}>
                        <svg width="16" height="28" viewBox="0 0 16 28" fill="none">
                          <rect x="1" y="1" width="14" height="26" rx="3" stroke="currentColor" strokeWidth="1.5" />
                          <rect x="2.5" y="2.5" width="11" height="23" rx="1.5" fill="currentColor" opacity="0.12" />
                          <rect x="5.5" y="2" width="5" height="1.2" rx="0.6" fill="currentColor" opacity="0.35" />
                        </svg>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs mb-1.5">
                  <span className="text-gray-500 font-medium">Frame Size</span>
                  <span className="text-gray-400 tabular-nums">{deviceFrameScale}%</span>
                </div>
                <input
                  type="range"
                  min="40"
                  max="80"
                  value={deviceFrameScale}
                  onChange={(e) => handleDeviceChange({ frameScale: Number(e.target.value) })}
                  className="w-full accent-gray-900"
                />
              </div>

              <div>
                <div className="flex justify-between text-xs mb-1.5">
                  <span className="text-gray-500 font-medium">Vertical Position</span>
                  <span className="text-gray-400 tabular-nums">{standardVerticalPosition}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="80"
                  value={standardVerticalPosition}
                  onChange={(e) => handleDeviceChange({ verticalPosition: Number(e.target.value) })}
                  className="w-full accent-gray-900"
                />
              </div>

              <label className="flex items-center gap-2 text-sm text-gray-600 font-medium">
                <input
                  type="checkbox"
                  checked={allowOffCanvasPosition}
                  onChange={(e) => {
                    if (e.target.checked) {
                      handleDeviceChange({ allowOffCanvasPosition: true })
                      return
                    }
                    updateSlide({
                      device: {
                        ...currentSlide.device,
                        allowOffCanvasPosition: false,
                        horizontalPosition: DEFAULT_DEVICE_HORIZONTAL_POSITION,
                      },
                      text: {
                        ...currentSlide.text,
                        horizontalOffset: DEFAULT_HEADLINE_HORIZONTAL_OFFSET,
                      },
                    })
                  }}
                  className="h-4 w-4 rounded border-gray-300 accent-gray-900"
                />
                Horizontal positioning
              </label>

              {allowOffCanvasPosition && (
                <div className="space-y-3 rounded-lg border border-gray-200 bg-gray-50/70 p-3">
                  <div className="text-[11px] text-gray-500">
                    Move the frame beyond normal limits and shift headline position for creative layouts.
                  </div>

                  <div>
                    <div className="flex justify-between text-xs mb-1.5">
                      <span className="text-gray-500 font-medium">Horizontal Position</span>
                      <span className="text-gray-400 tabular-nums">{deviceHorizontalPosition}%</span>
                    </div>
                    <input
                      type="range"
                      min="-30"
                      max="130"
                      value={deviceHorizontalPosition}
                      onChange={(e) => handleDeviceChange({ horizontalPosition: Number(e.target.value) })}
                      className="w-full accent-gray-900"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between text-xs mb-1.5">
                      <span className="text-gray-500 font-medium">Headline Horizontal</span>
                      <span className="text-gray-400 tabular-nums">{advancedHeadlineHorizontalOffset}%</span>
                    </div>
                    <input
                      type="range"
                      min="-30"
                      max="30"
                      value={advancedHeadlineHorizontalOffset}
                      onChange={(e) => handleTextChange({ horizontalOffset: Number(e.target.value) })}
                      className="w-full accent-gray-900"
                    />
                  </div>
                </div>
              )}
            </div>

          </div>
        </div>
      </div>

      {showLocaleManager && (
        <LocaleManager
          locales={project.locales ?? []}
          defaultLocale={project.defaultLocale}
          onAddLocale={handleAddLocale}
          onRemoveLocale={handleRemoveLocale}
          onSetDefaultLocale={handleSetDefaultLocale}
          onClose={() => setShowLocaleManager(false)}
        />
      )}
    </div>
  )
}
