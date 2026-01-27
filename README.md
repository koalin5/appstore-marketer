# iOS Screenshot Designer

A web-based tool for creating polished App Store screenshots for iOS apps. Design beautiful screenshots with device mockups, curated fonts, and flexible but constrained controls.

## Features

- **Device Mockups**: iPhone 16 Pro Max, iPhone 16 Pro, iPhone 15 Pro Max with 5 angle presets
- **Text Overlays**: Curated font selection (6 fonts), constrained positioning, alignment controls
- **Backgrounds**: Solid colors, gradients, or custom images with blur
- **Screenshot Import**: Drag-and-drop or file picker with perspective transforms for tilted angles
- **Multi-Slide Management**: Create, duplicate, delete, and reorder slides
- **High-Quality Export**: Export individual slides or batch export as ZIP at exact App Store dimensions
- **Auto-Save**: Client-side persistence with localStorage + IndexedDB

## Getting Started

### Installation

```bash
npm install
```

### Development

```bash
npm run dev
```

### Build

```bash
npm run build
```

## Usage

1. **Create a Project**: Start with a new project or load an existing one
2. **Add Slides**: Click "+ Add Slide" to create multiple screenshots
3. **Upload Screenshot**: Use the file picker to upload your app screenshot
4. **Customize**:
   - Choose background (solid, gradient, or image)
   - Add headline text with font, size, alignment controls
   - Select device model and angle
5. **Export**: Export individual slides or all slides as a ZIP file

## App Store Dimensions

The tool exports at exact App Store requirements:
- iPhone 16 Pro Max: 1290 × 2796 pixels
- iPhone 16 Pro: 1179 × 2556 pixels
- iPhone 15 Pro Max: 1290 × 2796 pixels

## Tech Stack

- React 18
- TypeScript
- Vite
- Tailwind CSS
- html2canvas (for export)
- IndexedDB (for image storage)

## Storage

Projects are stored locally in your browser:
- Project metadata: localStorage
- Images (screenshots, backgrounds): IndexedDB

## License

MIT
