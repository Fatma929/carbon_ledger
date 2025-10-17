# cleanup_env.ps1
# Safe cleanup script for local use in the project root.
# Moves sensitive .env and backup folders out to a timestamped backup folder
# and optionally deletes them. Then attempts to create a safe .env.example file.

param()

Write-Host "Running cleanup in: $(Get-Location)" -ForegroundColor Cyan

$timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
$backupRoot = Join-Path $env:USERPROFILE "carbon_ledger_cleanup_backup_$timestamp"
New-Item -ItemType Directory -Path $backupRoot -Force | Out-Null
Write-Host "Backup folder: $backupRoot" -ForegroundColor Green

# Items to move if they exist (files or directories). We'll move them into the backup folder.
$itemsToMove = @(
    ".env",
    ".env.example",
    ".env_example_backup",
    "envbackup",
    "envbackup/",
    ".env.example/",
    ".env_example_backup/"
)

foreach ($item in $itemsToMove) {
    if (Test-Path $item) {
        try {
            $resolved = Resolve-Path $item
            Write-Host "Moving '$($resolved)' to backup..."
            Move-Item -Path $resolved -Destination $backupRoot -Force
        } catch {
            Write-Warning "Failed to move $item: $_"
        }
    } else {
        Write-Host "Not found: $item" -ForegroundColor DarkGray
    }
}

# Find duplicated .gitignore files under env-related directories and move them to backupRoot
$gitignoreMatches = Get-ChildItem -Path . -Recurse -Filter ".gitignore" -ErrorAction SilentlyContinue | Where-Object {
    $_.FullName -match "\\\.env" -or $_.FullName -match "envbackup" -or $_.FullName -match "env_example"
}
foreach ($g in $gitignoreMatches) {
    try {
        Write-Host "Moving duplicate gitignore: $($g.FullName)"
        Move-Item -Path $g.FullName -Destination $backupRoot -Force
    } catch {
        Write-Warning "Could not move $($g.FullName): $_"
    }
}

# Overwrite root .env with placeholders to ensure no secrets remain (if present)
$rootEnv = Join-Path (Get-Location) ".env"
if (Test-Path $rootEnv) {
    Write-Host "Sanitizing root .env (overwriting with placeholders)"
    @"
# sanitized placeholder .env (sensitive values removed)
MY_ACCOUNT_ID=0.0.YOUR_ACCOUNT_ID
MY_PRIVATE_KEY_DER=REDACTED
MY_PRIVATE_KEY_HEX=REDACTED
EVM_Address=0xREDACTED
HEDERA_NETWORK=testnet
"@ | Out-File -FilePath $rootEnv -Encoding UTF8 -Force
} else {
    Write-Host "No root .env found to sanitize." -ForegroundColor DarkGray
}

# Try to create a root .env.example file (only if there isn't a directory blocking it)
$envExamplePath = Join-Path (Get-Location) ".env.example"
if (Test-Path $envExamplePath) {
    if ((Get-Item $envExamplePath).PSIsContainer) {
        Write-Warning ".env.example exists as a directory. Please remove it manually if you want a file with this name."
    } else {
        Write-Host ".env.example already exists as a file; leaving it in place." -ForegroundColor DarkGray
    }
} else {
    Write-Host "Creating .env.example with placeholders"
    @"
# Example .env (placeholders only — do NOT commit real secrets)
MY_ACCOUNT_ID=0.0.YOUR_ACCOUNT_ID
MY_PRIVATE_KEY_DER=YOUR_PRIVATE_KEY_HERE
HEDERA_NETWORK=testnet
HEDERA_PORTAL_TOKEN=YOUR_PORTAL_TOKEN_HERE
"@ | Out-File -FilePath $envExamplePath -Encoding UTF8 -Force
}

Write-Host "Cleanup actions moved items into: $backupRoot" -ForegroundColor Green

# Ask user whether to delete backups permanently
$answer = Read-Host "If you want to permanently delete the backup folder now, type DELETE (case-sensitive). Otherwise press Enter to keep it"
if ($answer -eq 'DELETE') {
    try {
        Remove-Item -Recurse -Force $backupRoot
        Write-Host "Backup folder deleted." -ForegroundColor Yellow
    } catch {
        Write-Warning "Failed to delete backup: $_"
    }
} else {
    Write-Host "Backup retained at: $backupRoot" -ForegroundColor Cyan
}

Write-Host "Done. Please review the repository and run a quick search for any remaining private key strings before pushing to GitHub." -ForegroundColor Green
