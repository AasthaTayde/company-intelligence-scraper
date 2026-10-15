
import test from 'node:test';
import assert from 'node:assert/strict';
import { extractCompanyData } from '../src/extractor.js';

test('extracts company metadata and public contact links', () => {
  const html = `
    <html><head>
      <title>Example Cloud | Home</title>
      <meta property="og:site_name" content="Example Cloud">
      <meta name="description" content="Cloud software company">
    </head><body>
      <h1>Welcome</h1>
      <a href="mailto:hello@example.com">Email us</a>
      <a href="tel:+1-555-0100">Call us</a>
      <a href="https://www.linkedin.com/company/example-cloud">LinkedIn</a>
    </body></html>`;

  const result = extractCompanyData(html, 'https://example.com/');

  assert.equal(result.companyName, 'Example Cloud');
  assert.equal(result.email, 'hello@example.com');
  assert.equal(result.phone, '+1-555-0100');
  assert.match(result.description, /Cloud software/);
  assert.match(result.socialProfiles, /linkedin\.com/);
});

test('uses a paragraph as description when metadata is missing', () => {
  const html = `
    <html><head><title>Bright Learning</title></head>
    <body>
      <main>
        <p>Bright Learning provides online education and training
        resources for students and professionals around the world.</p>
      </main>
    </body></html>`;

  const result = extractCompanyData(html, 'https://bright.example/');

  assert.match(result.description, /online education and training/);
});

test('detects industry hints from page content', () => {
  const html = `
    <html><head>
      <title>Cloud Academy</title>
      <meta name="description" content="Software and education services">
    </head><body>
      <p>We provide software tools and education resources.</p>
    </body></html>`;

  const result = extractCompanyData(html, 'https://academy.example/');

  assert.match(result.industryHints, /software/);
  assert.match(result.industryHints, /education/);
});

test('handles websites without public contact details', () => {
  const html = `
    <html><head>
      <title>Simple Website</title>
    </head><body>
      <h1>Welcome</h1>
      <p>This is a simple website without public contact details.</p>
    </body></html>`;

  const result = extractCompanyData(html, 'https://simple.example/');

  assert.equal(result.companyName, 'Simple Website');
  assert.equal(result.email, '');
  assert.equal(result.phone, '');
  assert.equal(result.websiteUrl, 'https://simple.example');
});

test('extracts GitHub links as social or developer profiles', () => {
  const html = `
    <html><head><title>Developer Tools</title></head>
    <body>
      <a href="https://github.com/example-org">GitHub</a>
    </body></html>`;

  const result = extractCompanyData(html, 'https://developer.example/');

  assert.match(result.socialProfiles, /github\.com\/example-org/);
});
