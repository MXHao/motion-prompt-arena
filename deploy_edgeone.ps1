# Deploy to Tencent Cloud EdgeOne Makers (China-friendly free static hosting)
$dist = Join-Path $PSScriptRoot "dist"
Write-Host "Deploying $dist to EdgeOne Makers..."
npx --yes edgeone makers deploy "$dist" -n motion-prompt-arena -e production
