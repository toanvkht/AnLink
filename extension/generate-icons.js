/**
 * Icon Generator Script
 * 
 * This script generates PNG icons from the SVG source.
 * Run: node generate-icons.js
 * 
 * Requirements:
 * - sharp: npm install sharp
 * 
 * Or use an online converter like https://convertio.co/svg-png/
 */

const fs = require('fs');
const path = require('path');

// Check if sharp is available
let sharp;
try {
  sharp = require('sharp');
} catch (e) {
  console.log('='.repeat(60));
  console.log('MANUAL ICON GENERATION REQUIRED');
  console.log('='.repeat(60));
  console.log('\nThe "sharp" package is not installed.');
  console.log('\nOption 1: Install sharp and run again:');
  console.log('  npm install sharp');
  console.log('  node generate-icons.js');
  console.log('\nOption 2: Use an online SVG to PNG converter:');
  console.log('  1. Open https://convertio.co/svg-png/');
  console.log('  2. Upload extension/icons/icon.svg');
  console.log('  3. Download and resize to these sizes:');
  console.log('     - 16x16   → icon16.png');
  console.log('     - 32x32   → icon32.png');
  console.log('     - 48x48   → icon48.png');
  console.log('     - 128x128 → icon128.png');
  console.log('\nOption 3: Use ImageMagick:');
  console.log('  convert icons/icon.svg -resize 16x16 icons/icon16.png');
  console.log('  convert icons/icon.svg -resize 32x32 icons/icon32.png');
  console.log('  convert icons/icon.svg -resize 48x48 icons/icon48.png');
  console.log('  convert icons/icon.svg -resize 128x128 icons/icon128.png');
  console.log('='.repeat(60));
  process.exit(0);
}

const sizes = [16, 32, 48, 128];
const svgPath = path.join(__dirname, 'icons', 'icon.svg');

async function generateIcons() {
  console.log('Generating PNG icons from SVG...\n');

  for (const size of sizes) {
    const outputPath = path.join(__dirname, 'icons', `icon${size}.png`);
    
    try {
      await sharp(svgPath)
        .resize(size, size)
        .png()
        .toFile(outputPath);
      
      console.log(`✓ Generated: icon${size}.png (${size}x${size})`);
    } catch (error) {
      console.error(`✗ Failed to generate icon${size}.png:`, error.message);
    }
  }

  console.log('\nDone! Icons are ready in the icons/ folder.');
}

generateIcons();
