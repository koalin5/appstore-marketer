import type { DeviceModel, ScreenshotTarget } from '../types'
import { DEVICE_SPECS } from '../presets/deviceSpecs'
import { getAcceptedScreenshotSizes } from '../presets/exportSpecs'

const ASPECT_RATIO_TOLERANCE = 0.02

export interface ImageDimensions {
  width: number
  height: number
}

export interface ScreenshotValidationResult {
  dimensions: ImageDimensions
  expectedSizes: ImageDimensions[]
  isCompatible: boolean
  message: string | null
}

function formatSize(size: ImageDimensions): string {
  return `${size.width} x ${size.height}`
}

function getExpectedScreenshotSizes(target: ScreenshotTarget, deviceModel: DeviceModel): ImageDimensions[] {
  const appStoreSizes = getAcceptedScreenshotSizes(target).map((size) => ({
    width: size.width,
    height: size.height,
  }))

  if (target !== 'iphone-6_9') {
    return appStoreSizes
  }

  const deviceScreenSize: ImageDimensions = {
    width: DEVICE_SPECS[deviceModel].screen.width,
    height: DEVICE_SPECS[deviceModel].screen.height,
  }

  const hasDeviceSize = appStoreSizes.some(
    (size) => size.width === deviceScreenSize.width && size.height === deviceScreenSize.height
  )
  if (hasDeviceSize) {
    return appStoreSizes
  }

  return [...appStoreSizes, deviceScreenSize]
}

export function validateScreenshotDimensions(
  dimensions: ImageDimensions,
  target: ScreenshotTarget,
  deviceModel: DeviceModel
): ScreenshotValidationResult {
  const expectedSizes = getExpectedScreenshotSizes(target, deviceModel)
  const isExactMatch = expectedSizes.some((size) => size.width === dimensions.width && size.height === dimensions.height)

  const uploadedAspectRatio = dimensions.width / dimensions.height
  const aspectRatioDelta = expectedSizes.reduce((minDelta, size) => {
    const expectedAspectRatio = size.width / size.height
    return Math.min(minDelta, Math.abs(uploadedAspectRatio - expectedAspectRatio))
  }, Number.POSITIVE_INFINITY)

  const isAspectMatch = aspectRatioDelta <= ASPECT_RATIO_TOLERANCE
  const isCompatible = isExactMatch || isAspectMatch

  if (isCompatible) {
    return {
      dimensions,
      expectedSizes,
      isCompatible: true,
      message: null,
    }
  }

  const targetLabel = target === 'ipad-13' ? 'iPad' : 'iPhone'
  const expectedText = expectedSizes.map(formatSize).join(', ')

  return {
    dimensions,
    expectedSizes,
    isCompatible: false,
    message: `This screenshot is ${formatSize(dimensions)}. Upload a ${targetLabel} screenshot (${expectedText}).`,
  }
}

export async function readImageDimensions(blob: Blob): Promise<ImageDimensions> {
  return await new Promise((resolve, reject) => {
    const url = URL.createObjectURL(blob)
    const image = new Image()

    image.onload = () => {
      resolve({
        width: image.naturalWidth,
        height: image.naturalHeight,
      })
      URL.revokeObjectURL(url)
    }

    image.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('Failed to read screenshot dimensions'))
    }

    image.src = url
  })
}

export async function validateScreenshotBlob(
  blob: Blob,
  target: ScreenshotTarget,
  deviceModel: DeviceModel
): Promise<ScreenshotValidationResult> {
  const dimensions = await readImageDimensions(blob)
  return validateScreenshotDimensions(dimensions, target, deviceModel)
}
