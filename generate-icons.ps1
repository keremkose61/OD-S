Add-Type -AssemblyName System.Drawing

$dir = Split-Path -Parent $MyInvocation.MyCommand.Path
$iconsDir = Join-Path $dir "icons"

function Create-OdisIcon {
    param (
        [int]$size,
        [string]$filename,
        [bool]$isMaskable = $false
    )

    $bmp = [System.Drawing.Bitmap]::new($size, $size)
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
    $g.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::AntiAliasGridFit
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic

    # Dark Slate background (#0f172a)
    $bgBrush = [System.Drawing.SolidBrush]::new([System.Drawing.Color]::FromArgb(255, 15, 23, 42))
    $g.FillRectangle($bgBrush, 0, 0, $size, $size)
    $bgBrush.Dispose()

    # Scale factor based on size
    $scale = [float]($size / 512.0)
    
    # Safe zone for maskable icons (inner 80%)
    $offset = 0.0
    if ($isMaskable) {
        $scale = $scale * 0.78
        $offset = [float](($size - (512.0 * $scale)) / 2.0)
    }

    # Inner rounded container or card
    $cardX = [float]($offset + (20 * $scale))
    $cardY = [float]($offset + (20 * $scale))
    $cardW = [float](472 * $scale)
    $cardH = [float](472 * $scale)
    $cardCorner = [float](64 * $scale)

    # Card background (White)
    $path = [System.Drawing.Drawing2D.GraphicsPath]::new()
    $path.AddArc($cardX, $cardY, $cardCorner, $cardCorner, [float]180, [float]90)
    $path.AddArc($cardX + $cardW - $cardCorner, $cardY, $cardCorner, $cardCorner, [float]270, [float]90)
    $path.AddArc($cardX + $cardW - $cardCorner, $cardY + $cardH - $cardCorner, $cardCorner, $cardCorner, [float]0, [float]90)
    $path.AddArc($cardX, $cardY + $cardH - $cardCorner, $cardCorner, $cardCorner, [float]90, [float]90)
    $path.CloseFigure()

    $cardFill = [System.Drawing.SolidBrush]::new([System.Drawing.Color]::White)
    $g.FillPath($cardFill, $path)
    $cardFill.Dispose()

    # Amber border (#f59e0b)
    $penWidth = [float][Math]::Max(2.0, (12 * $scale))
    $amberColor = [System.Drawing.Color]::FromArgb(255, 245, 158, 11)
    $borderPen = [System.Drawing.Pen]::new($amberColor, $penWidth)
    $g.DrawPath($borderPen, $path)
    $borderPen.Dispose()
    $path.Dispose()

    # Amber Wing polygon
    $wingBrush = [System.Drawing.SolidBrush]::new($amberColor)
    $p1 = [System.Drawing.PointF]::new([float]($offset + (120 * $scale)), [float]($offset + (86 * $scale)))
    $p2 = [System.Drawing.PointF]::new([float]($offset + (380 * $scale)), [float]($offset + (86 * $scale)))
    $p3 = [System.Drawing.PointF]::new([float]($offset + (250 * $scale)), [float]($offset + (215 * $scale)))
    $g.FillPolygon($wingBrush, [System.Drawing.PointF[]]@($p1, $p2, $p3))
    $wingBrush.Dispose()

    # Charcoal Head (#3f3f46)
    $charcoalColor = [System.Drawing.Color]::FromArgb(255, 63, 63, 70)
    $charcoalBrush = [System.Drawing.SolidBrush]::new($charcoalColor)
    $headR = [float](38 * $scale)
    $headX = [float]($offset + (250 * $scale) - $headR)
    $headY = [float]($offset + (88 * $scale) - $headR)
    $g.FillEllipse($charcoalBrush, $headX, $headY, [float]($headR * 2), [float]($headR * 2))

    # White ring around head
    $ringPen = [System.Drawing.Pen]::new([System.Drawing.Color]::White, [float](10 * $scale))
    $g.DrawEllipse($ringPen, $headX, $headY, [float]($headR * 2), [float]($headR * 2))
    $ringPen.Dispose()

    # Charcoal 'K' lines
    $kPen = [System.Drawing.Pen]::new($charcoalColor, [float](34 * $scale))
    $kPen.StartCap = [System.Drawing.Drawing2D.LineCap]::Round
    $kPen.EndCap = [System.Drawing.Drawing2D.LineCap]::Round

    # Left K
    $g.DrawLine($kPen, [float]($offset + (225 * $scale)), [float]($offset + (180 * $scale)), [float]($offset + (110 * $scale)), [float]($offset + (108 * $scale)))
    $g.DrawLine($kPen, [float]($offset + (225 * $scale)), [float]($offset + (180 * $scale)), [float]($offset + (110 * $scale)), [float]($offset + (242 * $scale)))
    $g.DrawLine($kPen, [float]($offset + (216 * $scale)), [float]($offset + (140 * $scale)), [float]($offset + (216 * $scale)), [float]($offset + (244 * $scale)))

    # Right K
    $g.DrawLine($kPen, [float]($offset + (275 * $scale)), [float]($offset + (180 * $scale)), [float]($offset + (390 * $scale)), [float]($offset + (108 * $scale)))
    $g.DrawLine($kPen, [float]($offset + (275 * $scale)), [float]($offset + (180 * $scale)), [float]($offset + (390 * $scale)), [float]($offset + (242 * $scale)))
    $g.DrawLine($kPen, [float]($offset + (284 * $scale)), [float]($offset + (140 * $scale)), [float]($offset + (284 * $scale)), [float]($offset + (244 * $scale)))
    $kPen.Dispose()

    # Divider gap (white)
    $dividerBrush = [System.Drawing.SolidBrush]::new([System.Drawing.Color]::White)
    $g.FillRectangle($dividerBrush, [float]($offset + (238 * $scale)), [float]($offset + (126 * $scale)), [float](24 * $scale), [float](134 * $scale))
    $dividerBrush.Dispose()

    # Text KAŞİF
    $fontFamily = [System.Drawing.FontFamily]::GenericSansSerif
    $fontKasif = [System.Drawing.Font]::new($fontFamily, [float](36 * $scale), [System.Drawing.FontStyle]::Bold)
    $sf = [System.Drawing.StringFormat]::new()
    $sf.Alignment = [System.Drawing.StringAlignment]::Center
    $sf.LineAlignment = [System.Drawing.StringAlignment]::Center

    $g.DrawString("KAŞİF", $fontKasif, $charcoalBrush, [float]($offset + (250 * $scale)), [float]($offset + (315 * $scale)), $sf)

    # Line under Kasif
    $linePen = [System.Drawing.Pen]::new($amberColor, [float](6 * $scale))
    $g.DrawLine($linePen, [float]($offset + (80 * $scale)), [float]($offset + (344 * $scale)), [float]($offset + (420 * $scale)), [float]($offset + (344 * $scale)))
    $linePen.Dispose()

    # Text KALKAVAN
    $fontKalkavan = [System.Drawing.Font]::new($fontFamily, [float](34 * $scale), [System.Drawing.FontStyle]::Bold)
    $g.DrawString("KALKAVAN", $fontKalkavan, $charcoalBrush, [float]($offset + (250 * $scale)), [float]($offset + (380 * $scale)), $sf)

    # Text Anadolu Lisesi
    $fontLise = [System.Drawing.Font]::new($fontFamily, [float](22 * $scale), [System.Drawing.FontStyle]::Regular)
    $g.DrawString("Anadolu Lisesi", $fontLise, $charcoalBrush, [float]($offset + (250 * $scale)), [float]($offset + (420 * $scale)), $sf)

    # Clean up fonts
    $fontKasif.Dispose()
    $fontKalkavan.Dispose()
    $fontLise.Dispose()
    $charcoalBrush.Dispose()
    $sf.Dispose()

    # Save PNG
    $destPath = Join-Path $iconsDir $filename
    $bmp.Save($destPath, [System.Drawing.Imaging.ImageFormat]::Png)
    $g.Dispose()
    $bmp.Dispose()
    Write-Host "Created: $filename ($size x $size)"
}

Create-OdisIcon -size 512 -filename "icon-512.png" -isMaskable $false
Create-OdisIcon -size 512 -filename "icon-maskable-512.png" -isMaskable $true
Create-OdisIcon -size 192 -filename "icon-192.png" -isMaskable $false
Create-OdisIcon -size 192 -filename "icon-maskable-192.png" -isMaskable $true
Create-OdisIcon -size 180 -filename "apple-touch-icon.png" -isMaskable $false
Create-OdisIcon -size 32  -filename "favicon-32x32.png" -isMaskable $false
Create-OdisIcon -size 16  -filename "favicon-16x16.png" -isMaskable $false
