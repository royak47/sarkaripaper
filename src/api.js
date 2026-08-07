// Thin wrapper around the Cloudflare Worker scraper API.
// Set VITE_API_BASE in your environment (see .env.example) to point
// this at your own Worker deployment.
const API_BASE = import.meta.env.VITE_API_BASE || 'https://sarkariapi.sonukalakhari76.workers.dev';

async function getJson(path) {
  const res = await fetch(`${API_BASE}${path}`);
  if (!res.ok) throw new Error(`Request failed: ${res.status}`);
  return res.json();
}

export function fetchHomepage() {
  return getJson('/api/homepage');
}

export function fetchSection(section) {
  return getJson(`/api/jobs?section=${encodeURIComponent(section)}`);
}

export function fetchDetail(slug, url) {
  const qs = url ? `?url=${encodeURIComponent(url)}` : '';
  return getJson(`/api/job/${encodeURIComponent(slug)}${qs}`);
}

export function fetchSearch(query) {
  return getJson(`/api/search?q=${encodeURIComponent(query)}`);
}
