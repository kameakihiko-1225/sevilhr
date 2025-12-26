# Font Family Options in Tailwind CSS / Shadcn

Here are all the font family options you can use in Tailwind CSS:

## Built-in Font Families:

1. **font-sans** - Sans-serif (system default)
   - Classes: `font-sans`
   - Default in most Shadcn setups

2. **font-serif** - Serif fonts
   - Classes: `font-serif`
   - Example: Times New Roman, Georgia

3. **font-mono** - Monospace fonts
   - Classes: `font-mono`
   - Example: Courier New, monospace

## Custom Fonts (via Google Fonts or custom):

You can add custom fonts in `app/layout.tsx`. Currently configured:

- **Geist Sans** (`--font-geist-sans`) - Used as default
- **Geist Mono** (`--font-geist-mono`) - Monospace variant

## Usage Examples:

```tsx
// Sans-serif (default)
<div className="font-sans">Text</div>

// Serif
<div className="font-serif">Text</div>

// Monospace
<div className="font-mono">Text</div>

// Custom font variable
<div className="font-[family-name:var(--font-geist-sans)]">Text</div>
```

## Popular Google Fonts you can add:

- **Inter**: `font-inter` (modern sans-serif)
- **Roboto**: `font-roboto` (clean sans-serif)
- **Poppins**: `font-poppins` (geometric sans-serif)
- **Montserrat**: `font-montserrat` (modern sans-serif)
- **Open Sans**: `font-open-sans` (readable sans-serif)
- **Playfair Display**: `font-playfair` (elegant serif)

To add a new font:
1. Import from `next/font/google` in `app/layout.tsx`
2. Add CSS variable
3. Use in components with `font-*` class

