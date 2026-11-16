# Motion Prompt Arena (`motion_arena`)

Static, zero-dependency comparison website for evaluating multiple AI models on the exact same 15-second motion-graphics showreel prompt.

## Features
- **Synchronized Dual Playback**: Locks two (or all) `1920×1080 @ 60fps` videos within milliseconds, with `0.25× / 0.5× / 1× / 1.5×` speed, `-1f / +1f` frame stepping, and loop mode.
- **Split-Screen Wipe Curtain**: Interactive draggable curtain (`25% / 50% / 75%` presets + mouse/touch drag) comparing Gemini 4 Hydrogen and ChatGPT 6.2 Sol Max (`AFTERFORM`) pixel-for-pixel.
- **Solo Audio Switching**: Switch seamlessly between Model A, Model B, Mix, or Mute.
- **Instant Local Model Upload**: Drag & drop new `.mp4` / `.webm` videos in-browser and export the `models.json` object to commit permanently.
- **China-Direct Friendly**: Zero external CDN fonts/scripts so loading stays fast with or without a VPN. Video assets are kept under **25 MiB** (`10.74 MiB` and `16.83 MiB`) to fit both EdgeOne Pages and Cloudflare Pages single-file caps.

## Local Preview
```powershell
python -m http.server 8080 --directory dist
# Open http://127.0.0.1:8080
```

## Adding New Models Permanently
1. Put your new `.mp4` under `dist/videos/` (keep each file `< 25 MB` for free EdgeOne / Cloudflare hosting).
2. Optional: put cover image under `dist/posters/`.
3. Add an entry to `dist/models.json` under `"models": [...]` (you can generate the snippet inside the web UI's `+ 添加本地对比视频` modal).

## Free Deployment Options
- **Tencent EdgeOne Pages / Makers (Recommended for Mainland China No-VPN Access)**:
  Run `.\deploy_edgeone.ps1` (uses `npx edgeone makers deploy dist -n motion-prompt-arena`), or `npx edgeone login` followed by deployment.
- **Cloudflare Pages (Global Unlimited Bandwidth CDN)**:
  Run `.\deploy_cloudflare.ps1` (requires `npx wrangler login` once). Note: `.pages.dev` often requires VPN or a custom optimized domain from mainland China.
- **GitHub Pages**:
  Push `dist/` to a GitHub repository and enable GitHub Pages on `/docs` or via GitHub Actions. Keep files `< 100 MB` (both videos already qualify).
