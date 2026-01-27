// Soft, pastel solid colors - modern and clean
export const SOLID_COLORS = [
  '#FFFFFF',   // White
  '#F8F8F8',   // Off-white
  '#F5F5F0',   // Cream
  '#F0F4F8',   // Light blue-gray
  '#E8F4F8',   // Pale cyan
  '#FFF9E6',   // Pale yellow
  '#E8F5E9',   // Pale mint
  '#FCE4EC',   // Pale pink
  '#1E3A5F',   // Deep navy
  '#1A1A1A',   // Near black
]

// Soft gradient presets - muted, elegant combinations
export const GRADIENT_PRESETS: Array<{
  name: string
  colors: string[]
  direction: number
}> = [
  { name: 'Soft Peach', colors: ['#FFECD2', '#FCB69F'], direction: 180 },
  { name: 'Mint Cream', colors: ['#E0F2E9', '#A8E6CF'], direction: 180 },
  { name: 'Lavender', colors: ['#E8E0F0', '#D4C4E3'], direction: 180 },
  { name: 'Sky', colors: ['#E0F7FA', '#B2EBF2'], direction: 180 },
  { name: 'Blush', colors: ['#FDE2E4', '#FAD2CF'], direction: 180 },
  { name: 'Sage', colors: ['#E8F0E8', '#C8DCC8'], direction: 180 },
  { name: 'Ocean', colors: ['#667EEA', '#764BA2'], direction: 135 },
  { name: 'Sunset', colors: ['#FA709A', '#FEE140'], direction: 135 },
  { name: 'Deep Blue', colors: ['#1E3A5F', '#2E5A7F'], direction: 180 },
  { name: 'Charcoal', colors: ['#2C3E50', '#1A1A2E'], direction: 180 },
]

export const FONT_OPTIONS: Array<{
  id: string
  name: string
  family: string
}> = [
  { id: 'sf-pro', name: 'SF Pro Display', family: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif' },
  { id: 'inter', name: 'Inter', family: '"Inter", sans-serif' },
  { id: 'poppins', name: 'Poppins', family: '"Poppins", sans-serif' },
  { id: 'dm-sans', name: 'DM Sans', family: '"DM Sans", sans-serif' },
  { id: 'playfair', name: 'Playfair Display', family: '"Playfair Display", serif' },
  { id: 'space-grotesk', name: 'Space Grotesk', family: '"Space Grotesk", sans-serif' },
]

export const DEVICE_MODELS: Array<{
  id: DeviceModel
  name: string
  dimensions: { width: number; height: number }
}> = [
  { id: 'iphone-16-pro-max', name: 'iPhone 16 Pro Max', dimensions: { width: 1290, height: 2796 } },
  { id: 'iphone-16-pro', name: 'iPhone 16 Pro', dimensions: { width: 1179, height: 2556 } },
  { id: 'iphone-15-pro-max', name: 'iPhone 15 Pro Max', dimensions: { width: 1290, height: 2796 } },
]

export type DeviceModel = 'iphone-16-pro-max' | 'iphone-16-pro' | 'iphone-15-pro-max'
