/**
 * Generate ClaudeDesk app icon — blue-purple gradient with "CD" monogram
 */
const sharp = require('sharp')
const path = require('path')

const SIZE = 256
const SVG = `
<svg width="${SIZE}" height="${SIZE}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#4F46E5"/>
      <stop offset="50%" style="stop-color:#7C3AED"/>
      <stop offset="100%" style="stop-color:#9333EA"/>
    </linearGradient>
    <linearGradient id="text" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#ffffff"/>
      <stop offset="100%" style="stop-color:#e0e7ff"/>
    </linearGradient>
  </defs>
  <!-- Rounded background -->
  <rect width="${SIZE}" height="${SIZE}" rx="48" ry="48" fill="url(#bg)"/>
  <!-- CD Text -->
  <text x="${SIZE/2}" y="${SIZE/2 + 8}"
        text-anchor="middle"
        dominant-baseline="central"
        font-family="'Segoe UI', system-ui, sans-serif"
        font-weight="800"
        font-size="110"
        fill="url(#text)"
        letter-spacing="-2">
    CD
  </text>
  <!-- Subtle bottom line -->
  <rect x="${SIZE*0.2}" y="${SIZE*0.78}" width="${SIZE*0.6}" height="3" rx="1.5" fill="white" opacity="0.3"/>
</svg>
`

async function generate() {
  const outDir = path.join(__dirname, '..', 'resources')

  // Generate PNG from SVG
  await sharp(Buffer.from(SVG))
    .png()
    .toFile(path.join(outDir, 'icon.png'))

  // Generate smaller sizes for ICO
  const sizes = [16, 32, 48, 64, 128]
  for (const s of sizes) {
    await sharp(Buffer.from(SVG))
      .resize(s, s)
      .png()
      .toFile(path.join(outDir, `icon-${s}.png`))
  }

  console.log('✅ Icon generated: resources/icon.png (256x256 + smaller sizes)')
}

generate().catch(err => {
  console.error('❌ Failed to generate icon:', err)
  process.exit(1)
})
