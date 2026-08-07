/**
 * Department / Organization Extractor
 * Detects major Indian government organizations, commissions, forces, PSUs.
 * Uses aliases, abbreviations, regex patterns, keyword matching and confidence scoring.
 */

import departmentsData from '../../data/departments.json' with { type: 'json' };
import {
  normalizeText,
  buildSearchCorpus,
  confidenceFromType,
  compilePatterns,
  tokenSimilarity,
  uniqueBy,
} from './utils.js';

const DEPARTMENTS = departmentsData.departments || [];

// Pre-compile patterns once at module load for performance
const COMPILED = DEPARTMENTS.map((d) => ({
  ...d,
  _patterns: compilePatterns(d.patterns || []),
  _aliasSet: new Set((d.aliases || []).map((a) => normalizeText(a))),
  _shortNorm: normalizeText(d.short || ''),
  _nameNorm: normalizeText(d.name || ''),
}));

/**
 * Extract department / organization from a scraped job.
 * @param {object} job - Scraped job detail object
 * @returns {{ department: string, organization: string, category: string, confidence: number, id: string } | null}
 */
export function extractDepartment(job) {
  const corpus = buildSearchCorpus(job);
  const title = normalizeText(job?.title || '');
  const shortInfo = normalizeText(job?.short_info || '');
  const combined = `${title} ${shortInfo} ${corpus}`;

  if (!combined.trim()) {
    return null;
  }

  const candidates = [];

  for (const dept of COMPILED) {
    let bestType = null;
    let bestScore = 0;

    // 1. Exact short-name match in title (highest signal)
    if (dept._shortNorm && title.includes(dept._shortNorm)) {
      // Prefer whole-word style matches
      const wordRe = new RegExp(`\\b${escapeReg(dept._shortNorm)}\\b`, 'i');
      if (wordRe.test(title)) {
        bestType = 'exact';
        bestScore = confidenceFromType('exact', 0.02);
      }
    }

    // 2. Alias exact / substring in title or short_info
    if (!bestType) {
      for (const alias of dept._aliasSet) {
        if (alias.length < 2) continue;
        if (title.includes(alias) || shortInfo.includes(alias)) {
          const wordRe = new RegExp(`\\b${escapeReg(alias)}\\b`, 'i');
          if (wordRe.test(title) || wordRe.test(shortInfo)) {
            bestType = 'alias';
            bestScore = confidenceFromType('alias');
            break;
          }
        }
      }
    }

    // 3. Regex patterns against combined corpus
    if (!bestType || bestScore < 0.9) {
      for (const re of dept._patterns) {
        if (re.test(combined)) {
          const score = confidenceFromType('pattern');
          if (score > bestScore) {
            bestType = 'pattern';
            bestScore = score;
          }
          break;
        }
      }
    }

    // 4. Keyword / full name fuzzy fallback (lower confidence)
    if (!bestType) {
      const nameSim = tokenSimilarity(dept._nameNorm, title);
      if (nameSim >= 0.6) {
        bestType = 'fuzzy';
        bestScore = confidenceFromType('fuzzy', nameSim * 0.15);
      } else if (combined.includes(dept._nameNorm) && dept._nameNorm.length > 8) {
        bestType = 'keyword';
        bestScore = confidenceFromType('keyword');
      }
    }

    if (bestType && bestScore >= 0.55) {
      candidates.push({
        id: dept.id,
        department: dept.short || dept.name,
        organization: dept.name,
        category: dept.category || 'Other',
        confidence: bestScore,
        _type: bestType,
      });
    }
  }

  if (candidates.length === 0) return null;

  // Prefer higher confidence; on tie prefer matches that appeared in title
  candidates.sort((a, b) => {
    if (b.confidence !== a.confidence) return b.confidence - a.confidence;
    const aInTitle = title.includes(normalizeText(a.department)) ? 1 : 0;
    const bInTitle = title.includes(normalizeText(b.department)) ? 1 : 0;
    return bInTitle - aInTitle;
  });

  const best = candidates[0];
  return {
    id: best.id,
    department: best.department,
    organization: best.organization,
    category: best.category,
    confidence: best.confidence,
  };
}

/**
 * Return all matching departments above a confidence threshold (for multi-org posts).
 * @param {object} job
 * @param {number} minConfidence
 * @returns {Array}
 */
export function extractAllDepartments(job, minConfidence = 0.7) {
  const corpus = buildSearchCorpus(job);
  const title = normalizeText(job?.title || '');
  const shortInfo = normalizeText(job?.short_info || '');
  const combined = `${title} ${shortInfo} ${corpus}`;
  const results = [];

  for (const dept of COMPILED) {
    let matched = false;
    let score = 0;

    if (dept._shortNorm) {
      const wordRe = new RegExp(`\\b${escapeReg(dept._shortNorm)}\\b`, 'i');
      if (wordRe.test(title) || wordRe.test(shortInfo)) {
        matched = true;
        score = confidenceFromType('exact');
      }
    }

    if (!matched) {
      for (const re of dept._patterns) {
        if (re.test(combined)) {
          matched = true;
          score = confidenceFromType('pattern');
          break;
        }
      }
    }

    if (matched && score >= minConfidence) {
      results.push({
        id: dept.id,
        department: dept.short || dept.name,
        organization: dept.name,
        category: dept.category || 'Other',
        confidence: score,
      });
    }
  }

  return uniqueBy(results, (r) => r.id);
}

function escapeReg(str) {
  return String(str).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export default { extractDepartment, extractAllDepartments };
