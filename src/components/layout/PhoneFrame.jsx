import { useEffect, useRef } from 'react'
import { ArrowsOut, ArrowsIn } from '@phosphor-icons/react'
import {
  activeBrand,
  getBrandCssProperties,
  resolveBrandAsset,
} from '../../brand'

export default function PhoneFrame({ children, brand = activeBrand, kitOpen = false, onKitToggle }) {
  const kitButtonRef = useRef(null)
  const wasKitOpen = useRef(false)
  const logoSrc = resolveBrandAsset(brand.logo.src)
  const brandProperties = getBrandCssProperties(brand, import.meta.env.BASE_URL)

  useEffect(() => {
    if (wasKitOpen.current && !kitOpen) kitButtonRef.current?.focus({ preventScroll: true })
    wasKitOpen.current = kitOpen
  }, [kitOpen])

  return (
    <div
      className={`app-viewport ${kitOpen ? 'is-kit-view' : ''}`}
      data-brand={brand.id}
      style={{
        ...brandProperties,
        backgroundColor: 'var(--brand-color-canvas)',
        color: 'var(--brand-color-ink)',
        fontFamily: 'var(--brand-font-body)',
      }}
    >
      <div
        className="app-phone-frame"
        style={{
          backgroundColor: 'var(--brand-color-canvas)',
          borderColor: 'var(--brand-color-border)',
        }}
      >
        <header className="app-brand-header">
          <img src={logoSrc} alt={brand.logo.alt} className="app-brand-logo" />
          {onKitToggle && (
            <button
              ref={kitButtonRef}
              type="button"
              className="pulse-kit-toggle"
              onClick={onKitToggle}
              aria-label={kitOpen ? 'Exit Kit View' : 'Enter Kit View'}
              aria-pressed={kitOpen}
              title={kitOpen ? 'Exit Kit View (Escape)' : 'Kit View'}
            >
              {kitOpen ? <ArrowsIn size={24} aria-hidden="true" /> : <ArrowsOut size={24} aria-hidden="true" />}
            </button>
          )}
        </header>
        {children}
      </div>
    </div>
  )
}
