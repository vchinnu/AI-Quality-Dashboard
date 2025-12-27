#!/usr/bin/env powershell
# Development startup script for AI Quality Dashboard

Write-Host "Starting AI Quality Dashboard Development Environment..." -ForegroundColor Green

# Check if ports are available
$backendPort = 8002
$frontendPort = 3000

Write-Host "Checking port availability..." -ForegroundColor Yellow
$backendInUse = Get-NetTCPConnection -LocalPort $backendPort -ErrorAction SilentlyContinue
$frontendInUse = Get-NetTCPConnection -LocalPort $frontendPort -ErrorAction SilentlyContinue

if ($backendInUse) {
    Write-Host "Port $backendPort is in use. Killing existing process..." -ForegroundColor Red
    $processId = (Get-NetTCPConnection -LocalPort $backendPort).OwningProcess
    Stop-Process -Id $processId -Force
    Start-Sleep -Seconds 2
}

if ($frontendInUse) {
    Write-Host "Port $frontendPort is in use. Killing existing process..." -ForegroundColor Red
    $processId = (Get-NetTCPConnection -LocalPort $frontendPort).OwningProcess
    Stop-Process -Id $processId -Force
    Start-Sleep -Seconds 2
}

# Start backend server in background
Write-Host "Starting Backend Server (Port $backendPort)..." -ForegroundColor Cyan
Set-Location "backend"
$backendJob = Start-Job -ScriptBlock {
    Set-Location $using:PWD\backend
    python server.py
}
Set-Location ".."

# Wait a moment for backend to start
Start-Sleep -Seconds 3

# Start frontend development server
Write-Host "Starting Frontend Server (Port $frontendPort)..." -ForegroundColor Cyan
Set-Location "frontend"
$frontendJob = Start-Job -ScriptBlock {
    Set-Location $using:PWD\frontend
    npm start
}
Set-Location ".."

Write-Host "Both servers are starting..." -ForegroundColor Green
Write-Host "Backend: http://localhost:$backendPort" -ForegroundColor White
Write-Host "Frontend: http://localhost:$frontendPort" -ForegroundColor White
Write-Host ""
Write-Host "Press Ctrl+C to stop both servers" -ForegroundColor Yellow

# Monitor jobs and wait for user input
try {
    while ($true) {
        if ($backendJob.State -eq "Failed") {
            Write-Host "Backend server failed! Check logs..." -ForegroundColor Red
            Receive-Job $backendJob
        }
        if ($frontendJob.State -eq "Failed") {
            Write-Host "Frontend server failed! Check logs..." -ForegroundColor Red
            Receive-Job $frontendJob
        }
        Start-Sleep -Seconds 5
    }
}
catch {
    Write-Host "Stopping servers..." -ForegroundColor Red
    Stop-Job $backendJob, $frontendJob -ErrorAction SilentlyContinue
    Remove-Job $backendJob, $frontendJob -Force -ErrorAction SilentlyContinue
}