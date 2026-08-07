import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  fetchHomepage,
  fetchSection,
  fetchClosingSoon,
  API_BASE,
} from '../api';
import { SECTIONS, sectionMeta } from '../sections';
import SectionBlock from '../components/SectionBlock';
import ErrorState from '../components/ErrorState';
import { attachDeadlineFromTitle } from '../lib/dates';

function withDeadlines(list) {
  return (list || []).map((item) => {
    try {
      // Prefer API last_date fields when present (D1)
      if (item.last_date_ts != null || item.last_date) {
        const days =
          item.last_date_ts != null
            ? Math.round(
                (new Date(item.last_date_ts).setHours(0, 0, 0, 0) -
                  new Date().setHours(0, 0, 0, 0)) /
                  86400000
              )
            : null;
        return {
          ...item,
          _lastDate: item.last_date_ts ? new Date(item.last_date_ts) : null,
          _daysLeft: days,
          _lastDateRaw: item.last_date || null,
        };
      }
      return attachDeadlineFromTitle(item);
    } catch {
      return item;
    }
  });
}

function filterClosingSoonLocal(items, withinDays = 7) {
  return (items || [])
    .filter((i) => i._daysLeft != null && i._daysLeft >= 0 && i._daysLeft <= withinDays)
    .sort((a, b) => a._daysLeft - b._daysLeft);
}

export default function Home() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [debug, setDebug] = useState('');

  const [latestJobs, setLatestJobs] = useState([]);
  const [results, setResults] = useState([]);
  const [admitCards, setAdmitCards] = useState([]);
  const [answerKeys, setAnswerKeys] = useState([]);
  const [onlineForms, setOnlineForms] = useState([]);
  const [closingSoon, setClosingSoon] = useState([]);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      setDebug(`API: ${API_BASE}`);

      try {
        const resultsSettled = await Promise.allSettled([
          fetchHomepage(),
          fetchSection('latestjob'),
          fetchSection('result'),
          fetchSection('admitcard'),
          fetchSection('answerkey'),
          fetchSection('online'),
          fetchClosingSoon(7),
        ]);

        if (cancelled) return;

        const val = (i, fallback) =>
          resultsSettled[i].status === 'fulfilled' ? resultsSettled[i].value : fallback;

        const errs = resultsSettled
          .map((r, i) => (r.status === 'rejected' ? `${i}:${r.reason?.message || r.reason}` : null))
          .filter(Boolean);
        if (errs.length) setDebug((d) => `${d} | errors: ${errs.join('; ')}`);

        const home = val(0, { sections: {} });
        const jobsSec = val(1, { listings: [] });
        const resultSec = val(2, { listings: [] });
        const admitSec = val(3, { listings: [] });
        const answerSec = val(4, { listings: [] });
        const onlineSec = val(5, { listings: [] });
        const closingSec = val(6, { listings: [] });

        const fromHome = home.sections?.latestjob?.listings || [];
        const jobs = jobsSec.listings?.length ? jobsSec.listings : fromHome;

        setLatestJobs(withDeadlines(jobs));
        setResults(withDeadlines(resultSec.listings || []));
        setAdmitCards(withDeadlines(admitSec.listings || []));
        setAnswerKeys(withDeadlines(answerSec.listings || []));
        setOnlineForms(withDeadlines(onlineSec.listings || []));

        // Prefer server closing-soon; fallback to local filter
        const fromApi = withDeadlines(closingSec.listings || []);
        if (fromApi.length) {
          setClosingSoon(fromApi.slice(0, 12));
        } else {
          setClosingSoon(
            filterClosingSoonLocal(withDeadlines([...(jobs || []), ...(onlineSec.listings || [])]), 7).slice(0, 12)
          );
        }

        setDebug(
          (d) =>
            `${d} | jobs=${jobs.length} results=${(resultSec.listings || []).length} closing=${fromApi.length || 'local'}`
        );
      } catch (e) {
        if (!cancelled) {
          setError(`Data load fail: ${e.message || e}`);
          setDebug(`API: ${API_BASE} | ${e.message}`);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const upcoming7 = useMemo(() => filterClosingSoonLocal(latestJobs, 7), [latestJobs]);
  const upcoming15 = useMemo(
    () =>
      withDeadlines(latestJobs).filter((i) => i._daysLeft != null && i._daysLeft > 7 && i._daysLeft <= 15),
    [latestJobs]
  );
  const upcoming30 = useMemo(
    () =>
      withDeadlines(latestJobs).filter((i) => i._daysLeft != null && i._daysLeft > 15 && i._daysLeft <= 30),
    [latestJobs]
  );

  const remainingByDeadline = useMemo(() => {
    return [...latestJobs]
      .filter((i) => i._daysLeft != null && i._daysLeft >= 0)
      .sort((a, b) => a._daysLeft - b._daysLeft)
      .slice(0, 16);
  }, [latestJobs]);

  const trendingCategories = useMemo(() => {
    const sectionCounts = [
      { key: 'latestjob', label: SECTIONS.latestjob.label, icon: SECTIONS.latestjob.icon, count: latestJobs.length },
      { key: 'result', label: SECTIONS.result.label, icon: SECTIONS.result.icon, count: results.length },
      { key: 'admitcard', label: SECTIONS.admitcard.label, icon: SECTIONS.admitcard.icon, count: admitCards.length },
      { key: 'answerkey', label: SECTIONS.answerkey.label, icon: SECTIONS.answerkey.icon, count: answerKeys.length },
      { key: 'online', label: SECTIONS.online.label, icon: SECTIONS.online.icon, count: onlineForms.length },
    ].filter((s) => s.count > 0);
    return { sections: sectionCounts, dynamic: [] };
  }, [latestJobs, results, admitCards, answerKeys, onlineForms]);

  if (error) {
    return (
      <div>
        <ErrorState message={error} />
        <p style={{ textAlign: 'center', fontSize: 12, color: '#64748b' }}>{debug}</p>
      </div>
    );
  }

  return (
    <div className="fade-in home">
      <div className="home-hero">
        <div className="home-hero__text">
          <p className="home-hero__eyebrow">Government Jobs · Live Feed</p>
          <h1 className="home-hero__title">Find jobs by deadline, not just by date posted</h1>
          <p className="home-hero__sub">
            Closing soon first · Cached from database · Fast & reliable
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

      {debug && (
        <p className="api-debug" style={{ fontSize: 11, color: '#94a3b8', margin: '0 0 12px' }}>
          {debug}
        </p>
      )}

      <SectionBlock
        id="closing-soon"
        title="Closing Soon"
        icon="⏰"
        items={closingSoon}
        sectionKey="latestjob"
        layout="horizontal"
        loading={loading}
        emptyText={loading ? null : 'Is 7-day window me koi deadline nahi mili.'}
      />

      <SectionBlock
        id="latest-jobs"
        title="Latest Jobs"
        icon="🔥"
        items={latestJobs.slice(0, 9)}
        sectionKey="latestjob"
        viewAllTo="/section/latestjob"
        loading={loading}
      />

      <SectionBlock
        id="results"
        title="Latest Results"
        icon={sectionMeta('result').icon}
        items={results.slice(0, 6)}
        sectionKey="result"
        viewAllTo="/section/result"
        loading={loading}
      />

      <SectionBlock
        id="admit"
        title="Latest Admit Cards"
        icon={sectionMeta('admitcard').icon}
        items={admitCards.slice(0, 6)}
        sectionKey="admitcard"
        viewAllTo="/section/admitcard"
        loading={loading}
      />

      <SectionBlock
        id="answerkeys"
        title="Answer Keys"
        icon={sectionMeta('answerkey').icon}
        items={answerKeys.slice(0, 6)}
        sectionKey="answerkey"
        viewAllTo="/section/answerkey"
        loading={loading}
      />

      {!loading && trendingCategories.sections.length > 0 && (
        <section className="section-block" id="trending">
          <div className="section-block__head">
            <h2 className="section-block__title">
              <span className="section-block__icon">📈</span>
              Categories
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
          </div>
        </section>
      )}

      <section className="section-block" id="deadlines">
        <div className="section-block__head">
          <h2 className="section-block__title">
            <span className="section-block__icon">📅</span>
            Upcoming Deadlines
          </h2>
        </div>
        {!loading && (
          <div className="deadline-cols">
            <DeadlineCol title="Next 7 Days" items={upcoming7} />
            <DeadlineCol title="8–15 Days" items={upcoming15} />
            <DeadlineCol title="16–30 Days" items={upcoming30} />
          </div>
        )}
      </section>

      <SectionBlock
        id="remaining"
        title="Open Applications"
        icon="📋"
        items={remainingByDeadline}
        sectionKey="latestjob"
        loading={loading}
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
            <Link to={`/job/${encodeURIComponent(item.slug)}`}>
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
