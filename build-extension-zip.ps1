#!/usr/bin/env powershell
<#
.SYNOPSIS
    Builds the SimcoIntel extension zip for Chrome Web Store / Firefox Add-ons / GitHub Pages

.DESCRIPTION
    Creates a clean zip from the extension/ directory excluding:
    - Source files (.ts, .md, etc.)
    - The zip itself
    - Node modules, git files, etc.
    - Dev/debug files

.EXAMPLE
    ./build-extension-zip.ps1
#>

param(
    [string]$ExtensionDir = "extension",
    [string]$OutputZip = "extension/simcointel-extension.zip"
)

# Files to include in the extension package
$includePatterns = @(
    "manifest.json",
    "background.js",
    "content.js",
    "bridge.js",
    "popup.html",
    "popup.js",
    "content.css",
    "icons/*"
)

# Files/dirs to exclude
$excludePatterns = @(
    "*.zip",
    "*.md",
    "*.ts",
    "*.map",
    "node_modules",
    ".git",
    ".gitignore",
    "*.log",
    "*.tmp",
    "*.ps1",
    "*.sh",
    "build*",
    "dist*",
    ".vscode",
    ".idea",
    "*.orig",
    "*.bak"
)

Write-Host "Building SimcoIntel extension zip..." -ForegroundColor Cyan
Write-Host "Source: $ExtensionDir" -ForegroundColor Gray
Write-Host "Output: $OutputZip" -ForegroundColor Gray

# Remove existing zip
if (Test-Path $OutputZip) {
    Remove-Item $OutputZip -Force
    Write-Host "Removed existing zip" -ForegroundColor Yellow
}

# Build file list
$files = @()
foreach ($pattern in $includePatterns) {
    $matched = Get-ChildItem -Path (Join-Path $ExtensionDir $pattern) -File -Recurse -ErrorAction SilentlyContinue
    $files += $matched.FullName
}

# Also include any files directly in extension dir that aren't excluded
$allFiles = Get-ChildItem -Path $ExtensionDir -File -Recurse -ErrorAction SilentlyContinue
foreach ($file in $allFiles) {
    $relPath = $file.FullName.Substring($ExtensionDir.Length + 1)
    $shouldExclude = $false
    foreach ($exclude in $excludePatterns) {
        if ($relPath -like $exclude) {
            $shouldExclude = $true
            break
        }
    }
    if (-not $shouldExclude -and $files -notcontains $file.FullName) {
        $files += $file.FullName
    }
}

Write-Host "Including $($files.Count) files:" -ForegroundColor Green
$files | ForEach-Object { Write-Host "  $_" -ForegroundColor Gray }

# Create zip
Compress-Archive -Path $files -DestinationPath $OutputZip -Force -CompressionLevel Optimal

# Verify
$zipSize = (Get-Item $OutputZip).Length
Write-Host "Created: $OutputZip ($([math]::Round($zipSize/1KB, 1)) KB)" -ForegroundColor Green

# List contents for verification
Write-Host "`nZip contents:" -ForegroundColor Cyan
$zipContents = Expand-Archive -Path $OutputZip -DestinationPath (Join-Path $env:TEMP "ext-zip-verify") -Force -PassThru
$zipContents | Sort-Object FullName | ForEach-Object { Write-Host "  $($_.FullName)" -ForegroundColor Gray }
Remove-Item (Join-Path $env:TEMP "ext-zip-verify") -Recurse -Force -ErrorAction SilentlyContinue

Write-Host "`nDone!" -ForegroundColor Green