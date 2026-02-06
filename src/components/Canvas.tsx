import { useRef, useEffect, useState } from 'react'
import type { Slide } from '../types'
import { FONT_OPTIONS } from '../presets/colors'
import { DEVICE_SPECS } from '../presets/deviceSpecs'
import { SCREENSHOT_HEIGHT, SCREENSHOT_WIDTH } from '../presets/exportSpecs'
import { getBackgroundImage } from '../utils/storage'
import DeviceMockup from './DeviceMockup'

interface CanvasProps {
  slide: Slide
  scale?: number
}

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
    let cancelled = false

    async function loadBackgroundImage() {
      if (slide.background.type !== 'image' || !slide.background.imageRef) {
        setBgImageUrl(null)
        return
      }

      const blob = await getBackgroundImage(slide.background.imageRef)
      if (!blob || cancelled) {
        if (!cancelled) setBgImageUrl(null)
        return
      }

      const url = URL.createObjectURL(blob)
      if (!cancelled) {
        setBgImageUrl(url)
      } else {
        URL.revokeObjectURL(url)
      }
    }

    loadBackgroundImage()

    return () => {
      cancelled = true
    }
  }, [slide.background.type, slide.background.imageRef])

  useEffect(() => {
    return () => {
      if (bgImageUrl) {
        URL.revokeObjectURL(bgImageUrl)
      }
    }
  }, [bgImageUrl])

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
  const shouldShowSubCaption = Boolean(slide.text.showSubCaption && slide.text.subCaption.trim())
  const subCaptionScale =
    typeof slide.text.subCaptionSize === 'number' ? Math.max(25, Math.min(65, slide.text.subCaptionSize)) : 42
  const subCaptionFontSize = Math.max(24, Math.min(72, textSize * (subCaptionScale / 100))) * scale
  const subCaptionFontFamily =
    FONT_OPTIONS.find((f) => f.id === (slide.text.subCaptionFont ?? slide.text.font))?.family || fontFamily

  // Device mockup sizing — use frame image aspect ratio
  const deviceSpec = DEVICE_SPECS[slide.device.model]
  const deviceDisplayWidth = displayWidth * 0.55  // Phone takes 55% of canvas width
  const deviceDisplayHeight = deviceDisplayWidth * (deviceSpec.frameHeight / deviceSpec.frameWidth)
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
          color: textColor,
          textAlign: slide.text.align,
          textShadow: slide.text.color === 'white'
            ? `0 ${11 * scale}px ${22 * scale}px rgba(0,0,0,0.4)`
            : 'none',
          zIndex: 10,
        }}
      >
        <div
          style={{
            fontFamily,
            fontSize: `${fontSize}px`,
            fontWeight: 700,
            lineHeight: 1.2,
            overflowWrap: 'break-word',
            wordBreak: 'break-word',
          }}
        >
          {slide.text.content || 'Your headline here'}
        </div>
        {shouldShowSubCaption && (
          <div
            style={{
              marginTop: `${Math.max(10, textSize * 0.08) * scale}px`,
              fontFamily: subCaptionFontFamily,
              fontSize: `${subCaptionFontSize}px`,
              fontWeight: 500,
              lineHeight: 1.3,
              opacity: 0.9,
              overflowWrap: 'break-word',
              wordBreak: 'break-word',
            }}
          >
            {slide.text.subCaption}
          </div>
        )}
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
