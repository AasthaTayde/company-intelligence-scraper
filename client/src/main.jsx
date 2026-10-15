import React, { useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import './style.css';

const DEFAULT_URLS = 'https://example.com';

function asList(value) {
  if (Array.isArray(value)) {
    return value.filter((item) => item != null && item !== '').map(String);
  }
  if (typeof value === 'string' && value.trim()) {
    return [value.trim()];
  }
  return [];
}

function textValue(value, fallback = '—') {
  if (value == null || value === '') return fallback;
  if (Array.isArray(value)) return value.length ? value.join(', ') : fallback;
  if (typeof value === 'object') return Object.values(value).filter(Boolean).join(', ') || fallback;
  return String(value);
}

function downloadFile(content, filename, type) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function csvCell(value) {
  const text = Array.isArray(value)
    ? value.join(', ')
    : value && typeof value === 'object'
      ? JSON.stringify(value)
      : value == null
        ? ''
        : String(value);
  return `"${text.replace(/"/g, '""')}"`;
}

function App() {
  const [urls, setUrls] = useState(DEFAULT_URLS);
  const [format, setFormat] = useState('csv');
  const [results, setResults] = useState([]);
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const rows = useMemo(() => {
    if (!Array.isArray(results)) return [];

    return results.map((item, index) => {
      const row = item && typeof item === 'object' ? item : {};
      return {
        ...row,
        _id: row.id || row.websiteUrl || row.sourceUrl || index,
        companyName: textValue(row.companyName || row.name, 'Unknown company'),
        websiteUrl: textValue(row.websiteUrl || row.website || row.sourceUrl),
        sourceUrl: textValue(row.sourceUrl || row.websiteUrl || row.website),
        email: textValue(row.email || row.emails),
        phone: textValue(row.phone || row.phones),
        description: textValue(row.description),
        industryHints: asList(row.industryHints || row.industry),
        socialProfiles: asList(row.socialProfiles),
      };
    });
  }, [results]);

  const metrics = {
    companies: rows.length,
    emails: rows.filter((row) => row.email !== '—').length,
    phones: rows.filter((row) => row.phone !== '—').length,
    socials: rows.filter((row) => row.socialProfiles.length > 0).length,
  };

  async function runScraper(event) {
    event.preventDefault();

    const inputUrls = urls.split(/[\n,]+/).map((url) => url.trim()).filter(Boolean);

    if (!inputUrls.length) {
      setError('Enter at least one company website URL.');
      setNotice('');
      return;
    }

    const invalid = inputUrls.filter((url) => {
      try {
        return !['http:', 'https:'].includes(new URL(url).protocol);
      } catch {
        return true;
      }
    });

    if (invalid.length) {
      setError(`Enter valid URLs starting with https:// or http://. Invalid: ${invalid.join(', ')}`);
      setNotice('');
      return;
    }

    setLoading(true);
    setError('');
    setNotice('');

    try {
      const response = await fetch('/api/scrape', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ urls: inputUrls, format: 'json' }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.error || data.message || `Request failed (${response.status}).`);
      }

      const records = Array.isArray(data.results)
        ? data.results
        : Array.isArray(data.data)
          ? data.data
          : [];

      setResults(records);
      setReport(data.report || null);
      setNotice(records.length
        ? `Scraping completed: ${records.length} result(s) received.`
        : 'The request completed, but no company records were returned.');
    } catch (err) {
      setError(err instanceof TypeError
        ? 'Could not connect to the API. Check that the backend is running on port 3000.'
        : err.message || 'An unexpected scraping error occurred.');
    } finally {
      setLoading(false);
    }
  }

  function exportResults() {
    if (!rows.length) {
      setError('Run the scraper before exporting results.');
      setNotice('');
      return;
    }

    setError('');
    setNotice('');

    const stamp = new Date().toISOString().replace(/[:.]/g, '-');

    if (format === 'json') {
      const cleanRows = rows.map(({ _id, ...record }) => record);
      downloadFile(JSON.stringify(cleanRows, null, 2), `company-intelligence-${stamp}.json`, 'application/json;charset=utf-8');
    } else {
      const fields = [
        ['companyName', 'Company Name'],
        ['websiteUrl', 'Website'],
        ['sourceUrl', 'Source URL'],
        ['email', 'Email'],
        ['phone', 'Phone'],
        ['description', 'Description'],
        ['industryHints', 'Industry'],
        ['socialProfiles', 'Social Profiles'],
      ];

      const csv = [
        fields.map(([, label]) => csvCell(label)).join(','),
        ...rows.map((row) => fields.map(([key]) => csvCell(row[key])).join(',')),
      ].join('\r\n');

      downloadFile('\uFEFF' + csv, `company-intelligence-${stamp}.csv`, 'text/csv;charset=utf-8');
    }

    setNotice(`${format.toUpperCase()} export prepared.`);
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark">CI</div>
          <div>
            <strong>Company Intel</strong>
            <span>RESEARCH WORKSPACE</span>
          </div>
        </div>

        <div className="side-label">WORKSPACE</div>
        <div className="nav-item active"><span>◈</span> Website scraper</div>
        <div className="nav-item"><span>▤</span> Export results</div>

        <div className="sidebar-bottom">
          <span className="status-dot" />
          <div>
            <strong>Scraper workspace</strong>
            <small>Public company data</small>
          </div>
          <span className="online">ONLINE</span>
        </div>
      </aside>

      <div className="main-panel">
        <header className="topbar">
          <div className="breadcrumb">WORKSPACE <span>/</span> <strong>Company scraper</strong></div>
          <div className="top-right">
            <div className="environment">LOCAL ENVIRONMENT</div>
            <div className="avatar">CI</div>
          </div>
        </header>

        <main className="content">
          <div className="eyebrow"><span className="eyebrow-line" /> COMPANY RESEARCH / DATA EXTRACTION</div>

          <div className="hero-row">
            <div>
              <h1>Company Intelligence <span>Scraper</span></h1>
              <p className="subtitle">Extract structured company information from publicly accessible websites.</p>
            </div>
            <div className="hero-icon">⌘</div>
          </div>

          <section className="metrics">
            <div className="metric-card">
              <div className="metric-top"><span>COMPANIES FOUND</span><i>◈</i></div>
              <strong>{metrics.companies}</strong>
              <small>Company records collected</small>
            </div>
            <div className="metric-card">
              <div className="metric-top"><span>PUBLIC EMAILS</span><i>✉</i></div>
              <strong>{metrics.emails}</strong>
              <small>Records with an email</small>
            </div>
            <div className="metric-card">
              <div className="metric-top"><span>PHONE NUMBERS</span><i>⌕</i></div>
              <strong>{metrics.phones}</strong>
              <small>Records with a phone</small>
            </div>
            <div className="metric-card">
              <div className="metric-top"><span>SOCIAL PROFILES</span><i>◎</i></div>
              <strong>{metrics.socials}</strong>
              <small>Records with social links</small>
            </div>
          </section>

          <section className="panel">
            <div className="section-heading">
              <div>
                <span className="step">01</span>
                <div>
                  <h2>Company website URLs</h2>
                  <p>Enter one website per line, or separate URLs with commas.</p>
                </div>
              </div>
              <span className="badge">PUBLIC DATA ONLY</span>
            </div>

            <form onSubmit={runScraper}>
              <label htmlFor="website-urls">WEBSITE URLS</label>
              <textarea
                id="website-urls"
                value={urls}
                onChange={(event) => setUrls(event.target.value)}
                placeholder={'https://example.com\nhttps://www.python.org'}
                rows={4}
                disabled={loading}
              />
              <div className="input-hint"><span>ⓘ</span> Use full URLs including https://</div>

              <div className="controls">
                <div className="format-control">
                  <label htmlFor="export-format">EXPORT FORMAT</label>
                  <select id="export-format" value={format} onChange={(event) => setFormat(event.target.value)}>
                    <option value="csv">CSV (.csv)</option>
                    <option value="json">JSON (.json)</option>
                  </select>
                </div>
                <button className="run-button" type="submit" disabled={loading}>
                  {loading ? <><span className="spinner" /> Scraping…</> : <>Run Scraper <span>→</span></>}
                </button>
              </div>
            </form>

            {error && <div className="error-message" role="alert">{error}</div>}
            {notice && !error && <div className="report-strip" role="status">{notice}</div>}
          </section>

          <section className="panel results-panel">
            <div className="results-header">
              <div>
                <span className="step">02</span>
                <div>
                  <h2>Extracted company results</h2>
                  <p>Review extracted details and export the records.</p>
                </div>
              </div>
              <button className="export-button" type="button" onClick={exportResults} disabled={!rows.length}>
                ↓ Export {format.toUpperCase()}
              </button>
            </div>

            {report && (
              <div className="report-strip">
                Successful: {report.successfulCount ?? rows.length}
                <span>•</span> Failed: {report.failedCount ?? 0}
                <span>•</span> Duplicates removed: {report.duplicateRecordsRemoved ?? 0}
              </div>
            )}

            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>COMPANY</th>
                    <th>WEBSITE</th>
                    <th>EMAIL</th>
                    <th>PHONE</th>
                    <th>INDUSTRY</th>
                    <th>DESCRIPTION</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="empty-cell">
                        <div className="empty-icon">⌕</div>
                        <strong>No company results yet</strong>
                        <span>Enter a website above and run the scraper to get started.</span>
                      </td>
                    </tr>
                  ) : rows.map((row, index) => (
                    <tr key={`${row._id}-${index}`}>
                      <td><strong>{row.companyName}</strong></td>
                      <td>
                        {row.websiteUrl !== '—'
                          ? <a href={row.websiteUrl} target="_blank" rel="noreferrer">{row.websiteUrl}</a>
                          : '—'}
                      </td>
                      <td>{row.email}</td>
                      <td>{row.phone}</td>
                      <td>
                        <div className="tags">
                          {row.industryHints.length
                            ? row.industryHints.map((industry, i) => <span className="tag" key={`${industry}-${i}`}>{industry}</span>)
                            : <span className="muted">—</span>}
                        </div>
                      </td>
                      <td><small>{row.description}</small></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="table-footer">
              <span>{rows.length} record(s)</span>
              <span>Company Intelligence Scraper</span>
            </div>
          </section>

          <footer>COMPANY INTELLIGENCE SCRAPER <span>•</span> PUBLIC WEBSITE DATA</footer>
        </main>
      </div>
    </div>
  );
}

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
