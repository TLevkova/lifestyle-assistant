# Clean Next.js build artifacts
# This script helps resolve EPERM errors on Windows

Write-Host "Cleaning Next.js build artifacts..." -ForegroundColor Yellow

# Try to remove .next directory
if (Test-Path .next) {
    Write-Host "Attempting to remove .next directory..." -ForegroundColor Cyan
    try {
        Remove-Item .next -Recurse -Force -ErrorAction Stop
        Write-Host "✓ .next directory removed successfully" -ForegroundColor Green
    } catch {
        Write-Host "✗ Could not remove .next directory: $_" -ForegroundColor Red
        Write-Host "Please close any running Next.js dev servers or processes and try again." -ForegroundColor Yellow
        Write-Host "You may also need to manually delete the .next folder in File Explorer." -ForegroundColor Yellow
        exit 1
    }
} else {
    Write-Host "✓ .next directory does not exist" -ForegroundColor Green
}

# Clean other build artifacts
$artifacts = @(".next", "out", "dist", "build")
foreach ($artifact in $artifacts) {
    if (Test-Path $artifact) {
        Remove-Item $artifact -Recurse -Force -ErrorAction SilentlyContinue
    }
}

Write-Host "Cleanup complete!" -ForegroundColor Green

