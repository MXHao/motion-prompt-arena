# Prompt Arena (`motion_arena`)

Static multi-modal benchmark site for comparing different AI models on the exact same prompt across **Videos (`MP4/WebM`)**, **Interactive Web Pages (`HTML/WebGL2`)**, and **Vector Graphics (`SVG`)**.

## Highlights
- **Two-Level Navigation**: Switch by Prompt Topic (`benchmarks[]`) and automatically group into Deliverable Categories (`video` / `html` / `svg` / `all`) when a prompt has multiple output types.
- **Stutter-Free Video Comparison**: Native independent `<video controls>` per card (play one or many anytime), `1s` GOP `yuv420p` streaming, one-click Audio Solo, and clean simultaneous `Play All` without mid-playback forced seeks.
- **GPU-Safe Interactive HTML Embedding**: WebGL/WebGL2 pages start as lightweight poster cards and boot cleanly on click (individually or together), with per-card Sleep/Unload, Reload, and Full-Tab links.
- **Transparent Telemetry**: Side-by-side comparison of generation time, token breakdown, cost notes, and per-category fairness disclaimers.

## Directory Layout
```text
dist/
  index.html / styles.css / app.js / models.json
  videos/     # Web-optimized MP4s (<= 25 MiB, 1s GOP, +faststart)
  posters/    # Cover images
  pages/      # Self-contained interactive HTML sub-apps (relative paths only)
```

## Updating GitHub Pages
```powershell
cd d:\projects\geminiVibe\motion_arena
powershell -ExecutionPolicy Bypass -File .\deploy_github.ps1 "Update models"
```
