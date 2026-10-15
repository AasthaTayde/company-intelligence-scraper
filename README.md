# Company Intelligence Scraper

A Node.js web-scraping application that collects publicly visible company information from supplied website URLs and exports the results to CSV or JSON. The project includes a React/Vite frontend, an Express REST API, input validation, structured logging, error handling, and automated tests.

## Features

### Core Features

- Accepts one or more website URLs through the web interface, REST API, and CLI if configured.
- Validates and normalizes HTTP/HTTPS URLs.
- Extracts company and website names, website URLs, source URLs, public email addresses, phone links, descriptions, social profiles, and basic industry keyword hints when available.
- Exports scraped records to CSV and JSON.
- Handles scraping errors and reports unsuccessful URLs.
- Provides structured application logs.
- Reports scraping statistics, including successful and failed records.
- Removes duplicate website records where applicable.
- Includes automated tests using Node.js's built-in test runner.

### Additional Features

- Configurable URL/page limits where supported.
- Configurable request timeout, user agent, and delay where supported.
- REST API health-check endpoint.
- React-based user interface for submitting URLs and viewing results.
- Frontend and backend input validation.

## Technology Stack

- **Backend:** Node.js, Express
- **HTTP requests:** Axios
- **HTML parsing:** Cheerio
- **Frontend:** React, Vite
- **Testing:** Node.js built-in test runner (`node:test`)
- **Output formats:** CSV and JSON

## Project Structure

```text
company-intelligence-scraper/
├── src/
│   └── server.js
├── client/
│   ├── index.html
│   ├── package.json
│   └── src/
│       ├── main.jsx
│       └── style.css
├── tests/                 # Test directory name may vary
├── output/                # Generated exports, if configured
├── logs/                  # Application logs, if configured
├── package.json
├── package-lock.json
└── README.md
```

## Prerequisites

- Node.js 18 or newer
- npm
- A modern web browser
- Git, if cloning or submitting through GitHub

## Installation

### 1. Install backend dependencies

Open a terminal in the project's root directory:

```bash
npm install
```

### 2. Install frontend dependencies

```bash
cd client
npm install
```

## Running the Application

Run the backend and frontend in separate terminals.

### 1. Start the backend

From the project root:

```bash
npm start
```

The backend runs on port `3000` by default.

### 2. Start the frontend

Open a second terminal:

```bash
cd client
npm run dev
```

Open the local URL printed by Vite. It is typically:

```text
http://localhost:5173
```

Keep both terminals running while using the application.

## Using the Web Interface

1. Open the frontend in your browser.
2. Enter one or more website URLs.
3. Select the desired output format, CSV or JSON.
4. Start the scraping operation.
5. Review the returned company information and any validation or scraping errors.
6. Download the generated output file.

Use complete website URLs where possible, for example:

```text
https://example.com
https://www.python.org/
https://www.wikipedia.org/
```

Example websites are useful for functional testing, but they may not contain real company contact details.

## REST API

### Health Check

**Endpoint:** `GET /api/health`

Check whether the backend is running:

```bash
curl http://localhost:3000/api/health
```

### Scrape Websites

**Endpoint:** `POST /api/scrape`

**Content-Type:** `application/json`

Example request body:

```json
{
  "urls": [
    "https://example.com",
    "https://www.iana.org"
  ],
  "format": "json",
  "maxPages": 10
}
```

Example request using curl:

```bash
curl -X POST http://localhost:3000/api/scrape \
  -H "Content-Type: application/json" \
  -d '{"urls":["https://example.com"],"format":"json"}'
```

Use `"format": "csv"` to request CSV output if supported by the current implementation.

The response contains scraping results and, depending on the implementation, error details, quality statistics, and the output file path.

### HTTP Status Codes

| Status code | Meaning |
|---|---|
| `200 OK` | The request was processed successfully |
| `400 Bad Request` | The request contains invalid input, such as an invalid URL |
| `404 Not Found` | The requested API endpoint does not exist |
| `500 Internal Server Error` | An unexpected server-side error occurred |

The exact response format and status codes depend on the backend implementation.

## Extracted Data Fields

| Field | Description |
|---|---|
| `companyName` | Company or website name inferred from page content and metadata |
| `websiteUrl` | Canonical website origin |
| `sourceUrl` | URL of the page used for extraction |
| `email` | Public email address or addresses, when available |
| `phone` | Public telephone links, when available |
| `description` | Website description extracted from metadata or page content |
| `socialProfiles` | Recognized social or developer profile links |
| `industryHints` | Keyword-based industry hints; not verified classifications |
| `extractedAt` | UTC timestamp when the record was extracted |

Fields that are not available on a website may be empty or represented by a placeholder in the user interface.

## Export Formats

### CSV

CSV output represents records in a tabular format and can be opened using Microsoft Excel or compatible spreadsheet applications.

### JSON

JSON output stores records as structured objects and arrays. It can be opened in a text editor or JSON viewer.

Example JSON structure:

```json
[
  {
    "companyName": "Example Domain",
    "websiteUrl": "https://example.com",
    "sourceUrl": "https://example.com/",
    "email": "—",
    "phone": "—",
    "description": "Example website description",
    "socialProfiles": [],
    "industryHints": [],
    "extractedAt": "2026-10-15T06:53:02.035Z"
  }
]
```

This example illustrates the output structure; actual extracted values depend on the website being scraped.

## Input Validation and Error Handling

- The frontend displays validation messages for invalid input.
- The backend validates submitted URLs.
- Invalid URLs should be rejected with an appropriate client-error response. The invalid URL test performed during development returned HTTP `400`.
- Scraping errors should be reported without exposing unnecessary internal details to users.
- Where supported, individual URL failures should not prevent processing of other valid URLs in the same batch.

## Logging and Data Quality

The application uses structured logs for scraping activity. When configured, logs are written to:

```text
logs/scraper.log
```

Log entries may include:

- Scraping started
- Scraping succeeded
- Scraping failed
- Number of input URLs
- Number of successful and failed records
- Duplicate records removed
- Records containing email or phone details
- Completion timestamp

Log output and file locations depend on the current configuration.

## Automated Tests

Run the test suite from the project root:

```bash
npm test
```

The current test suite contains eight tests covering:

- Extraction of company metadata and public contact links
- Description extraction when metadata is missing
- Industry keyword hints
- Websites without public contact details
- GitHub and developer profile links
- URL normalization
- Invalid URL rejection
- Email normalization

**Verified during development:** All eight tests passed, with zero failures.

If a syntax-check script is configured in the root `package.json`, run it using:

```bash
npm run check
```

## Design Decisions and Limitations

- **Static HTML parsing:** Cheerio is suitable for parsing static HTML. Some JavaScript-rendered websites may require a browser automation tool.
- **Seed URLs:** The application accepts supplied website URLs. Search-query-based company discovery requires a search provider or API if it is not already implemented.
- **Best-effort extraction:** Websites use different layouts and may not publish contact information. Missing values should not be guessed.
- **Industry hints:** Keyword matches are indicative and are not authoritative industry classifications.
- **Duplicate handling:** Successful records may be deduplicated by website origin.
- **Website restrictions:** Scraping behavior depends on website availability, access restrictions, and applicable terms.

## Responsible Use and Security

- Scrape only websites you are authorized to access.
- Respect applicable website terms and robots.txt guidance.
- Do not bypass authentication, access controls, or anti-abuse protections.
- Validate URLs on the backend as well as the frontend.
- For production use, restrict requests to safe public destinations and block loopback, private-network, and other restricted IP addresses to reduce server-side request forgery (SSRF) risks.
- Use request timeouts and reasonable delays to avoid excessive traffic.

## Future Improvements

- Integrate an authorized search API for query-based company discovery.
- Add browser automation for permitted JavaScript-rendered pages.
- Support configurable extraction selectors.
- Add bounded, same-domain crawling.
- Add enrichment using authorized company-data APIs.
- Expand automated tests for batch failures, export formats, and API status codes.

## License

Add the license required by your assignment or chosen for this project, if applicable.
