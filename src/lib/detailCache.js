/**
 * Session-level cache + limited concurrency for detail fetches.
 * Used only for Closing Soon / deadline sections (real last-date fields).
 */
import { fetchDetail } from '../api';
import { getLastApplyDate, daysUntil } from './dates';

const CACHE_KEY = 'sp:detail-cache:v1';
const MAX_AGE_MS = 30 * 60 * 1000; // 30 min

function readCache() {
  try {
    const raw = sessionStorage.getItem(CACHE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    const now = Date.now();
    const out = {};
    for (const [k, v] of Object.entries(parsed)) {
      if (v && now - v.ts < MAX_AGE_MS) out[k] = v;
    }
    return out;
  } catch {
    return {};
  }
}

function writeCache(map) {
  try {
    sessionStorage.setItem(CACHE_KEY, JSON.stringify(map));
  } catch { /* quota */ }
}

async function mapPool(items, concurrency, fn) {
  const results = new Array(items.length);
  let i = 0;
  async function worker() {
    while (i < items.length) {
      const idx = i++;
      try {
        results[idx] = await fn(items[idx], idx);
      } catch {
        results[idx] = null;
      }
    }
  }
  const workers = Array.from({ length: Math.min(concurrency, items.length) }, () => worker());
  await Promise.all(workers);
  return results;
}

/**
 * Enrich listing items with last-apply date from detail API (cached).
 * @param {Array} listings - items with slug / sarkari_link
 * @param {object} opts
 * @param {number} opts.limit - max items to resolve
 * @param {number} opts.concurrency
 * @returns {Promise<Array>} listings with _lastDate, _daysLeft attached when known
 */
export async function resolveDeadlines(listings, opts = {}) {
  const limit = opts.limit ?? 24;
  const concurrency = opts.concurrency ?? 4;
  const slice = (listings || []).slice(0, limit);
  const cache = readCache();

  const resolved = await mapPool(slice, concurrency, async (item) => {
    if (!item?.slug) return { ...item };
    const cached = cache[item.slug];
    if (cached?.data) {
      const last = getLastApplyDate(cached.data);
      const days = daysUntil(last);
      return {
        ...item,
        _detail: cached.data,
        _lastDate: last,
        _daysLeft: days,
        _lastDateRaw: cached.data?.dates?.['Last Date Apply Online'] || null,
      };
    }
    try {
      const data = await fetchDetail(item.slug, item.sarkari_link, true);
      cache[item.slug] = { ts: Date.now(), data };
      const last = getLastApplyDate(data);
      const days = daysUntil(last);
      return {
        ...item,
        _detail: data,
        _lastDate: last,
        _daysLeft: days,
        _lastDateRaw: data?.dates?.['Last Date Apply Online'] || null,
        // merge enrichment if listing lacked it
        department: item.department || data.department,
        qualification: item.qualification || data.qualification,
        states: item.states || data.states,
        salary: item.salary || data.salary,
        vacancy: item.vacancy || data.vacancy,
        jobType: item.jobType || data.jobType,
        examType: item.examType || data.examType,
        tags: item.tags || data.tags,
      };
    } catch {
      return { ...item };
    }
  });

  writeCache(cache);
  return resolved.filter(Boolean);
}

/**
 * Filter items closing within `withinDays` (inclusive), sort nearest first.
 */
export function filterClosingSoon(items, withinDays = 7) {
  return (items || [])
    .filter((i) => i._daysLeft != null && i._daysLeft >= 0 && i._daysLeft <= withinDays)
    .sort((a, b) => a._daysLeft - b._daysLeft);
}

/**
 * Filter by deadline window and sort ascending by last date.
 */
export function filterByDeadlineWindow(items, maxDays) {
  return (items || [])
    .filter((i) => i._daysLeft != null && i._daysLeft >= 0 && i._daysLeft <= maxDays)
    .sort((a, b) => a._daysLeft - b._daysLeft);
}
