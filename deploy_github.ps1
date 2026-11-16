# Deploy static dist/ directory to GitHub Pages (gh-pages branch) + sync main
param(
    [string]$Message = "Update Motion Arena models and assets"
)

$ErrorActionPreference = "Stop"
Set-Location $PSScriptRoot

$ghExe = (Get-Command gh -ErrorAction SilentlyContinue | Select-Object -ExpandProperty Source -First 1)
if ($ghExe) {
    & $ghExe auth setup-git | Out-Null
}

git add -A
$status = git status --porcelain
if ($status) {
    git commit -m $Message
}

git push origin main
$splitSha = git subtree split --prefix=dist main
git push origin "${splitSha}:refs/heads/gh-pages" --force
Write-Host "Pushed main + gh-pages! Check GitHub Pages URL in ~1 minute."
