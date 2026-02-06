# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

iOS Screenshot Designer — a client-side web app for creating App Store screenshots with device mockups, text overlays, and background customization. No backend; all data persists in localStorage (project metadata) and IndexedDB (images).

## Commands

```bash
npm run dev      # Start Vite dev server (port 5173)
npm run build    # TypeScript check + Vite production build
npm run preview  # Preview production build
npm run lint     # ESLint with zero warnings allowed
```

No test framework is configured.

## Architecture

**Entry point**: `src/main.tsx` → `App.tsx` → `Editor` component.

**Core data model** (`src/types/index.ts`): A `Project` contains an array of `Slide`s. Each slide has a `BackgroundConfig`, `TextConfig`, `DeviceConfig`, and an optional screenshot reference (stored as an IndexedDB key).

**Component hierarchy**:
- **Editor** (`src/components/Editor.tsx`): Central state manager. Holds the slides array, current slide index, and all editing state. Auto-saves to localStorage every 500ms. Renders the left slide thumbnails panel, center canvas preview, and right-side editing controls.
- **Canvas** (`src/components/Canvas.tsx`): Renders a slide at fixed 1320x2868px (App Store-compliant iPhone 6.9" resolution). Composes background, text overlay, and device mockup. This is the element captured for export.
- **DeviceMockup** (`src/components/DeviceMockup.tsx`): Renders the iPhone frame with CSS 3D perspective transforms. Places the user's screenshot inside the device bezel.
- **ExportPanel** (`src/components/ExportPanel.tsx`): Single-slide PNG export via snapdom, batch ZIP export via JSZip + FileSaver.
- **BackgroundPicker** / **FontPicker**: UI controls for background and font selection.

**Storage layer** (`src/utils/storage.ts`): Wraps localStorage for project JSON and `idb-keyval` for binary image data (screenshots, background images).

**Export pipeline** (`src/utils/export.ts`): Uses snapdom to rasterize the Canvas DOM element to PNG at exact App Store dimensions.

**Presets** (`src/presets/colors.ts`): Curated color palettes, gradient presets, font options, device model specs, and angle presets.

## Key Constraints

- Canvas always renders at 1320x2868px regardless of selected device model — this is an App Store-compliant iPhone 6.9" screenshot size.
- Thumbnails in the slide panel render at 0.18 scale using CSS transforms.
- TypeScript strict mode is enabled with `noUnusedLocals` and `noUnusedParameters`.
- ESLint enforces `--max-warnings 0` — any warning fails the lint.
