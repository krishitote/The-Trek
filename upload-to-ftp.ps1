# FTP Upload Script for The Trek
# Usage: Update FTP credentials below, then run: .\upload-to-ftp.ps1

# FTP Configuration (UPDATE THESE)
$ftpServer = "ftp.trekfit.co.ke"  # Or your TrueHost FTP server
$ftpUsername = "your-ftp-username"
$ftpPassword = "your-ftp-password"
$remoteDir = "/public_html"  # Remote directory on server

# Local directory to upload
$localDir = "c:\Users\krish\the-trek\dist"

Write-Host "Starting FTP upload..." -ForegroundColor Cyan

# Get all files from dist folder
$files = Get-ChildItem -Path $localDir -Recurse -File

foreach ($file in $files) {
    $relativePath = $file.FullName.Substring($localDir.Length).Replace('\', '/')
    $remotePath = "ftp://$ftpServer$remoteDir$relativePath"
    
    Write-Host "Uploading: $($file.Name)" -ForegroundColor Yellow
    
    try {
        $webclient = New-Object System.Net.WebClient
        $webclient.Credentials = New-Object System.Net.NetworkCredential($ftpUsername, $ftpPassword)
        $webclient.UploadFile($remotePath, $file.FullName)
        Write-Host "✓ Uploaded: $($file.Name)" -ForegroundColor Green
    }
    catch {
        Write-Host "✗ Failed: $($file.Name) - $($_.Exception.Message)" -ForegroundColor Red
    }
}

Write-Host "`nUpload complete! Visit https://trekfit.co.ke to test." -ForegroundColor Cyan
