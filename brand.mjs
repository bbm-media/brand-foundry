const hex = /^#[0-9a-f]{6}$/i;
const fontName = /^[a-zA-Z0-9][a-zA-Z0-9 -]{0,79}$/;
const escapeAttr = value => value.replaceAll('&', '&amp;').replaceAll("'", '&#39;').replaceAll('"', '&quot;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
export function validateBrand(input, previous = {}) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) throw new Error('Enter your brand details.');
  const brand = { ...previous, fonts: { ...previous.fonts } };
  for (const key of ['name', 'handle']) {
    const value = input[key];
    if (typeof value !== 'string' || value.length > 100 || (key === 'name' && !value.trim())) throw new Error(`${key === 'name' ? 'Studio name' : 'Handle'} must be ${key === 'name' ? '1' : '0'} to 100 characters.`);
    brand[key] = value.trim();
  }
  for (const key of ['accent', 'accentSoft', 'paper', 'ink']) {
    if (!hex.test(input[key])) throw new Error('Use six-digit hex colors, for example #2453FF.');
    brand[key] = input[key].toUpperCase();
  }
  for (const key of ['display', 'body']) {
    const value = input.fonts?.[key];
    if (typeof value !== 'string' || !fontName.test(value.trim())) throw new Error('Use a font family name, such as Inter or Lora.');
    brand.fonts[key] = value.trim();
  }
  brand.fonts.googleUrl = fontUrl(brand.fonts);
  return brand;
}
export function fontUrl(fonts) {
  return 'https://fonts.googleapis.com/css2?' + [...new Set([fonts.display, fonts.body])].map(name => 'family=' + encodeURIComponent(name) + ':wght@400;500;600;700;800;900').join('&') + '&display=swap';
}
export function parseVariables(html) {
  const match = html.match(/data-composition-variables\s*=\s*(["'])([\s\S]*?)\1/);
  if (!match) return [];
  return JSON.parse(match[2].replace(/&quot;/g, '"').replace(/&#39;|&apos;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&'));
}
export function brandTemplate(html, brand) {
  // Templates explicitly opt in, so existing independent templates retain their style.
  const variables = parseVariables(html);
  const allowed = new Set(['handle', 'accent', 'accentSoft', 'paper', 'ink']);
  for (const variable of variables) if (allowed.has(variable.brandKey) && brand[variable.brandKey] != null) variable.default = brand[variable.brandKey];
  html = html.replace(/data-composition-variables\s*=\s*(["'])([\s\S]*?)\1/, () => `data-composition-variables='${escapeAttr(JSON.stringify(variables))}'`);
  if (html.includes('data-brand-fonts')) {
    const fonts = brand.fonts;
    if (![fonts?.display, fonts?.body].every(value => typeof value === 'string' && fontName.test(value))) throw new Error('Invalid brand font family');
    html = html.replace(/<link\b[^>]*href=["']https:\/\/fonts.googleapis.com\/[^>]*>/g, '');
    html = html.replace('</head>', `<link rel="stylesheet" href="${escapeAttr(fontUrl(fonts))}"><style>:root{--serif:"${fonts.display}",Georgia,serif;--sans:"${fonts.body}",Arial,sans-serif}</style></head>`);
  }
  return html;
}
