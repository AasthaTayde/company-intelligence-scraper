export function normalizeUrl(input) {
  if (typeof input !== 'string' || !input.trim()) {
    throw new Error('URL must be a non-empty string.');
  }
  let candidate = input.trim();
  if (!/^https?:\/\//i.test(candidate)) candidate = `https://${candidate}`;
  let parsed;
  try {
    parsed = new URL(candidate);
  } catch {
    throw new Error(`Invalid URL: ${input}`);
  }
  if (!['http:', 'https:'].includes(parsed.protocol)) {
    throw new Error('Only HTTP and HTTPS URLs are supported.');
  }
  if (!parsed.hostname || !parsed.hostname.includes('.')) {
    throw new Error(`URL must include a valid hostname: ${input}`);
  }
  parsed.hash = '';
  return parsed.toString();
}

export function normalizeEmail(email) {
  return String(email || '').trim().toLowerCase();
}
