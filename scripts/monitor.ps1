# Screenshot Auto Backup - Monitor Script
# Author: Kilo Code
# Version: 4.0
# Purpose: Real-time monitor system screenshots folder using FileSystemWatcher
#          Automatically copy new screenshots to project folder when created

$ErrorActionPreference = "Continue"

# ========================================
# Configuration
# ========================================

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$sourceFolder = "$env:USERPROFILE\Pictures\Screenshots"
$targetFolder = Join-Path $scriptDir "..\screenshot"
$logFile = Join-Path $scriptDir "monitor.log"

# ========================================
# Logging Function
# ========================================

function Write-Log {
    param(
        [string]$Message,
        [string]$Level = "INFO"
    )
    
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $logEntry = "[$timestamp] [$Level] $Message"
    
    # Write to log file
    try {
        Add-Content -Path $logFile -Value $logEntry -Encoding UTF8 -ErrorAction SilentlyContinue
    } catch {}
    
    # Also write to console if not hidden
    if ($env:WINDOW_STYLE -ne "Hidden") {
        $color = switch ($Level) {
            "INFO" { "White" }
            "SUCCESS" { "Green" }
            "WARNING" { "Yellow" }
            "ERROR" { "Red" }
            default { "White" }
        }
        Write-Host $logEntry -ForegroundColor $color
    }
}

# ========================================
# Initialization
# ========================================

Write-Log "========================================" "INFO"
Write-Log "  Screenshot Auto Backup v4.0" "INFO"
Write-Log "========================================" "INFO"
Write-Log "Source: $sourceFolder" "INFO"
Write-Log "Target: $targetFolder" "INFO"
Write-Log "Mode: Real-time FileSystemWatcher" "INFO"
Write-Log "" "INFO"

# Ensure target folder exists
if (!(Test-Path $targetFolder)) {
    New-Item -ItemType Directory -Path $targetFolder -Force | Out-Null
    Write-Log "[Init] Created target folder" "SUCCESS"
}

# Wait for source folder to be created
$maxWait = 60
$waited = 0
while (!(Test-Path $sourceFolder) -and $waited -lt $maxWait) {
    Write-Log "[Init] Waiting for source folder... ($($waited)s)" "WARNING"
    Start-Sleep -Seconds 1
    $waited++
}

if (!(Test-Path $sourceFolder)) {
    Write-Log "[Init] Source folder not found after ${maxWait}s. Will continue monitoring..." "WARNING"
}

# ========================================
# Create FileSystemWatcher
# ========================================

Write-Log "[Init] Creating FileSystemWatcher..." "INFO"

$watcher = New-Object System.IO.FileSystemWatcher
$watcher.Path = $sourceFolder
$watcher.Filter = "*.png"
$watcher.IncludeSubdirectories = $false
$watcher.NotifyFilter = [System.IO.NotifyFilters]::FileName

# ========================================
# Event Handlers
# ========================================

$onCreated = Register-ObjectEvent -InputObject $watcher -EventName Created -SourceIdentifier FileCreated -Action {
    $fileName = $Event.SourceEventArgs.Name
    $fullPath = $Event.SourceEventArgs.FullPath
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    
    # Wait a moment for file to be fully written
    Start-Sleep -Milliseconds 500
    
    try {
        if (Test-Path $fullPath) {
            $targetPath = Join-Path $targetFolder $fileName
            
            # Handle duplicate filenames
            if (Test-Path $targetPath) {
                $ts = Get-Date -Format "yyyyMMdd_HHmmss"
                $base = [System.IO.Path]::GetFileNameWithoutExtension($fileName)
                $ext = [System.IO.Path]::GetExtension($fileName)
                $targetPath = Join-Path $targetFolder "${base}_${ts}${ext}"
            }
            
            # Copy file
            Copy-Item -Path $fullPath -Destination $targetPath -Force -ErrorAction Stop
            
            Write-Log "[$timestamp] Copied: $fileName -> $(Split-Path $targetPath -Leaf)" "SUCCESS"
        }
    } catch {
        Write-Log "[$timestamp] Error copying $fileName`: $($_.Exception.Message)" "ERROR"
    }
}

# ========================================
# Start Monitoring
# ========================================

$watcher.EnableRaisingEvents = $true
Write-Log "[Running] Monitoring started. Waiting for new screenshots..." "SUCCESS"
Write-Log "[Running] Press Ctrl+C to stop" "INFO"
Write-Log "" "INFO"

# Keep script running
try {
    while ($true) {
        Start-Sleep -Seconds 5
    }
} catch {
    Write-Log "[Exit] Monitoring stopped" "INFO"
} finally {
    # Cleanup
    $watcher.EnableRaisingEvents = $false
    Unregister-Event -SourceIdentifier FileCreated -ErrorAction SilentlyContinue
    Remove-Job -Name FileCreated -ErrorAction SilentlyContinue
    Write-Log "[Exit] FileSystemWatcher cleaned up" "INFO"
}
