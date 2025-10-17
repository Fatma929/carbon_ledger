# scripts/smoke_test.ps1
# Simple smoke test to check API server status and logs

$base = "http://localhost:3000"
try {
    Write-Host "Checking status..."
    $status = Invoke-RestMethod "$base/status"
    Write-Host "Status:" (ConvertTo-Json $status -Depth 3)
} catch {
    Write-Host "Status check failed: $_"
    exit 1
}

try {
    Write-Host "Fetching logs..."
    $logs = Invoke-RestMethod "$base/logs"
    Write-Host (ConvertTo-Json $logs -Depth 5)
} catch {
    Write-Host "Logs fetch failed: $_"
    exit 1
}

Write-Host "Smoke test completed."
