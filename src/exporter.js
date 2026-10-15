import fs from 'node:fs/promises';
import path from 'node:path';

const fields = [
  'companyName', 'websiteUrl', 'sourceUrl', 'email', 'phone',
  'description', 'socialProfiles', 'industryHints', 'extractedAt'
];

export async function exportResults(results, format = 'json', outputDir = 'output') {
  await fs.mkdir(outputDir, { recursive: true });
  const normalizedFormat = String(format).toLowerCase();
  if (!['json', 'csv'].includes(normalizedFormat)) {
    throw new Error('Export format must be csv or json.');
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const filePath = path.resolve(outputDir, `companies-${timestamp}.${normalizedFormat}`);

  if (normalizedFormat === 'json') {
    await fs.writeFile(filePath, `${JSON.stringify(results, null, 2)}\n`, 'utf8');
  } else {
    const escapeCsv = value => {
      const str = String(value ?? '');
      return /[",\n\r]/.test(str) ? `"${str.replace(/"/g, '""')}"` : str;
    };
    const lines = [
      fields.join(','),
      ...results.map(row => fields.map(field => escapeCsv(row[field])).join(','))
    ];
    await fs.writeFile(filePath, `${lines.join('\n')}\n`, 'utf8');
  }
  return filePath;
}
