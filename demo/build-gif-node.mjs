#!/usr/bin/env node
import { readFileSync, createWriteStream } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');

console.log('Installing temporary dependencies...');
execSync('npm install --no-save gif-encoder-2 pngjs', { cwd: root, stdio: 'inherit' });

const { default: GIFEncoder } = await import('gif-encoder-2');
const { PNG } = await import('pngjs');

const frames = ['frame-01.png', 'frame-02.png', 'frame-03.png']
  .map(f => join(__dirname, 'frames', f));

const first = PNG.sync.read(readFileSync(frames[0]));
console.log(`Creating GIF: ${first.width}x${first.height}, 3 frames, 3s each`);

const encoder = new GIFEncoder(first.width, first.height);
encoder.setDelay(3000);
encoder.setRepeat(0);
encoder.setQuality(10);

const output = join(__dirname, 'demo.gif');
const stream = createWriteStream(output);
encoder.createReadStream().pipe(stream);
encoder.start();

for (const f of frames) {
  const png = PNG.sync.read(readFileSync(f));
  encoder.addFrame(png.data);
  console.log(`  Added: ${f.split(/[/\\]/).pop()}`);
}

encoder.finish();

stream.on('finish', () => {
  const size = readFileSync(output).length;
  console.log(`\nGIF created: ${output} (${(size / 1024).toFixed(0)} KB)`);
  execSync('npm uninstall gif-encoder-2 pngjs', { cwd: root, stdio: 'inherit' });
  console.log('Cleaned up temp dependencies.');
});
