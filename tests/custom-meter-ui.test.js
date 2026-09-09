import test from 'node:test'
import assert from 'node:assert/strict'
import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'
import { JSDOM } from 'jsdom'
import { build } from 'esbuild'

const dom = new JSDOM('<div id="root"></div>', { url: 'http://localhost/' })
globalThis.window = dom.window
globalThis.document = dom.window.document
globalThis.IS_REACT_ACT_ENVIRONMENT = true
// React DOM must initialize after the DOM so input/change events use its DOM path.
const { createElement, act } = await import('react')
const { createRoot } = await import('react-dom/client')
const compiled = await build({
  entryPoints: [fileURLToPath(new URL('../src/components/metronome/MeterPicker.jsx', import.meta.url))],
  bundle: true, write: false, platform: 'node', format: 'cjs', jsx: 'automatic', external: ['react', 'react/jsx-runtime'], loader: { '.css': 'empty' },
})
const module = { exports: {} }
new Function('module', 'exports', 'require', compiled.outputFiles[0].text)(module, module.exports, createRequire(import.meta.url))
const MeterPicker = module.exports.default
const container = document.getElementById('root')
const change = async (element, value) => {
  await act(() => {
    const proto = element.tagName === 'INPUT' ? window.HTMLInputElement.prototype : window.HTMLSelectElement.prototype
    Object.getOwnPropertyDescriptor(proto, 'value').set.call(element, value)
    element.dispatchEvent(new window.Event(element.tagName === 'INPUT' ? 'input' : 'change', { bubbles: true }))
  })
}
const click = async element => act(() => element.click())

test('custom edits validate without applying; Apply commits once and Cancel/Escape restore focus', async () => {
  let meter = { numerator: 4, denominator: 4, groups: [1, 1, 1, 1], groupOnly: false, tempoUnit: 'quarter' }
  const applied = []
  const root = createRoot(container)
  const render = () => root.render(createElement(MeterPicker, { meter, onChange(next) { applied.push(next); meter = next; render() } }))
  await act(render)
  const picker = () => container.querySelector('[aria-label="Time signature"]')
  await change(picker(), 'custom')
  assert.equal(document.activeElement, container.querySelector('input[type="number"]'))
  await change(container.querySelector('input[type="number"]'), '')
  assert.ok(container.querySelector('button[type="submit"]').disabled)
  await change(container.querySelector('input[type="number"]'), '15')
  await change(container.querySelector('form select'), '16')
  await change(container.querySelector('input[type="text"]'), '4+4+4')
  assert.match(container.textContent, /Grouping totals 12; it must equal 15/)
  assert.equal(applied.length, 0)
  await act(() => container.querySelector('form').dispatchEvent(new window.Event('submit', { bubbles: true, cancelable: true })))
  assert.equal(applied.length, 0)
  await change(container.querySelector('input[type="text"]'), '4+4+4+3')
  assert.equal(container.querySelector('button[type="submit"]').disabled, false)
  await click(container.querySelector('button[type="submit"]'))
  assert.equal(applied.length, 1)
  assert.deepEqual(meter, { numerator: 15, denominator: 16, groups: [4, 4, 4, 3], tempoUnit: 'quarter', groupOnly: false })
  assert.equal(picker().value, '15/16')
  assert.equal(document.activeElement, picker())
  assert.equal(container.querySelector('form'), null)

  await click(container.querySelector('.pulse-custom-meter-edit'))
  assert.equal(container.querySelector('input[type="text"]').value, '4+4+4+3')
  await change(container.querySelector('input[type="text"]'), '3+3+3+3+3')
  await click(container.querySelector('form button[type="button"]'))
  assert.equal(applied.length, 1)
  assert.equal(document.activeElement, picker())
  await change(picker(), 'custom')
  assert.equal(container.querySelector('input[type="text"]').value, '4+4+4+3')
  await act(() => container.querySelector('form').dispatchEvent(new window.KeyboardEvent('keydown', { key: 'Escape', bubbles: true })))
  assert.equal(container.querySelector('form'), null)
  assert.equal(applied.length, 1)
  assert.equal(document.activeElement, picker())

  await change(picker(), '6/8')
  assert.deepEqual(meter.groups, [3, 3])
  assert.equal(meter.denominator, 8)
  await act(() => root.unmount())
})
