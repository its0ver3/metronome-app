import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

test('bottom navigation selection only brightens the icon and label', async () => {
  const css = await readFile(new URL('../src/index.css', import.meta.url), 'utf8')
  const source = await readFile(new URL('../src/components/layout/BottomNav.jsx', import.meta.url), 'utf8')
  const selectedRule = css.match(/\.pulse-bottom-nav > button\.is-active\s*\{([^}]*)\}/)?.[1]?.trim()

  assert.equal(selectedRule, 'color: var(--brand-color-ink);')
  assert.doesNotMatch(css, /\.pulse-bottom-nav > button\.is-active(?:\s+\.pulse-nav-icon|::(?:before|after))/)
  assert.match(css, /\.pulse-bottom-nav > button:focus-visible \.pulse-nav-icon\s*\{[^}]*outline: 2px solid/)
  assert.match(source, /aria-current=\{isActive \? 'page' : undefined\}/)
  assert.match(source, /stroke="currentColor"/)
  assert.match(source, /label: 'Training'/)
  assert.doesNotMatch(source, /label: 'Practice tools'/)
})
