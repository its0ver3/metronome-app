const REQUIRED_COLOR_KEYS = [
  'canvas',
  'surface',
  'ink',
  'accent',
  'muted',
  'border',
  'focus',
  'rhythmTwo',
]

function assertNonEmptyString(value, field) {
  if (typeof value !== 'string' || value.trim() === '') {
    throw new TypeError(`Brand ${field} must be a non-empty string`)
  }
}

function deepFreeze(value) {
  Object.values(value).forEach((entry) => {
    if (entry && typeof entry === 'object' && !Object.isFrozen(entry)) {
      deepFreeze(entry)
    }
  })

  return Object.freeze(value)
}

/**
 * Validates and freezes the public brand contract used by the app shell.
 * Feature components should consume semantic CSS variables, not this object.
 */
export function defineBrand(definition) {
  assertNonEmptyString(definition?.id, 'id')
  assertNonEmptyString(definition?.name, 'name')
  assertNonEmptyString(definition?.productName, 'productName')
  assertNonEmptyString(definition?.logo?.src, 'logo.src')
  assertNonEmptyString(definition?.logo?.alt, 'logo.alt')
  assertNonEmptyString(definition?.assets?.rangeThumb, 'assets.rangeThumb')
  assertNonEmptyString(definition?.fonts?.heading, 'fonts.heading')
  assertNonEmptyString(definition?.fonts?.body, 'fonts.body')

  REQUIRED_COLOR_KEYS.forEach((key) => {
    assertNonEmptyString(definition?.colors?.[key], `colors.${key}`)
  })

  return deepFreeze({
    ...definition,
    logo: { ...definition.logo },
    assets: { ...definition.assets },
    colors: { ...definition.colors },
    fonts: { ...definition.fonts },
  })
}
