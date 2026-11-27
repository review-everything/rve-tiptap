export const contentFonts = [
  { label: 'Roboto', value: 'Roboto, sans-serif' },
  { label: 'Be Vietnam Pro', value: '"Be Vietnam Pro", sans-serif' },
  { label: 'Source Serif 4', value: '"Source Serif 4", serif' },
] as const;

export const contentFontSizes = ['14px', '16px', '18px', '20px', '24px'] as const;

export function contentFontFamily(value: unknown): (typeof contentFonts)[number]['value'] | null {
  if (typeof value !== 'string') {
    return null;
  }
  for (const font of contentFonts) {
    if (font.value === value) {
      return font.value;
    }
  }
  return null;
}

export function contentFontSize(value: unknown): (typeof contentFontSizes)[number] | null {
  if (typeof value !== 'string') {
    return null;
  }
  for (const size of contentFontSizes) {
    if (size === value) {
      return size;
    }
  }
  return null;
}
