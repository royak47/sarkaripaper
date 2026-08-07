/**
 * Sarkari Result Data Enrichment Engine
 * --------------------------------------
 * Production-ready, modular, Cloudflare Workers compatible.
 *
 * Takes raw scraper output and produces a fully structured, SEO-ready job object.
 *
 * Usage:
 *   import { enrichJob, enrichListings } from './enrich/index.js';
 *   const enriched = enrichJob(scrapedDetail);
 */

import { extractDepartment } from './department.js';
import { extractQualifications } from './qualification.js';
import { extractStates } from './state.js';
import { extractSalary } from './salary.js';
import { extractVacancy } from './vacancy.js';
import { extractSelectionProcess } from './selectionProcess.js';
import { extractJobType } from './jobType.js';
import { extractExamType } from './examType.js';
import { generateTags } from './tags.js';
import { generateSlug } from './slug.js';
import { generateSeo } from './metadata.js';
import { cleanDisplayText } from './utils.js';

/**
 * Enrich a single scraped job detail object.
 *
 * @param {object} job - Output of SarkariScraper.scrapeDetail()
 * @param {object} [options]
 * @param {string} [options.baseUrl] - Site base URL for canonical / OG links
 * @param {Set<string>} [options.existingSlugs] - For slug de-duplication
 * @returns {object} Fully enriched job object matching the required schema
 */
export function enrichJob(job, options = {}) {
  if (!job || typeof job !== 'object') {
    throw new Error('enrichJob: job object is required');
  }

  // --- Core extractors (order matters for dependent signals) ---
  const department = extractDepartment(job);
  const qualification = extractQualifications(job);
  const statesResult = extractStates(job);
  const salary = extractSalary(job);
  const vacancy = extractVacancy(job);
  const selectionProcess = extractSelectionProcess(job);
  const jobType = extractJobType(job);
  const examType = extractExamType(job, department);

  // Intermediate enrichment bag used by tags / slug / seo
  const partial = {
    department,
    qualification,
    states: statesResult.states,
    salary,
    vacancy,
    selectionProcess,
    jobType,
    examType,
  };

  const tags = generateTags(job, partial);
  const slug = generateSlug(job, { ...partial, tags }, options.existingSlugs);

  const enrichedBase = {
    ...partial,
    tags,
    slug,
  };

  const seo = generateSeo(job, enrichedBase, { baseUrl: options.baseUrl });

  // Final structured output
  return {
    // Original core fields preserved / cleaned
    title: cleanDisplayText(job.title || ''),
    description: cleanDisplayText(job.short_info || job.description || ''),
    post_date: job.post_date || null,
    dates: job.dates || null,
    fees: job.fees || null,
    age_limit: job.age_limit || null,
    official_links: job.official_links || [],
    pdfs: job.pdfs || [],
    official_apply_link: job.official_apply_link || null,
    sarkari_link: job.sarkari_link || null,

    // Enrichment layer
    department: department || null,
    qualification: qualification || [],
    states: statesResult.states || [],
    salary: salary || null,
    vacancy: vacancy || { total: null, posts: [], byCategory: null },
    selectionProcess: selectionProcess || [],
    jobType: jobType ? jobType.name : null,
    examType: examType ? examType.name : null,
    tags: tags || [],
    slug,
    seo,

    // Extra machine-readable ids for filtering
    _meta: {
      departmentId: department?.id || null,
      examTypeId: examType?.id || null,
      jobTypeId: jobType?.id || null,
      stateIds: (statesResult.states || []).map((s) => s.id),
      qualificationIds: (qualification || []).map((q) => q.id),
      confidence: {
        department: department?.confidence ?? 0,
        states: statesResult.confidence ?? 0,
        jobType: jobType?.confidence ?? 0,
        examType: examType?.confidence ?? 0,
      },
    },
  };
}

/**
 * Enrich a list of lightweight listing items (from homepage / section scrape).
 * Listings typically only have title + sarkari_link + slug; we still extract
 * what we can from the title alone.
 *
 * @param {Array<object>} listings
 * @param {object} [options]
 * @returns {Array<object>}
 */
export function enrichListings(listings, options = {}) {
  if (!Array.isArray(listings)) return [];

  const existingSlugs = options.existingSlugs || new Set();

  return listings.map((item) => {
    // Synthesize a minimal job object so extractors can run on title
    const synthetic = {
      title: item.title || '',
      short_info: '',
      slug: item.slug || '',
      sarkari_link: item.sarkari_link || '',
      posts: [],
    };

    const department = extractDepartment(synthetic);
    const qualification = extractQualifications(synthetic);
    const statesResult = extractStates(synthetic);
    const examType = extractExamType(synthetic, department);
    const jobType = extractJobType(synthetic);

    const partial = {
      department,
      qualification,
      states: statesResult.states,
      examType,
      jobType,
    };

    const tags = generateTags(synthetic, partial);
    const slug = generateSlug(synthetic, { ...partial, tags }, existingSlugs);

    return {
      title: cleanDisplayText(item.title || ''),
      sarkari_link: item.sarkari_link || null,
      section: item.section || null,
      department: department || null,
      qualification: qualification || [],
      states: statesResult.states || [],
      examType: examType ? examType.name : null,
      jobType: jobType ? jobType.name : null,
      tags,
      slug,
    };
  });
}

// Re-export individual modules for advanced / custom usage
export {
  extractDepartment,
  extractQualifications,
  extractStates,
  extractSalary,
  extractVacancy,
  extractSelectionProcess,
  extractJobType,
  extractExamType,
  generateTags,
  generateSlug,
  generateSeo,
};

export default {
  enrichJob,
  enrichListings,
};
