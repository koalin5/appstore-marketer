import { useState, useEffect, useRef, useCallback } from 'react'
import type { Project, Slide, TextConfig, BackgroundConfig, DeviceConfig } from '../types'
import Canvas from './Canvas'
import BackgroundPicker from './BackgroundPicker'
import FontPicker from './FontPicker'
import ExportPanel from './ExportPanel'
import {
  createNewProject,
  saveProject,
  getCurrentProjectId,
  getProject,
  saveScreenshot,
  getScreenshot,
  deleteScreenshot,
  deleteBackgroundImage,
} from '../utils/storage'
import { captureSlideAsPNG, captureSlideAsBlob, exportBlobsAsZIP } from '../utils/export'
import { DEVICE_MODELS } from '../presets/colors'
import { SCREENSHOT_HEIGHT, SCREENSHOT_WIDTH } from '../presets/exportSpecs'

const DEFAULT_SUB_CAPTION_SIZE = 42

export default function Editor() {
  const [project, setProject] = useState<Project | null>(null)
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0)
  const [isExporting, setIsExporting] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout>>()

  useEffect(() => {
    async function loadInitialProject() {
      const currentId = await getCurrentProjectId()
      if (currentId) {
        const loaded = await getProject(currentId)
        if (loaded) {
          setProject(loaded)
          return
        }
      }

      const newProject = createNewProject()
      setProject(newProject)
      await saveProject(newProject)
    }

    loadInitialProject()
  }, [])

  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current)
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
    }, 500)
  }, [])

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
    (text: Partial<TextConfig>) => {
      if (!project) return
      updateSlide({
        text: { ...project.slides[currentSlideIndex].text, ...text },
      })
    },
    [project, currentSlideIndex, updateSlide]
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

  const handleScreenshotUpload = useCallback(
    async (file: File) => {
      if (!project) return

      const screenshotRef = crypto.randomUUID()
      await saveScreenshot(screenshotRef, file)

      updateSlide({ screenshotRef })
    },
    [project, updateSlide]
  )

  const handleSlideAdd = useCallback(() => {
    if (!project) return

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
        showSubCaption: false,
        subCaption: '',
        subCaptionFont: 'inter',
        subCaptionSize: DEFAULT_SUB_CAPTION_SIZE,
      },
      device: { model: 'iphone-17-pro-max', angle: 'straight', verticalPosition: 35 },
      screenshotRef: null,
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
      
      // Duplicate the slide
      const newSlide: Slide = {
        ...sourceSlide,
        id: newSlideId,
        screenshotRef: null, // Will copy below if exists
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
    const containers = containerRef.current?.querySelectorAll('[data-canvas-container]')
    const el = containers?.[currentSlideIndex] as HTMLElement | null
    if (!el) return

    setIsExporting(true)
    try {
      await captureSlideAsPNG(el, `screenshot-${currentSlideIndex + 1}.png`)
    } catch (error) {
      console.error('Export failed:', error)
      alert('Export failed. Please try again.')
    } finally {
      setIsExporting(false)
    }
  }, [currentSlideIndex])

  const handleExportAll = useCallback(async () => {
    if (!project) return
    const containers = containerRef.current?.querySelectorAll('[data-canvas-container]')
    if (!containers || containers.length === 0) return

    setIsExporting(true)
    try {
      const blobs: Blob[] = []
      for (let i = 0; i < containers.length; i++) {
        const blob = await captureSlideAsBlob(containers[i] as HTMLElement)
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

  if (!project) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="text-gray-400">Loading...</div>
      </div>
    )
  }

  const currentSlide = project.slides[currentSlideIndex]
  const textSize = typeof currentSlide.text.size === 'number' ? currentSlide.text.size : 96
  const showSubCaption = currentSlide.text.showSubCaption ?? false
  const subCaptionSize =
    typeof currentSlide.text.subCaptionSize === 'number'
      ? currentSlide.text.subCaptionSize
      : DEFAULT_SUB_CAPTION_SIZE

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-3 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-xl">✨</span>
              <h1 className="text-lg font-semibold text-gray-900">Screenshot Studio</h1>
            </div>
            <select
              value={currentSlide.device.model}
              onChange={(e) => handleDeviceChange({ model: e.target.value as DeviceConfig['model'] })}
              className="px-3 py-1.5 bg-gray-100 border-0 rounded-lg text-sm text-gray-700"
            >
              {DEVICE_MODELS.map((model) => (
                <option key={model.id} value={model.id}>{model.name}</option>
              ))}
            </select>
          </div>
          
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-500">
              {project.slides.length} screenshot{project.slides.length !== 1 ? 's' : ''} • {SCREENSHOT_WIDTH} × {SCREENSHOT_HEIGHT}px
            </span>
            <ExportPanel
              slideCount={project.slides.length}
              isExporting={isExporting}
              onExportCurrent={handleExportSingle}
              onExportAll={handleExportAll}
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
                  <Canvas slide={slide} scale={0.18} />
                </div>
              </div>
            ))}

            {/* Add slide button */}
            <button
              onClick={handleSlideAdd}
              className="flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-xl hover:border-gray-400 hover:bg-gray-50 transition-colors"
              style={{ width: SCREENSHOT_WIDTH * 0.18, height: SCREENSHOT_HEIGHT * 0.18 }}
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
              <h3 className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Text</h3>

              <input
                type="text"
                value={currentSlide.text.content}
                onChange={(e) => handleTextChange({ content: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-white border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-all"
                placeholder="Your headline here"
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
                    value={currentSlide.text.subCaption ?? ''}
                    onChange={(e) => handleTextChange({ subCaption: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-white border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-all"
                    placeholder="Add context under the headline"
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
                    <span className="text-gray-400 tabular-nums">{currentSlide.text.verticalPosition}%</span>
                  </div>
                  <input
                    type="range"
                    min="5"
                    max="90"
                    value={currentSlide.text.verticalPosition}
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
                  <span className="text-gray-500 font-medium">Vertical Position</span>
                  <span className="text-gray-400 tabular-nums">{currentSlide.device.verticalPosition ?? 35}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="80"
                  value={currentSlide.device.verticalPosition ?? 35}
                  onChange={(e) => handleDeviceChange({ verticalPosition: Number(e.target.value) })}
                  className="w-full accent-gray-900"
                />
              </div>
            </div>

          </div>
        </div>
      </div>

    </div>
  )
}
