import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

const svgPath = path.resolve('public/icon.svg');
const svgBuffer = fs.readFileSync(svgPath);

async function generate() {
  // 192x192
  await sharp(svgBuffer)
    .resize(192, 192)
    .png()
    .toFile('public/pwa-192x192.png');
  console.log('Generated pwa-192x192.png');

  // 512x512
  await sharp(svgBuffer)
    .resize(512, 512)
    .png()
    .toFile('public/pwa-512x512.png');
  console.log('Generated pwa-512x512.png');

  // apple-touch-icon 180x180
  await sharp(svgBuffer)
    .resize(180, 180)
    .png()
    .toFile('public/apple-touch-icon.png');
  console.log('Generated apple-touch-icon.png');

  // Maskable 512x512: 80% safe zone with padded inner icon on solid background
  const innerSize = Math.round(512 * 0.78);
  const innerBuffer = await sharp(svgBuffer).resize(innerSize, innerSize).png().toBuffer();
  
  await sharp({
    create: {
      width: 512,
      height: 512,
      channels: 4,
      background: { r: 53, g: 88, b: 108, alpha: 1 }
    }
  })
  .composite([{ input: innerBuffer, gravity: 'center' }])
  .png()
  .toFile('public/pwa-maskable-512x512.png');
  console.log('Generated pwa-maskable-512x512.png');

  // Favicon (32x32 png saved as ico fallback)
  await sharp(svgBuffer)
    .resize(32, 32)
    .png()
    .toFile('public/favicon.ico');
  console.log('Generated favicon.ico');
}

generate().catch(err => {
  console.error(err);
  process.exit(1);
});
