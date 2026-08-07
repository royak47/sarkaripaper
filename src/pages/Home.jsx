import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { fetchHomepage, fetchSection } from '../api';
import { SECTIONS, sectionMeta } from '../sections';
import SectionBlock from '../components/SectionBlock';
import ErrorState from '../components/ErrorState';
import {
  attachDeadlineFromTitle,
  daysUntil,
} from '../lib/dates';

function withDeadlines(list) {
  return (list || []).map(attachDeadlineFromTitle);
}

function filterClosingSoon(items, withinDays = 7) {
  return (items || [])
    .filter((i) => i._daysLeft != null && i._daysLeft >= 0 && i._daysLeft <= withinDays)
    .sort((a, b) => a._daysLeft - b._daysLeft);
}

function filterByDeadlineWindow(items, maxDays) {
  return (items || [])
    .filter((i) => i._daysLeft != null && i._daysLeft >= 0 && i._daysLeft <= maxDays)
    .sort((a, b) => a._daysLeft - b._daysLeft);
}

function dedupeBySlug(items) {
  const seen = new Set();
  return items.filter((i) => {
    if (!i?.slug || seen.has(i.slug)) return false;
    seen.add(i.slug);
    return true;
  });
}

/**
 * Homepage priority driven by real API data only.
 * Last dates parsed from title ("| Last Date : DD/MM/YYYY") — no fake data.
 */
export default function Home() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [latestJobs, setLatestJobs] = useState([]);
  const [results, setResults] = useState([]);
  const [admitCards, setAdmitCards] = useState([]);
  const [answerKeys, setAnswerKeys] = useState([]);
  const [onlineForms, setOnlineForms] = useState([]);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const [home, jobsSec, resultSec, admitSec, answerSec, onlineSec] = await Promise.all([
          fetchHomepage(true).catch(() => ({ sections: {} })),
          fetchSection('latestjob', true).catch(() => ({ listings: [] })),
          fetchSection('result', true).catch(() => ({ listings: [] })),
          fetchSection('admitcard', true).catch(() => ({ listings: [] })),
          fetchSection('answerkey', true).catch(() => ({ listings: [] })),
          fetchSection('online', true).catch(() => ({ listings: [] })),
        ]);

        if (cancelled) return;

        const fromHome = home.sections?.latestjob?.listings || [];
        const jobs = (jobsSec.listings?.length ? jobsSec.listings : fromHome) || [];

        setLatestJobs(withDeadlines(jobs));
        setResults(withDeadlines(resultSec.listings || []));
        setAdmitCards(withDeadlines(admitSec.listings || []));
        setAnswerKeys(withDeadlines(answerSec.listings || []));
        setOnlineForms(withDeadlines(onlineSec.listings || []));
      } catch {
        if (!cancelled) setError('Homepage load nahi ho saka. API URL check karo.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, []);

  const deadlinePool = useMemo(
    () => dedupeBySlug([...latestJobs, ...onlineForms]),
    [latestJobs, onlineForms]
  );

  const closingSoon = useMemo(
    () => filterClosingSoon(deadlinePool, 7).slice(0, 12),
    [deadlinePool]
  );

  const upcoming7 = useMemo(() => filterByDeadlineWindow(deadlinePool, 7), [deadlinePool]);
  const upcoming15 = useMemo(
    () => filterByDeadlineWindow(deadlinePool, 15).filter((i) => i._daysLeft > 7),
    [deadlinePool]
  );
  const upcoming30 = useMemo(
    () => filterByDeadlineWindow(deadlinePool, 30).filter((i) => i._daysLeft > 15),
    [deadlinePool]
  );

  const remainingByDeadline = useMemo(() => {
    return [...deadlinePool]
      .filter((i) => i._daysLeft != null && i._daysLeft >= 0)
      .sort((a, b) => a._daysLeft - b._daysLeft)
      .slice(0, 16);
  }, [deadlinePool]);

  const trendingCategories = useMemo(() => {
    const counts = {};
    const bump = (key, label, icon) => {
      if (!key) return;
      if (!counts[key]) counts[key] = { key, label, icon, count: 0 };
      counts[key].count += 1;
    };
    const all = [...latestJobs, ...results, ...admitCards, ...answerKeys, ...onlineForms];
    for (const item of all) {
      if (item.examType) bump(`exam:${item.examType}`, item.examType, '📑');
      const dept = item.department?.department;
      if (dept) bump(`dept:${dept}`, dept, '🏛️');
      const cat = item.department?.category;
      if (cat) bump(`cat:${cat}`, cat, '📁');
    }
    const sectionCounts = [
      { key: 'latestjob', label: SECTIONS.latestjob.label, icon: SECTIONS.latestjob.icon, count: latestJobs.length },
      { key: 'result', label: SECTIONS.result.label, icon: SECTIONS.result.icon, count: results.length },
      { key: 'admitcard', label: SECTIONS.admitcard.label, icon: SECTIONS.admitcard.icon, count: admitCards.length },
      { key: 'answerkey', label: SECTIONS.answerkey.label, icon: SECTIONS.answerkey.icon, count: answerKeys.length },
      { key: 'online', label: SECTIONS.online.label, icon: SECTIONS.online.icon, count: onlineForms.length },
    ].filter((s) => s.count > 0);

    const dynamic = Object.values(counts)
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);

    return { sections: sectionCounts, dynamic };
  }, [latestJobs, results, admitCards, answerKeys, onlineForms]);

  if (error) return <ErrorState message={error} />;

  return (
    <div className="fade-in home">
      {/* Hero strip — makes redesign obvious */}
      <div className="home-hero">
        <div className="home-hero__text">
          <p className="home-hero__eyebrow">Government Jobs · Live Feed</p>
          <h1 className="home-hero__title">Find jobs by deadline, not just by date posted</h1>
          <p className="home-hero__sub">
            Closing soon first · Real last dates from notifications · Filters from live data
          </p>
        </div>
        <div className="home-hero__stats">
          <div className="stat">
            <span className="stat__n">{closingSoon.length}</span>
            <span className="stat__l">Closing ≤7d</span>
          </div>
          <div className="stat">
            <span className="stat__n">{latestJobs.length}</span>
            <span className="stat__l">Latest jobs</span>
          </div>
          <div className="stat">
            <span className="stat__n">{results.length}</span>
            <span className="stat__l">Results</span>
          </div>
        </div>
      </div>

      {/* 1. Closing Soon */}
      <SectionBlock
        id="closing-soon"
        title="Closing Soon"
        icon="⏰"
        items={closingSoon}
        sectionKey="latestjob"
        layout="horizontal"
        loading={loading}
        emptyText={loading ? null : 'Is 7-day window me koi last-date nahi mili titles me.'}
      />

      {/* 2–3. Latest Jobs */}
      <SectionBlock
        id="latest-jobs"
        title="Latest Jobs"
        icon="🔥"
        items={latestJobs.slice(0, 9)}
        sectionKey="latestjob"
        viewAllTo="/section/latestjob"
        loading={loading}
      />

      {/* 4. Results */}
      <SectionBlock
        id="results"
        title="Latest Results"
        icon={sectionMeta('result').icon}
        items={results.slice(0, 6)}
        sectionKey="result"
        viewAllTo="/section/result"
        loading={loading}
      />

      {/* 5. Admit Cards */}
      <SectionBlock
        id="admit"
        title="Latest Admit Cards"
        icon={sectionMeta('admitcard').icon}
        items={admitCards.slice(0, 6)}
        sectionKey="admitcard"
        viewAllTo="/section/admitcard"
        loading={loading}
      />

      {/* 6. Answer Keys */}
      <SectionBlock
        id="answerkeys"
        title="Answer Keys"
        icon={sectionMeta('answerkey').icon}
        items={answerKeys.slice(0, 6)}
        sectionKey="answerkey"
        viewAllTo="/section/answerkey"
        loading={loading}
      />

      {/* 7. Trending */}
      {!loading && (
        <section className="section-block" id="trending">
          <div className="section-block__head">
            <h2 className="section-block__title">
              <span className="section-block__icon">📈</span>
              Trending Categories
            </h2>
          </div>
          <div className="trend-grid">
            {trendingCategories.sections.map((s) => (
              <Link key={s.key} to={`/section/${s.key}`} className="trend-chip">
                <span>{s.icon}</span>
                <span className="trend-chip__label">{s.label}</span>
                <span className="trend-chip__count">{s.count}</span>
              </Link>
            ))}
            {trendingCategories.dynamic.map((d) => (
              <span key={d.key} className="trend-chip trend-chip--static" title="From live feed">
                <span>{d.icon}</span>
                <span className="trend-chip__label">{d.label}</span>
                <span className="trend-chip__count">{d.count}</span>
              </span>
            ))}
          </div>
        </section>
      )}

      {/* 9. Upcoming Deadlines */}
      <section className="section-block" id="deadlines">
        <div className="section-block__head">
          <h2 className="section-block__title">
            <span className="section-block__icon">📅</span>
            Upcoming Deadlines
          </h2>
        </div>
        {loading && (
          <div className="card-grid">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="skeleton-card" />
            ))}
          </div>
        )}
        {!loading && (
          <div className="deadline-cols">
            <DeadlineCol title="Next 7 Days" items={upcoming7} />
            <DeadlineCol title="8–15 Days" items={upcoming15} />
            <DeadlineCol title="16–30 Days" items={upcoming30} />
          </div>
        )}
      </section>

      {/* 10. Open applications by nearest deadline */}
      <SectionBlock
        id="remaining"
        title="Open Applications"
        icon="📋"
        items={remainingByDeadline}
        sectionKey="latestjob"
        loading={loading}
        emptyText={loading ? null : 'Deadline wali listings abhi nahi mili.'}
      />
    </div>
  );
}

function DeadlineCol({ title, items }) {
  return (
    <div className="deadline-col">
      <h3 className="deadline-col__title">{title}</h3>
      {!items?.length && <p className="strip-empty">—</p>}
      <ul className="deadline-col__list">
        {(items || []).slice(0, 6).map((item) => (
          <li key={item.slug}>
            <Link
              to={`/job/${encodeURIComponent(item.slug)}${
                item.sarkari_link ? `?url=${encodeURIComponent(item.sarkari_link)}` : ''
              }`}
            >
              <span className="deadline-col__days">
                {item._daysLeft === 0
                  ? 'Today'
                  : item._daysLeft === 1
                    ? 'Tomorrow'
                    : `${item._daysLeft}d`}
              </span>
              <span className="deadline-col__name">{item.title}</span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
