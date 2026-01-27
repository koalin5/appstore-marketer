import type { DeviceMockupData, AnglePreset } from '../types'

// Placeholder mockup data structure
// In production, these would reference actual PNG/SVG mockup images
// For now, we'll create programmatic mockups using SVG

export const MOCKUP_DATA: Record<string, DeviceMockupData> = {
  'iphone-16-pro-max': {
    frameImage: '', // Will be SVG or data URL
    screenBounds: {
      straight: {
        corners: [
          [150, 200],
          [1140, 200],
          [1140, 2596],
          [150, 2596],
        ],
        width: 990,
        height: 2396,
      },
      'slight-left': {
        corners: [
          [160, 210],
          [1130, 195],
          [1120, 2586],
          [155, 2601],
        ],
        width: 990,
        height: 2396,
      },
      'slight-right': {
        corners: [
          [145, 195],
          [1145, 210],
          [1155, 2601],
          [140, 2586],
        ],
        width: 990,
        height: 2396,
      },
      'dramatic-left': {
        corners: [
          [180, 230],
          [1100, 180],
          [1080, 2560],
          [170, 2610],
        ],
        width: 990,
        height: 2396,
      },
      'dramatic-right': {
        corners: [
          [130, 180],
          [1160, 230],
          [1180, 2610],
          [120, 2560],
        ],
        width: 990,
        height: 2396,
      },
    },
  },
  'iphone-16-pro': {
    frameImage: '',
    screenBounds: {
      straight: {
        corners: [
          [150, 200],
          [1029, 200],
          [1029, 2356],
          [150, 2356],
        ],
        width: 879,
        height: 2156,
      },
      'slight-left': {
        corners: [
          [160, 210],
          [1019, 195],
          [1009, 2346],
          [155, 2361],
        ],
        width: 879,
        height: 2156,
      },
      'slight-right': {
        corners: [
          [145, 195],
          [1034, 210],
          [1044, 2361],
          [140, 2346],
        ],
        width: 879,
        height: 2156,
      },
      'dramatic-left': {
        corners: [
          [180, 230],
          [990, 180],
          [970, 2320],
          [170, 2370],
        ],
        width: 879,
        height: 2156,
      },
      'dramatic-right': {
        corners: [
          [130, 180],
          [1050, 230],
          [1070, 2370],
          [120, 2320],
        ],
        width: 879,
        height: 2156,
      },
    },
  },
  'iphone-15-pro-max': {
    frameImage: '',
    screenBounds: {
      straight: {
        corners: [
          [150, 200],
          [1140, 200],
          [1140, 2596],
          [150, 2596],
        ],
        width: 990,
        height: 2396,
      },
      'slight-left': {
        corners: [
          [160, 210],
          [1130, 195],
          [1120, 2586],
          [155, 2601],
        ],
        width: 990,
        height: 2396,
      },
      'slight-right': {
        corners: [
          [145, 195],
          [1145, 210],
          [1155, 2601],
          [140, 2586],
        ],
        width: 990,
        height: 2396,
      },
      'dramatic-left': {
        corners: [
          [180, 230],
          [1100, 180],
          [1080, 2560],
          [170, 2610],
        ],
        width: 990,
        height: 2396,
      },
      'dramatic-right': {
        corners: [
          [130, 180],
          [1160, 230],
          [1180, 2610],
          [120, 2560],
        ],
        width: 990,
        height: 2396,
      },
    },
  },
}

/**
 * Generate SVG device frame programmatically
 */
export function generateDeviceFrameSVG(
  model: string,
  angle: AnglePreset,
  width: number,
  height: number
): string {
  // Simplified device frame SVG
  // In production, use actual high-quality mockup images
  const screenBounds = MOCKUP_DATA[model]?.screenBounds[angle]
  if (!screenBounds) return ''
  
  const [topLeft, topRight, bottomRight, bottomLeft] = screenBounds.corners
  
  // Generate unique ID for this SVG to avoid conflicts
  const gradientId = `phoneGradient-${model}-${angle}`
  
  return `
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg" style="display: block;">
      <defs>
        <linearGradient id="${gradientId}" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" style="stop-color:#1a1a1a;stop-opacity:1" />
          <stop offset="100%" style="stop-color:#000000;stop-opacity:1" />
        </linearGradient>
        <mask id="screenMask-${model}-${angle}">
          <rect x="0" y="0" width="${width}" height="${height}" fill="white"/>
          <polygon points="${topLeft[0]},${topLeft[1]} ${topRight[0]},${topRight[1]} ${bottomRight[0]},${bottomRight[1]} ${bottomLeft[0]},${bottomLeft[1]}" fill="black"/>
        </mask>
      </defs>
      <!-- Phone frame -->
      <rect x="0" y="0" width="${width}" height="${height}" fill="url(#${gradientId})" rx="60" ry="60"/>
      <!-- Screen area cutout - use a mask to create transparent area -->
      <defs>
        <mask id="screenMask-${model}-${angle}">
          <rect x="0" y="0" width="${width}" height="${height}" fill="white"/>
          <polygon points="${topLeft[0]},${topLeft[1]} ${topRight[0]},${topRight[1]} ${bottomRight[0]},${bottomRight[1]} ${bottomLeft[0]},${bottomLeft[1]}" fill="black"/>
        </mask>
      </defs>
      <!-- Dynamic Island -->
      <ellipse cx="${width / 2}" cy="220" rx="80" ry="25" fill="#000000"/>
    </svg>
  `.trim()
}
