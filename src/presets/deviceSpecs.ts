import type { DeviceModel, ScreenshotTarget } from '../types'

export interface DeviceSpec {
  /** Path to the transparent PNG frame image in /public */
  frameSrc: string
  /** Full frame image dimensions (px) */
  frameWidth: number
  frameHeight: number
  /** Screen region within the frame image (px) — where the screenshot sits */
  screen: { x: number; y: number; width: number; height: number }
  /** Radius ratio to round screenshot container corners (relative to screen width) */
  screenCornerRadiusRatio: number
  /** Radius ratio for clipping the full device body (relative to rendered width) */
  bodyRadiusRatio: number
}

export const DEVICE_SPECS: Record<DeviceModel, DeviceSpec> = {
  'iphone-17-pro-max': {
    frameSrc: '/frames/iphone-17-pro-max.png',
    frameWidth: 1470,
    frameHeight: 3000,
    screen: { x: 75, y: 66, width: 1320, height: 2868 },
    screenCornerRadiusRatio: 0.14,
    bodyRadiusRatio: 0.17,
  },
  'iphone-17-pro': {
    frameSrc: '/frames/iphone-17-pro.png',
    frameWidth: 1350,
    frameHeight: 2760,
    screen: { x: 72, y: 69, width: 1206, height: 2622 },
    screenCornerRadiusRatio: 0.14,
    bodyRadiusRatio: 0.17,
  },
  'iphone-16-pro-max': {
    frameSrc: '/frames/iphone-16-pro-max.png',
    frameWidth: 1470,
    frameHeight: 3000,
    screen: { x: 75, y: 66, width: 1320, height: 2868 },
    screenCornerRadiusRatio: 0.14,
    bodyRadiusRatio: 0.17,
  },
  'iphone-16-pro': {
    frameSrc: '/frames/iphone-16-pro.png',
    frameWidth: 1350,
    frameHeight: 2760,
    screen: { x: 72, y: 69, width: 1206, height: 2622 },
    screenCornerRadiusRatio: 0.14,
    bodyRadiusRatio: 0.17,
  },
}

export const IPAD_13_DEVICE_SPEC: DeviceSpec = {
  frameSrc: '/frames/iPad%20-%20Silver%20-%20Portrait.png',
  frameWidth: 1840,
  frameHeight: 2660,
  screen: { x: 110, y: 250, width: 1620, height: 2160 },
  screenCornerRadiusRatio: 0,
  bodyRadiusRatio: 0.05,
}

export function getActiveDeviceSpec(target: ScreenshotTarget, deviceModel: DeviceModel): DeviceSpec {
  if (target === 'ipad-13') {
    return IPAD_13_DEVICE_SPEC
  }
  return DEVICE_SPECS[deviceModel]
}
