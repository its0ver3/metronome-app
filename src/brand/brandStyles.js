const EXTERNAL_ASSET_PATTERN = /^(?:[a-z][a-z\d+.-]*:|\/\/|\/)/i

export function resolveBrandAsset(src, baseUrl = import.meta.env.BASE_URL) {
  if (EXTERNAL_ASSET_PATTERN.test(src)) return src

  const normalizedBase = baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`
  return `${normalizedBase}${src.replace(/^\.\//, '')}`
}

/**
 * Brand-native variables are the stable public contract. The existing
 * Tailwind theme aliases keep current feature components visually unchanged.
 */
export function getBrandCssProperties(brand, baseUrl = import.meta.env.BASE_URL) {
  const { colors, fonts } = brand

  return {
    '--brand-color-canvas': colors.canvas,
    '--brand-color-surface': colors.surface,
    '--brand-color-ink': colors.ink,
    '--brand-color-accent': colors.accent,
    '--brand-color-muted': colors.muted,
    '--brand-color-border': colors.border,
    '--brand-color-focus': colors.focus,
    '--brand-font-heading': fonts.heading,
    '--brand-font-body': fonts.body,
    '--brand-range-thumb-image': `url("${resolveBrandAsset(brand.assets.rangeThumb, baseUrl)}")`,

    '--color-primary': colors.accent,
    '--color-secondary': colors.surface,
    '--color-dark': colors.ink,
    '--color-light': colors.canvas,
    '--color-muted': colors.muted,
    '--font-heading': fonts.heading,
    '--font-body': fonts.body,
    '--tw-ring-offset-color': colors.canvas,
  }
}
