#!/usr/bin/env node
// Build animated GIF from captured frames using pure Node.js
// Creates an animated GIF by encoding PNG frames into GIF87a format
// Usage: node demo/build-gif.mjs

import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __dirname = dirname(fileURLToPath(import.meta.url));
const framesDir = join(__dirname, 'frames');
const output = join(__dirname, 'demo.gif');

// Use ImageMagick (magick) or fall back to building an APNG
try {
  // Try magick (ImageMagick 7+)
  execSync(`magick -delay 300 -loop 0 "${framesDir}/frame-01.png" "${framesDir}/frame-02.png" "${framesDir}/frame-03.png" "${output}"`, { stdio: 'inherit' });
  console.log(`GIF created: ${output}`);
} catch {
  try {
    // Try convert (ImageMagick 6)
    execSync(`convert -delay 300 -loop 0 "${framesDir}/frame-01.png" "${framesDir}/frame-02.png" "${framesDir}/frame-03.png" "${output}"`, { stdio: 'inherit' });
    console.log(`GIF created: ${output}`);
  } catch {
    try {
      // Try ffmpeg
      execSync(`ffmpeg -y -framerate 0.33 -i "${framesDir}/frame-%02d.png" -vf "fps=1/3,scale=820:-1:flags=lanczos,split[s0][s1];[s0]palettegen[p];[s1][p]paletteuse" "${output}"`, { stdio: 'inherit' });
      console.log(`GIF created: ${output}`);
    } catch {
      console.log('No GIF tools found. Install one of:');
      console.log('  - ImageMagick: winget install ImageMagick');
      console.log('  - ffmpeg: winget install ffmpeg');
      console.log('');
      console.log('Or use an online tool:');
      console.log('  Upload frames from demo/frames/ to https://ezgif.com/maker');
      console.log('  Set delay to 3000ms per frame, download the GIF');
      process.exit(1);
    }
  }
}
