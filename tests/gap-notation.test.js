import test from 'node:test'
import assert from 'node:assert/strict'
import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { build } from 'esbuild'
import { GAP_PATTERNS } from '../src/audio/gapPatterns.js'

const compiled = await build({
  stdin: { contents: `
    export { default as Notation } from './src/components/training/GapPatternNotation.jsx'
    export { default as Card } from './src/components/training/GapTraining.jsx'
    export { getPlaybackSummary } from './src/components/metronome/PlaybackStatus.jsx'
  `, resolveDir: fileURLToPath(new URL('../', import.meta.url)), loader: 'jsx' },
  bundle: true, write: false, platform: 'node', format: 'cjs', jsx: 'automatic',
  external: ['react', 'react/jsx-runtime'], loader: { '.css': 'empty', '.png': 'dataurl' },
})
const module = { exports: {} }
new Function('module', 'exports', 'require', compiled.outputFiles[0].text)(module, module.exports, createRequire(import.meta.url))
const { Notation, Card, getPlaybackSummary } = module.exports
const render = (Component, props) => renderToStaticMarkup(createElement(Component, props))

test('notation describes a complete denominator note with the correct rests and flags', () => {
  for (const denominator of [4, 8]) {
    const eighth = denominator === 4 ? 8 : 16
    const sixteenth = denominator === 4 ? 16 : 32
    for (const pattern of ['offbeat', 'second', 'fourth']) {
      const html = render(Notation, { pattern, denominator })
      const durations = [...html.matchAll(/data-(rest|note)="(\d+)"/g)].map(([, kind, duration]) => [kind, Number(duration)])
      assert.deepEqual(durations, pattern === 'offbeat'
        ? [['rest', eighth], ['note', eighth]]
        : pattern === 'second' ? [['rest', sixteenth], ['note', sixteenth], ['rest', eighth]]
          : [['rest', eighth], ['rest', sixteenth], ['note', sixteenth]])
      assert.equal(durations.reduce((sum, [, duration]) => sum + 1 / duration, 0), 1 / denominator)
      assert.doesNotMatch(html, /undefined|NaN/)
    }
    assert.match(render(Notation, { pattern: 'silence', denominator }), /data-rest="bar"/)
    assert.match(render(Notation, { pattern: 'all', denominator }), /data-rest="bar"/)
  }
})

test('the gap card keeps two bar wheels and reveals one accessible notation picker when enabled', () => {
  for (const enabled of [false, true]) for (const disabled of [false, true]) {
    const html = render(Card, { enabled, disabled, clickBars: 2, silentBars: 3, pattern: 'offbeat', onChange() {} })
    assert.equal((html.match(/role="spinbutton"/g) || []).length, 2)
    assert.equal(html.includes('aria-haspopup="listbox"'), enabled)
    assert.match(html, /Gap bars/)
    if (enabled) {
      assert.match(html, /aria-label="Gap pattern: Offbeat &amp;"/)
      assert.match(html, /data-gap-pattern="offbeat"/)
      assert.match(html, /aria-expanded="false"/)
      assert.equal(/class="pulse-subdivision-dropdown[^>]*disabled=""/.test(html), disabled)
    }
  }
})

test('playback status uses the sounding pattern until a queued edit reaches its bar boundary', () => {
  const props = { bpm: 120, isPlaying: true, gapEnabled: true, inGap: true, gapPattern: 'fourth', meter: { denominator: 4 }, gapPlayback: { pattern: 'offbeat', bar: 2, bars: 3 } }
  assert.deepEqual(getPlaybackSummary(props).chips, ['Gap · Offbeat & · 2/3'])
  assert.deepEqual(getPlaybackSummary({ ...props, gapPlayback: { pattern: 'silence', bar: 1, bars: 3 } }).chips, ['Gap · Silent · 1/3'])
  assert.deepEqual(getPlaybackSummary({ ...props, polyrhythmMode: true }).chips, ['1 trainer paused'])
})


test('triplet notation places one note and two rests under a 3:2 bracket', () => {
  assert.equal(GAP_PATTERNS.some(pattern => pattern.id === 'all'), false)
  for (const denominator of [4, 8]) for (const pattern of ['triplet-second', 'triplet-third']) {
    const html = render(Notation, { pattern, denominator })
    assert.match(html, /data-tuplet="3:2"/)
    assert.match(html, />3<\/text>/)
    const durations = [...html.matchAll(/data-(rest|note)="(\d+)"/g)].map(([, kind, duration]) => [kind, Number(duration)])
    assert.deepEqual(durations.map(([kind]) => kind), pattern === 'triplet-second' ? ['rest', 'note', 'rest'] : ['rest', 'rest', 'note'])
    assert.ok(durations.every(([, duration]) => duration === denominator * 2))
    assert.equal(durations.reduce((sum, [, duration]) => sum + 1 / duration, 0) * 2 / 3, 1 / denominator)
    const card = render(Card, { enabled: true, clickBars: 2, silentBars: 2, pattern, denominator, onChange() {} })
    assert.match(card, /Gap pattern: Triplet · (2nd|3rd)/)
  }
})
