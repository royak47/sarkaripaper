import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { fetchHomepage, fetchSection } from '../api';
import { SECTIONS, sectionMeta } from '../sections';
import SectionBlock from '../components/SectionBlock';
import ErrorState from '../components/ErrorState';
import { resolveDeadlines, filterClosingSoon, filterByDeadlineWindow } from '../lib/detailCache';

/**
 * Homepage priority:
 * 1 Closing Soon (≤7 days) — needs detail last-date
 * 2 Latest Updates (newest scraped)
 * 3 Latest Jobs
 * 4 Latest Results
 * 5 Latest Admit Cards
 * 6 Answer Keys
 * 7 Trending Categories (from live data)
 * 8 Upcoming Deadlines (7 / 15 / 30)
 * 9 Remaining by nearest deadline
 */
export default function Home() {
  const [loading, setLoading] = useState(true);
  const [closingLoading, setClosingLoading] = useState(true);
  const [error, setError] = useState(null);

  const [latestJobs, setLatestJobs] = useState([]);
  const [results, setResults] = useState([]);
  const [admitCards, setAdmitCards] = useState([]);
  const [answerKeys, setAnswerKeys] = useState([]);
  const [onlineForms, setOnlineForms] = useState([]);
  const [deadlinePool, setDeadlinePool] = useState([]);

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
        setLatestJobs(jobs);
        setResults(resultSec.listings || []);
        setAdmitCards(admitSec.listings || []);
        setAnswerKeys(answerSec.listings || []);
        setOnlineForms(onlineSec.listings || []);
        setLoading(false);

        // Closing soon: resolve last dates for job-like listings only
        setClosingLoading(true);
        const pool = dedupeBySlug([
          ...jobs.slice(0, 20),
          ...(onlineSec.listings || []).slice(0, 12),
        ]);
        const withDates = await resolveDeadlines(pool, { limit: 28, concurrency: 4 });
        if (!cancelled) {
          setDeadlinePool(withDates);
          setClosingLoading(false);
        }
      } catch {
        if (!cancelled) {
          setError('Homepage load nahi ho saka. API URL check karo.');
          setLoading(false);
          setClosingLoading(false);
        }
      }
    }

    load();
    return () => { cancelled = true; };
  }, []);

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
      const exam = item.examType;
      if (exam) bump(`exam:${exam}`, exam, '📑');
      const dept = item.department?.department;
      if (dept) bump(`dept:${dept}`, dept, '🏛️');
      const cat = item.department?.category;
      if (cat) bump(`cat:${cat}`, cat, '📁');
    }
    // Always include live section counts
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
      {/* 1. Closing Soon */}
      <SectionBlock
        id="closing-soon"
        title="Closing Soon"
        icon="⏰"
        items={closingSoon}
        sectionKey="latestjob"
        layout="horizontal"
        loading={closingLoading}
        emptyText={closingLoading ? null : 'Is window me koi closing deadline nahi mili (last date detail se aati hai).'}
      />

      {/* 2 + 3. Latest Updates / Latest Jobs */}
      <SectionBlock
        id="latest-jobs"
        title="Latest Jobs"
        icon="🔥"
        items={latestJobs.slice(0, 8)}
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

      {/* 7. Trending Categories — from live data only */}
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
        {closingLoading && <div className="card-grid">{Array.from({ length: 3 }).map((_, i) => <div key={i} className="skeleton-card" />)}</div>}
        {!closingLoading && (
          <div className="deadline-cols">
            <DeadlineCol title="Next 7 Days" items={upcoming7} />
            <DeadlineCol title="8–15 Days" items={upcoming15} />
            <DeadlineCol title="16–30 Days" items={upcoming30} />
          </div>
        )}
      </section>

      {/* 10. Remaining by nearest deadline */}
      <SectionBlock
        id="remaining"
        title="Open Applications"
        icon="📋"
        items={remainingByDeadline}
        sectionKey="latestjob"
        loading={closingLoading}
        emptyText={closingLoading ? null : 'Deadline data abhi resolve nahi hui.'}
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
            <Link to={`/job/${encodeURIComponent(item.slug)}${item.sarkari_link ? `?url=${encodeURIComponent(item.sarkari_link)}` : ''}`}>
              <span className="deadline-col__days">
                {item._daysLeft === 0 ? 'Today' : item._daysLeft === 1 ? 'Tomorrow' : `${item._daysLeft}d`}
              </span>
              <span className="deadline-col__name">{item.title}</span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

function dedupeBySlug(items) {
  const seen = new Set();
  return items.filter((i) => {
    if (!i?.slug || seen.has(i.slug)) return false;
    seen.add(i.slug);
    return true;
  });
}
