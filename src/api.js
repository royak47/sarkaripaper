/**
 * Cloudflare Worker scraper API client.
 * Set VITE_API_BASE to your Worker URL.
 */
const API_BASE = import.meta.env.VITE_API_BASE || 'https://sarkariapi.sonukalakhari76.workers.dev';

async function getJson(path) {
  const res = await fetch(`${API_BASE}${path}`);
  if (!res.ok) throw new Error(`Request failed: ${res.status}`);
  return res.json();
}

export function fetchHomepage(enrich = false) {
  return getJson(`/api/homepage${enrich ? '?enrich=1' : ''}`);
}

export function fetchSection(section, enrich = false) {
  const q = enrich ? '&enrich=1' : '';
  return getJson(`/api/jobs?section=${encodeURIComponent(section)}${q}`);
}

export function fetchDetail(slug, url, enrich = true) {
  const params = new URLSearchParams();
  if (url) params.set('url', url);
  if (enrich) params.set('enrich', '1');
  const qs = params.toString() ? `?${params}` : '';
  return getJson(`/api/job/${encodeURIComponent(slug)}${qs}`);
}

export function fetchSearch(query, enrich = false) {
  const q = enrich ? '&enrich=1' : '';
  return getJson(`/api/search?q=${encodeURIComponent(query)}${q}`);
}

export { API_BASE };
