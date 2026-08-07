/**
 * Clean URL Slug Generator
 * Produces SEO-friendly, collision-resistant slugs such as:
 *   ssc-cgl-2026, rrb-technician-2026, rajasthan-police-constable
 */

import { slugify, extractYear, normalizeText } from './utils.js';

/**
 * Generate a primary slug for a job.
 * @param {object} job - Scraped job
 * @param {object} enrichment - Enrichment results (department, states, etc.)
 * @param {Set<string>} [existingSlugs] - Optional set of already-used slugs for de-duplication
 * @returns {string}
 */
export function generateSlug(job, enrichment = {}, existingSlugs = null) {
  const parts = [];

  // 1. Department short name
  if (enrichment.department?.department) {
    parts.push(slugify(enrichment.department.department));
  }

  // 2. Key exam / post keywords from title
  const title = job?.title || '';
  const cleanedTitle = title
    .replace(/\b(20[2-3]\d)\b/g, '') // year handled separately
    .replace(/\b(notification|recruitment|online\s*form|apply\s*online|vacancy|post)\b/gi, '')
    .trim();

  // Extract meaningful tokens
  const stop = new Set([
    'the', 'and', 'for', 'of', 'in', 'to', 'a', 'an', 'on', 'at', 'by', 'with',
    'from', 'under', 'over', 'job', 'jobs', 'recruitment', 'notification',
    'online', 'form', 'apply', 'vacancy', 'vacancies', 'post', 'posts',
  ]);

  const tokens = slugify(cleanedTitle)
    .split('-')
    .filter((t) => t.length > 1 && !stop.has(t));

  // Prefer distinctive tokens (exam names, ranks)
  const preferred = tokens.filter((t) =>
    /^(cgl|chsl|mts|cpo|gd|ntpc|alp|constable|clerk|po|so|je|ae|si|asi|teacher|tgt|pgt|nurse|technician|officer|assistant|manager|steno|driver)$/i.test(t)
  );

  if (preferred.length > 0) {
    parts.push(...preferred.slice(0, 3));
  } else {
    parts.push(...tokens.slice(0, 4));
  }

  // 3. State (if not All India and not already implied)
  if (Array.isArray(enrichment.states)) {
    const specific = enrichment.states.find(
      (s) => (s.id || s) !== 'all-india' && (s.type || '') !== 'national'
    );
    if (specific) {
      const stateSlug = slugify(typeof specific === 'string' ? specific : specific.name);
      if (stateSlug && !parts.includes(stateSlug)) {
        // Put state near the front for state-level jobs
        parts.unshift(stateSlug);
      }
    }
  }

  // 4. Year
  const year = extractYear(title) || extractYear(job?.short_info || '');
  if (year) parts.push(String(year));

  // Build and clean
  let slug = parts
    .filter(Boolean)
    .map((p) => slugify(p))
    .filter(Boolean)
    .join('-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');

  // Fallback from original sarkari slug if generation failed
  if (!slug || slug.length < 3) {
    const fallback = job?.slug || slugify(title) || 'job';
    slug = fallback.replace(/[^a-z0-9-]/g, '').replace(/-+/g, '-').replace(/^-|-$/g, '') || 'job';
  }

  // Hard length limit
  if (slug.length > 80) {
    slug = slug.slice(0, 80).replace(/-$/, '');
  }

  // De-duplicate against existing set
  if (existingSlugs instanceof Set) {
    let candidate = slug;
    let n = 2;
    while (existingSlugs.has(candidate)) {
      candidate = `${slug}-${n}`;
      n += 1;
    }
    existingSlugs.add(candidate);
    return candidate;
  }

  return slug;
}

export default { generateSlug };
