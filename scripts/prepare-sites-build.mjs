import { access, copyFile, mkdir, readFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'

const projectRoot = fileURLToPath(new URL('../', import.meta.url))
const hostingDirectory = fileURLToPath(new URL('../dist/.openai/', import.meta.url))

// Sites must publish Vite's output as static assets. A Worker archive with
// these files at its root can deploy successfully while serving empty 404s.
const hosting = JSON.parse(await readFile(new URL('../.openai/hosting.json', import.meta.url), 'utf8'))
if (hosting.static?.directory !== 'dist') {
  throw new Error('The metronome Sites build requires static.directory = dist')
}
const html = await readFile(new URL('../dist/index.html', import.meta.url), 'utf8')
for (const [, assetPath] of html.matchAll(/(?:src|href)="(\/[^\"]+)"/g)) {
  await access(new URL(`../dist${assetPath}`, import.meta.url))
}

await mkdir(hostingDirectory, { recursive: true })
await copyFile(
  new URL('../.openai/hosting.json', import.meta.url),
  new URL('../dist/.openai/hosting.json', import.meta.url),
)

console.log(`Prepared static Sites build from ${projectRoot}`)
