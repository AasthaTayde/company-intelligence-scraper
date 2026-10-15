import 'dotenv/config';

export const config = {
  port: Number(process.env.PORT || 3000),
  timeoutMs: Number(process.env.REQUEST_TIMEOUT_MS || 10000),
  delayMs: Number(process.env.REQUEST_DELAY_MS || 800),
  maxPages: Number(process.env.MAX_PAGES || 10),
  userAgent: process.env.USER_AGENT || 'CompanyIntelligenceScraper/1.0 (educational project)'
};
