// backend/middleware/imageProcessor.js
import sharp from 'sharp';
import path from 'path';
import fs from 'fs';

export async function processProfileImage(req, res, next) {
  if (!req.file) {
    return next();
  }
  
  const originalPath = req.file.path;
  const filename = `profile-${req.user.id}-${Date.now()}.jpg`;
  const outputPath = path.join('uploads', filename);
  
  try {
    console.log(`📸 Processing image: ${req.file.originalname} (${(req.file.size / 1024).toFixed(1)}KB)`);
    
    // Process image
    const info = await sharp(originalPath)
      .resize(400, 400, {
        fit: 'cover',
        position: 'center'
      })
      .jpeg({ 
        quality: 85,
        progressive: true,
        mozjpeg: true 
      })
      .toFile(outputPath);
    
    // Delete original
    fs.unlinkSync(originalPath);
    
    // Update req.file to point to processed image
    req.file.filename = filename;
    req.file.path = outputPath;
    const newSize = info.size;
    
    const reduction = ((req.file.size - newSize) / req.file.size * 100).toFixed(1);
    console.log(`✅ Image optimized: ${(newSize / 1024).toFixed(1)}KB (${reduction}% reduction)`);
    
    req.file.size = newSize;
    
    next();
  } catch (err) {
    console.error('❌ Image processing failed:', err.message);
    
    // Clean up
    if (fs.existsSync(originalPath)) {
      fs.unlinkSync(originalPath);
    }
    
    return res.status(500).json({ error: 'Image processing failed' });
  }
}

// Optional: Generate thumbnail
export async function generateThumbnail(imagePath) {
  const thumbnailPath = imagePath.replace(/(\.\w+)$/, '-thumb$1');
  
  await sharp(imagePath)
    .resize(100, 100, {
      fit: 'cover',
      position: 'center'
    })
    .jpeg({ quality: 80 })
    .toFile(thumbnailPath);
  
  return thumbnailPath;
}
