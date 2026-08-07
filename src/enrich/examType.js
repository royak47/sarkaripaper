/**
 * Exam / Sector Type Detector
 * Central, State, Railway, Police, Teaching, Banking, Defence, PSU, Court, etc.
 */

import examTypesData from '../../data/examTypes.json' with { type: 'json' };
import {
  normalizeText,
  buildSearchCorpus,
  confidenceFromType,
  compilePatterns,
} from './utils.js';

const EXAM_TYPES = examTypesData.examTypes || [];

const COMPILED = EXAM_TYPES.map((e) => ({
  ...e,
  _patterns: compilePatterns(e.patterns || []),
  _aliasSet: new Set((e.aliases || []).map((a) => normalizeText(a))),
}));

/**
 * Detect primary exam / sector type.
 * @param {object} job
 * @param {object|null} department - Optional pre-extracted department for stronger signal
 * @returns {{ id: string, name: string, confidence: number } | null}
 */
export function extractExamType(job, department = null) {
  // Strong signal from department category
  if (department && department.category) {
    const catMap = {
      'Central Government': 'central',
      'State Government': 'state',
      Railway: 'railway',
      Banking: 'banking',
      Defence: 'defence',
      PSU: 'psu',
      Medical: 'medical',
      University: 'university',
      Police: 'police',
    };
    const mapped = catMap[department.category];
    if (mapped) {
      const et = COMPILED.find((e) => e.id === mapped);
      if (et) {
        return {
          id: et.id,
          name: et.name,
          confidence: Math.min(0.95, (department.confidence || 0.8) + 0.05),
        };
      }
    }
  }

  const corpus = buildSearchCorpus(job);
  const title = normalizeText(job?.title || '');
  const text = `${title} ${job?.short_info || ''} ${corpus}`;

  if (!text.trim()) return null;

  const candidates = [];

  for (const et of COMPILED) {
    let conf = 0;
    let matched = false;

    for (const re of et._patterns) {
      if (re.test(text)) {
        matched = true;
        conf = confidenceFromType('pattern');
        if (re.test(title)) conf = Math.min(1, conf + 0.08);
        break;
      }
    }

    if (!matched) {
      for (const alias of et._aliasSet) {
        const wordRe = new RegExp(`\\b${escapeReg(alias)}\\b`, 'i');
        if (wordRe.test(title)) {
          matched = true;
          conf = confidenceFromType('alias');
          break;
        }
      }
    }

    if (matched) {
      candidates.push({
        id: et.id,
        name: et.name,
        confidence: conf,
      });
    }
  }

  if (candidates.length === 0) return null;

  candidates.sort((a, b) => b.confidence - a.confidence);
  return candidates[0];
}

function escapeReg(str) {
  return String(str).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export default { extractExamType };
