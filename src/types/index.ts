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
  horizontalOffset: number // percentage offset for creative horizontal shifts (-30 to 30)
  showSubCaption: boolean
  subCaption: string
  subCaptionFont: FontOption
  subCaptionSize: number // Percentage of headline size (25-65)
  subCaptionSpacing: number // Percentage of headline size (6-24)
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
  verticalPosition: number // top position as percentage of canvas height
  frameScale: number // percentage of canvas width used by the phone frame
  horizontalPosition: number // center point as percentage of canvas width
  allowOffCanvasPosition: boolean // unlocks extended positioning range
}

export type DeviceModel = 'iphone-17-pro-max' | 'iphone-17-pro' | 'iphone-16-pro-max' | 'iphone-16-pro'

export type AnglePreset =
  | 'straight'
  | 'slight-left'
  | 'slight-right'
  | 'dramatic-left'
  | 'dramatic-right'
