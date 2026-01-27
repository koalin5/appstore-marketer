import { useEffect, useState } from 'react'
import type { DeviceConfig, AnglePreset } from '../types'
import { getScreenshot } from '../utils/storage'

interface DeviceMockupProps {
  device: DeviceConfig
  screenshotRef: string | null
  width: number
  height: number
}

// Get CSS transform and shadow for different angles
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

  const { transform, shadow } = getAngleTransform(device.angle)
  
  // Frame dimensions
  const frameRadius = width * 0.08 // Corner radius
  const bezelWidth = width * 0.025 // Bezel thickness
  const screenRadius = frameRadius - bezelWidth

  return (
    <div
      className="relative"
      style={{
        width,
        height,
      }}
    >
      {/* Phone container with transform and shadow */}
      <div
        className="absolute inset-0"
        style={{
          transform,
          transformStyle: 'preserve-3d',
        }}
      >
        {/* Phone outer frame - titanium finish */}
        <div
          className="absolute inset-0"
          style={{
            borderRadius: frameRadius,
            background: `
              linear-gradient(135deg, 
                #3a3a3c 0%, 
                #2c2c2e 20%, 
                #1c1c1e 50%, 
                #2c2c2e 80%, 
                #3a3a3c 100%
              )
            `,
            boxShadow: `
              ${shadow},
              inset 0 1px 1px rgba(255,255,255,0.15),
              inset 0 -1px 1px rgba(0,0,0,0.3)
            `,
          }}
        >
          {/* Side buttons - left side */}
          <div
            className="absolute"
            style={{
              left: -3,
              top: height * 0.18,
              width: 3,
              height: height * 0.04,
              borderRadius: '2px 0 0 2px',
              background: 'linear-gradient(90deg, #4a4a4c, #3a3a3c)',
            }}
          />
          <div
            className="absolute"
            style={{
              left: -3,
              top: height * 0.25,
              width: 3,
              height: height * 0.08,
              borderRadius: '2px 0 0 2px',
              background: 'linear-gradient(90deg, #4a4a4c, #3a3a3c)',
            }}
          />
          <div
            className="absolute"
            style={{
              left: -3,
              top: height * 0.35,
              width: 3,
              height: height * 0.08,
              borderRadius: '2px 0 0 2px',
              background: 'linear-gradient(90deg, #4a4a4c, #3a3a3c)',
            }}
          />
          
          {/* Power button - right side */}
          <div
            className="absolute"
            style={{
              right: -3,
              top: height * 0.25,
              width: 3,
              height: height * 0.1,
              borderRadius: '0 2px 2px 0',
              background: 'linear-gradient(270deg, #4a4a4c, #3a3a3c)',
            }}
          />
        </div>

        {/* Screen bezel/edge */}
        <div
          className="absolute"
          style={{
            top: bezelWidth,
            left: bezelWidth,
            right: bezelWidth,
            bottom: bezelWidth,
            borderRadius: screenRadius,
            background: '#000',
            overflow: 'hidden',
          }}
        >
          {/* Screenshot or placeholder */}
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
        
        {/* Screen glass reflection overlay */}
        <div
          className="absolute pointer-events-none"
          style={{
            top: bezelWidth,
            left: bezelWidth,
            right: bezelWidth,
            bottom: bezelWidth,
            borderRadius: screenRadius,
            background: 'linear-gradient(135deg, rgba(255,255,255,0.12) 0%, transparent 40%, transparent 100%)',
          }}
        />
      </div>
    </div>
  )
}
