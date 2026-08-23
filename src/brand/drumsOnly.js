import { defineBrand } from './defineBrand.js'

/**
 * Drums Only is the active shop identity. Replace this definition (or point
 * activeBrand at another definition) to rebrand the shell without changing
 * metronome, training, or settings components.
 */
export const drumsOnlyBrand = defineBrand({
  id: 'drums-only',
  name: 'Drums Only',
  productName: 'Drums Only Metronome',
  logo: {
    src: 'logo.png',
    alt: 'Drums Only',
  },
  assets: {
    rangeThumb: 'blue-olive-badge.png',
  },
  colors: {
    canvas: '#0A0A0A',
    surface: '#1A1A1A',
    ink: '#F5F0E8',
    accent: '#F5F0E8',
    muted: '#2A2A2A',
    border: '#3A3A3A',
    focus: '#F5F0E8',
  },
  fonts: {
    heading: "'Black Ops One', system-ui, sans-serif",
    body: "'Inter', sans-serif",
  },
})
