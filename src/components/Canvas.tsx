import { useRef, useEffect, useState } from 'react'
import type { Slide } from '../types'
import { FONT_OPTIONS } from '../presets/colors'
import { getBackgroundImage } from '../utils/storage'
import DeviceMockup from './DeviceMockup'

interface CanvasProps {
  slide: Slide
  scale?: number
}

// App Store screenshot dimensions are FIXED - always 6.9" display size
// This is the export target, regardless of which device mockup is shown
const SCREENSHOT_WIDTH = 1290
const SCREENSHOT_HEIGHT = 2796

export default function Canvas({ slide, scale = 0.18 }: CanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [bgImageUrl, setBgImageUrl] = useState<string | null>(null)

  // Canvas size is always fixed to App Store requirements
  const nativeWidth = SCREENSHOT_WIDTH
  const nativeHeight = SCREENSHOT_HEIGHT

  // Calculate display dimensions
  const displayWidth = nativeWidth * scale
  const displayHeight = nativeHeight * scale

  // Load background image
  useEffect(() => {
    if (slide.background.type === 'image' && slide.background.imageRef) {
      getBackgroundImage(slide.background.imageRef).then(blob => {
        if (blob) {
          const url = URL.createObjectURL(blob)
          setBgImageUrl(url)
          return () => URL.revokeObjectURL(url)
        }
      })
    } else {
      setBgImageUrl(null)
    }
  }, [slide.background])

  // Get background style
  const getBackgroundStyle = () => {
    if (slide.background.type === 'solid' && slide.background.color) {
      return { backgroundColor: slide.background.color }
    }
    if (slide.background.type === 'gradient' && slide.background.gradient) {
      const { colors, direction } = slide.background.gradient
      return { background: `linear-gradient(${direction}deg, ${colors.join(', ')})` }
    }
    return { backgroundColor: '#FFFFFF' }
  }

  // Text styling (scaled) - now uses numeric size directly
  const textSize = typeof slide.text.size === 'number' ? slide.text.size : 96
  const fontSize = textSize * scale
  const fontFamily = FONT_OPTIONS.find((f) => f.id === slide.text.font)?.family || 'Inter, sans-serif'
  const textColor = slide.text.color === 'white' ? '#FFFFFF' : '#000000'

  // Device mockup sizing - the mockup is rendered at a fixed visual size
  // regardless of which device model is selected
  const deviceDisplayWidth = displayWidth * 0.55  // Phone takes 55% of canvas width
  const deviceDisplayHeight = deviceDisplayWidth * 2.17 // iPhone aspect ratio ~1:2.17
  const deviceLeft = (displayWidth - deviceDisplayWidth) / 2

  // Device vertical position - default to 35% if not set
  const deviceVerticalPosition = slide.device.verticalPosition ?? 35
  const deviceTop = displayHeight * (deviceVerticalPosition / 100)

  return (
    <div
      ref={containerRef}
      data-canvas-container
      className="relative overflow-hidden rounded-xl shadow-lg"
      style={{
        width: displayWidth,
        height: displayHeight,
        ...getBackgroundStyle(),
      }}
    >
      {/* Background image if set */}
      {bgImageUrl && slide.background.type === 'image' && (
        <img
          src={bgImageUrl}
          alt=""
          className="absolute inset-0 w-full h-full object-cover"
          style={{ filter: slide.background.blur ? `blur(${slide.background.blur * scale}px)` : undefined }}
        />
      )}

      {/* Text overlay */}
      <div
        className="absolute left-0 right-0"
        style={{
          top: `${slide.text.verticalPosition}%`,
          transform: 'translateY(-50%)',
          padding: `0 ${65 * scale}px`,
          fontFamily,
          fontSize: `${fontSize}px`,
          fontWeight: 700,
          color: textColor,
          textAlign: slide.text.align,
          lineHeight: 1.2,
          textShadow: slide.text.color === 'white'
            ? `0 ${11 * scale}px ${22 * scale}px rgba(0,0,0,0.4)`
            : 'none',
          zIndex: 10,
        }}
      >
        {slide.text.content || 'Your headline here'}
      </div>

      {/* Device Mockup */}
      <div
        className="absolute"
        style={{
          left: deviceLeft,
          top: deviceTop,
          width: deviceDisplayWidth,
          height: deviceDisplayHeight,
          zIndex: 5,
        }}
      >
        <DeviceMockup
          device={slide.device}
          screenshotRef={slide.screenshotRef}
          width={deviceDisplayWidth}
          height={deviceDisplayHeight}
        />
      </div>
    </div>
  )
}
