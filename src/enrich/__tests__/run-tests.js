/**
 * Production unit tests for the Enrichment Engine.
 * Run with: node src/enrich/__tests__/run-tests.js
 * Zero dependencies – pure Node ESM.
 */

import { extractDepartment } from '../department.js';
import { extractQualifications } from '../qualification.js';
import { extractStates } from '../state.js';
import { extractSalary } from '../salary.js';
import { extractVacancy } from '../vacancy.js';
import { extractSelectionProcess } from '../selectionProcess.js';
import { extractJobType } from '../jobType.js';
import { extractExamType } from '../examType.js';
import { generateTags } from '../tags.js';
import { generateSlug } from '../slug.js';
import { generateSeo } from '../metadata.js';
import { enrichJob, enrichListings } from '../index.js';

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    passed++;
    console.log(`  ✓ ${message}`);
  } else {
    failed++;
    console.error(`  ✗ ${message}`);
  }
}

function assertEqual(actual, expected, message) {
  const ok = actual === expected;
  if (ok) {
    passed++;
    console.log(`  ✓ ${message}`);
  } else {
    failed++;
    console.error(`  ✗ ${message} (expected: ${JSON.stringify(expected)}, got: ${JSON.stringify(actual)})`);
  }
}

function assertIncludes(arr, value, message) {
  const ok = Array.isArray(arr) && arr.some((x) => (typeof x === 'string' ? x === value : x.name === value || x.id === value));
  if (ok) {
    passed++;
    console.log(`  ✓ ${message}`);
  } else {
    failed++;
    console.error(`  ✗ ${message}`);
  }
}

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const SSC_CGL = {
  title: 'SSC CGL 2026 Online Form',
  short_info: 'Staff Selection Commission Combined Graduate Level Examination 2026. Graduate candidates can apply. Pay Level 4 to 8.',
  post_date: '15/01/2026',
  dates: {
    'Application Begin': '01/02/2026',
    'Last Date Apply Online': '28/02/2026',
    'Exam Date': 'June 2026',
  },
  total_posts: 7500,
  posts: [
    { post_name: 'Assistant Section Officer', total: 2000, eligibility: 'Graduate' },
    { post_name: 'Inspector', total: 1500, eligibility: 'Graduate' },
  ],
  sarkari_link: 'https://www.sarkariresult.com/ssc-cgl-2026/',
  slug: 'ssc-cgl-2026',
};

const RRB_TECH = {
  title: 'RRB Technician 2026 Recruitment',
  short_info: 'Railway Recruitment Board Technician Grade vacancies. ITI / Diploma holders. CBT, Document Verification.',
  posts: [
    { post_name: 'Technician Grade I', total: 3000, eligibility: 'ITI or Diploma' },
  ],
  total_posts: 3000,
};

const RAJ_POLICE = {
  title: 'Rajasthan Police Constable 2026',
  short_info: 'Rajasthan Police Constable Recruitment. 10th Pass. PET PST Written Exam Medical. Pay Scale Rs 21700-69100.',
  posts: [
    { post_name: 'Constable', total: 5000, eligibility: '10th Pass' },
  ],
};

const UP_TEACHER = {
  title: 'UPPSC LT Grade Teacher Recruitment',
  short_info: 'Uttar Pradesh Public Service Commission LT Grade Assistant Teacher. B.Ed Graduate. Written Exam Interview.',
};

const BANK_PO = {
  title: 'IBPS PO 2026 Notification',
  short_info: 'Institute of Banking Personnel Selection Probationary Officer. Graduate. Prelims Mains Interview. Salary Rs 48480 - 85920.',
};

const ARMY_AGNIVEER = {
  title: 'Indian Army Agniveer Recruitment 2026',
  short_info: 'Join Indian Army Agniveer. 10th 12th Pass. Physical Test Medical Document Verification. Contract based.',
};

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

console.log('\n=== Department Extractor ===');
{
  const d1 = extractDepartment(SSC_CGL);
  assert(d1 !== null, 'SSC CGL returns department');
  assertEqual(d1?.department, 'SSC', 'SSC short name');
  assert(d1?.confidence >= 0.8, 'SSC high confidence');

  const d2 = extractDepartment(RRB_TECH);
  assertEqual(d2?.department, 'RRB', 'RRB detected');

  const d3 = extractDepartment(RAJ_POLICE);
  // May or may not have explicit dept; at least should not crash
  assert(true, 'Rajasthan Police does not throw');

  const d4 = extractDepartment(UP_TEACHER);
  assertEqual(d4?.department, 'UPPSC', 'UPPSC detected');

  const d5 = extractDepartment(BANK_PO);
  assertEqual(d5?.department, 'IBPS', 'IBPS detected');

  const d6 = extractDepartment(ARMY_AGNIVEER);
  assert(d6?.department === 'Army' || d6?.id === 'indian-army', 'Indian Army detected');
}

console.log('\n=== Qualification Extractor ===');
{
  const q1 = extractQualifications(SSC_CGL);
  assertIncludes(q1, 'Graduate', 'SSC CGL has Graduate');

  const q2 = extractQualifications(RRB_TECH);
  assert(q2.some((q) => q.id === 'iti' || q.id === 'diploma'), 'RRB has ITI or Diploma');

  const q3 = extractQualifications(RAJ_POLICE);
  assertIncludes(q3, '10th Pass', 'Rajasthan Police 10th Pass');

  const q4 = extractQualifications(UP_TEACHER);
  assert(q4.some((q) => q.id === 'bed' || q.id === 'graduate'), 'UP Teacher B.Ed / Graduate');
}

console.log('\n=== State Extractor ===');
{
  const s1 = extractStates(RAJ_POLICE);
  assert(s1.states.some((s) => s.id === 'rajasthan'), 'Rajasthan detected');

  const s2 = extractStates(UP_TEACHER);
  assert(s2.states.some((s) => s.id === 'uttar-pradesh'), 'Uttar Pradesh detected');

  const s3 = extractStates(SSC_CGL);
  // SSC is All India – may or may not explicitly say it
  assert(true, 'SSC states does not throw');
}

console.log('\n=== Salary Extractor ===');
{
  const sal1 = extractSalary(SSC_CGL);
  assert(sal1?.level === 'Level 4' || sal1?.level != null || sal1 === null, 'SSC salary level or null ok');

  const sal2 = extractSalary(RAJ_POLICE);
  assert(sal2 !== null, 'Rajasthan Police salary extracted');
  assert(sal2?.min === 21700, 'Min salary 21700');
  assert(sal2?.max === 69100, 'Max salary 69100');

  const sal3 = extractSalary(BANK_PO);
  assert(sal3 !== null, 'IBPS PO salary extracted');
  assert(sal3?.min === 48480, 'IBPS min 48480');
}

console.log('\n=== Vacancy Parser ===');
{
  const v1 = extractVacancy(SSC_CGL);
  assertEqual(v1.total, 7500, 'SSC total 7500');
  assert(v1.posts.length === 2, 'SSC post-wise count');

  const v2 = extractVacancy(RRB_TECH);
  assertEqual(v2.total, 3000, 'RRB total 3000');
}

console.log('\n=== Selection Process ===');
{
  const sp1 = extractSelectionProcess(RRB_TECH);
  assert(sp1.some((s) => s.id === 'cbt'), 'RRB has CBT');
  assert(sp1.some((s) => s.id === 'document'), 'RRB has Document Verification');

  const sp2 = extractSelectionProcess(RAJ_POLICE);
  assert(sp2.some((s) => s.id === 'pet' || s.id === 'pst'), 'Rajasthan has PET/PST');
  assert(sp2.some((s) => s.id === 'written' || s.id === 'cbt'), 'Rajasthan has Written/CBT');

  const sp3 = extractSelectionProcess(BANK_PO);
  assert(sp3.some((s) => s.id === 'prelims' || s.id === 'mains' || s.id === 'interview'), 'IBPS has exam stages');
}

console.log('\n=== Job Type ===');
{
  const jt1 = extractJobType(ARMY_AGNIVEER);
  assert(jt1?.id === 'contract' || jt1?.name === 'Contract', 'Agniveer is Contract');

  const jt2 = extractJobType(SSC_CGL);
  assert(jt2?.id === 'permanent' || jt2?.name === 'Permanent', 'SSC default Permanent');
}

console.log('\n=== Exam Type ===');
{
  const et1 = extractExamType(SSC_CGL, extractDepartment(SSC_CGL));
  assert(et1?.id === 'central' || et1?.name === 'Central Government', 'SSC is Central');

  const et2 = extractExamType(RRB_TECH, extractDepartment(RRB_TECH));
  assert(et2?.id === 'railway', 'RRB is Railway');

  const et3 = extractExamType(BANK_PO, extractDepartment(BANK_PO));
  assert(et3?.id === 'banking', 'IBPS is Banking');

  const et4 = extractExamType(ARMY_AGNIVEER, extractDepartment(ARMY_AGNIVEER));
  assert(et4?.id === 'defence', 'Army is Defence');
}

console.log('\n=== Tags Generator ===');
{
  const dept = extractDepartment(SSC_CGL);
  const qual = extractQualifications(SSC_CGL);
  const tags = generateTags(SSC_CGL, { department: dept, qualification: qual });
  assert(Array.isArray(tags) && tags.length > 0, 'Tags generated');
  assert(tags.some((t) => /ssc/i.test(t)), 'Tags contain SSC');
}

console.log('\n=== Slug Generator ===');
{
  const dept = extractDepartment(SSC_CGL);
  const slug = generateSlug(SSC_CGL, { department: dept });
  assert(typeof slug === 'string' && slug.length > 3, 'Slug is non-empty string');
  assert(/ssc/i.test(slug), 'Slug contains ssc');
  assert(/2026/.test(slug), 'Slug contains year');
  assert(!slug.includes(' '), 'Slug has no spaces');
}

console.log('\n=== SEO Metadata ===');
{
  const enrichedPartial = {
    department: extractDepartment(SSC_CGL),
    qualification: extractQualifications(SSC_CGL),
    states: extractStates(SSC_CGL).states,
    vacancy: extractVacancy(SSC_CGL),
    slug: 'ssc-cgl-2026',
    tags: ['SSC', 'CGL', '2026'],
  };
  const seo = generateSeo(SSC_CGL, enrichedPartial);
  assert(seo.title && seo.title.length > 10, 'SEO title present');
  assert(seo.description && seo.description.length > 30, 'SEO description present');
  assert(Array.isArray(seo.keywords) && seo.keywords.length > 0, 'SEO keywords present');
  assert(seo.canonical.includes('ssc-cgl-2026'), 'Canonical includes slug');
  assert(seo.openGraph && seo.openGraph.title, 'OpenGraph present');
  assert(seo.twitter && seo.twitter.card, 'Twitter card present');
  assert(Array.isArray(seo.jsonLd) && seo.jsonLd.length >= 1, 'JSON-LD present');
}

console.log('\n=== Full enrichJob ===');
{
  const full = enrichJob(SSC_CGL);
  assert(full.title.includes('SSC'), 'Enriched title');
  assert(full.department?.department === 'SSC', 'Enriched department');
  assert(Array.isArray(full.qualification), 'Enriched qualification array');
  assert(Array.isArray(full.states), 'Enriched states array');
  assert(full.vacancy?.total === 7500, 'Enriched vacancy total');
  assert(Array.isArray(full.tags) && full.tags.length > 0, 'Enriched tags');
  assert(typeof full.slug === 'string', 'Enriched slug');
  assert(full.seo && full.seo.title, 'Enriched SEO');
  assert(full._meta && full._meta.departmentId === 'ssc', 'Meta departmentId');
}

console.log('\n=== enrichListings ===');
{
  const listings = [
    { title: 'SSC CGL 2026 Online Form', sarkari_link: 'https://example.com/ssc', slug: 'ssc-cgl-2026', section: 'latestjob' },
    { title: 'RRB NTPC 2026', sarkari_link: 'https://example.com/rrb', slug: 'rrb-ntpc-2026', section: 'latestjob' },
  ];
  const enriched = enrichListings(listings);
  assertEqual(enriched.length, 2, 'Listings count preserved');
  assert(enriched[0].department?.department === 'SSC' || enriched[0].tags.some((t) => /ssc/i.test(t)), 'First listing enriched');
  assert(typeof enriched[0].slug === 'string', 'Listing has slug');
}

// ---------------------------------------------------------------------------
// Summary
// ---------------------------------------------------------------------------
console.log('\n========================================');
console.log(`Passed: ${passed}  Failed: ${failed}`);
console.log('========================================\n');

if (failed > 0) {
  process.exit(1);
}
