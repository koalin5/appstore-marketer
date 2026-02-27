import JSZip from 'jszip'
import { saveAs } from 'file-saver'
import { snapdom } from '@zumer/snapdom'
import type { ScreenshotTarget } from '../types'
import {
  getDefaultExportSize,
  isAcceptedScreenshotSize,
} from '../presets/exportSpecs'

/**
 * Capture a slide's canvas element as a PNG blob at native App Store resolution.
 * Uses snapdom which renders via SVG foreignObject — preserves box-shadow,
 * 3D transforms, filters, and all CSS exactly as the browser displays them.
 */
export async function captureSlideAsBlob(element: HTMLElement, screenshotTarget: ScreenshotTarget): Promise<Blob> {
  const { width, height } = getDefaultExportSize(screenshotTarget)

  if (!isAcceptedScreenshotSize(screenshotTarget, width, height)) {
    throw new Error(`Invalid screenshot size: ${width}x${height}`)
  }

  const result = await snapdom(element, {
    width,
    height,
    outerShadows: true,
    outerTransforms: true,
    embedFonts: true,
  })

  return await result.toBlob({ type: 'png' })
}

/**
 * Capture a slide element and download as PNG.
 */
export async function captureSlideAsPNG(
  element: HTMLElement,
  filename: string,
  screenshotTarget: ScreenshotTarget
): Promise<void> {
  const blob = await captureSlideAsBlob(element, screenshotTarget)
  saveAs(blob, filename)
}

/**
 * Export multiple slide blobs as a ZIP file.
 */
export async function exportBlobsAsZIP(blobs: Blob[]): Promise<void> {
  const zip = new JSZip()
  for (let i = 0; i < blobs.length; i++) {
    zip.file(`screenshot-${i + 1}.png`, blobs[i])
  }
  const zipBlob = await zip.generateAsync({ type: 'blob' })
  saveAs(zipBlob, 'screenshots.zip')
}

/**
 * Export slide blobs organized by locale folders.
 * Structure: /en-US/screenshot-1.png, /es-MX/screenshot-1.png, etc.
 */
export async function exportBlobsByLocaleAsZIP(blobsByLocale: Record<string, Blob[]>): Promise<void> {
  const zip = new JSZip()

  for (const [locale, blobs] of Object.entries(blobsByLocale)) {
    const folder = zip.folder(locale)!
    for (let i = 0; i < blobs.length; i++) {
      folder.file(`screenshot-${i + 1}.png`, blobs[i])
    }
  }

  const zipBlob = await zip.generateAsync({ type: 'blob' })
  saveAs(zipBlob, 'screenshots-localized.zip')
}
