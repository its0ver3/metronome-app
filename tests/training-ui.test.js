import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

test('Training opens directly on the cards without an introductory heading', async () => {
  const source = await readFile(new URL('../src/components/training/TrainingScreen.jsx', import.meta.url), 'utf8')
  assert.match(source, /aria-label="Training"/)
  assert.doesNotMatch(source, /training-title|pulse-feature-header|Build steadier time/)
})

test('disabled wheels share the Settings gray surface and neutralize the tempo tint', async () => {
  const css = await readFile(new URL('../src/components/training/numberWheel.css', import.meta.url), 'utf8')
  const rules = css.match(/\.number-wheel\[aria-disabled='true'\]\s*\{([^}]*)\}/)[1]
  assert.match(rules, /var\(--pulse-surface-raised, #202020\)/)
  assert.match(rules, /--trainer-accent:\s*#a4a4a4/)
})

test('trainer card surfaces inherit the same panel treatment as Settings in both states', async () => {
  const css = await readFile(new URL('../src/components/training/trainerCards.css', import.meta.url), 'utf8')
  const appCss = await readFile(new URL('../src/index.css', import.meta.url), 'utf8')
  assert.match(appCss, /\.pulse-panel\s*\{[^}]*background:\s*var\(--pulse-surface-raised\)/)
  const cards = [...css.matchAll(/\.pulse-training-stack > \.pulse-trainer-card(?:\.is-enabled)?\s*\{([^}]*)\}/g)]
  assert.equal(cards.length, 2)
  for (const [, rules] of cards) assert.doesNotMatch(rules, /(?:background|box-shadow)\s*:/)
})

for (const [file, title] of [
  ['GapTraining', 'Gap Trainer'],
  ['TempoTrainer', 'Tempo Trainer'],
  ['SubdivisionTrainer', 'Subdivision Trainer'],
]) {
  test(`${title} uses the shared card identity and no numbered category label`, async () => {
    const source = await readFile(
      new URL(`../src/components/training/${file}.jsx`, import.meta.url),
      'utf8',
    )

    assert.ok(source.includes(`title="${title}"`))
    assert.match(source, /<TrainerCardHeader/)
    if (file === 'GapTraining') {
      assert.match(source, /metricsId="gap-trainer-settings"/)
      assert.doesNotMatch(source, /pulse-stepper|pulse-trainer-settings-reveal/)
    } else {
      assert.match(source, /aria-hidden=\{!enabled\}/)
      assert.match(source, /inert=\{!enabled \? true : undefined\}/)
      assert.match(source, /pulse-trainer-settings-reveal/)
    }
    assert.doesNotMatch(source, /(?:Timing|Tempo|Control) · 0[123]/)
  })
}

test('subdivision stages retain playback progress without the redundant cycle summary', async () => {
  const source = await readFile(
    new URL('../src/components/training/SubdivisionTrainer.jsx', import.meta.url),
    'utf8',
  )
  const css = await readFile(new URL('../src/index.css', import.meta.url), 'utf8')

  assert.doesNotMatch(source, /pulse-cycle-summary|Subdivision cycle order|<span>Cycle<\/span>/)
  assert.doesNotMatch(css, /pulse-cycle-summary/)
  assert.match(source, /className="pulse-stage-list"/)
  assert.match(source, /aria-current=\{isActive \? 'step' : undefined\}/)
  const stageSource = await readFile(new URL('../src/components/training/SubdivisionStage.jsx', import.meta.url), 'utf8')
  assert.match(stageSource, /Active · Bar \{Math\.min\(activeBar, stage\.bars\)\} of \{stage\.bars\}/)
  assert.match(source, /\+ Add stage/)
  assert.match(stageSource, /Remove stage/)
})
