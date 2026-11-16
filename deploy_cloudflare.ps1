# Deploy to Cloudflare Pages (Global free static CDN, unlimited bandwidth, 25 MiB/file limit)
$dist = Join-Path $PSScriptRoot "dist"
Write-Host "Deploying $dist to Cloudflare Pages..."
npx --yes wrangler pages deploy "$dist" --project-name=motion-prompt-arena
