/**
 * The internship catalogue stores legacy plain-text descriptions and newer
 * bilingual content in the same TEXT columns. Never expose AZ/EN markers in UI.
 */
export function localizedInternshipText(
  text: string | null | undefined,
  language: 'az' | 'en',
): string {
  if (!text) return '';
  const azMarker = '[[AZ]]';
  const enMarker = '[[EN]]';
  const azIndex = text.indexOf(azMarker);
  const enIndex = text.indexOf(enMarker);
  if (azIndex < 0 || enIndex < 0 || azIndex >= enIndex) return text;
  const azText = text.slice(azIndex + azMarker.length, enIndex).trim();
  const enText = text.slice(enIndex + enMarker.length).trim();
  return language === 'en' ? (enText || azText) : (azText || enText);
}
