import fs from 'node:fs';
import path from 'node:path';

const logDir = path.resolve('logs');
fs.mkdirSync(logDir, { recursive: true });
const logFile = path.join(logDir, 'scraper.log');

function write(level, message, details = {}) {
  const entry = JSON.stringify({
    timestamp: new Date().toISOString(),
    level,
    message,
    ...details
  });
  const line = `${entry}\n`;
  if (level === 'error') console.error(line.trim());
  else console.log(line.trim());
  fs.appendFileSync(logFile, line, 'utf8');
}

export const logger = {
  info: (message, details) => write('info', message, details),
  warn: (message, details) => write('warn', message, details),
  error: (message, details) => write('error', message, details)
};
