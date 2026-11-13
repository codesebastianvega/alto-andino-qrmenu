import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { resolveDIYImage } from '../src/utils/diyImages.js';

const brand = 'a63da806-a62a-49b9-a833-07e0976785ad';
const chicken = '103ad6f2-c584-4492-9d3a-e9a917cbfa62';
test('bundled defaults are restricted to brand and option ID', () => {
  assert.equal(resolveDIYImage({ id: chicken }, brand), '/img/ingredients/raw-chicken.webp');
  assert.equal(resolveDIYImage({ id: chicken }, 'another-brand'), null);
  assert.equal(resolveDIYImage({ id: 'another-option', name: 'Pollo Marinado BOKU' }, brand), null);
});
test('explicit administrator images always take priority, including a different CDN', () => {
  assert.equal(resolveDIYImage({ id: chicken, image_url: 'https://images.example.com/custom.webp' }, brand), 'https://images.example.com/custom.webp');
});
test('every bundled catalog reference is a local file that exists', () => {
  const data = JSON.parse(readFileSync(new URL('../src/data/diyImageLibrary.json', import.meta.url), 'utf8'));
  for (const options of Object.values(data)) for (const item of Object.values(options)) {
    assert.ok(item.image_url.startsWith('/img/ingredients/'));
    assert.ok(existsSync(new URL('../public' + item.image_url, import.meta.url)), item.image_url);
  }
});
