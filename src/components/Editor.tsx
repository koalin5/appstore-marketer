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
} from '../utils/storage'
import { captureSlideAsPNG, captureSlideAsBlob, exportBlobsAsZIP } from '../utils/export'
import { DEVICE_MODELS } from '../presets/colors'

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

      const blob = new Blob([file], { type: file.type })
      const screenshotRef = `screenshot-${project.slides[currentSlideIndex].id}`
      await saveScreenshot(screenshotRef, blob)

      updateSlide({ screenshotRef })
    },
    [project, currentSlideIndex, updateSlide]
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
      },
      device: { model: 'iphone-16-pro-max', angle: 'straight', verticalPosition: 35 },
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
          const newScreenshotRef = `screenshot-${newSlideId}`
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
    (index: number) => {
      if (!project || project.slides.length <= 1) return

      const updatedSlides = project.slides.filter((_, i) => i !== index)
      const newIndex = Math.min(currentSlideIndex, updatedSlides.length - 1)

      const updatedProject = { ...project, slides: updatedSlides }
      setProject(updatedProject)
      setCurrentSlideIndex(newIndex)
      autoSave(updatedProject)
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
              {project.slides.length} screenshot{project.slides.length !== 1 ? 's' : ''} • 1290 × 2796px
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
            onClick={handleSlideAdd}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium text-gray-700 transition-colors"
          >
            <span>+</span> Add
          </button>
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
              style={{ width: 1290 * 0.18, height: 2796 * 0.18 }}
            >
              <span className="text-3xl text-gray-400 mb-1">+</span>
            </button>
          </div>
        </div>

        {/* Right panel - controls */}
        <div className="w-96 bg-white border-l border-gray-200 overflow-y-auto flex-shrink-0">
          <div className="p-6 space-y-6">
            
            {/* Text Controls */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <span className="text-base">✏️</span>
                <h3 className="font-semibold text-gray-900">Text</h3>
              </div>
              
              <div>
                <input
                  type="text"
                  value={currentSlide.text.content}
                  onChange={(e) => handleTextChange({ content: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:bg-white transition-all"
                  placeholder="Your headline here"
                />
              </div>

              <FontPicker
                font={currentSlide.text.font}
                onChange={(font) => handleTextChange({ font })}
              />

              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-gray-600 font-medium">Text Size</span>
                  <span className="text-gray-400">{textSize}px</span>
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
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-gray-600 font-medium">Vertical Position</span>
                  <span className="text-gray-400">{currentSlide.text.verticalPosition}%</span>
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

              <div>
                <span className="block text-sm text-gray-600 font-medium mb-2">Text Color</span>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleTextChange({ color: 'black' })}
                    className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-all ${
                      currentSlide.text.color === 'black'
                        ? 'bg-gray-900 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    Dark
                  </button>
                  <button
                    onClick={() => handleTextChange({ color: 'white' })}
                    className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-all ${
                      currentSlide.text.color === 'white'
                        ? 'bg-gray-900 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    Light
                  </button>
                </div>
              </div>

              <div>
                <span className="block text-sm text-gray-600 font-medium mb-2">Alignment</span>
                <div className="flex gap-2">
                  {(['left', 'center', 'right'] as const).map((align) => (
                    <button
                      key={align}
                      onClick={() => handleTextChange({ align })}
                      className={`flex-1 py-2.5 rounded-xl text-sm transition-all ${
                        currentSlide.text.align === align
                          ? 'bg-gray-900 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {align === 'left' ? '⬅' : align === 'center' ? '⬌' : '➡'}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="h-px bg-gray-100" />

            {/* Screenshot Upload - Second after Text */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <span className="text-base">🖼</span>
                <h3 className="font-semibold text-gray-900">Screenshot</h3>
              </div>
              
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
                className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors ${
                  currentSlide.screenshotRef 
                    ? 'border-green-300 bg-green-50' 
                    : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'
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
                  <div className="text-green-600 font-medium">✓ Screenshot uploaded</div>
                ) : (
                  <div className="text-gray-500">Drop screenshot here</div>
                )}
              </div>
            </div>

            <div className="h-px bg-gray-100" />

            {/* Phone Angle */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <span className="text-base">📱</span>
                <h3 className="font-semibold text-gray-900">Phone Angle</h3>
              </div>
              
              <div className="grid grid-cols-5 gap-2">
                {([
                  { id: 'straight', label: '|' },
                  { id: 'slight-left', label: '/' },
                  { id: 'slight-right', label: '\\' },
                  { id: 'dramatic-left', label: '//' },
                  { id: 'dramatic-right', label: '\\\\' },
                ] as const).map((angle) => (
                  <button
                    key={angle.id}
                    onClick={() => handleDeviceChange({ angle: angle.id })}
                    className={`py-3 rounded-xl text-lg font-mono transition-all ${
                      currentSlide.device.angle === angle.id
                        ? 'bg-gray-900 text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                    title={angle.id.replace(/-/g, ' ')}
                  >
                    {angle.label}
                  </button>
                ))}
              </div>

              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-gray-600 font-medium">Vertical Position</span>
                  <span className="text-gray-400">{currentSlide.device.verticalPosition ?? 35}%</span>
                </div>
                <input
                  type="range"
                  min="20"
                  max="50"
                  value={currentSlide.device.verticalPosition ?? 35}
                  onChange={(e) => handleDeviceChange({ verticalPosition: Number(e.target.value) })}
                  className="w-full accent-gray-900"
                />
              </div>
            </div>

            <div className="h-px bg-gray-100" />

            {/* Background */}
            <BackgroundPicker
              background={currentSlide.background}
              onChange={handleBackgroundChange}
              onApplyToAll={handleApplyBackgroundToAll}
            />
          </div>
        </div>
      </div>

    </div>
  )
}
