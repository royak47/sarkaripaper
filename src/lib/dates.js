/**
 * Date helpers for Closing Soon / deadline logic.
 * Parses common Indian date formats from scraper output.
 */

const MONTHS = {
  jan: 0, january: 0, feb: 1, february: 1, mar: 2, march: 2,
  apr: 3, april: 3, may: 4, jun: 5, june: 5, jul: 6, july: 6,
  aug: 7, august: 7, sep: 8, sept: 8, september: 8,
  oct: 9, october: 9, nov: 10, november: 10, dec: 11, december: 11,
};

export function parseIndianDate(raw) {
  if (!raw || typeof raw !== 'string') return null;
  const s = raw.trim();
  if (!s || /not\s*declared|coming\s*soon|to\s*be\s*notified|tba|na\b/i.test(s)) return null;

  let m = s.match(/^(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{4})$/);
  if (m) {
    const d = parseInt(m[1], 10);
    const mo = parseInt(m[2], 10) - 1;
    const y = parseInt(m[3], 10);
    if (mo >= 0 && mo <= 11 && d >= 1 && d <= 31) {
      const dt = new Date(y, mo, d);
      if (!Number.isNaN(dt.getTime())) return dt;
    }
  }

  m = s.match(/(\d{1,2})\s+([A-Za-z]+)\s+(\d{4})/);
  if (m) {
    const d = parseInt(m[1], 10);
    const mo = MONTHS[m[2].toLowerCase()];
    const y = parseInt(m[3], 10);
    if (mo != null && d >= 1 && d <= 31) {
      const dt = new Date(y, mo, d);
      if (!Number.isNaN(dt.getTime())) return dt;
    }
  }

  const iso = Date.parse(s);
  if (!Number.isNaN(iso)) {
    const dt = new Date(iso);
    return new Date(dt.getFullYear(), dt.getMonth(), dt.getDate());
  }
  return null;
}

export function startOfToday() {
  const n = new Date();
  return new Date(n.getFullYear(), n.getMonth(), n.getDate());
}

export function daysUntil(date) {
  if (!date) return null;
  const t = startOfToday();
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  return Math.round((d - t) / 86400000);
}

export function deadlineLabel(days) {
  if (days == null) return null;
  if (days < 0) return 'Expired';
  if (days === 0) return 'Today';
  if (days === 1) return 'Tomorrow';
  if (days <= 30) return `${days} Days Left`;
  return null;
}

export function deadlineKind(days) {
  if (days == null) return null;
  if (days < 0) return 'expired';
  if (days === 0) return 'today';
  if (days === 1) return 'tomorrow';
  if (days <= 3) return 'urgent';
  if (days <= 7) return 'soon';
  return 'later';
}

export function getLastApplyDate(detail) {
  if (!detail) return null;
  const dates = detail.dates || {};
  const candidates = [
    dates['Last Date Apply Online'],
    dates['Last Date for Apply'],
    dates['Last Date'],
    dates['Last Date Pay Fee'],
  ];
  for (const c of candidates) {
    const parsed = parseIndianDate(c);
    if (parsed) return parsed;
  }
  return null;
}
