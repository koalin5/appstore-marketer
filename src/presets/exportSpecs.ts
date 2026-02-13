import type { ScreenshotTarget } from '../types'

export interface ExportSize {
  width: number
  height: number
  label: string
}

export interface ScreenshotTargetSpec {
  id: ScreenshotTarget
  name: string
  defaultSize: ExportSize
  acceptedSizes: ExportSize[]
}

/**
 * Apple accepts these exact portrait sizes for iPhone 6.9" screenshots.
 * Source: App Store Connect Help (Screenshot specifications).
 */
export const APP_STORE_IPHONE_69_ACCEPTED_SIZES: ExportSize[] = [
  { width: 1320, height: 2868, label: '6.9" (1320 × 2868)' },
  { width: 1290, height: 2796, label: '6.9" (1290 × 2796)' },
  { width: 1260, height: 2736, label: '6.9" (1260 × 2736)' },
]

/**
 * Apple accepts these exact portrait sizes for iPad screenshots
 * in App Store Connect (13" and 12.9" classes).
 * Source: App Store Connect Help (Screenshot specifications).
 */
export const APP_STORE_IPAD_13_ACCEPTED_SIZES: ExportSize[] = [
  { width: 2064, height: 2752, label: '13" (2064 × 2752)' },
  { width: 2048, height: 2732, label: '12.9" (2048 × 2732)' },
]

export const SCREENSHOT_TARGET_SPECS: ScreenshotTargetSpec[] = [
  {
    id: 'iphone-6_9',
    name: 'iPhone 6.9"',
    defaultSize: APP_STORE_IPHONE_69_ACCEPTED_SIZES[0],
    acceptedSizes: APP_STORE_IPHONE_69_ACCEPTED_SIZES,
  },
  {
    id: 'ipad-13',
    name: 'iPad 13"',
    defaultSize: APP_STORE_IPAD_13_ACCEPTED_SIZES[0],
    acceptedSizes: APP_STORE_IPAD_13_ACCEPTED_SIZES,
  },
]

const SCREENSHOT_TARGET_SPEC_MAP = SCREENSHOT_TARGET_SPECS.reduce<Record<ScreenshotTarget, ScreenshotTargetSpec>>(
  (acc, spec) => {
    acc[spec.id] = spec
    return acc
  },
  {} as Record<ScreenshotTarget, ScreenshotTargetSpec>
)

export const DEFAULT_SCREENSHOT_TARGET: ScreenshotTarget = 'iphone-6_9'

export function isSupportedScreenshotTarget(value: unknown): value is ScreenshotTarget {
  if (typeof value !== 'string') return false
  return value in SCREENSHOT_TARGET_SPEC_MAP
}

export function getScreenshotTargetSpec(target: ScreenshotTarget): ScreenshotTargetSpec {
  return SCREENSHOT_TARGET_SPEC_MAP[target]
}

export function getDefaultExportSize(target: ScreenshotTarget): ExportSize {
  return getScreenshotTargetSpec(target).defaultSize
}

export function getAcceptedScreenshotSizes(target: ScreenshotTarget): ExportSize[] {
  return getScreenshotTargetSpec(target).acceptedSizes
}

export function isAcceptedScreenshotSize(target: ScreenshotTarget, width: number, height: number): boolean {
  return getAcceptedScreenshotSizes(target).some((size) => size.width === width && size.height === height)
}
