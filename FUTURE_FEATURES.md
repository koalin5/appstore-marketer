# Future Feature Roadmap

Ranked by user value and commercial viability for an App Store screenshot design tool.

---

## Tier 1 — High Value, High Commercial Impact

### 1. Status Bar Overlay (Clean 9:41)
**What**: Automatically overlay a clean iOS status bar (9:41 time, full signal/wifi/battery) on device screenshots — the Apple-standard look.
**Why it matters**: Most raw screenshots show messy status bars (random times, low battery, carrier names). Apple's own marketing always uses 9:41. Users currently have to manually clean this up in another tool. Removing that friction is a big deal.
**Complexity**: Low — a static SVG overlay positioned at the top of the device screen area.
**Competitors**: Status Bar Screenshot Editor (dedicated App Store app), Screenshots Pro supports it.

### 2. Caption Text Templates / Presets
**What**: Pre-designed text layout presets users can apply with one click — e.g., "Bold Center", "Top-Left Editorial", "Bottom Card", "Split Headline + Badge".
**Why it matters**: Most users stare at a blank headline field and don't know what looks good. Templates give them a starting point and dramatically speed up workflow. Also lets the app showcase its design capabilities.
**Complexity**: Low — just preset combinations of existing TextConfig values (font, size, position, alignment, color, sub-caption settings).
**Competitors**: AppLaunchpad, AppScreens, Screenshots Pro all offer templates.

### 3. Badge / Award Overlays
**What**: Draggable overlay elements like "New", "#1 in Productivity", "Editor's Choice", star ratings, "App of the Day", "4.9 ★★★★★", "Featured on Product Hunt".
**Why it matters**: Social proof badges on App Store screenshots significantly boost conversion. Every successful app uses them. Currently users need Figma/Photoshop to add these.
**Complexity**: Medium — needs a simple layer/overlay system with positioning. Could start with fixed-position badge slots (top-left, top-right) to keep it simple.
**Competitors**: Screenshots Pro, AppMockUp Studio.

---

## Tier 2 — Medium-High Value

### 4. Custom Font Upload
**What**: Let users upload their own .ttf/.otf/.woff2 font files beyond the 6 built-in options.
**Why it matters**: Brand consistency is critical. Apps have brand fonts and users want their screenshots to match their app's typography. Currently limited to 6 generic options.
**Complexity**: Low — load font via FontFace API, add to FONT_OPTIONS dynamically, store in IndexedDB.
**Competitors**: Screenshots Pro and AppScreens both support custom fonts.

### 5. Custom Product Pages Support
**What**: Organize screenshots into named "page sets" (e.g., "Default", "Search Ads - Fitness", "Search Ads - Weight Loss") within a project, each with different text/order but same underlying design.
**Why it matters**: Apple's Custom Product Pages (CPP) let developers create up to 35 unique App Store pages targeting different audiences. This is the #1 ASO strategy for 2025-2026. Making it easy to manage multiple page variants is hugely valuable.
**Complexity**: Medium — extends the existing slide model with a "page set" grouping layer.
**Competitors**: AppScreens has basic support; most tools don't handle this well yet — opportunity to differentiate.

### 6. Slide Reordering via Drag-and-Drop
**What**: Drag slides in the thumbnail panel to reorder them instead of only navigating with prev/next buttons.
**Why it matters**: Users iterate on slide order constantly to optimize the first 3 screenshots (the ones visible without scrolling). Current prev/next navigation is clunky for reordering.
**Complexity**: Low-Medium — use a library like dnd-kit or @hello-pangea/dnd. Existing slides array just needs index swapping.

---

## Tier 3 — Medium Value

### 7. Background Pattern Library
**What**: Subtle geometric/abstract patterns as background options (dots, grids, waves, gradients with texture).
**Why it matters**: Solid colors and gradients get repetitive. Patterns add visual interest without requiring design skills. Many top apps use subtle patterns.
**Complexity**: Low — SVG patterns rendered as background, add to existing BackgroundConfig as a new type.

### 8. App Icon Display on Screenshots
**What**: Option to show the project's app icon on the screenshot itself (typically in a corner or above the headline).
**Why it matters**: Reinforces brand recognition, especially when screenshots appear in search results alongside competitors. Already have the app icon in the project model.
**Complexity**: Low — render the existing `appIcon` as an optional overlay element with position presets.

### 9. Multi-Device Showcase (Side-by-Side)
**What**: Show two devices side by side on a single screenshot (e.g., iPhone + iPad, or two iPhone screens).
**Why it matters**: Common pattern in professional App Store listings to show complementary screens. Demonstrates the app's breadth.
**Complexity**: Medium-High — needs a layout system for multiple device instances per slide.

### 10. A/B Testing Metadata
**What**: Let users tag screenshot variants (A/B) and track which set they're using in App Store Connect. Notes field per slide set.
**Why it matters**: Screenshot A/B testing is standard ASO practice. Having the tool aware of variants helps users stay organized.
**Complexity**: Low — metadata/tagging layer on existing project model.

---

## Tier 4 — Nice to Have

### 11. Android Device Frames
**What**: Add Google Pixel and Samsung Galaxy device frames alongside iPhone/iPad.
**Why it matters**: Many apps ship on both platforms. Supporting Android frames makes the tool useful for Google Play Store screenshots too — doubles the addressable market.
**Complexity**: Medium — new device specs, frames, and Google Play export dimensions. The architecture already supports it conceptually.

### 12. Direct App Store Connect Upload
**What**: OAuth integration with App Store Connect API to upload screenshots directly.
**Why it matters**: Eliminates the manual upload step. Especially valuable when combined with localization (uploading 10+ locale sets manually is tedious).
**Complexity**: High — requires OAuth flow, Apple API integration, and moves away from the "no backend" constraint.

### 13. Screenshot Preview Mockup
**What**: Show how the screenshots will look on the actual App Store product page (search result card, product page gallery).
**Why it matters**: Helps users evaluate their screenshots in context. The first 3 screenshots in search results are critical for conversion.
**Complexity**: Medium — mock App Store UI shell rendered around the user's screenshots.

### 14. Undo/Redo
**What**: Ctrl+Z / Ctrl+Y to undo and redo changes.
**Why it matters**: Standard editing expectation. Users make mistakes and want to go back without manually reversing changes.
**Complexity**: Medium — state history stack on the slide/project model.

---

## Summary Table

| # | Feature | User Value | Commercial Impact | Complexity | Priority |
|---|---------|-----------|-------------------|------------|----------|
| 1 | Status Bar Overlay | High | High | Low | Do next |
| 2 | Caption Templates | High | High | Low | Do next |
| 3 | Badge Overlays | High | High | Medium | Soon |
| 4 | Custom Font Upload | Medium-High | Medium | Low | Soon |
| 5 | Custom Product Pages | High | Very High | Medium | Soon |
| 6 | Drag-and-Drop Reorder | Medium | Medium | Low | Soon |
| 7 | Background Patterns | Medium | Low | Low | Later |
| 8 | App Icon Display | Medium | Low | Low | Later |
| 9 | Multi-Device Layout | Medium | Medium | High | Later |
| 10 | A/B Test Metadata | Low-Medium | Medium | Low | Later |
| 11 | Android Frames | Medium | High | Medium | Later |
| 12 | App Store Connect Upload | Medium | High | High | Eventually |
| 13 | Store Preview Mockup | Medium | Medium | Medium | Eventually |
| 14 | Undo/Redo | Medium | Low | Medium | Eventually |
