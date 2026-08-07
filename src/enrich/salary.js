/**
 * Salary / Pay Scale Extractor
 * Parses salary ranges, pay matrix levels, pay scales using regex.
 * Returns structured min/max/currency/level.
 */

import salaryData from '../../data/salaryPatterns.json' with { type: 'json' };
import { buildSearchCorpus, parseNumber, normalizeText } from './utils.js';

const PATTERNS = salaryData.patterns || {};
const CURRENCY = salaryData.currency || 'INR';
const SYMBOL = salaryData.symbol || '₹';

/**
 * Compile pattern arrays into RegExp objects.
 */
function compile(arr) {
  if (!Array.isArray(arr)) return [];
  return arr.map((p) => {
    try {
      return new RegExp(p, 'i');
    } catch {
      return null;
    }
  }).filter(Boolean);
}

const RE_PAY_LEVEL = compile(PATTERNS.payLevel);
const RE_PAY_SCALE = compile(PATTERNS.payScale);
const RE_MIN_MAX = compile(PATTERNS.minMax);
const RE_SINGLE = compile(PATTERNS.single);
const RE_7TH = compile(PATTERNS['7thCPC']);
const RE_BASIC = compile(PATTERNS.basicPay);

/**
 * Extract salary information from a scraped job.
 * @param {object} job
 * @returns {{
 *   min: number|null,
 *   max: number|null,
 *   currency: string,
 *   symbol: string,
 *   level: string|null,
 *   payScale: string|null,
 *   raw: string|null,
 *   is7thCPC: boolean
 * } | null}
 */
export function extractSalary(job) {
  const corpus = buildSearchCorpus(job);
  const text = `${job?.title || ''} ${job?.short_info || ''} ${corpus}`;

  if (!text.trim()) return null;

  let min = null;
  let max = null;
  let level = null;
  let payScale = null;
  let raw = null;
  let is7thCPC = false;

  // Pay Level (7th CPC matrix)
  for (const re of RE_PAY_LEVEL) {
    const m = text.match(re);
    if (m && m[1]) {
      level = `Level ${m[1]}`;
      raw = m[0];
      break;
    }
  }

  // 7th CPC flag
  for (const re of RE_7TH) {
    if (re.test(text)) {
      is7thCPC = true;
      break;
    }
  }

  // Pay Scale range (e.g. 5200-20200)
  for (const re of RE_PAY_SCALE) {
    const m = text.match(re);
    if (m && m[1] && m[2]) {
      const a = parseNumber(m[1]);
      const b = parseNumber(m[2]);
      if (a != null && b != null) {
        min = Math.min(a, b);
        max = Math.max(a, b);
        payScale = `${SYMBOL}${min.toLocaleString('en-IN')} - ${SYMBOL}${max.toLocaleString('en-IN')}`;
        raw = m[0];
        break;
      }
    }
  }

  // Generic min-max salary
  if (min == null) {
    for (const re of RE_MIN_MAX) {
      const m = text.match(re);
      if (m && m[1] && m[2]) {
        const a = parseNumber(m[1]);
        const b = parseNumber(m[2]);
        if (a != null && b != null && a > 1000 && b > 1000) {
          min = Math.min(a, b);
          max = Math.max(a, b);
          raw = m[0];
          break;
        }
      }
    }
  }

  // Single salary value
  if (min == null) {
    for (const re of RE_SINGLE) {
      const m = text.match(re);
      if (m && m[1]) {
        const v = parseNumber(m[1]);
        if (v != null && v > 1000) {
          min = v;
          max = v;
          raw = m[0];
          break;
        }
      }
    }
  }

  // Basic pay
  if (min == null) {
    for (const re of RE_BASIC) {
      const m = text.match(re);
      if (m && m[1]) {
        const v = parseNumber(m[1]);
        if (v != null && v > 1000) {
          min = v;
          raw = m[0];
          break;
        }
      }
    }
  }

  // Nothing useful found
  if (min == null && max == null && !level) return null;

  return {
    min: min != null ? Math.round(min) : null,
    max: max != null ? Math.round(max) : null,
    currency: CURRENCY,
    symbol: SYMBOL,
    level,
    payScale,
    raw: raw ? normalizeText(raw) : null,
    is7thCPC,
  };
}

export default { extractSalary };
