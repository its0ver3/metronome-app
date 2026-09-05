// Offline asset compilation: rasterize the original CSS silhouettes and shadow,
// then downsample to 3x their actual UI size. No artwork is redrawn or generated.
// Run with sharp available via NODE_PATH (or in the local development runtime).
import { createRequire } from 'node:module'
import { readFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'

const sharp = createRequire(import.meta.url)('sharp')
const image = (await readFile(new URL('../src/assets/trainer-throwoff.png', import.meta.url))).toString('base64')
const parts = {
  body: {
    crop: [200, 0, 430, 1210], scale: 0.07,
    path: 'M 375 67 C 321 67 288 76 282 105 L 282 168 Q 283 194 302 201 L 318 203 L 318 261 L 298 264 Q 278 266 278 286 L 278 1094 Q 278 1146 302 1151 L 486 1155 Q 518 1155 536 1123 Q 549 1093 532 1060 Q 517 1032 489 1028 L 489 1000 L 478 1000 L 478 975 Q 480 957 507 957 C 551 962 580 934 580 895 C 581 857 552 825 518 825 Q 491 825 489 784 L 478 783 L 487 780 L 487 303 Q 487 279 432 252 L 432 201 L 449 198 Q 470 191 470 165 L 470 109 C 468 81 435 67 375 67 Z',
  },
  lever: {
    crop: [800, 125, 160, 1050], scale: 0.07 * 0.84,
    path: 'M 873 148 Q 846 147 843 172 L 843 335 Q 843 346 851 366 L 865 403 Q 872 423 870 449 L 854 966 Q 854 1008 838 1038 Q 822 1058 822 1085 Q 821 1122 848 1144 Q 868 1157 895 1150 Q 927 1147 939 1119 Q 949 1098 941 1062 Q 935 1038 925 1023 L 917 462 Q 915 420 927 387 Q 937 359 937 338 L 937 186 Q 937 154 908 151 Z',
  },
}

for (const [name, { crop: [x, y, width, height], scale, path }] of Object.entries(parts)) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${width}" height="${height}" viewBox="${x} ${y} ${width} ${height}">
    <defs><clipPath id="part"><path d="${path}"/></clipPath>
    <filter id="shadow" x="-30%" y="-10%" width="160%" height="120%" color-interpolation-filters="sRGB">
      <feGaussianBlur in="SourceAlpha" stdDeviation="14"/><feOffset dx="-14" dy="10"/>
      <feComponentTransfer><feFuncA type="linear" slope="0.439216"/></feComponentTransfer>
      <feMerge><feMergeNode/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter></defs>
    <g ${name === 'body' ? 'filter="url(#shadow)"' : ''}><image width="1254" height="1254" xlink:href="data:image/png;base64,${image}" clip-path="url(#part)"/></g>
  </svg>`
  const output = fileURLToPath(new URL(`../src/assets/trainer-throwoff-${name}.png`, import.meta.url))
  const info = await sharp(Buffer.from(svg))
    .resize(Math.ceil(width * scale * 3), Math.ceil(height * scale * 3), { fit: 'fill' })
    .png({ compressionLevel: 9 }).toFile(output)
  console.log(`${name}: ${info.width} × ${info.height}, ${info.size} bytes`)
}
