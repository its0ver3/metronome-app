import { copyFile, mkdir, writeFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'

const projectRoot = fileURLToPath(new URL('../', import.meta.url))
const serverDirectory = fileURLToPath(new URL('../dist/server/', import.meta.url))
const hostingDirectory = fileURLToPath(new URL('../dist/.openai/', import.meta.url))

const worker = `export default {
  async fetch(request, env) {
    const response = await env.ASSETS.fetch(request)

    if (response.status !== 404 || request.method !== 'GET') {
      return response
    }

    const acceptsHtml = request.headers.get('accept')?.includes('text/html')
    if (!acceptsHtml) return response

    const indexUrl = new URL('/index.html', request.url)
    return env.ASSETS.fetch(new Request(indexUrl, request))
  },
}
`

await mkdir(serverDirectory, { recursive: true })
await mkdir(hostingDirectory, { recursive: true })
await writeFile(new URL('../dist/server/index.js', import.meta.url), worker)
await copyFile(
  new URL('../.openai/hosting.json', import.meta.url),
  new URL('../dist/.openai/hosting.json', import.meta.url),
)

console.log(`Prepared Sites build from ${projectRoot}`)
