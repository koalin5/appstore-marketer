import JSZip from 'jszip'
import { saveAs } from 'file-saver'
import { snapdom } from '@zumer/snapdom'
import {
  SCREENSHOT_WIDTH,
  SCREENSHOT_HEIGHT,
  isAcceptedIPhoneScreenshotSize,
} from '../presets/exportSpecs'

/**
 * Capture a slide's canvas element as a PNG blob at native App Store resolution.
 * Uses snapdom which renders via SVG foreignObject — preserves box-shadow,
 * 3D transforms, filters, and all CSS exactly as the browser displays them.
 */
export async function captureSlideAsBlob(element: HTMLElement): Promise<Blob> {
  if (!isAcceptedIPhoneScreenshotSize(SCREENSHOT_WIDTH, SCREENSHOT_HEIGHT)) {
    throw new Error(`Invalid screenshot size: ${SCREENSHOT_WIDTH}x${SCREENSHOT_HEIGHT}`)
  }

  const result = await snapdom(element, {
    width: SCREENSHOT_WIDTH,
    height: SCREENSHOT_HEIGHT,
    outerShadows: true,
    outerTransforms: true,
    embedFonts: true,
  })

  return await result.toBlob({ type: 'png' })
}

/**
 * Capture a slide element and download as PNG.
 */
export async function captureSlideAsPNG(element: HTMLElement, filename: string): Promise<void> {
  const blob = await captureSlideAsBlob(element)
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
