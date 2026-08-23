import {
  activeBrand,
  getBrandCssProperties,
  resolveBrandAsset,
} from '../../brand'

export default function PhoneFrame({ children, brand = activeBrand }) {
  const logoSrc = resolveBrandAsset(brand.logo.src)
  const brandProperties = getBrandCssProperties(brand, import.meta.env.BASE_URL)

  return (
    <div
      className="app-viewport"
      data-brand={brand.id}
      style={{
        ...brandProperties,
        backgroundColor: 'var(--brand-color-canvas)',
        color: 'var(--brand-color-ink)',
        fontFamily: 'var(--brand-font-body)',
      }}
    >
      <div
        className="app-phone-frame brick-texture"
        style={{
          backgroundColor: 'var(--brand-color-canvas)',
          borderColor: 'var(--brand-color-border)',
        }}
      >
        <header
          className="app-brand-header"
          style={{ borderBottomColor: 'color-mix(in srgb, var(--brand-color-surface) 50%, transparent)' }}
        >
          <img src={logoSrc} alt={brand.logo.alt} className="app-brand-logo" />
        </header>
        {children}
      </div>
    </div>
  )
}
