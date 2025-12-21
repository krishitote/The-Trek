# Generate PWA Icons using PowerShell and .NET System.Drawing
# Run: .\generate-icons.ps1

Add-Type -AssemblyName System.Drawing

function Generate-Icon {
    param([int]$size)
    
    # Create bitmap
    $bitmap = New-Object System.Drawing.Bitmap($size, $size)
    $graphics = [System.Drawing.Graphics]::FromImage($bitmap)
    $graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
    
    # Green gradient background
    $rect = New-Object System.Drawing.Rectangle(0, 0, $size, $size)
    $greenStart = [System.Drawing.Color]::FromArgb(34, 197, 94)  # #22c55e
    $greenEnd = [System.Drawing.Color]::FromArgb(22, 163, 74)    # #16a34a
    $brush = New-Object System.Drawing.Drawing2D.LinearGradientBrush($rect, $greenStart, $greenEnd, 45)
    $graphics.FillRectangle($brush, $rect)
    
    # White border
    $borderWidth = [int]($size * 0.05)
    $borderPen = New-Object System.Drawing.Pen([System.Drawing.Color]::White, $borderWidth)
    $borderRect = New-Object System.Drawing.Rectangle($borderWidth, $borderWidth, $size - ($borderWidth * 2), $size - ($borderWidth * 2))
    $graphics.DrawRectangle($borderPen, $borderRect)
    
    # Draw "T" text
    $fontSize = [int]($size * 0.5)
    $font = New-Object System.Drawing.Font("Arial", $fontSize, [System.Drawing.FontStyle]::Bold)
    $textBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::White)
    $format = New-Object System.Drawing.StringFormat
    $format.Alignment = [System.Drawing.StringAlignment]::Center
    $format.LineAlignment = [System.Drawing.StringAlignment]::Center
    $textRect = New-Object System.Drawing.RectangleF(0, 0, $size, $size)
    $graphics.DrawString("T", $font, $textBrush, $textRect, $format)
    
    # Save file
    $outputPath = "public\icon-$size.png"
    $bitmap.Save($outputPath, [System.Drawing.Imaging.ImageFormat]::Png)
    
    # Cleanup
    $graphics.Dispose()
    $bitmap.Dispose()
    $brush.Dispose()
    $borderPen.Dispose()
    $font.Dispose()
    $textBrush.Dispose()
    
    Write-Host "✅ Generated $outputPath" -ForegroundColor Green
}

# Generate both icons
Write-Host "`n🎨 Generating PWA icons..." -ForegroundColor Cyan
Generate-Icon 192
Generate-Icon 512
Write-Host "`n🎉 PWA icons generated successfully!`n" -ForegroundColor Green
