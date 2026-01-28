import { useEffect, useState } from 'react'
import type { DeviceConfig, AnglePreset } from '../types'
import { getScreenshot } from '../utils/storage'
import { DEVICE_SPECS } from '../presets/deviceSpecs'

interface DeviceMockupProps {
  device: DeviceConfig
  screenshotRef: string | null
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
  screenshotRef,
  width,
  height,
}: DeviceMockupProps) {
  const [screenshotUrl, setScreenshotUrl] = useState<string | null>(null)

  useEffect(() => {
    let url: string | null = null

    async function loadScreenshot() {
      if (!screenshotRef) {
        setScreenshotUrl(null)
        return
      }

      const blob = await getScreenshot(screenshotRef)
      if (blob) {
        url = URL.createObjectURL(blob)
        setScreenshotUrl(url)
      }
    }

    loadScreenshot()

    return () => {
      if (url) {
        URL.revokeObjectURL(url)
      }
    }
  }, [screenshotRef])

  const spec = DEVICE_SPECS[device.model]
  const { transform, shadow } = getAngleTransform(device.angle)

  // Scale from frame image pixels to our render size
  const scale = width / spec.frameWidth

  // Position the screenshot exactly at the screen region inside the frame
  const screenLeft = spec.screen.x * scale
  const screenTop = spec.screen.y * scale
  const screenW = spec.screen.width * scale
  const screenH = spec.screen.height * scale

  // Clip the whole composite to the device body shape so nothing leaks outside
  const bodyRadius = width * 0.17

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
            borderRadius: screenW * 0.14,
          }}
        >
          {screenshotUrl ? (
            <img
              src={screenshotUrl}
              alt="App screenshot"
              className="w-full h-full object-cover"
            />
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
