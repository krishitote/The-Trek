// Generate PWA Icons Locally
// Run: node generate-icons.js

import fs from 'fs';
import { createCanvas } from 'canvas';

function generateIcon(size) {
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext('2d');

  // Green gradient background
  const gradient = ctx.createLinearGradient(0, 0, size, size);
  gradient.addColorStop(0, '#22c55e'); // green-500
  gradient.addColorStop(1, '#16a34a'); // green-600
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, size, size);

  // White border
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = size * 0.05;
  ctx.strokeRect(size * 0.05, size * 0.05, size * 0.9, size * 0.9);

  // Draw "T" text
  ctx.fillStyle = '#ffffff';
  ctx.font = `bold ${size * 0.6}px Arial`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('T', size / 2, size / 2);

  // Save file
  const buffer = canvas.toBuffer('image/png');
  fs.writeFileSync(`public/icon-${size}.png`, buffer);
  console.log(`✅ Generated icon-${size}.png`);
}

// Generate both sizes
generateIcon(192);
generateIcon(512);

console.log('\n🎉 PWA icons generated successfully!');
