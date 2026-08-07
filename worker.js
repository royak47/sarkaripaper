/**
 * Sarkari Result Scraper API - Cloudflare Worker
 * Clean Version - No unwanted pages + No branding
 *
 * Data Enrichment Engine integrated:
 *   - /api/job/{slug}?enrich=1   → fully enriched detail
 *   - /api/jobs?section=...&enrich=1 → enriched listings
 *   - /api/enriched/job/{slug}  → always-enriched detail (alias)
 *   - /api/enriched/jobs?section=... → always-enriched listings
 *
 * Original endpoints remain unchanged for backward compatibility.
 */

import { enrichJob, enrichListings } from './src/enrich/index.js';

const CONFIG = {
  SOURCE_URL: 'https://www.sarkariresult.com',
  REQUEST_TIMEOUT: 15000,
  MAX_LISTINGS: 50,

  SECTIONS: {
    latestjob:   { path: '/latestjob/',   label: 'Latest Jobs',   icon: '💼', color: '#e94560' },
    admitcard:   { path: '/admitcard/',   label: 'Admit Cards',   icon: '🎫', color: '#6495ed' },
    result:      { path: '/result/',      label: 'Results',       icon: '📊', color: '#ffc107' },
    online:      { path: '/online/',      label: 'Online Forms',  icon: '📝', color: '#4ecca3' },
    answerkey:   { path: '/answerkey/',   label: 'Answer Keys',   icon: '🔑', color: '#ff9800' },
    syllabus:    { path: '/syllabus/',    label: 'Syllabus',      icon: '📚', color: '#9c27b0' },
    admission:   { path: '/admission/',   label: 'Admissions',    icon: '🎓', color: '#03a9f4' },
    certificate: { path: '/certificate/', label: 'Certificate',   icon: '📜', color: '#795548' },
    outsourcing: { path: '/outsourcing/', label: 'Outsourcing',   icon: '🏢', color: '#607d8b' },
    important:   { path: '/important/',   label: 'Important',     icon: '⚡', color: '#f44336' },
  },

  OFFICIAL_DOMAINS: [
    '.gov.in', '.nic.in', '.ac.in', '.org.in', '.co.in', '.gov', '.nic', '.ac', '.edu',
    'bpsc.bih.nic.in', 'uppsc.nic.in', 'upsssc.gov.in', 'ssc.nic.in', 'upsc.gov.in',
    'rrbcdg.gov.in', 'ibps.in', 'sbi.co.in', 'railway.gov.in', 'rbi.org.in',
    'mppsc.nic.in', 'mpesb.mp.gov.in', 'nta.ac.in', 'aiims.edu', 'isro.gov.in',
    'drdo.gov.in', 'bsnl.co.in', 'licindia.in', 'crpf.gov.in', 'itbp.gov.in',
    'bankofindia.bank.in', 'bankofbaroda.in', 'bsebdeled.com', 'ssc.gov.in'
  ],

  BRAND_FILTER: [
    /sarkari\s*result/gi,
    /sarkariresult\.com/gi,
    /www\.sarkariresult\.com/gi,
    /sarkariresult/gi,
    /SARKARI RESULT/gi,
    /Sarkari Result®/gi,
    /Since 2012/gi,
    /Official Website of Sarkari Result/gi,
  ],
};

const USER_AGENTS = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:123.0) Gecko/20100101 Firefox/123.0',
];

// ====== UNWANTED TITLE PATTERNS (About Us, Contact, etc.) ======
const UNWANTED_TITLES = [
  'about us', 'contact us', 'terms and conditions', 'privacy policy', 'disclaimer',
  'follow us', 'follow instagram', 'follow facebook', 'follow twitter',
  'join telegram', 'join whatsapp', 'join channel', 'telegram channel',
  'android app', 'ios app', 'mobile app', 'download app',
  'sarkari result android', 'sarkari result ios', 'sarkari result app',
  'read more', 'click here', 'home', 'home page',
  'up scholarship', 'scholarship', 'scholarship form', 'scholarship 2026',
  'contact', 'about', 'terms', 'privacy'
];

// ====== UNWANTED URL PATHS ======
const UNWANTED_PATHS = [
  '/tag/', '/category/', '/author/', '/page/',
  '/about', '/contact', '/terms', '/privacy', '/disclaimer',
  '/instagram', '/facebook', '/twitter', '/youtube', '/telegram', '/whatsapp',
  '/t.me/', '/play.google.com', '/apps.apple.com'
];

function cleanText(text) {
  if (!text) return '';
  let t = text
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#8211;/g, '–')
    .replace(/&#8217;/g, "'")
    .replace(/&#8220;/g, '"')
    .replace(/&#8221;/g, '"')
    .replace(/\s+/g, ' ')
    .trim();

  for (const pattern of CONFIG.BRAND_FILTER) {
    t = t.replace(pattern, '').trim();
  }

  return t.replace(/\s{2,}/g, ' ').trim();
}

function normalizeUrl(href, base = CONFIG.SOURCE_URL) {
  if (!href) return null;
  href = href.trim();
  if (href.startsWith('//')) return 'https:' + href;
  if (href.startsWith('/')) return base + href;
  if (href.startsWith('http')) return href;
  return base + '/' + href;
}

function isOfficialDomain(url) {
  if (!url) return false;
  const lower = url.toLowerCase();
  return CONFIG.OFFICIAL_DOMAINS.some(d => lower.includes(d));
}

function isPdf(url) {
  return url && /\.pdf(\?|$)/i.test(url);
}

function isUnwantedLink(url, label = '') {
  if (!url) return true;
  const lower = url.toLowerCase();
  const labelLower = (label || '').toLowerCase();

  if (
    lower.includes('sarkariresult.com') ||
    lower.includes('sarkariresultportal.com') ||
    lower.includes('t.me/') ||
    lower.includes('whatsapp.com') ||
    lower.includes('instagram.com') ||
    lower.includes('youtube.com') ||
    lower.includes('youtu.be') ||
    lower.includes('twitter.com') ||
    lower.includes('x.com/') ||
    lower.includes('facebook.com') ||
    lower.includes('play.google.com') ||
    lower.includes('apps.apple.com') ||
    lower.includes('itunes.apple.com')
  ) return true;

  if (
    labelLower.includes('telegram') ||
    labelLower.includes('whatsapp') ||
    labelLower.includes('join channel') ||
    labelLower.includes('android app') ||
    labelLower.includes('ios app') ||
    labelLower.includes('pdf tool') ||
    labelLower.includes('remove background')
  ) return true;

  return false;
}

function scoreLink(url, label = '') {
  let score = 0;
  const u = (url || '').toLowerCase();
  const l = (label || '').toLowerCase();

  if (l.includes('download result') || l.includes('check result') || l === 'result') score += 140;
  if (l.includes('download admit card') || l.includes('admit card')) score += 135;
  if (l.includes('download answer key') || l.includes('answer key')) score += 130;
  if (l.includes('apply online') || l.includes('apply form') || l === 'apply') score += 125;
  if (l.includes('registration') || l.includes('login')) score += 110;
  if (l.includes('download notification') || l.includes('full notification') || l.includes('notification pdf')) score += 90;
  if (l.includes('download syllabus')) score += 80;
  if (l.includes('official website') || l.includes('official site')) score += 45;

  if (u.includes('allnotifications') || u.includes('apply') || u.includes('registration') || u.includes('onlineform')) score += 60;
  if (u.includes('admit') || u.includes('hallticket') || u.includes('callletter')) score += 55;
  if (u.includes('result') || u.includes('scorecard')) score += 55;
  if (u.includes('answerkey') || u.includes('answer-key')) score += 50;

  if (isOfficialDomain(url)) score += 40;
  if (isPdf(url)) score -= 35;

  return score;
}

class SarkariScraper {
  constructor() {
    this.ua = USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];
  }

  async fetchHtml(url) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), CONFIG.REQUEST_TIMEOUT);

    try {
      const res = await fetch(url, {
        headers: {
          'User-Agent': this.ua,
          'Accept': 'text/html,application/xhtml+xml',
          'Accept-Language': 'en-IN,en;q=0.9',
        },
        signal: controller.signal,
      });
      clearTimeout(timeout);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.text();
    } catch (e) {
      clearTimeout(timeout);
      throw e;
    }
  }

  extractListingsFromHtml(html, sectionKey) {
    const listings = [];
    const linkRegex = /<a[^>]+href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi;
    let match;

    while ((match = linkRegex.exec(html)) !== null) {
      const href = match[1];
      let title = cleanText(match[2]);

      if (!title || title.length < 8) continue;

      // ====== NEW: Strict URL filtering ======
      const hrefLower = href.toLowerCase();
      if (!href.includes('sarkariresult.com') && !href.startsWith('/')) continue;
      
      // Skip unwanted paths
      if (UNWANTED_PATHS.some(p => hrefLower.includes(p))) continue;
      
      // Skip section index pages
      if (Object.values(CONFIG.SECTIONS).some(s => hrefLower.endsWith(s.path))) continue;
      if (hrefLower === '/' || hrefLower === '') continue;

      // ====== NEW: Strict Title filtering ======
      const titleLower = title.toLowerCase();
      if (UNWANTED_TITLES.some(t => titleLower.includes(t))) continue;
      if (titleLower.includes('read more')) continue;

      const fullUrl = normalizeUrl(href);
      if (!fullUrl || fullUrl === CONFIG.SOURCE_URL + '/') continue;

      const slug = fullUrl.replace(CONFIG.SOURCE_URL, '').replace(/^\/|\/$/g, '').replace(/\//g, '-');

      listings.push({
        title,
        sarkari_link: fullUrl,
        slug,
        section: sectionKey,
      });

      if (listings.length >= CONFIG.MAX_LISTINGS) break;
    }

    // unique by slug
    const seen = new Set();
    return listings.filter(item => {
      if (seen.has(item.slug)) return false;
      seen.add(item.slug);
      return true;
    });
  }

  async scrapeSection(sectionKey) {
    const section = CONFIG.SECTIONS[sectionKey];
    if (!section) throw new Error('Invalid section');

    const url = CONFIG.SOURCE_URL + section.path;
    const html = await this.fetchHtml(url);
    const listings = this.extractListingsFromHtml(html, sectionKey);

    return {
      section: sectionKey,
      label: section.label,
      count: listings.length,
      listings,
    };
  }

  async scrapeHomepage() {
    const html = await this.fetchHtml(CONFIG.SOURCE_URL + '/');
    const sections = {};

    for (const key of Object.keys(CONFIG.SECTIONS)) {
      sections[key] = {
        section: key,
        label: CONFIG.SECTIONS[key].label,
        listings: [],
      };
    }

    const allLinks = this.extractListingsFromHtml(html, 'latestjob');
    sections.latestjob.listings = allLinks.slice(0, 30);
    sections.latestjob.count = sections.latestjob.listings.length;

    return { sections };
  }

  async scrapeDetail(sarkariUrl) {
    const html = await this.fetchHtml(sarkariUrl);

    const result = {
      title: '',
      post_date: '',
      short_info: '',
      dates: {},
      fees: {},
      age_limit: {},
      posts: [],
      total_posts: null,
      official_links: [],
      pdfs: [],
      official_apply_link: null,
      sarkari_link: sarkariUrl,
      slug: sarkariUrl.replace(CONFIG.SOURCE_URL, '').replace(/^\/|\/$/g, '').replace(/\//g, '-'),
    };

    const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
    if (titleMatch) {
      result.title = cleanText(titleMatch[1].replace(/\s*\|.*$/, '').replace(/Sarkari Result.*/i, ''));
    }

    const nameOfPostMatch = html.match(/Name\s*Of\s*Post\s*:?\s*<\/[^>]+>\s*<[^>]+>[\s\S]*?<h1[^>]*>([\s\S]*?)<\/h1>/i)
      || html.match(/Name\s*Of\s*Post[\s\S]*?<h1[^>]*>([\s\S]*?)<\/h1>/i);
    if (nameOfPostMatch) {
      result.title = cleanText(nameOfPostMatch[1]);
    }

    const postDateMatch = html.match(/Post\s*Date\s*\/\s*Update\s*:?[\s\S]*?<td[^>]*>([\s\S]*?)<\/td>/i);
    if (postDateMatch) {
      result.post_date = cleanText(postDateMatch[1]);
    }

    const shortInfoMatch = html.match(/Short\s*Information\s*<\/[^>]+>\s*<td[^>]*>([\s\S]*?)<\/td>/i);
    if (shortInfoMatch) {
      result.short_info = cleanText(shortInfoMatch[1]);
    }

    if (!result.short_info || result.short_info.length < 20 || /^\d{4}$/.test(result.short_info)) {
      const metaDesc = html.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)["']/i);
      if (metaDesc) {
        result.short_info = cleanText(metaDesc[1]);
      }
    }

    result.short_info = result.short_info
      .replace(/at\s*$/i, '')
      .replace(/\|\s*$/, '')
      .trim();

    const tableRegex = /<table[^>]*>([\s\S]*?)<\/table>/gi;
    let tableMatch;

    while ((tableMatch = tableRegex.exec(html)) !== null) {
      const tableHtml = tableMatch[1];
      const tableText = cleanText(tableHtml).toLowerCase();

      const extractLis = (chunk) => {
        const items = [];
        const liRegex = /<li[^>]*>([\s\S]*?)<\/li>/gi;
        let li;
        while ((li = liRegex.exec(chunk)) !== null) {
          const text = cleanText(li[1]);
          if (text.length > 3) items.push(text);
        }
        return items;
      };

      const splitKV = (text) => {
        const parts = text.split(/:|–|—/).map(p => p.trim()).filter(Boolean);
        if (parts.length < 2) return null;
        return { key: parts[0], value: parts.slice(1).join(': ').trim() };
      };

      if (tableText.includes('important dates') || 
          (tableText.includes('application begin') && tableText.includes('last date'))) {
        
        const datesSectionMatch = tableHtml.match(
          /important\s*dates[\s\S]*?(?=<h2|application\s*fee|age\s*limit|vacancy|how\s*to\s*fill|$)/i
        ) || [tableHtml];

        const lis = extractLis(datesSectionMatch[0]);
        for (const text of lis) {
          const kv = splitKV(text);
          if (!kv) continue;

          const k = kv.key.toLowerCase();
          const v = kv.value;

          if (k.includes('application begin') || k.includes('apply begin') || k.includes('form start')) {
            result.dates['Application Begin'] = v;
          } else if ((k.includes('last date') && (k.includes('apply') || k.includes('online'))) || k.includes('last date for apply')) {
            result.dates['Last Date Apply Online'] = v;
          } else if (k.includes('last date') && (k.includes('fee') || k.includes('pay') || k.includes('exam fee'))) {
            result.dates['Last Date Pay Fee'] = v;
          } else if (k.includes('exam date') || k.includes('exam schedule')) {
            result.dates['Exam Date'] = v;
          } else if (k.includes('admit card')) {
            result.dates['Admit Card'] = v;
          } else if (k.includes('result') && !k.includes('sarkari')) {
            result.dates['Result'] = v;
          } else if (k.includes('answer key')) {
            result.dates['Answer Key'] = v;
          } else if (k.includes('correction')) {
            result.dates['Correction Date'] = v;
          } else if (k.includes('exam city') || k.includes('city available')) {
            result.dates['Exam City'] = v;
          }
        }
      }

      if (tableText.includes('application fee') || tableText.includes('examination fee')) {
        const feeSectionMatch = tableHtml.match(
          /application\s*fee[\s\S]*?(?=<h2|important\s*dates|age\s*limit|vacancy|how\s*to\s*fill|$)/i
        ) || [tableHtml];

        const lis = extractLis(feeSectionMatch[0]);
        for (const text of lis) {
          const kv = splitKV(text);
          if (!kv) continue;

          const k = kv.key.toLowerCase();
          const v = kv.value;

          if (
            k.includes('general') || k.includes('obc') || k.includes('ews') ||
            k.includes('sc') || k.includes('st') || k.includes('ph') ||
            k.includes('divyang') || k.includes('female') || k.includes('women') ||
            k.includes('all category') || k.includes('other') ||
            k.includes('correction charge') || k.includes('fee')
          ) {
            if (k.includes('date') || k.includes('begin') || k.includes('exam')) continue;
            result.fees[kv.key] = v;
          }
        }
      }

      if (tableText.includes('age limit') || tableText.includes('minimum age') || tableText.includes('maximum age')) {
        const ageSectionMatch = tableHtml.match(
          /age\s*limit[\s\S]*?(?=<h2|vacancy|how\s*to\s*fill|important\s*links|$)/i
        ) || [tableHtml];

        const lis = extractLis(ageSectionMatch[0]);
        for (const text of lis) {
          const lower = text.toLowerCase();

          if (lower.includes('minimum age')) {
            result.age_limit['Minimum Age'] = text.replace(/minimum age\s*:?/i, '').trim();
          } else if (lower.includes('maximum age')) {
            result.age_limit['Maximum Age'] = text.replace(/maximum age\s*:?/i, '').trim();
          } else if (lower.includes('age relaxation')) {
            result.age_limit['Age Relaxation'] = text;
          } else if (lower.match(/\d+\s*[-–to]+\s*\d+\s*years/i) && lower.includes('age')) {
            result.age_limit['Age Limit'] = text;
          }
        }
      }

      if (tableText.includes('vacancy details') || tableText.includes('total :') || tableText.includes('total post')) {
        const totalMatch = tableHtml.match(/Total\s*:?\s*(?:<[^>]*>)*\s*(\d{2,6})\s*Post/i) ||
                           tableText.match(/total\s*:?\s*(\d{2,6})\s*post/i);
        if (totalMatch) {
          result.total_posts = parseInt(totalMatch[1], 10);
        }

        const rowRegex = /<tr[^>]*>([\s\S]*?)<\/tr>/gi;
        let row;
        while ((row = rowRegex.exec(tableHtml)) !== null) {
          const cells = [];
          const cellRegex = /<t[dh][^>]*>([\s\S]*?)<\/t[dh]>/gi;
          let cell;
          while ((cell = cellRegex.exec(row[1])) !== null) {
            cells.push(cleanText(cell[1]));
          }

          if (cells.length < 2) continue;

          const postName = cells[0];
          const postCountRaw = cells[1];

          if (/^(post name|total post|eligibility|category|force name|gender)$/i.test(postName)) continue;
          if (!postName || postName.length < 3) continue;

          const num = parseInt(String(postCountRaw).replace(/[^\d]/g, ''), 10);
          if (num && num >= 1 && num <= 99999 && !/^\d{4}$/.test(String(postCountRaw).trim())) {
            result.posts.push({
              post_name: postName,
              total: num,
              eligibility: cells[2] || '',
            });
          }
        }
      }

      if (tableText.includes('some useful important links') || tableText.includes('important links')) {
        const rowRegex = /<tr[^>]*>([\s\S]*?)<\/tr>/gi;
        let row;
        while ((row = rowRegex.exec(tableHtml)) !== null) {
          const cells = [];
          const cellRegex = /<t[dh][^>]*>([\s\S]*?)<\/t[dh]>/gi;
          let cell;
          while ((cell = cellRegex.exec(row[1])) !== null) {
            cells.push(cell[1]);
          }
          if (cells.length < 2) continue;

          const labelRaw = cleanText(cells[0]);
          const rightHtml = cells[1];

          const aRegex = /<a[^>]+href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi;
          let aMatch;
          while ((aMatch = aRegex.exec(rightHtml)) !== null) {
            const href = normalizeUrl(aMatch[1]);
            if (!href || isUnwantedLink(href, labelRaw)) continue;

            const label = (labelRaw || cleanText(aMatch[2]) || 'Link')
              .replace(/click here/gi, '')
              .trim() || 'Official Link';

            const score = scoreLink(href, label);
            const item = { label, url: href, score };

            if (isPdf(href)) {
              result.pdfs.push(item);
            } else {
              result.official_links.push(item);
            }
          }
        }
      }
    }

    result.official_links.sort((a, b) => b.score - a.score);
    result.pdfs.sort((a, b) => b.score - a.score);

    if (result.official_links.length > 0) {
      result.official_apply_link = result.official_links[0].url;
    } else if (result.pdfs.length > 0) {
      result.official_apply_link = result.pdfs[0].url;
    }

    if (Object.keys(result.dates || {}).length === 0) result.dates = null;
    if (Object.keys(result.fees || {}).length === 0) result.fees = null;
    if (Object.keys(result.age_limit || {}).length === 0) result.age_limit = null;

    return result;
  }
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const path = url.pathname;
    const scraper = new SarkariScraper();

    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Content-Type': 'application/json; charset=utf-8',
    };

    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    const json = (data, status = 200) =>
      new Response(JSON.stringify(data, null, 2), { status, headers: corsHeaders });

    try {
      const wantEnrich =
        url.searchParams.get('enrich') === '1' ||
        url.searchParams.get('enrich') === 'true' ||
        path.startsWith('/api/enriched/');

      // ---------- Homepage ----------
      if (path === '/api/homepage') {
        const data = await scraper.scrapeHomepage();
        if (wantEnrich) {
          for (const key of Object.keys(data.sections || {})) {
            const sec = data.sections[key];
            if (sec.listings) {
              sec.listings = enrichListings(sec.listings);
              sec.count = sec.listings.length;
            }
          }
        }
        return json(data);
      }

      // ---------- Section listings ----------
      if (path === '/api/jobs' || path === '/api/enriched/jobs') {
        const section = url.searchParams.get('section') || 'latestjob';
        if (!CONFIG.SECTIONS[section]) {
          return json({ error: 'Invalid section', available: Object.keys(CONFIG.SECTIONS) }, 400);
        }
        const data = await scraper.scrapeSection(section);
        if (wantEnrich || path === '/api/enriched/jobs') {
          data.listings = enrichListings(data.listings || []);
          data.count = data.listings.length;
          data.enriched = true;
        }
        return json(data);
      }

      // ---------- Job detail ----------
      if (path.startsWith('/api/job/') || path.startsWith('/api/enriched/job/')) {
        const slug = path
          .replace('/api/enriched/job/', '')
          .replace('/api/job/', '')
          .replace(/\/$/, '');
        if (!slug) return json({ error: 'Slug required' }, 400);

        let targetUrl = `${CONFIG.SOURCE_URL}/${slug}/`;

        if (slug.includes('2026-') || slug.startsWith('2026')) {
          targetUrl = `${CONFIG.SOURCE_URL}/2026/${slug.replace(/^2026-?/, '')}/`;
        }

        const clientUrl = url.searchParams.get('url');
        if (clientUrl && clientUrl.includes('sarkariresult.com')) {
          targetUrl = clientUrl;
        }

        const detail = await scraper.scrapeDetail(targetUrl);

        if (wantEnrich || path.startsWith('/api/enriched/job/')) {
          const enriched = enrichJob(detail, {
            baseUrl: url.searchParams.get('baseUrl') || undefined,
          });
          return json(enriched);
        }

        return json(detail);
      }

      // ---------- Search ----------
      if (path === '/api/search' || path === '/api/enriched/search') {
        const query = (url.searchParams.get('q') || '').toLowerCase();
        const org = (url.searchParams.get('org') || '').toLowerCase();
        const section = url.searchParams.get('section');

        if (!query && !org) return json({ error: 'Use ?q=search_term or ?org=BPSC' }, 400);

        let allListings = [];
        try {
          const homepageData = await scraper.scrapeHomepage();
          for (const sec of Object.values(homepageData.sections)) {
            if (section && sec.section !== section) continue;
            if (sec.listings) allListings.push(...sec.listings);
          }
        } catch (e) {}

        for (const key of ['latestjob', 'admitcard', 'result', 'answerkey']) {
          if (section && key !== section) continue;
          try {
            const data = await scraper.scrapeSection(key);
            if (data.listings) allListings.push(...data.listings);
          } catch (e) {}
        }

        const results = [];
        const seen = new Set();
        for (const item of allListings) {
          if (seen.has(item.slug)) continue;
          seen.add(item.slug);

          const text = (item.title + ' ').toLowerCase();
          let match = true;
          if (query && !text.includes(query)) match = false;
          if (org && !text.includes(org)) match = false;
          if (match) results.push(item);
        }

        let finalResults = results.slice(0, 100);
        if (wantEnrich || path === '/api/enriched/search') {
          finalResults = enrichListings(finalResults);
        }

        return json({
          query: query || org,
          count: finalResults.length,
          results: finalResults,
          enriched: wantEnrich || path === '/api/enriched/search',
        });
      }

      // ---------- Health / docs ----------
      if (path === '/' || path === '/api') {
        return json({
          status: 'ok',
          message: 'Sarkari Paper Scraper API + Data Enrichment Engine',
          endpoints: [
            '/api/homepage',
            '/api/jobs?section=latestjob',
            '/api/job/{slug}',
            '/api/search?q=BPSC',
            '/api/jobs?section=latestjob&enrich=1',
            '/api/job/{slug}?enrich=1',
            '/api/enriched/jobs?section=latestjob',
            '/api/enriched/job/{slug}',
            '/api/enriched/search?q=BPSC',
          ],
          enrichment: {
            modules: [
              'department',
              'qualification',
              'state',
              'salary',
              'vacancy',
              'selectionProcess',
              'jobType',
              'examType',
              'tags',
              'slug',
              'metadata',
            ],
          },
        });
      }

      return json(
        {
          error: 'Not found',
          endpoints: [
            '/api/homepage',
            '/api/jobs',
            '/api/job/{slug}',
            '/api/search',
            '/api/enriched/jobs',
            '/api/enriched/job/{slug}',
            '/api/enriched/search',
          ],
        },
        404
      );
    } catch (error) {
      return json({ error: 'Internal error', message: error.message }, 500);
    }
  },
};