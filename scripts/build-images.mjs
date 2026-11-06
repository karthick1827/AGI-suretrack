// Derives the committed raster assets from the Figma exports (AD-5, FR-7).
// The 17.6 MB silo source (981df.png, really a JPEG 4096×2732) is git-ignored
// and stays local; only the derivatives below are committed.
//
//   npm run build:images
import { copyFile, rename, rm, stat } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import sharp from 'sharp';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const figma = path.join(root, '_acl-output/planning-artifacts/briefs/brief-agi-cursor2-2026-11-05/figma-assets');
const out = path.join(root, 'src/assets');

const SILO_SRC = path.join(figma, 'login/981df.png');
const AVATAR_SRC = path.join(figma, 'dashboard/avatar3.png');
const WIDTH = 2732;
const MAX_BYTES = 600 * 1024;
const QUALITY_LADDER = [82, 78, 74, 70, 66, 62, 58, 54, 50, 46, 42, 40];

for (const [label, file] of [['silo photo', SILO_SRC], ['avatar', AVATAR_SRC]]) {
  if (!existsSync(file)) {
    process.stderr.write(
      `build-images: ${label} source not found.\n` +
        `Place the Figma export at ${path.relative(root, file)} first (it is git-ignored or exported from Figma).\n`,
    );
    process.exit(1);
  }
}

async function encodeUnderBudget(name, encode) {
  const target = path.join(out, name);
  const temp = `${target}.tmp-${process.pid}`;
  try {
    for (const quality of QUALITY_LADDER) {
      await encode(sharp(SILO_SRC).resize({ width: WIDTH, withoutEnlargement: true }), quality).toFile(temp);
      const { size } = await stat(temp);
      if (size <= MAX_BYTES) {
        await rename(temp, target);
        process.stdout.write(`${name}: ${WIDTH}px wide, q${quality}, ${size} bytes\n`);
        return;
      }
    }
    throw new Error(`${name} could not be encoded under ${MAX_BYTES} bytes, even at quality ${QUALITY_LADDER.at(-1)}`);
  } finally {
    await rm(temp, { force: true });
  }
}

try {
  await encodeUnderBudget('login-bg.webp', (img, quality) => img.webp({ quality, effort: 6 }));
  await encodeUnderBudget('login-bg.jpg', (img, quality) => img.jpeg({ quality, mozjpeg: true }));
  await copyFile(AVATAR_SRC, path.join(out, 'avatar.png'));
  process.stdout.write('avatar.png: copied from avatar3.png\n');
} catch (error) {
  process.stderr.write(`build-images: ${error.message}\n`);
  process.exit(1);
}
