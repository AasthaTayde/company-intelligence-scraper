import { scrapeUrls } from './scraper.js';
import { exportResults } from './exporter.js';

function readArgs(args) {
  const urls = [];
  let format = 'csv';
  let maxPages;
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--url') {
      if (!args[i + 1]) throw new Error('--url requires a URL.');
      urls.push(args[++i]);
    } else if (args[i] === '--format') {
      format = args[++i];
    } else if (args[i] === '--max-pages') {
      maxPages = Number(args[++i]);
    } else if (args[i] === '--help') {
      console.log('Usage: npm run scrape -- --url https://example.com [--url https://another.example] [--format csv|json] [--max-pages 10]');
      process.exit(0);
    } else {
      throw new Error(`Unknown argument: ${args[i]}`);
    }
  }
  return { urls, format, maxPages };
}

try {
  const args = readArgs(process.argv.slice(2));
  const { results, errors, report } = await scrapeUrls(args.urls, { maxPages: args.maxPages });
  const file = await exportResults(results, args.format);
  console.log('\nScrape report:', JSON.stringify(report, null, 2));
  console.log(`Output saved to: ${file}`);
  if (errors.length) console.error(`Some URLs failed. See logs/scraper.log for details.`);
  if (!results.length) process.exitCode = 1;
} catch (error) {
  console.error(`Error: ${error.message}`);
  console.error('Run npm run scrape -- --help for usage.');
  process.exitCode = 1;
}
