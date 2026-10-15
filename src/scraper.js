import axios from 'axios';
import { config } from './config.js';
import { logger } from './logger.js';
import { normalizeUrl } from './validators.js';
import { extractCompanyData } from './extractor.js';

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

export async function scrapeUrls(inputUrls, options = {}) {
  if (!Array.isArray(inputUrls) || inputUrls.length === 0) {
    throw new Error('Provide at least one website URL.');
  }
  const maxPages = Math.max(1, Math.min(Number(options.maxPages || config.maxPages), 100));
  const urls = [...new Set(inputUrls.map(normalizeUrl))].slice(0, maxPages);
  const results = [];
  const errors = [];

  for (const url of urls) {
    try {
      logger.info('Scrape started', { url });
      const response = await axios.get(url, {
        timeout: config.timeoutMs,
        maxRedirects: 5,
        responseType: 'text',
        headers: {
          'User-Agent': config.userAgent,
          'Accept': 'text/html,application/xhtml+xml'
        },
        validateStatus: status => status >= 200 && status < 400
      });
      const contentType = String(response.headers['content-type'] || '');
      if (contentType && !contentType.includes('text/html') && !contentType.includes('application/xhtml+xml')) {
        throw new Error(`Unsupported content type: ${contentType}`);
      }
      const record = extractCompanyData(response.data, response.request?.res?.responseUrl || url);
      results.push(record);
      logger.info('Scrape succeeded', { url, companyName: record.companyName });
    } catch (error) {
      const item = { url, error: error.message || 'Unknown scraping error' };
      errors.push(item);
      logger.error('Scrape failed', item);
    }
    if (url !== urls[urls.length - 1] && config.delayMs > 0) await sleep(config.delayMs);
  }

  const seen = new Set();
  const uniqueResults = results.filter(record => {
    const key = record.websiteUrl.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  const emailCount = uniqueResults.filter(row => row.email).length;
  const phoneCount = uniqueResults.filter(row => row.phone).length;
  const report = {
    inputCount: urls.length,
    successfulCount: uniqueResults.length,
    failedCount: errors.length,
    duplicateRecordsRemoved: results.length - uniqueResults.length,
    recordsWithEmail: emailCount,
    recordsWithPhone: phoneCount,
    completedAt: new Date().toISOString()
  };

  return { results: uniqueResults, errors, report };
}
