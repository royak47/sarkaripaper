# Sarkari Paper — React Frontend

Vite + React + React Router frontend for your Cloudflare Worker scraper API.
Mobile aur desktop dono ke liye responsive hai, aur "Saved" (bookmark) feature
localStorage ke saath already built-in hai.

## Local development

```bash
npm install
cp .env.example .env
# .env me apna Worker URL daal do (VITE_API_BASE)
npm run dev
```

## Deploy — Cloudflare Pages

1. Is folder ko GitHub repo me push karo (ya seedha Cloudflare Pages ke
   "Direct Upload" se `npm run build` ka `dist/` folder upload kar sakte ho).
2. Cloudflare Pages me naya project banao:
   - **Build command:** `npm run build`
   - **Build output directory:** `dist`
3. Project Settings → Environment Variables me add karo:
   - `VITE_API_BASE` = `https://sarkariapi.sonukalakhari76.workers.dev` (ya jo bhi tumhara Worker URL hai)
4. Deploy — `public/_redirects` already included hai, isliye client-side
   routing (`/section/latestjob`, `/job/some-slug` seedha URL se open karna)
   Cloudflare Pages par bina 404 ke kaam karega.

## Project structure

```
src/
  api.js            # Worker API calls
  sections.js        # category labels/icons/colors (frontend-owned)
  hooks/useBookmarks.js
  components/         # Header, TabBar, NoticeCard, filters, skeletons...
  pages/               # Home, Section, Detail, Search, Saved
  styles.css           # design tokens + all styling
```

Routes:
- `/` — homepage (latest jobs + category preview + browse tiles)
- `/section/:key` — full list for one category, with age filter
- `/job/:slug` — detail page ("dossier")
- `/search?q=...` — search results
- `/saved` — bookmarked notices

## Notice board fix

The Worker's `/api/homepage` endpoint only ever fills the `latestjob`
section — every other category comes back empty on that endpoint. The
old vanilla-JS frontend was reading those empty arrays, which is what
caused stale/duplicate items to appear to repeat under every category.
The React `Home` page now makes a few small parallel calls to
`/api/jobs?section=...` for a real preview of each category, and
de-duplicates by `slug` across every section it renders.

## Optional: Supabase sync for "Saved"

By default, saved/bookmarked notices live in `localStorage` (per device,
zero setup). If you want them to sync across devices, swap
`src/hooks/useBookmarks.js`'s `readAll`/`writeAll` for Supabase calls:

```sql
create table bookmarks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null,
  slug text not null,
  title text not null,
  section text,
  sarkari_link text,
  created_at timestamptz default now(),
  unique (user_id, slug)
);
```

```js
// src/hooks/useBookmarks.js — replace readAll/writeAll with:
import { supabase } from '../supabaseClient';

async function readAll() {
  const { data } = await supabase.from('bookmarks').select('*');
  return data || [];
}

async function writeOne(item) {
  await supabase.from('bookmarks').upsert({ ...item, user_id: /* current user id */ });
}
```

This needs Supabase Auth wired up for a `user_id` (email/OTP login is
simplest for an Indian job-portal audience). Happy to build that out if
you want it — just say the word.
