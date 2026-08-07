/**
 * Selection Process Parser
 * Detects ordered stages: Written/CBT, PET, PST, Skill, Interview, Medical, DV, etc.
 */

import selectionData from '../../data/selectionPatterns.json' with { type: 'json' };
import {
  normalizeText,
  buildSearchCorpus,
  confidenceFromType,
  compilePatterns,
  uniqueBy,
} from './utils.js';

const STAGES = selectionData.stages || [];

const COMPILED = STAGES.map((s) => ({
  ...s,
  _patterns: compilePatterns(s.patterns || []),
  _aliasSet: new Set((s.aliases || []).map((a) => normalizeText(a))),
}));

/**
 * Extract ordered selection process stages.
 * @param {object} job
 * @returns {Array<{ id: string, name: string, order: number, confidence: number }>}
 */
export function extractSelectionProcess(job) {
  const corpus = buildSearchCorpus(job);
  const text = normalizeText(`${job?.title || ''} ${job?.short_info || ''} ${corpus}`);

  if (!text) return [];

  const found = [];

  for (const stage of COMPILED) {
    let matched = false;
    let conf = 0;

    for (const re of stage._patterns) {
      if (re.test(text)) {
        matched = true;
        conf = confidenceFromType('pattern');
        break;
      }
    }

    if (!matched) {
      for (const alias of stage._aliasSet) {
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
        id: stage.id,
        name: stage.name,
        order: stage.order || 99,
        confidence: conf,
      });
    }
  }

  const unique = uniqueBy(
    found.sort((a, b) => b.confidence - a.confidence),
    (x) => x.id
  );

  // Return in logical process order
  return unique.sort((a, b) => a.order - b.order);
}

/**
 * Return just the stage name strings in order.
 * @param {object} job
 * @returns {string[]}
 */
export function extractSelectionProcessNames(job) {
  return extractSelectionProcess(job).map((s) => s.name);
}

function escapeReg(str) {
  return String(str).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export default { extractSelectionProcess, extractSelectionProcessNames };
