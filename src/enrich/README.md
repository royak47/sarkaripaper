# Sarkari Result Data Enrichment Engine

Production-ready, modular enrichment layer that sits on top of the existing Sarkari Result scraper.

**No AI APIs · No paid services · Rule / regex / keyword based · Cloudflare Workers compatible · Zero runtime dependencies**

## Architecture

```
Sarkari Result
      ↓
   Scraper (existing worker.js)
      ↓
 Notification Parser (scraper detail)
      ↓
 Enrichment Engine (src/enrich/*)
      ↓
 Structured JSON + SEO
      ↓
   Frontend
```

## Folder Structure

```
src/enrich/
  department.js      # Org / commission / force detection
  qualification.js   # Education requirements
  state.js           # States & UTs (+ All India)
  salary.js          # Pay scale / level / min-max
  vacancy.js         # Total + post-wise + category-wise
  selectionProcess.js
  jobType.js         # Permanent / Contract / Apprentice …
  examType.js        # Central / State / Railway / Banking …
  tags.js            # SEO tags
  slug.js            # Clean URL slugs
  metadata.js        # Title, description, OG, Twitter, JSON-LD
  utils.js           # Shared helpers
  index.js           # Public API: enrichJob / enrichListings
  __tests__/
    run-tests.js

data/
  departments.json
  qualifications.json
  states.json
  examTypes.json
  jobTypes.json
  salaryPatterns.json
  selectionPatterns.json
```

## Public API

### `enrichJob(job, options?)`

Takes the raw object returned by `SarkariScraper.scrapeDetail()` and returns:

```json
{
  "title": "SSC CGL 2026 Online Form",
  "description": "…",
  "department": {
    "id": "ssc",
    "department": "SSC",
    "organization": "Staff Selection Commission",
    "category": "Central Government",
    "confidence": 0.98
  },
  "qualification": [
    { "id": "graduate", "name": "Graduate", "level": 7, "confidence": 0.85 }
  ],
  "states": [
    { "id": "all-india", "name": "All India", "type": "national", "confidence": 0.9 }
  ],
  "salary": {
    "min": 25500,
    "max": 81100,
    "currency": "INR",
    "symbol": "₹",
    "level": "Level 4",
    "payScale": null,
    "raw": "…",
    "is7thCPC": true
  },
  "vacancy": {
    "total": 7500,
    "posts": [
      { "post_name": "Assistant Section Officer", "total": 2000, "eligibility": "Graduate" }
    ],
    "byCategory": { "UR": 3000, "OBC": 2000 }
  },
  "selectionProcess": [
    { "id": "cbt", "name": "Computer Based Test", "order": 1, "confidence": 0.85 }
  ],
  "jobType": "Permanent",
  "examType": "Central Government",
  "tags": ["SSC", "CGL", "Graduate", "2026", "Government Job"],
  "slug": "ssc-cgl-2026",
  "seo": {
    "title": "…",
    "description": "…",
    "keywords": ["…"],
    "canonical": "https://sarkaripaper.com/job/ssc-cgl-2026",
    "openGraph": { … },
    "twitter": { … },
    "breadcrumb": [ … ],
    "jsonLd": [ … ]
  },
  "_meta": {
    "departmentId": "ssc",
    "examTypeId": "central",
    "jobTypeId": "permanent",
    "stateIds": ["all-india"],
    "qualificationIds": ["graduate"],
    "confidence": { … }
  }
}
```

### `enrichListings(listings, options?)`

Lightweight enrichment for homepage / section listing cards (title-only signals).

## HTTP Endpoints (Worker)

| Endpoint | Behaviour |
|----------|-----------|
| `GET /api/job/{slug}` | Original scraper output (unchanged) |
| `GET /api/job/{slug}?enrich=1` | Fully enriched |
| `GET /api/enriched/job/{slug}` | Always enriched |
| `GET /api/jobs?section=latestjob&enrich=1` | Enriched listings |
| `GET /api/enriched/jobs?section=…` | Always enriched listings |
| `GET /api/search?q=BPSC&enrich=1` | Enriched search results |

Original endpoints without `enrich` keep their previous response shape for backward compatibility.

## Design Principles

1. **Modular** – each extractor is an independent ES module with its own data file.
2. **Reusable** – import any single extractor or the full `enrichJob` pipeline.
3. **High performance** – patterns compiled once at module load; pure synchronous CPU work after the HTML is already fetched.
4. **Confidence scores** – every match reports a 0–1 confidence so the frontend can filter or display quality signals.
5. **Extensible** – add a new organisation by appending one object to `data/departments.json`; no code change required.
6. **Cloudflare Workers ready** – ES modules + JSON import attributes, zero Node-only APIs.

## Running Tests

```bash
npm test
# or
node src/enrich/__tests__/run-tests.js
```

All 60 unit tests must pass before deployment.

## Adding a New Department

1. Open `data/departments.json`.
2. Append:

```json
{
  "id": "new-org",
  "name": "Full Official Name",
  "short": "SHORT",
  "aliases": ["short", "full name", "other alias"],
  "category": "Central Government",
  "patterns": ["\\bshort\\b", "full\\s*name"]
}
```

3. Re-run tests. No code changes needed.

## Adding a New Qualification / State / Exam Type

Same pattern – edit the corresponding JSON file under `data/`.

## Deployment

```bash
npx wrangler deploy
```

Requires `wrangler.toml` (provided) and Cloudflare account credentials.
