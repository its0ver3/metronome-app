# Drums Only Metronome — Theme Guide

## Color Palette

| Role        | Name       | Hex       | Usage                              |
|-------------|------------|-----------|-------------------------------------|
| Primary     | Deep Red   | `#B82025` | Buttons, accents, active states     |
| Secondary   | Cream      | `#F0E0C8` | Backgrounds, cards                  |
| Dark        | Charcoal   | `#2B2B2B` | Text, headers, dark backgrounds     |
| Light       | Warm White | `#FAF6F0` | Page background, input fields       |
| Muted       | Dusty Red  | `#8C1A1E` | Hover states, borders, shadows      |

## Typography

| Role     | Font        | Weight       | Source                                              |
|----------|-------------|--------------|------------------------------------------------------|
| Headings | Bebas Neue  | 400 (Regular)| [Google Fonts](https://fonts.google.com/specimen/Bebas+Neue) |
| Body     | Inter       | 400 / 600    | [Google Fonts](https://fonts.google.com/specimen/Inter)      |

### Font Sizes

| Element   | Size   |
|-----------|--------|
| H1        | 2.5rem |
| H2        | 2rem   |
| H3        | 1.5rem |
| Body      | 1rem   |
| Small     | 0.875rem |

## CSS Variables

```css
:root {
  /* Colors */
  --color-primary: #B82025;
  --color-secondary: #F0E0C8;
  --color-dark: #2B2B2B;
  --color-light: #FAF6F0;
  --color-muted: #8C1A1E;

  /* Typography */
  --font-heading: 'Bebas Neue', sans-serif;
  --font-body: 'Inter', sans-serif;

  /* Font Sizes */
  --text-h1: 2.5rem;
  --text-h2: 2rem;
  --text-h3: 1.5rem;
  --text-body: 1rem;
  --text-small: 0.875rem;

  /* Spacing */
  --spacing-xs: 0.25rem;
  --spacing-sm: 0.5rem;
  --spacing-md: 1rem;
  --spacing-lg: 1.5rem;
  --spacing-xl: 2rem;

  /* Border Radius */
  --radius-sm: 4px;
  --radius-md: 8px;
  --radius-lg: 12px;
}
```

## Google Fonts Import

```html
<link href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Inter:wght@400;600&display=swap" rel="stylesheet">
```
