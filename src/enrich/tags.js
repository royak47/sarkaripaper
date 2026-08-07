/**
 * Smart Tags Generator
 * Produces SEO-friendly tags from department, qualification, state, salary,
 * exam type, job type, vacancy and free-text signals.
 */

import { normalizeText, extractYear, uniqueBy, slugify } from './utils.js';

/**
 * Generate tags for a job using enrichment results + original text.
 * @param {object} job - Original scraped job
 * @param {object} enrichment - Partial enrichment object (department, qualification, etc.)
 * @returns {string[]}
 */
export function generateTags(job, enrichment = {}) {
  const tags = new Set();

  const add = (t) => {
    if (!t) return;
    const clean = String(t).trim();
    if (clean.length < 2 || clean.length > 60) return;
    tags.add(clean);
  };

  // Department / org
  if (enrichment.department) {
    add(enrichment.department.department);
    add(enrichment.department.organization);
    add(enrichment.department.category);
  }

  // Qualifications
  if (Array.isArray(enrichment.qualification)) {
    for (const q of enrichment.qualification) {
      add(q.name || q);
    }
  }

  // States
  if (Array.isArray(enrichment.states)) {
    for (const s of enrichment.states) {
      add(typeof s === 'string' ? s : s.name);
    }
  }

  // Job type & exam type
  if (enrichment.jobType) {
    add(typeof enrichment.jobType === 'string' ? enrichment.jobType : enrichment.jobType.name);
  }
  if (enrichment.examType) {
    add(typeof enrichment.examType === 'string' ? enrichment.examType : enrichment.examType.name);
  }

  // Selection process stages
  if (Array.isArray(enrichment.selectionProcess)) {
    for (const s of enrichment.selectionProcess) {
      add(typeof s === 'string' ? s : s.name);
    }
  }

  // Salary level
  if (enrichment.salary?.level) {
    add(enrichment.salary.level);
    add('7th CPC');
  }

  // Vacancy signal
  if (enrichment.vacancy?.total) {
    add(`${enrichment.vacancy.total} Vacancies`);
  }

  // Year from title
  const year = extractYear(job?.title || '') || extractYear(job?.short_info || '');
  if (year) {
    add(String(year));
    add(`Jobs ${year}`);
  }

  // Common high-value keywords extracted from title
  const title = job?.title || '';
  const keywordPatterns = [
    /\b(constable|si|sub[\s-]?inspector|asi|head[\s-]?constable)\b/i,
    /\b(clerk|steno|stenographer|typist|data[\s-]?entry)\b/i,
    /\b(junior[\s-]?engineer|je|assistant[\s-]?engineer|ae)\b/i,
    /\b(teacher|tgt|pgt|prt|lecturer|professor)\b/i,
    /\b(nurse|staff[\s-]?nurse|gnm|anm)\b/i,
    /\b(officer|manager|assistant|executive)\b/i,
    /\b(technician|mechanic|fitter|electrician)\b/i,
    /\b(driver|conductor)\b/i,
    /\b(forest[\s-]?guard|ranger|patwari|lekhpal)\b/i,
    /\b(po|probationary[\s-]?officer|so|specialist[\s-]?officer)\b/i,
    /\b(cgl|chsl|mts|gd|cpo|steno)\b/i,
    /\b(ntpc|group[\s-]?d|alp|technician)\b/i,
    /\b(agniveer|soldier|airman|sailor)\b/i,
    /\b(admit[\s-]?card|result|answer[\s-]?key|notification)\b/i,
  ];

  for (const re of keywordPatterns) {
    const m = title.match(re);
    if (m) add(m[1].replace(/[\s-]+/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()));
  }

  // Generic useful tags
  add('Government Job');
  add('Sarkari Naukri');
  if (enrichment.examType?.id === 'central' || enrichment.department?.category === 'Central Government') {
    add('Central Government Job');
  }
  if (enrichment.examType?.id === 'state' || enrichment.department?.category === 'State Government') {
    add('State Government Job');
  }

  // Convert to array, dedupe case-insensitively, limit size
  const list = uniqueBy(
    Array.from(tags).map((t) => t.trim()),
    (t) => normalizeText(t)
  );

  // Prefer shorter, more specific tags first; hard limit for SEO
  return list
    .sort((a, b) => a.length - b.length)
    .slice(0, 25);
}

export default { generateTags };
