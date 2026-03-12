#!/usr/bin/env node
// Captures the terminal animation as PNG frames, then builds an animated GIF
// Usage: node demo/capture-gif.mjs
// Requires: npm install playwright gif-encoder-2 png-js

import { chromium } from 'playwright';
import { createWriteStream, readFileSync, mkdirSync, readdirSync, unlinkSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const framesDir = join(__dirname, 'frames');
const outputGif = join(__dirname, 'demo.gif');

// Clean/create frames dir
mkdirSync(framesDir, { recursive: true });
for (const f of readdirSync(framesDir)) unlinkSync(join(framesDir, f));

async function captureFrames() {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 900, height: 580 } });

  await page.goto(`file://${join(__dirname, 'terminal-anim.html')}`);
  await page.waitForTimeout(500);

  // Capture 15s of animation at 4fps = 60 frames
  const fps = 4;
  const duration = 16; // seconds
  const totalFrames = fps * duration;

  console.log(`Capturing ${totalFrames} frames at ${fps}fps...`);

  for (let i = 0; i < totalFrames; i++) {
    const path = join(framesDir, `frame-${String(i).padStart(4, '0')}.png`);
    await page.screenshot({ path, type: 'png' });
    await page.waitForTimeout(1000 / fps);
    if (i % 10 === 0) console.log(`  Frame ${i}/${totalFrames}`);
  }

  console.log('Frames captured!');
  await browser.close();

  console.log(`\nFrames saved to: ${framesDir}`);
  console.log(`\nTo create GIF, run one of:`);
  console.log(`  ffmpeg -framerate ${fps} -i ${framesDir}/frame-%04d.png -vf "fps=${fps},scale=820:-1:flags=lanczos,split[s0][s1];[s0]palettegen[p];[s1][p]paletteuse" ${outputGif}`);
  console.log(`  magick -delay ${100/fps} -loop 0 ${framesDir}/frame-*.png ${outputGif}`);
}

captureFrames().catch(console.error);
