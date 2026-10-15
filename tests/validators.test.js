import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeUrl, normalizeEmail } from '../src/validators.js';

test('normalizeUrl adds https when scheme is absent', () => {
  assert.equal(normalizeUrl('example.com'), 'https://example.com/');
});

test('normalizeUrl rejects invalid URLs', () => {
  assert.throws(() => normalizeUrl('not a url'), /Invalid URL|valid hostname/);
});

test('normalizeEmail trims and lowercases email addresses', () => {
  assert.equal(normalizeEmail('  INFO@Example.COM '), 'info@example.com');
});
