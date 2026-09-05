import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

const cssSource = await readFile(new URL('../src/index.css', import.meta.url), 'utf8')
const controlsSource = await readFile(
  new URL('../src/components/metronome/BpmControls.jsx', import.meta.url),
  'utf8',
)
const phoneFrameSource = await readFile(
  new URL('../src/components/layout/PhoneFrame.jsx', import.meta.url),
  'utf8',
)

test('feature screens and the logo header use clean uninterrupted surfaces', () => {
  const featureScreenRule = cssSource.match(/\.pulse-feature-screen\s*\{([^}]*)\}/)?.[1] || ''
  const brandHeaderRule = cssSource.match(/\.app-brand-header\s*\{([^}]*)\}/)?.[1] || ''

  assert.match(featureScreenRule, /background:\s*var\(--brand-color-canvas\)/)
  assert.doesNotMatch(featureScreenRule, /radial-gradient|box-shadow/)
  assert.doesNotMatch(brandHeaderRule, /border-bottom|box-shadow/)
  assert.doesNotMatch(phoneFrameSource, /borderBottom|border-bottom/)
})

test('tempo badge leans with movement without a colored glow', async () => {
  const { getTempoThumbTilt } = await import('../src/components/metronome/bpmControlMotion.js')
  const tempoSliderThumbRule = cssSource.match(/\.pulse-tempo-slider input\[type="range"\]::\-webkit-slider-thumb\s*\{([^}]*)\}/)?.[1] || ''

  assert.equal(getTempoThumbTilt(120, 121), 3.5)
  assert.equal(getTempoThumbTilt(120, 119), -3.5)
  assert.equal(getTempoThumbTilt(120, 120), 0)
  assert.match(controlsSource, /--tempo-thumb-tilt/)
  assert.match(tempoSliderThumbRule, /transform:\s*rotate\(var\(--tempo-thumb-tilt\)\)/)
  assert.doesNotMatch(tempoSliderThumbRule, /filter|drop-shadow/)
})

test('tempo transport remains large and clearly separated from the wheel and slider', () => {
  const transportRowRule = cssSource.match(/\.pulse-transport-row\s*\{([^}]*)\}/)?.[1] || ''
  const transportButtonsRule = cssSource.match(/\.pulse-nudge,\s*\.pulse-transport\s*\{([^}]*)\}/)?.[1] || ''
  const tempoSliderRule = cssSource.match(/\.pulse-tempo-slider\s*\{([^}]*)\}/)?.[1] || ''
  const tempoSliderInputRule = cssSource.match(/\.pulse-tempo-slider input\[type="range"\]\s*\{([^}]*)\}/)?.[1] || ''
  const tempoSliderThumbRule = cssSource.match(/\.pulse-tempo-slider input\[type="range"\]::\-webkit-slider-thumb\s*\{([^}]*)\}/)?.[1] || ''
  const tempoSliderRailRule = cssSource.match(/\.pulse-tempo-slider-rail\s*\{([^}]*)\}/)?.[1] || ''

  assert.match(transportRowRule, /max-width:\s*346px/)
  assert.match(transportRowRule, /grid-template-columns:\s*var\(--pulse-transport-size\) minmax\(0, 1fr\) var\(--pulse-transport-size\)/)
  assert.match(transportRowRule, /gap:\s*14px/)
  assert.match(transportRowRule, /margin-top:\s*40px/)
  assert.match(transportButtonsRule, /min-height:\s*var\(--pulse-transport-size\)/)
  assert.match(tempoSliderRule, /margin-top:\s*22px/)
  assert.match(tempoSliderRule, /--tempo-slider-thumb-width:\s*50px/)
  assert.match(tempoSliderInputRule, /height:\s*48px/)
  assert.match(tempoSliderThumbRule, /width:\s*var\(--tempo-slider-thumb-width\)/)
  assert.match(tempoSliderThumbRule, /height:\s*39px/)
  assert.match(tempoSliderRailRule, /right:\s*calc\(var\(--tempo-slider-thumb-width\) \/ 2\)/)
  assert.match(tempoSliderRailRule, /left:\s*calc\(var\(--tempo-slider-thumb-width\) \/ 2\)/)
  assert.match(tempoSliderRailRule, /var\(--tempo-slider-progress\)/)
  assert.match(controlsSource, /<span className="pulse-tempo-slider-rail" aria-hidden="true" \/>/)
})

test('metronome proportions follow app width rather than browser height', () => {
  assert.match(cssSource, /\.app-phone-frame\s*\{\s*container-type: inline-size/)
  for (const selector of ['app-brand-logo', 'pulse-orbit']) {
    const rules = [...cssSource.matchAll(new RegExp(`\\.${selector}\\s*\\{([^}]*)\\}`, 'g'))]
    assert.equal(rules.length, 1, `${selector} has no alternate height-based sizing`)
    assert.match(rules[0][1], /cqw/)
    assert.doesNotMatch(rules[0][1], /\d(?:dvh|vh|vw)/)
  }
  assert.match(cssSource, /--pulse-transport-size: clamp\(44px, 13\.1cqw, 56px\)/)
  assert.match(cssSource, /\.pulse-performance\s*\{[^}]*flex: 1 0 auto/)
})

test('tempo nudge buttons respond immediately and settle without bounce or layout changes', () => {
  const nudgeRule = cssSource.match(/\.pulse-nudge\s*\{([^}]*)\}/)?.[1] || ''
  const pressedRule = cssSource.match(/\.pulse-nudge:not\(:disabled\):active\s*\{([^}]*)\}/)?.[1] || ''
  const reducedMotion = cssSource.slice(cssSource.indexOf('@media (prefers-reduced-motion: reduce)'))

  assert.match(nudgeRule, /touch-action:\s*manipulation/)
  assert.match(nudgeRule, /transition:\s*transform 140ms ease-out, background-color 140ms ease-out/)
  assert.match(pressedRule, /transform:\s*scale\(0\.95\)/)
  assert.match(pressedRule, /background-color:\s*color-mix/)
  assert.match(pressedRule, /transition-duration:\s*0ms/)
  assert.doesNotMatch(pressedRule, /(?:width|height|margin|padding):/)
  assert.match(reducedMotion, /\.pulse-nudge:not\(:disabled\):active\s*\{\s*transform:\s*none/)
})
