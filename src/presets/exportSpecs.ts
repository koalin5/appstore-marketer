export interface ExportSize {
  width: number
  height: number
  label: string
}

/**
 * Apple accepts these exact portrait sizes for iPhone 6.9" screenshots.
 * Source: App Store Connect Help (Screenshot specifications).
 */
export const APP_STORE_IPHONE_ACCEPTED_SIZES: ExportSize[] = [
  { width: 1320, height: 2868, label: '6.9" (1320 × 2868)' },
  { width: 1290, height: 2796, label: '6.9" (1290 × 2796)' },
  { width: 1260, height: 2736, label: '6.9" (1260 × 2736)' },
]

export const DEFAULT_EXPORT_SIZE = APP_STORE_IPHONE_ACCEPTED_SIZES[0]

export const SCREENSHOT_WIDTH = DEFAULT_EXPORT_SIZE.width
export const SCREENSHOT_HEIGHT = DEFAULT_EXPORT_SIZE.height

export function isAcceptedIPhoneScreenshotSize(width: number, height: number): boolean {
  return APP_STORE_IPHONE_ACCEPTED_SIZES.some((size) => size.width === width && size.height === height)
}
