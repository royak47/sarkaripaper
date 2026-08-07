/**
 * Qualification Extractor
 * Detects educational qualifications from job text (5th, 10th, Graduate, BTech, etc.).
 * Returns an ordered array of matched qualifications.
 */

import qualificationsData from '../../data/qualifications.json' with { type: 'json' };
import {
  normalizeText,
  buildSearchCorpus,
  confidenceFromType,
  compilePatterns,
  uniqueBy,
} from './utils.js';

const QUALIFICATIONS = qualificationsData.qualifications || [];

const COMPILED = QUALIFICATIONS.map((q) => ({
  ...q,
  _patterns: compilePatterns(q.patterns || []),
  _aliasSet: new Set((q.aliases || []).map((a) => normalizeText(a))),
  _nameNorm: normalizeText(q.name || ''),
}));

// Sort by level descending so more specific / higher qualifications are preferred when overlapping
const BY_LEVEL_DESC = [...COMPILED].sort((a, b) => (b.level || 0) - (a.level || 0));

/**
 * Extract qualifications from a scraped job.
 * @param {object} job
 * @returns {Array<{ id: string, name: string, level: number, confidence: number }>}
 */
export function extractQualifications(job) {
  const corpus = buildSearchCorpus(job);
  const title = normalizeText(job?.title || '');
  const eligibilityParts = [];

  if (Array.isArray(job?.posts)) {
    for (const p of job.posts) {
      if (p.eligibility) eligibilityParts.push(p.eligibility);
    }
  }

  // Prefer eligibility text; fall back to full corpus
  const primaryText = eligibilityParts.length
    ? eligibilityParts.join(' ')
    : `${title} ${job?.short_info || ''} ${corpus}`;

  const text = normalizeText(primaryText);
  if (!text) return [];

  const found = [];

  for (const q of BY_LEVEL_DESC) {
    let matched = false;
    let conf = 0;

    // Pattern match first (most reliable)
    for (const re of q._patterns) {
      if (re.test(text)) {
        matched = true;
        conf = confidenceFromType('pattern');
        break;
      }
    }

    // Alias whole-word match
    if (!matched) {
      for (const alias of q._aliasSet) {
        if (alias.length < 2) continue;
        const wordRe = new RegExp(`\\b${escapeReg(alias)}\\b`, 'i');
        if (wordRe.test(text)) {
          matched = true;
          conf = confidenceFromType('alias');
          break;
        }
      }
    }

    if (matched) {
      found.push({
        id: q.id,
        name: q.name,
        level: q.level || 0,
        confidence: conf,
      });
    }
  }

  // Deduplicate by id, keep highest confidence
  const unique = uniqueBy(
    found.sort((a, b) => b.confidence - a.confidence),
    (x) => x.id
  );

  // Sort by education level ascending (basic → advanced) for display
  return unique.sort((a, b) => a.level - b.level);
}

/**
 * Return a simple string array of qualification names (for tags / filters).
 * @param {object} job
 * @returns {string[]}
 */
export function extractQualificationNames(job) {
  return extractQualifications(job).map((q) => q.name);
}

function escapeReg(str) {
  return String(str).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export default { extractQualifications, extractQualificationNames };
