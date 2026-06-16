param(
  [string]$Message = "Update Supabase config"
)

$ErrorActionPreference = "Stop"
$repoRoot = Split-Path -Parent $PSScriptRoot
Set-Location $repoRoot

function Invoke-Git {
  param(
    [Parameter(Mandatory = $true)]
    [string[]]$Args
  )

  & git @Args
  if ($LASTEXITCODE -ne 0) {
    throw "git $($Args -join ' ') failed."
  }
}

if (-not (Test-Path ".git")) {
  Write-Error "This folder is not a git repository."
}

if (-not (Test-Path "config.js")) {
  Write-Error "config.js was not found."
}

$config = Get-Content -Path "config.js" -Raw
if ($config -match "service_role|serviceRole|database password|db_password|JWT secret") {
  Write-Error "config.js looks like it may contain a private secret. Do not publish service_role keys, database passwords, or JWT secrets."
}

$remote = & git remote get-url origin 2>$null
if (-not $remote) {
  Write-Error "No git remote named origin is configured. Add your GitHub repository as origin first."
}

Invoke-Git @("add", "config.js", "README.md", "index.html", "app.js", "styles.css", "manifest.json", "sw.js", "icons/icon.svg", ".nojekyll", ".github/workflows/pages.yml", "scripts/publish-config.ps1")

$changes = & git diff --cached --name-only
if (-not $changes) {
  Write-Output "No changes to publish."
  exit 0
}

$timestamp = Get-Date -Format "yyyy-MM-dd HH:mm"
Invoke-Git @("-c", "user.name=Yilin", "-c", "user.email=yilin@example.local", "commit", "-m", "$Message ($timestamp)")
Invoke-Git @("push", "-u", "origin", "HEAD:main")

Write-Output "Published changes to GitHub. GitHub Pages should update after the Pages workflow finishes."
