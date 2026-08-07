/**
 * Job Type Detector
 * Permanent, Contract, Apprentice, Internship, Guest, Temporary, Part/Full Time, etc.
 */

import jobTypesData from '../../data/jobTypes.json' with { type: 'json' };
import {
  normalizeText,
  buildSearchCorpus,
  confidenceFromType,
  compilePatterns,
} from './utils.js';

const JOB_TYPES = jobTypesData.jobTypes || [];

const COMPILED = JOB_TYPES.map((j) => ({
  ...j,
  _patterns: compilePatterns(j.patterns || []),
  _aliasSet: new Set((j.aliases || []).map((a) => normalizeText(a))),
}));

/**
 * Detect primary job type.
 * @param {object} job
 * @returns {{ id: string, name: string, confidence: number } | null}
 */
export function extractJobType(job) {
  const corpus = buildSearchCorpus(job);
  const title = normalizeText(job?.title || '');
  const shortInfo = normalizeText(job?.short_info || '');
  const text = `${title} ${shortInfo} ${corpus}`;

  if (!text.trim()) return null;

  const candidates = [];

  for (const jt of COMPILED) {
    let conf = 0;
    let matched = false;

    for (const re of jt._patterns) {
      if (re.test(text)) {
        matched = true;
        conf = confidenceFromType('pattern');
        // Boost if found in title
        if (re.test(title)) conf = Math.min(1, conf + 0.08);
        break;
      }
    }

    if (!matched) {
      for (const alias of jt._aliasSet) {
        const wordRe = new RegExp(`\\b${escapeReg(alias)}\\b`, 'i');
        if (wordRe.test(title) || wordRe.test(shortInfo)) {
          matched = true;
          conf = confidenceFromType('alias');
          break;
        }
      }
    }

    if (matched) {
      candidates.push({
        id: jt.id,
        name: jt.name,
        confidence: conf,
      });
    }
  }

  if (candidates.length === 0) {
    // Default assumption for most government jobs
    return { id: 'permanent', name: 'Permanent', confidence: 0.4 };
  }

  candidates.sort((a, b) => b.confidence - a.confidence);
  return candidates[0];
}

function escapeReg(str) {
  return String(str).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export default { extractJobType };
