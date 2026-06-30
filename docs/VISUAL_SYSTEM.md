# Canvas 2D Visual System - KoalaFi

## Rendering Engine

Visual backgrounds in KoalaFi are rendered using a high-performance, battery-conscious HTML5 Canvas 2D context. No heavy WebGL shaders are loaded, conserving device memory and CPU processing.

## Visual Themes

1. **Sunset Glow (`sunset`)**: warm coral orange to deep indigo twilight sky gradient and horizontal water reflections.
2. **Indigo Rain (`night-rain`)**: dark slate grid, vertical falling raindrops with wind angles, and minimal blue moonlight.
3. **Minimal Dark (`minimal-dark`)**: clean zinc monochrome atmosphere and light grey highlights (minimal emission).
4. **Neon Coast (`neon-coast`)**: hot pink and indigo gradient sky with cyan perspective scrolling highway grids.

## Sun-Centered Player

The main sun is a DOM/CSS button in `src/lib/components/SunPlayer.svelte`, not a Canvas hit target. Canvas keeps the sky, horizon, water/reflections, rain, and grid motion. Shared layout values live in `src/lib/visuals/sunLayout.ts` so the canvas reflection stays visually aligned with the DOM sun without duplicating the sun disc.

## Performance Capping

### 1. Page Visibility Observer

Frame rendering loops are immediately suspended when the application tab is hidden (`document.visibilityState !== 'visible'`).

### 2. Device Pixel Ratio Clamp

Canvas drawing sizes are scaled using:
`const dpr = Math.min(window.devicePixelRatio || 1, 2);`
This prevents rendering overload on Ultra-HD screens.

### 3. FPS Limiting

Frame updates are throttled using delta-time checks inside the render loop:

- **Desktop Calm**: Capped at ~18 FPS.
- **Desktop Reactive**: Capped at ~24 FPS.
- **Mobile Calm**: Capped at ~12 FPS.
- **Mobile Reactive**: Capped at ~18 FPS.
- **Motion Off**: Complete stop of the animation loop; renders once on state changes.

### 4. Accessibility

If the browser matchMedia detects `prefers-reduced-motion: reduce`, the background rendering loop immediately switches to static render mode, preventing eye strain.
