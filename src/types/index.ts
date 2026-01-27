export interface Project {
  id: string
  name: string
  createdAt: number
  updatedAt: number
  slides: Slide[]
}

export interface Slide {
  id: string
  background: BackgroundConfig
  text: TextConfig
  device: DeviceConfig
  screenshotRef: string | null
}

export type BackgroundType = 'solid' | 'gradient' | 'image'

export interface BackgroundConfig {
  type: BackgroundType
  color?: string
  gradient?: GradientConfig
  imageRef?: string
  blur?: number
}

export interface GradientConfig {
  colors: string[]
  direction: number // degrees
}

export interface TextConfig {
  content: string
  font: FontOption
  size: number // Now a number for custom sizing (40-200)
  color: 'white' | 'black' | 'auto'
  align: 'left' | 'center' | 'right'
  verticalPosition: number // 0-100, percentage from top
}

export type FontOption =
  | 'sf-pro'
  | 'inter'
  | 'poppins'
  | 'dm-sans'
  | 'playfair'
  | 'space-grotesk'

export interface DeviceConfig {
  model: DeviceModel
  angle: AnglePreset
  verticalPosition: number // percentage from top (20-60)
}

export type DeviceModel = 'iphone-16-pro-max' | 'iphone-16-pro' | 'iphone-15-pro-max'

export type AnglePreset =
  | 'straight'
  | 'slight-left'
  | 'slight-right'
  | 'dramatic-left'
  | 'dramatic-right'

export interface DeviceMockupData {
  frameImage: string
  screenBounds: {
    [key in AnglePreset]: {
      corners: [number, number][] // 4 corners [x, y]
      width: number
      height: number
    }
  }
}
