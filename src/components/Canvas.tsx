import { useRef, useEffect, useState } from 'react'
import type { Slide, ScreenshotTarget } from '../types'
import { FONT_OPTIONS } from '../presets/colors'
import { getActiveDeviceSpec } from '../presets/deviceSpecs'
import { DEFAULT_SCREENSHOT_TARGET, getDefaultExportSize } from '../presets/exportSpecs'
import { getBackgroundImage } from '../utils/storage'
import { resolveLocalizedText } from '../utils/locale'
import DeviceMockup from './DeviceMockup'

interface CanvasProps {
  slide: Slide
  screenshotTarget?: ScreenshotTarget
  scale?: number
  locale?: string
  defaultLocale?: string
}

const DEFAULT_DEVICE_VERTICAL_POSITION = 35
const DEFAULT_DEVICE_FRAME_SCALE = 55
const DEFAULT_DEVICE_HORIZONTAL_POSITION = 50
const DEFAULT_HEADLINE_HORIZONTAL_OFFSET = 0

export default function Canvas({ slide, screenshotTarget = DEFAULT_SCREENSHOT_TARGET, scale = 0.18, locale, defaultLocale }: CanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [bgImageUrl, setBgImageUrl] = useState<string | null>(null)

  // Canvas size is always fixed to App Store requirements
  const exportSize = getDefaultExportSize(screenshotTarget)
  const nativeWidth = exportSize.width
  const nativeHeight = exportSize.height

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

  // Resolve locale-specific text
  const resolvedText = resolveLocalizedText(slide, locale, defaultLocale)

  // Text styling (scaled) - now uses numeric size directly
  const textSize = typeof slide.text.size === 'number' ? slide.text.size : 96
  const fontSize = textSize * scale
  const fontFamily = FONT_OPTIONS.find((f) => f.id === slide.text.font)?.family || 'Inter, sans-serif'
  const textColor = slide.text.color === 'white' ? '#FFFFFF' : '#000000'
  const shouldShowSubCaption = Boolean(slide.text.showSubCaption && resolvedText.subCaption.trim())
  const subCaptionScale =
    typeof slide.text.subCaptionSize === 'number' ? Math.max(25, Math.min(65, slide.text.subCaptionSize)) : 42
  const subCaptionSpacingScale =
    typeof slide.text.subCaptionSpacing === 'number' ? Math.max(6, Math.min(24, slide.text.subCaptionSpacing)) : 12
  const subCaptionFontSize = Math.max(24, Math.min(72, textSize * (subCaptionScale / 100))) * scale
  const subCaptionMarginTop = Math.max(8, Math.min(36, textSize * (subCaptionSpacingScale / 100))) * scale
  const subCaptionFontFamily =
    FONT_OPTIONS.find((f) => f.id === (slide.text.subCaptionFont ?? slide.text.font))?.family || fontFamily

  // Device mockup sizing — use frame image aspect ratio
  const deviceSpec = getActiveDeviceSpec(screenshotTarget, slide.device.model)
  const frameScale =
    typeof slide.device.frameScale === 'number' ? Math.max(40, Math.min(80, slide.device.frameScale)) : DEFAULT_DEVICE_FRAME_SCALE
  const allowOffCanvasPosition = slide.device.allowOffCanvasPosition ?? false
  const horizontalPosition =
    typeof slide.device.horizontalPosition === 'number'
      ? slide.device.horizontalPosition
      : DEFAULT_DEVICE_HORIZONTAL_POSITION
  const verticalPosition =
    typeof slide.device.verticalPosition === 'number'
      ? slide.device.verticalPosition
      : DEFAULT_DEVICE_VERTICAL_POSITION
  const effectiveHorizontalPosition = allowOffCanvasPosition
    ? Math.max(-30, Math.min(130, horizontalPosition))
    : DEFAULT_DEVICE_HORIZONTAL_POSITION
  const effectiveVerticalPosition = allowOffCanvasPosition
    ? Math.max(-30, Math.min(120, verticalPosition))
    : Math.max(0, Math.min(80, verticalPosition))
  const headlineVerticalPosition =
    typeof slide.text.verticalPosition === 'number' ? Math.max(5, Math.min(90, slide.text.verticalPosition)) : 12
  const headlineHorizontalOffset = allowOffCanvasPosition
    ? typeof slide.text.horizontalOffset === 'number'
      ? Math.max(-30, Math.min(30, slide.text.horizontalOffset))
      : DEFAULT_HEADLINE_HORIZONTAL_OFFSET
    : DEFAULT_HEADLINE_HORIZONTAL_OFFSET
  const headlineHorizontalShiftPx = displayWidth * (headlineHorizontalOffset / 100)

  const deviceDisplayWidth = displayWidth * (frameScale / 100)
  const deviceDisplayHeight = deviceDisplayWidth * (deviceSpec.frameHeight / deviceSpec.frameWidth)
  const deviceLeft = (displayWidth * (effectiveHorizontalPosition / 100)) - (deviceDisplayWidth / 2)
  const deviceTop = displayHeight * (effectiveVerticalPosition / 100)

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
          top: `${headlineVerticalPosition}%`,
          transform: `translate(${headlineHorizontalShiftPx}px, -50%)`,
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
          {resolvedText.content || 'Your headline here'}
        </div>
        {shouldShowSubCaption && (
          <div
            style={{
              marginTop: `${subCaptionMarginTop}px`,
              fontFamily: subCaptionFontFamily,
              fontSize: `${subCaptionFontSize}px`,
              fontWeight: 500,
              lineHeight: 1.3,
              opacity: 0.9,
              overflowWrap: 'break-word',
              wordBreak: 'break-word',
            }}
          >
            {resolvedText.subCaption}
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
          screenshotTarget={screenshotTarget}
          screenshotRef={slide.screenshotRef}
          allowMismatchedScreenshot={slide.allowMismatchedScreenshot ?? false}
          width={deviceDisplayWidth}
          height={deviceDisplayHeight}
        />
      </div>
    </div>
  )
}
