# Sarkari Paper — Frontend

Static website (HTML + CSS + JS). Koi React/npm build zaroori nahi.  
API se data leta hai: **Cloudflare Worker + D1**.

---

## Folder structure

```
pages-deploy/
├── index.html      # Entry page (SPA shell)
├── 404.html        # Same as index — GitHub/CF Pages fallback
├── app.js          # Saari logic: routes, API calls, UI
├── styles.css      # Design: colors, layout, mobile/PC
├── _redirects      # Netlify / Cloudflare: SPA routing
├── _headers        # Security headers (optional)
└── README.md       # Ye file
```

| File | Kaam |
|------|------|
| `index.html` | Page load, fonts, `app.js` + `styles.css` link |
| `app.js` | Routing (`#/`), homepage, section, detail, search, theme |
| `styles.css` | Top bar, 3-column boards, detail cards, dark mode |
| `404.html` | Unknown URL pe bhi same app (Pages ke liye) |
| `_redirects` | `/* → /index.html` (SPA) |

---

## Kaise chalta hai

```
Browser  →  index.html + app.js
                ↓
         API (Cloudflare Worker)
                ↓
              D1 DB  ←  scraper sync (cron)
                ↓
         Sarkari Result website
```

1. User site kholta hai → `app.js` load  
2. Hash route padhta hai: `#/`, `#/section/admitcard`, `#/job/slug`  
3. API call: `https://sarkari-api-d1-zip....workers.dev/api/...`  
4. HTML render (lists, detail boxes)

**Build step nahi** — files seedha host hoti hain.

---

## Routes (URL)

| Hash URL | Page |
|----------|------|
| `#/` | Home — Result \| Admit Card \| Latest Job (3 columns) |
| `#/section/latestjob` | Poori latest job list |
| `#/section/result` | Poori result list |
| `#/section/admitcard` | Poori admit card list |
| `#/section/admission` | Admission |
| `#/section/answerkey` | Answer key |
| `#/section/online` | New vacancy / online forms |
| `#/closing` | Last date soon (7 days) |
| `#/search` | Search + live suggestions |
| `#/job/{slug}` | Job detail (dates, fee, vacancy, links) |

---

## API endpoints (frontend use)

Base URL (`app.js` ke andar):

```js
const API = 'https://sarkari-api-d1-zip.sonukalakhari76.workers.dev';
```

| Call | Path |
|------|------|
| Homepage sections | `GET /api/jobs?section=result&limit=30` (admitcard, latestjob bhi) |
| Section full list | `GET /api/jobs?section=admitcard&limit=100` |
| Job detail | `GET /api/job/{slug}` |
| Search | `GET /api/search?q=SSB` |
| Closing soon | `GET /api/closing-soon?days=7` |
| Admin sync | `GET /api/admin/sync?section=admitcard&details=10` |

Sorting: **Post Date** (naya top — `08 August 2026` pehle, phir `07 August`…).

---

## UI features

- **Top bar:** Sarkari Paper · Search · Dark/Light · Menu  
- **Tabs:** Home, Latest Job, Result, New Vacancy, Admit Card, Admission, Last Date  
- **Home boards:** PC pe 3 columns; mobile pe stack  
- **NEW badge:** last 2 din ke posts  
- **Detail:** 2-column cards (Name, Date, Fee, Age, Vacancy, Links)  
- **Search suggest:** type karte hi niche suggestions  
- **Footer:** Made by Mitt Ydv · WhatsApp · Telegram  
- **About + FAQ** home / section ke neeche  

---

## Local test

Koi install nahi:

```bash
# Python
cd pages-deploy
python3 -m http.server 8080

# ya Node
npx serve .
```

Browser: `http://localhost:8080`

---

## Deploy

### Cloudflare Pages

1. Ye files upload / Git push  
2. Settings:
   - **Build command:** (khali)  
   - **Output directory:** `/` ya `dist` (jahan ye files hain)  
   - **Framework:** None  
3. `package.json` is folder mein **mat** rakho — warna npm install chalega  

### GitHub Pages

- Branch pe ye files root ya `/docs`  
- SPA ke liye `404.html` = `index.html` (pehle se hai)  

### Netlify

- Drag-drop folder  
- `_redirects` already: `/*  /index.html  200`  

---

## API base badalna

`app.js` line ~1:

```js
const API = 'https://YOUR-WORKER.workers.dev';
```

Save → re-upload `app.js`.

---

## Naye posts kab aate hain?

Frontend **khud scrape nahi** karta.  
Worker **cron / admin sync** DB update karta hai → refresh pe naya data dikhta hai.

```
Cron (e.g. */5 * * * *)  →  scrape Sarkari Result  →  D1  →  site
```

Manual sync:

```
https://YOUR-WORKER.workers.dev/api/admin/sync?section=admitcard&details=10
```

---

## Customization cheatsheet

| Badalna ho | File | Kahan |
|------------|------|--------|
| Colors / layout | `styles.css` | `:root { --primary: ... }` |
| Tabs | `app.js` | `TABS = [...]` |
| API URL | `app.js` | `const API = ...` |
| Footer / WhatsApp | `app.js` | `renderShell()` → footer |
| About / FAQ text | `app.js` | `aboutHtml()` |
| Home boards order | `app.js` | `pageHome()` → `board(...)` |

---

## Related

| Part | Repo / zip |
|------|------------|
| Frontend (ye) | `pages-deploy` |
| API Worker + D1 | `sarkari-api` / `sarkari-api-rank-fix.zip` |

API ke bina lists khali dikhengi (network error).

---

**Made by Mitt Ydv · Sarkari Paper**
