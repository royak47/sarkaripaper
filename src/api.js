/**
 * API client — defaults to D1-backed Worker.
 * Override with VITE_API_BASE at build time.
 */
const API_BASE =
  (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_API_BASE) ||
  'https://sarkari-api-d1-zip.sonukalakhari76.workers.dev';

async function getJson(path) {
  const url = `${API_BASE}${path}`;
  const res = await fetch(url);
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`API ${res.status}: ${path} ${text.slice(0, 120)}`);
  }
  return res.json();
}

export function fetchHomepage() {
  return getJson('/api/homepage');
}

export function fetchSection(section) {
  return getJson(`/api/jobs?section=${encodeURIComponent(section)}`);
}

export function fetchDetail(slug, _urlIgnored) {
  // D1: slug is enough — no ?url= needed
  return getJson(`/api/job/${encodeURIComponent(slug)}`);
}

export function fetchSearch(query) {
  return getJson(`/api/search?q=${encodeURIComponent(query)}`);
}

export function fetchClosingSoon(days = 7) {
  return getJson(`/api/closing-soon?days=${days}`);
}

export { API_BASE };
