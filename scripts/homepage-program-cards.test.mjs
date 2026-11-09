import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

const source = (path) => readFileSync(new URL('../' + path, import.meta.url), 'utf8');

test('homepage featured programs have isolated compact responsive grid', () => {
  const css = source('components/internships/program-artwork.css');
  const home = source('app/page.tsx');
  assert.match(css, /\.talora-landing \.live-programs \{\s*grid-template-columns: repeat\(4, minmax\(0, 1fr\)\)/);
  assert.match(css, /min-width: 640px\) and \(max-width: 1199px/);
  assert.match(css, /grid-template-columns: repeat\(2, minmax\(0, 1fr\)\)/);
  assert.match(css, /max-width: 639px/);
  assert.match(css, /\.live-program--illustrated \.program-artwork \{\s*aspect-ratio: auto;\s*height: clamp/);
  assert.match(home, /live-program live-program--illustrated/);
  assert.match(home, /localize[d]?InternshipText\(item\.short_description/);
  assert.match(home, /25vw/);
  assert.match(home, /slice\(0, 4\)/);
});
