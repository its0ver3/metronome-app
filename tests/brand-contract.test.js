import test from 'node:test'
import assert from 'node:assert/strict'
import { drumsOnlyBrand } from '../src/brand/drumsOnly.js'
import { getBrandCssProperties, resolveBrandAsset } from '../src/brand/brandStyles.js'

test('the active Drums Only brand contract is immutable', () => {
  assert.equal(drumsOnlyBrand.id, 'drums-only')
  assert.equal(drumsOnlyBrand.logo.alt, 'Drums Only')
  assert.ok(Object.isFrozen(drumsOnlyBrand))
  assert.ok(Object.isFrozen(drumsOnlyBrand.colors))
  assert.ok(Object.isFrozen(drumsOnlyBrand.assets))
})

test('brand assets resolve against the configured Vite base path', () => {
  assert.equal(
    resolveBrandAsset('logo.png', '/metronome-app/'),
    '/metronome-app/logo.png',
  )
  assert.equal(
    resolveBrandAsset('https://assets.example/shop.svg', '/metronome-app/'),
    'https://assets.example/shop.svg',
  )
})

test('brand properties include semantic values and a base-aware range thumb', () => {
  const properties = getBrandCssProperties(drumsOnlyBrand, '/metronome-app/')

  assert.equal(properties['--brand-color-canvas'], '#0A0A0A')
  assert.equal(properties['--color-primary'], drumsOnlyBrand.colors.accent)
  assert.equal(properties['--brand-color-rhythm-two'], '#3B82F6')
  assert.equal(
    properties['--brand-range-thumb-image'],
    'url("/metronome-app/blue-olive-badge.png")',
  )
})
