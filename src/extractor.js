
import * as cheerio from 'cheerio';
import { normalizeEmail } from './validators.js';

const unique = values => [...new Set(values.filter(Boolean))];

function cleanText(value) {
  return String(value || '').replace(/\s+/g, ' ').trim();
}

function getMeta($, selectors) {
  for (const selector of selectors) {
    const value = $(selector).first().attr('content');
    if (value && value.trim()) return cleanText(value);
  }
  return '';
}

function getDescription($) {
  const metadata = getMeta($, [
    'meta[name="description"]',
    'meta[property="og:description"]',
    'meta[name="twitter:description"]',
    'meta[name="twitter:title"]'
  ]);

  if (metadata) return metadata;

  // Fall back to the first useful paragraph if metadata is missing.
  const paragraphs = $('main p, article p, body p')
    .map((_, el) => cleanText($(el).text()))
    .get();

  return paragraphs.find(text => text.length >= 40)?.slice(0, 500) || '';
}

export function extractCompanyData(html, pageUrl) {
  const $ = cheerio.load(html);
  const page = new URL(pageUrl);

  const title = cleanText($('title').first().text());
  const h1 = cleanText($('h1').first().text());

  const siteName = getMeta($, [
    'meta[property="og:site_name"]',
    'meta[name="application-name"]'
  ]);

  const description = getDescription($);

  // Extract publicly displayed email addresses.
  const emails = [];

  $('a[href^="mailto:"]').each((_, el) => {
    const raw = ($(el).attr('href') || '')
      .replace(/^mailto:/i, '')
      .split('?')[0];

    if (raw.includes('@')) emails.push(normalizeEmail(raw));
  });

  const bodyText = $('body').text();
  const emailMatches =
    bodyText.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi) || [];

  emails.push(...emailMatches.map(normalizeEmail));

  // Extract phone numbers from telephone links.
  const phones = [];

  $('a[href^="tel:"]').each((_, el) => {
    const phone = cleanText(
      ($(el).attr('href') || '').replace(/^tel:/i, '')
    );

    if (phone) phones.push(phone);
  });

  // Extract links to common social and developer platforms.
  const socialDomains = [
    'linkedin.com',
    'twitter.com',
    'x.com',
    'facebook.com',
    'instagram.com',
    'youtube.com',
    'github.com',
    'tiktok.com',
    'threads.net',
    'pinterest.com'
  ];

  const socialProfiles = [];

  $('a[href]').each((_, el) => {
    const href = ($(el).attr('href') || '').trim();

    try {
      const absolute = new URL(href, pageUrl);
      const hostname = absolute.hostname.toLowerCase();

      const isSocial = socialDomains.some(
        domain => hostname === domain || hostname.endsWith(`.${domain}`)
      );

      if (absolute.protocol.startsWith('http') && isSocial) {
        socialProfiles.push(absolute.href);
      }
    } catch {
      // Ignore malformed links.
    }
  });

  // Identify possible industries from visible page content.
  const allText = cleanText($('body').text()).slice(0, 10000);

  const industryKeywords = [
    'software',
    'technology',
    'cloud computing',
    'healthcare',
    'finance',
    'education',
    'retail',
    'manufacturing',
    'consulting',
    'marketing',
    'artificial intelligence',
    'cybersecurity',
    'logistics',
    'e-commerce',
    'real estate',
    'information technology'
  ];

  const lowerText =
    `${title} ${description} ${allText}`.toLowerCase();

  const industryHints = industryKeywords.filter(
    keyword => lowerText.includes(keyword)
  );

  // Prefer an explicit site name, then the page title, then its heading.
  const cleanedTitle = title
    .split(/\s+[|–—]\s+/)[0]
    .trim();

  const companyName =
    siteName ||
    cleanedTitle ||
    h1 ||
    page.hostname.replace(/^www\./, '');

  return {
    companyName,
    websiteUrl: page.origin,
    sourceUrl: page.href,
    email: unique(emails).join('; '),
    phone: unique(phones).join('; '),
    description,
    socialProfiles: unique(socialProfiles).join('; '),
    industryHints: unique(industryHints).join('; '),
    extractedAt: new Date().toISOString()
  };
}
