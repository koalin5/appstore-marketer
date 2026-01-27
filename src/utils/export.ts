import JSZip from 'jszip'
import { saveAs } from 'file-saver'
import html2canvas from 'html2canvas'
import type { Slide } from '../types'

// Fixed App Store dimensions (6.9" display)
const SCREENSHOT_WIDTH = 1290
const SCREENSHOT_HEIGHT = 2796

export async function exportSlideAsPNG(slide: Slide, slideIndex: number): Promise<void> {
  const slideElements = document.querySelectorAll('[data-canvas-container]')
  const slideElement = slideElements[slideIndex] as HTMLElement
  
  if (!slideElement) {
    console.error('Could not find slide element')
    alert('Export failed: Could not find slide element')
    return
  }
  
  try {
    const scale = SCREENSHOT_WIDTH / slideElement.offsetWidth
    
    // Temporarily remove overflow:hidden to allow shadow to be captured
    const originalOverflow = slideElement.style.overflow
    const originalBorderRadius = slideElement.style.borderRadius
    slideElement.style.overflow = 'visible'
    slideElement.style.borderRadius = '0'
    
    const canvas = await html2canvas(slideElement, {
      scale: scale,
      useCORS: true,
      allowTaint: true,
      backgroundColor: null,
      logging: false,
    })
    
    // Restore original styles
    slideElement.style.overflow = originalOverflow
    slideElement.style.borderRadius = originalBorderRadius
    
    // Ensure exact dimensions
    const finalCanvas = document.createElement('canvas')
    finalCanvas.width = SCREENSHOT_WIDTH
    finalCanvas.height = SCREENSHOT_HEIGHT
    const ctx = finalCanvas.getContext('2d')!
    ctx.drawImage(canvas, 0, 0, SCREENSHOT_WIDTH, SCREENSHOT_HEIGHT)
    
    finalCanvas.toBlob((blob) => {
      if (blob) {
        saveAs(blob, `screenshot-${slideIndex + 1}.png`)
      }
    }, 'image/png')
  } catch (error) {
    console.error('Export failed:', error)
    alert('Export failed. Please try again.')
  }
}

export async function exportAllSlidesAsZIP(slides: Slide[]): Promise<void> {
  const zip = new JSZip()
  const slideElements = document.querySelectorAll('[data-canvas-container]')
  
  for (let i = 0; i < slides.length; i++) {
    const slideElement = slideElements[i] as HTMLElement
    
    if (!slideElement) {
      console.error(`Could not find slide element ${i}`)
      continue
    }
    
    try {
      const scale = SCREENSHOT_WIDTH / slideElement.offsetWidth
      
      // Temporarily remove overflow:hidden to allow shadow to be captured
      const originalOverflow = slideElement.style.overflow
      const originalBorderRadius = slideElement.style.borderRadius
      slideElement.style.overflow = 'visible'
      slideElement.style.borderRadius = '0'
      
      const canvas = await html2canvas(slideElement, {
        scale: scale,
        useCORS: true,
        allowTaint: true,
        backgroundColor: null,
        logging: false,
      })
      
      // Restore original styles
      slideElement.style.overflow = originalOverflow
      slideElement.style.borderRadius = originalBorderRadius
      
      const finalCanvas = document.createElement('canvas')
      finalCanvas.width = SCREENSHOT_WIDTH
      finalCanvas.height = SCREENSHOT_HEIGHT
      const ctx = finalCanvas.getContext('2d')!
      ctx.drawImage(canvas, 0, 0, SCREENSHOT_WIDTH, SCREENSHOT_HEIGHT)
      
      const blob = await new Promise<Blob>((resolve) => {
        finalCanvas.toBlob((b) => {
          resolve(b || new Blob())
        }, 'image/png')
      })
      
      zip.file(`screenshot-${i + 1}.png`, blob)
    } catch (error) {
      console.error(`Failed to export slide ${i}:`, error)
    }
  }
  
  const zipBlob = await zip.generateAsync({ type: 'blob' })
  saveAs(zipBlob, 'screenshots.zip')
}
