import type { DeviceModel } from '../types'

export interface DeviceSpec {
  /** Path to the transparent PNG frame image in /public */
  frameSrc: string
  /** Full frame image dimensions (px) */
  frameWidth: number
  frameHeight: number
  /** Screen region within the frame image (px) — where the screenshot sits */
  screen: { x: number; y: number; width: number; height: number }
}

export const DEVICE_SPECS: Record<DeviceModel, DeviceSpec> = {
  'iphone-17-pro-max': {
    frameSrc: '/frames/iphone-17-pro-max.png',
    frameWidth: 1470,
    frameHeight: 3000,
    screen: { x: 75, y: 66, width: 1320, height: 2868 },
  },
  'iphone-17-pro': {
    frameSrc: '/frames/iphone-17-pro.png',
    frameWidth: 1350,
    frameHeight: 2760,
    screen: { x: 72, y: 69, width: 1206, height: 2622 },
  },
  'iphone-16-pro-max': {
    frameSrc: '/frames/iphone-16-pro-max.png',
    frameWidth: 1470,
    frameHeight: 3000,
    screen: { x: 75, y: 66, width: 1320, height: 2868 },
  },
  'iphone-16-pro': {
    frameSrc: '/frames/iphone-16-pro.png',
    frameWidth: 1350,
    frameHeight: 2760,
    screen: { x: 72, y: 69, width: 1206, height: 2622 },
  },
}
