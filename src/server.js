import express from 'express';
import cors from 'cors';
import { config } from './config.js';
import { scrapeUrls } from './scraper.js';
import { exportResults } from './exporter.js';
import { logger } from './logger.js';

const app = express();
app.use(cors());
app.use(express.json({ limit: '1mb' }));

app.get('/', (_req, res) => {
  res.json({
    name: 'Company Intelligence Scraper',
    status: 'running',
    endpoints: {
      health: 'GET /api/health',
      scrape: 'POST /api/scrape'
    }
  });
});

app.get('/api/health', (_req, res) => res.json({ status: 'ok' }));

app.post('/api/scrape', async (req, res) => {
  try {
    const { urls, format = 'json', maxPages } = req.body || {};
    if (!Array.isArray(urls) || urls.length === 0) {
      return res.status(400).json({ error: 'Body must include a non-empty urls array.' });
    }
    const output = await scrapeUrls(urls, { maxPages });
    let outputFile = null;
    if (['csv', 'json'].includes(String(format).toLowerCase())) {
      outputFile = await exportResults(output.results, format);
    } else {
      return res.status(400).json({ error: 'format must be csv or json.' });
    }
    logger.info('Scrape job completed', output.report);
    return res.json({ ...output, outputFile });
  } catch (error) {
    logger.error('Scrape request failed', { error: error.message });
    return res.status(400).json({ error: error.message });
  }
});

app.listen(config.port, () => {
  logger.info('Server started', { port: config.port });
});
