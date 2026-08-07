/**
 * SEO Metadata Generator
 * Produces title, description, keywords, canonical, OpenGraph, Twitter,
 * breadcrumb and JSON-LD structured data.
 */

import { cleanDisplayText, extractYear } from './utils.js';

const SITE_NAME = 'Sarkari Paper';
const DEFAULT_BASE_URL = 'https://sarkaripaper.com';

/**
 * Build complete SEO package for a job.
 * @param {object} job - Original scraped job
 * @param {object} enrichment - Full enrichment result (must include slug, tags, department, etc.)
 * @param {object} [options]
 * @param {string} [options.baseUrl]
 * @returns {object}
 */
export function generateSeo(job, enrichment = {}, options = {}) {
  const baseUrl = (options.baseUrl || DEFAULT_BASE_URL).replace(/\/$/, '');
  const slug = enrichment.slug || job?.slug || 'job';
  const pageUrl = `${baseUrl}/job/${slug}`;

  const title = buildTitle(job, enrichment);
  const description = buildDescription(job, enrichment);
  const keywords = buildKeywords(job, enrichment);

  const ogImage = `${baseUrl}/og/default-job.png`;

  const breadcrumb = buildBreadcrumb(enrichment, baseUrl, pageUrl, title);
  const jsonLd = buildJsonLd(job, enrichment, {
    title,
    description,
    pageUrl,
    baseUrl,
  });

  return {
    title,
    description,
    keywords,
    canonical: pageUrl,
    openGraph: {
      title,
      description,
      url: pageUrl,
      type: 'article',
      site_name: SITE_NAME,
      image: ogImage,
      locale: 'en_IN',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      image: ogImage,
    },
    breadcrumb,
    jsonLd,
  };
}

function buildTitle(job, enrichment) {
  const raw = cleanDisplayText(job?.title || 'Government Job');
  // Keep under ~60–70 chars for SERP
  let t = raw.length > 65 ? raw.slice(0, 62).replace(/\s+\S*$/, '') + '…' : raw;
  if (!/recruitment|notification|vacancy|job/i.test(t)) {
    t = `${t} Recruitment`;
  }
  return `${t} | ${SITE_NAME}`;
}

function buildDescription(job, enrichment) {
  const parts = [];

  const title = cleanDisplayText(job?.title || 'Government Job');
  parts.push(`${title}.`);

  if (enrichment.department?.organization) {
    parts.push(`Apply for ${enrichment.department.organization} vacancies.`);
  }

  if (enrichment.vacancy?.total) {
    parts.push(`Total Posts: ${enrichment.vacancy.total}.`);
  }

  if (Array.isArray(enrichment.qualification) && enrichment.qualification.length) {
    const qs = enrichment.qualification.map((q) => q.name || q).slice(0, 3).join(', ');
    parts.push(`Qualification: ${qs}.`);
  }

  if (enrichment.salary?.min) {
    const sal =
      enrichment.salary.max && enrichment.salary.max !== enrichment.salary.min
        ? `${enrichment.salary.symbol || '₹'}${enrichment.salary.min.toLocaleString('en-IN')} - ${enrichment.salary.symbol || '₹'}${enrichment.salary.max.toLocaleString('en-IN')}`
        : `${enrichment.salary.symbol || '₹'}${enrichment.salary.min.toLocaleString('en-IN')}`;
    parts.push(`Salary: ${sal}.`);
  }

  if (job?.dates?.['Last Date Apply Online'] || job?.dates?.['Application Begin']) {
    const last = job.dates['Last Date Apply Online'];
    const begin = job.dates['Application Begin'];
    if (begin) parts.push(`Apply From: ${begin}.`);
    if (last) parts.push(`Last Date: ${last}.`);
  }

  let desc = parts.join(' ').replace(/\s+/g, ' ').trim();
  if (desc.length > 160) {
    desc = desc.slice(0, 157).replace(/\s+\S*$/, '') + '…';
  }
  if (desc.length < 50) {
    desc = `${title} – Check eligibility, vacancy, important dates and apply online at ${SITE_NAME}.`;
  }
  return desc;
}

function buildKeywords(job, enrichment) {
  const kws = new Set();

  if (Array.isArray(enrichment.tags)) {
    for (const t of enrichment.tags) kws.add(String(t).toLowerCase());
  }

  if (enrichment.department) {
    kws.add(String(enrichment.department.department || '').toLowerCase());
    kws.add(String(enrichment.department.organization || '').toLowerCase());
  }

  const year = extractYear(job?.title || '');
  if (year) {
    kws.add(`${year}`);
    kws.add(`government jobs ${year}`);
    kws.add(`sarkari naukri ${year}`);
  }

  kws.add('sarkari result');
  kws.add('government job');
  kws.add('sarkari naukri');
  kws.add('online form');
  kws.add('admit card');
  kws.add('result');

  return Array.from(kws)
    .filter((k) => k && k.length > 1)
    .slice(0, 20);
}

function buildBreadcrumb(enrichment, baseUrl, pageUrl, title) {
  const items = [
    { name: 'Home', url: baseUrl + '/' },
  ];

  if (enrichment.examType?.name) {
    items.push({
      name: enrichment.examType.name,
      url: `${baseUrl}/category/${(enrichment.examType.id || 'jobs').toLowerCase()}`,
    });
  } else if (enrichment.department?.category) {
    items.push({
      name: enrichment.department.category,
      url: `${baseUrl}/category/${String(enrichment.department.category).toLowerCase().replace(/\s+/g, '-')}`,
    });
  }

  items.push({ name: title.replace(/\s*\|\s*Sarkari Paper$/, ''), url: pageUrl });
  return items;
}

function buildJsonLd(job, enrichment, meta) {
  const { title, description, pageUrl, baseUrl } = meta;

  const jobPosting = {
    '@context': 'https://schema.org',
    '@type': 'JobPosting',
    title: cleanDisplayText(job?.title || title),
    description,
    datePosted: job?.post_date || undefined,
    hiringOrganization: {
      '@type': 'Organization',
      name: enrichment.department?.organization || enrichment.department?.department || 'Government of India',
    },
    jobLocation: {
      '@type': 'Place',
      address: {
        '@type': 'PostalAddress',
        addressCountry: 'IN',
        addressRegion:
          Array.isArray(enrichment.states) && enrichment.states.length
            ? enrichment.states.map((s) => (typeof s === 'string' ? s : s.name)).join(', ')
            : 'India',
      },
    },
    url: pageUrl,
    identifier: enrichment.slug || job?.slug,
  };

  if (enrichment.salary?.min) {
    jobPosting.baseSalary = {
      '@type': 'MonetaryAmount',
      currency: enrichment.salary.currency || 'INR',
      value: {
        '@type': 'QuantitativeValue',
        minValue: enrichment.salary.min,
        maxValue: enrichment.salary.max || enrichment.salary.min,
        unitText: 'MONTH',
      },
    };
  }

  if (job?.dates?.['Last Date Apply Online']) {
    jobPosting.validThrough = job.dates['Last Date Apply Online'];
  }

  if (enrichment.jobType?.name) {
    jobPosting.employmentType = mapEmploymentType(enrichment.jobType.name);
  }

  if (enrichment.vacancy?.total) {
    jobPosting.totalJobOpenings = enrichment.vacancy.total;
  }

  const breadcrumbList = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: (enrichment.seo?.breadcrumb || []).map((b, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: b.name,
      item: b.url,
    })),
  };

  // If breadcrumb not yet attached, build a minimal one
  if (!breadcrumbList.itemListElement.length) {
    breadcrumbList.itemListElement = [
      { '@type': 'ListItem', position: 1, name: 'Home', item: baseUrl + '/' },
      { '@type': 'ListItem', position: 2, name: title, item: pageUrl },
    ];
  }

  return [jobPosting, breadcrumbList];
}

function mapEmploymentType(name) {
  const n = String(name).toLowerCase();
  if (n.includes('part')) return 'PART_TIME';
  if (n.includes('contract') || n.includes('temporary')) return 'CONTRACTOR';
  if (n.includes('intern') || n.includes('apprentice')) return 'INTERN';
  return 'FULL_TIME';
}

export default { generateSeo };
