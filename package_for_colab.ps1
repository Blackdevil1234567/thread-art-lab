# =============================================
# Threadify — Colab Packaging Script
# Run this from the "thread art" folder.
# Output: threadify.zip (ready to upload to Colab)
# =============================================

$ErrorActionPreference = "Stop"
$ROOT  = Split-Path -Parent $MyInvocation.MyCommand.Path
$DEST  = "$ROOT\threadify_colab_package"
$ZIP   = "$ROOT\threadify.zip"

Write-Host ""
Write-Host "=== Threadify Colab Packager ===" -ForegroundColor Cyan
Write-Host "Root: $ROOT"

# Clean up previous build
if (Test-Path $DEST) { Remove-Item $DEST -Recurse -Force }
if (Test-Path $ZIP)  { Remove-Item $ZIP  -Force }

New-Item -ItemType Directory -Path "$DEST\backend"   | Out-Null
New-Item -ItemType Directory -Path "$DEST\frontend"  | Out-Null

# ── Backend files (exclude venv, __pycache__, debug images)
Write-Host "`n[1/3] Copying backend..." -ForegroundColor Yellow
$backendFiles = @(
    "main.py",
    "thread_art.py",
    "pdf_generator.py",
    "requirements.txt"
)
foreach ($f in $backendFiles) {
    $src = "$ROOT\backend\$f"
    if (Test-Path $src) {
        Copy-Item $src "$DEST\backend\$f"
        Write-Host "   Copied: $f"
    } else {
        Write-Host "   WARNING: $f not found, skipping." -ForegroundColor Red
    }
}

# ── Frontend files (exclude node_modules, dist)
Write-Host "`n[2/3] Copying frontend (source only)..." -ForegroundColor Yellow
$frontendExclude = @("node_modules", "dist", ".git")
Get-ChildItem "$ROOT\frontend" | Where-Object { $frontendExclude -notcontains $_.Name } | ForEach-Object {
    $target = "$DEST\frontend\$($_.Name)"
    Copy-Item $_.FullName $target -Recurse -Force
    Write-Host "   Copied: $($_.Name)"
}

# ── Colab notebook
Write-Host "`n[3/3] Copying Colab notebook..." -ForegroundColor Yellow
Copy-Item "$ROOT\threadify_colab.ipynb" "$DEST\threadify_colab.ipynb"
Write-Host "   Copied: threadify_colab.ipynb"

# ── Create ZIP
Write-Host "`nCreating ZIP archive..." -ForegroundColor Yellow
Compress-Archive -Path "$DEST\*" -DestinationPath $ZIP -CompressionLevel Optimal
Write-Host ""
Write-Host "✅ Done! Package ready at:" -ForegroundColor Green
Write-Host "   $ZIP" -ForegroundColor Green
$size = (Get-Item $ZIP).Length / 1MB
Write-Host ("   Size: {0:N2} MB" -f $size)

# Clean temp folder
Remove-Item $DEST -Recurse -Force
Write-Host "`nUpload this ZIP to Colab when Cell 1 prompts you."
Write-Host ""
