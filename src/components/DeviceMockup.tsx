import { useEffect, useState } from 'react'
import type { DeviceConfig, AnglePreset, ScreenshotTarget } from '../types'
import { getScreenshot } from '../utils/storage'
import { getActiveDeviceSpec } from '../presets/deviceSpecs'
import { DEFAULT_SCREENSHOT_TARGET } from '../presets/exportSpecs'
import { validateScreenshotBlob } from '../utils/screenshotValidation'

interface DeviceMockupProps {
  device: DeviceConfig
  screenshotTarget?: ScreenshotTarget
  screenshotRef: string | null
  allowMismatchedScreenshot?: boolean
  width: number
  height: number
}

function getAngleTransform(angle: AnglePreset): { transform: string; shadow: string } {
  switch (angle) {
    case 'slight-left':
      return {
        transform: 'perspective(1200px) rotateY(8deg) rotateX(2deg)',
        shadow: '25px 35px 60px rgba(0,0,0,0.35)',
      }
    case 'slight-right':
      return {
        transform: 'perspective(1200px) rotateY(-8deg) rotateX(2deg)',
        shadow: '-25px 35px 60px rgba(0,0,0,0.35)',
      }
    case 'dramatic-left':
      return {
        transform: 'perspective(1000px) rotateY(18deg) rotateX(5deg)',
        shadow: '40px 50px 80px rgba(0,0,0,0.4)',
      }
    case 'dramatic-right':
      return {
        transform: 'perspective(1000px) rotateY(-18deg) rotateX(5deg)',
        shadow: '-40px 50px 80px rgba(0,0,0,0.4)',
      }
    default:
      return {
        transform: 'none',
        shadow: '0 40px 80px rgba(0,0,0,0.3)',
      }
  }
}

export default function DeviceMockup({
  device,
  screenshotTarget = DEFAULT_SCREENSHOT_TARGET,
  screenshotRef,
  allowMismatchedScreenshot = false,
  width,
  height,
}: DeviceMockupProps) {
  const [screenshotUrl, setScreenshotUrl] = useState<string | null>(null)
  const [validationMessage, setValidationMessage] = useState<string | null>(null)

  useEffect(() => {
    let url: string | null = null
    let cancelled = false

    async function loadScreenshot() {
      if (!screenshotRef) {
        setValidationMessage(null)
        setScreenshotUrl(null)
        return
      }

      const blob = await getScreenshot(screenshotRef)
      if (!blob) {
        if (!cancelled) {
          setValidationMessage(null)
          setScreenshotUrl(null)
        }
        return
      }

      try {
        const validation = await validateScreenshotBlob(blob, screenshotTarget, device.model)
        if (cancelled) return

        if (!validation.isCompatible && !allowMismatchedScreenshot) {
          setScreenshotUrl(null)
          setValidationMessage(validation.message)
          return
        }

        url = URL.createObjectURL(blob)
        setValidationMessage(null)
        setScreenshotUrl(url)
      } catch (error) {
        console.error('Failed to validate screenshot dimensions:', error)
        if (!cancelled) {
          setScreenshotUrl(null)
          setValidationMessage('Unable to read screenshot dimensions. Please upload another screenshot.')
        }
      }
    }

    loadScreenshot()

    return () => {
      cancelled = true
      if (url) {
        URL.revokeObjectURL(url)
      }
    }
  }, [allowMismatchedScreenshot, device.model, screenshotRef, screenshotTarget])

  const spec = getActiveDeviceSpec(screenshotTarget, device.model)
  const { transform, shadow } = getAngleTransform(device.angle)

  // Scale from frame image pixels to our render size
  const scale = width / spec.frameWidth

  // Position the screenshot exactly at the screen region inside the frame
  const screenLeft = spec.screen.x * scale
  const screenTop = spec.screen.y * scale
  const screenW = spec.screen.width * scale
  const screenH = spec.screen.height * scale

  // Clip the whole composite to the device body shape so nothing leaks outside
  const bodyRadius = width * spec.bodyRadiusRatio

  return (
    <div
      className="relative"
      style={{ width, height }}
    >
      <div
        className="absolute inset-0 overflow-hidden"
        style={{
          transform,
          transformStyle: 'preserve-3d',
          filter: `drop-shadow(${shadow})`,
          borderRadius: bodyRadius,
        }}
      >
        {/* Layer 1: Screenshot placed at the screen region inside the frame */}
        <div
          className="absolute overflow-hidden"
          style={{
            top: screenTop,
            left: screenLeft,
            width: screenW,
            height: screenH,
            background: '#000',
            borderRadius: screenW * spec.screenCornerRadiusRatio,
          }}
        >
          {screenshotUrl ? (
            <img
              src={screenshotUrl}
              alt="App screenshot"
              className="w-full h-full object-cover"
            />
          ) : validationMessage ? (
            <div
              className="w-full h-full flex flex-col items-center justify-center px-5 py-6 text-center"
              style={{
                background:
                  'linear-gradient(180deg, #0b1220 0%, #0f1a2f 45%, #1f2937 100%)',
              }}
            >
              <div className="text-[10px] uppercase tracking-[0.12em] text-white/70 mb-2">Wrong Screenshot Size</div>
              <div className="text-[12px] leading-5 text-white/95 max-w-[260px]">{validationMessage}</div>
            </div>
          ) : (
            <div
              className="w-full h-full flex items-center justify-center"
              style={{
                background: 'linear-gradient(180deg, #1a1a2e 0%, #16213e 50%, #0f0f23 100%)',
              }}
            >
              <div className="text-center">
                <div className="text-gray-600 text-sm mb-1">📱</div>
                <div className="text-gray-500 text-xs">Drop screenshot</div>
              </div>
            </div>
          )}
        </div>

        {/* Layer 2: PNG device frame on top — opaque bezel masks the screenshot edges */}
        <img
          src={spec.frameSrc}
          alt=""
          className="absolute inset-0 w-full h-full"
          style={{ pointerEvents: 'none' }}
          draggable={false}
        />
      </div>
    </div>
  )
}
