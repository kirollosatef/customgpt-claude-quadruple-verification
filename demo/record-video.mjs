import { chromium } from 'playwright';
import { mkdirSync, readdirSync, copyFileSync, statSync, rmSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const videoDir = join(__dirname, 'video-tmp');
mkdirSync(videoDir, { recursive: true });

console.log('Launching browser with video recording...');
const browser = await chromium.launch();
const context = await browser.newContext({
  viewport: { width: 920, height: 600 },
  recordVideo: { dir: videoDir, size: { width: 920, height: 600 } }
});

const page = await context.newPage();
await page.goto('http://localhost:8777/demo/terminal-anim.html');
console.log('Page loaded, recording 10 seconds...');

// Record exactly 10s (2 scenes at 5s each = eval blocked + research blocked + start of pass)
await page.waitForTimeout(10500);
console.log('Done recording.');

await page.close();
const videoPath = await page.video().path();
await context.close();
await browser.close();

const dest = join(__dirname, 'demo.webm');
copyFileSync(videoPath, dest);
const size = statSync(dest).size;
console.log(`Video saved: demo/demo.webm (${(size / 1024).toFixed(0)} KB)`);

rmSync(videoDir, { recursive: true, force: true });
