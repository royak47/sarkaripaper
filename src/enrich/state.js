/**
 * State / Region Extractor
 * Detects All India, states, and Union Territories with aliases (UP, MP, WB, etc.).
 */

import statesData from '../../data/states.json' with { type: 'json' };
import {
  normalizeText,
  buildSearchCorpus,
  confidenceFromType,
  compilePatterns,
  uniqueBy,
} from './utils.js';

const STATES = statesData.states || [];

const COMPILED = STATES.map((s) => ({
  ...s,
  _patterns: compilePatterns(s.patterns || []),
  _aliasSet: new Set((s.aliases || []).map((a) => normalizeText(a))),
  _nameNorm: normalizeText(s.name || ''),
}));

/**
 * Extract states / regions from a scraped job.
 * @param {object} job
 * @returns {{ states: Array<{ id: string, name: string, type: string, confidence: number }>, confidence: number }}
 */
export function extractStates(job) {
  const corpus = buildSearchCorpus(job);
  const title = normalizeText(job?.title || '');
  const shortInfo = normalizeText(job?.short_info || '');
  const text = `${title} ${shortInfo} ${corpus}`;

  if (!text.trim()) {
    return { states: [], confidence: 0 };
  }

  const found = [];

  for (const st of COMPILED) {
    let matched = false;
    let conf = 0;

    // Prefer whole-word alias / short code matches (UP, MP, WB are high signal)
    for (const alias of st._aliasSet) {
      if (alias.length < 2) continue;
      // Short codes (2–3 chars) need stricter word boundary to avoid false positives
      const re =
        alias.length <= 3
          ? new RegExp(`\\b${escapeReg(alias)}\\b`, 'i')
          : new RegExp(escapeReg(alias), 'i');
      if (re.test(title) || re.test(shortInfo) || re.test(text)) {
        matched = true;
        conf = alias.length <= 3 ? confidenceFromType('exact') : confidenceFromType('alias');
        break;
      }
    }

    if (!matched) {
      for (const re of st._patterns) {
        if (re.test(text)) {
          matched = true;
          conf = confidenceFromType('pattern');
          break;
        }
      }
    }

    if (matched) {
      found.push({
        id: st.id,
        name: st.name,
        type: st.type || 'state',
        confidence: conf,
      });
    }
  }

  const unique = uniqueBy(
    found.sort((a, b) => b.confidence - a.confidence),
    (x) => x.id
  );

  // If "All India" is present, keep it and optionally other states
  // If only specific states, return them
  const overallConfidence =
    unique.length === 0 ? 0 : Math.max(...unique.map((s) => s.confidence));

  return {
    states: unique,
    confidence: overallConfidence,
  };
}

/**
 * Convenience: return just the state name strings.
 * @param {object} job
 * @returns {string[]}
 */
export function extractStateNames(job) {
  return extractStates(job).states.map((s) => s.name);
}

function escapeReg(str) {
  return String(str).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export default { extractStates, extractStateNames };
