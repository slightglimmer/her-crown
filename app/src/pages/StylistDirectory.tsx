import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Masthead } from '../components/Masthead';
import { ServiceChips } from '../components/ServiceChips';
import { SERVICES, type Chair, type Stylist } from '../data/stylists';
import { stylistPhotoUrl } from '../api/http';
import { useStylists } from '../state/StylistsContext';
import styles from './StylistDirectory.module.css';

type SortKey = 'score' | 'verified' | 'new';

const CHAIRS: { key: Chair | 'either'; label: string }[] = [
  { key: 'either', label: 'Either' },
  { key: 'travels', label: 'Travels to you' },
  { key: 'salon', label: 'Salon or studio' },
];

const SORTS: { key: SortKey; label: string }[] = [
  { key: 'score', label: 'Highest rated' },
  { key: 'verified', label: 'Most reviewed' },
  { key: 'new', label: 'Newest' },
];

function shape(st: Stylist) {
  return {
    ...st,
    scoreLabel: st.score !== null ? st.score.toFixed(1) : 'New',
    verifiedLabel: st.verified > 0 ? `${st.verified} verified ${st.verified === 1 ? 'review' : 'reviews'}` : 'No reviews yet',
    why: st.chair === 'travels' ? 'Travels to you' : 'Near ' + st.area.split(' ·')[0],
  };
}

export function StylistDirectory() {
  const { stylists, loading } = useStylists();
  const [search, setSearch] = useState('');
  const [where, setWhere] = useState('');
  const [chair, setChair] = useState<Chair | 'either'>('either');
  const [picked, setPicked] = useState<string[]>([]);
  const [sort, setSort] = useState<SortKey>('score');

  function togglePicked(name: string) {
    setPicked((prev) => (prev.includes(name) ? prev.filter((x) => x !== name) : prev.concat(name)));
  }

  // stylists is already newest-first from the API, so "Newest" needs no
  // further sort — everything here runs client-side over the real, live
  // stylist list (small by nature for a new platform).
  const results = useMemo(() => {
    const q = search.trim().toLowerCase();
    const whereQ = where.trim().toLowerCase();
    const matches = stylists.filter((st) => {
      const chairOk = chair === 'either' || st.chair === chair;
      const svOk = picked.length === 0 || picked.some((p) => st.services.includes(p));
      const areaOk = !whereQ || st.area.toLowerCase().includes(whereQ);
      const searchOk = !q || st.name.toLowerCase().includes(q) || st.specialty.toLowerCase().includes(q);
      return chairOk && svOk && areaOk && searchOk;
    });

    const sorted =
      sort === 'verified'
        ? matches.slice().sort((a, b) => b.verified - a.verified)
        : sort === 'score'
          ? matches.slice().sort((a, b) => (b.score ?? -1) - (a.score ?? -1))
          : matches;

    return sorted.map(shape);
  }, [stylists, search, where, chair, picked, sort]);

  const recCount = Math.min(3, results.length);
  const recs = results.slice(0, recCount);
  const showRecs = recCount > 0;
  const recReason =
    (picked.length ? picked.join(', ').toLowerCase() : 'all services') +
    ' · ' +
    (where || 'anywhere') +
    (search ? ` · "${search}"` : '');
  const resultsHeading = results.length
    ? `${results.length} ${results.length === 1 ? 'stylist' : 'stylists'}${where ? ' in ' + where : ''}`
    : 'No matches';
  const isEmpty = results.length === 0;
  const noStylistsYet = !loading && stylists.length === 0;

  function clearFilters() {
    setPicked([]);
    setChair('either');
    setSearch('');
    setWhere('');
  }

  return (
    <div className={styles.page}>
      <div className={styles.wrap}>
        <Masthead
          right={
            <>
              <Link to="/review">Rate a stylist</Link>
              <Link to="/join">List your chair</Link>
              <Link to="/stylist/login">Stylist login</Link>
            </>
          }
        />

        <div className={styles.hero}>
          <h1 className={styles.heroTitle}>Find hands you can trust.</h1>
          <p className={styles.heroSub}>
            Every score here comes from a woman with a receipt. Tell us what you need and where you are — we'll put
            the right chairs in front of you.
          </p>
        </div>

        <div className={styles.filterHead}>
          <div className="field">
            <label htmlFor="hc-search">Search</label>
            <input
              className="input"
              id="hc-search"
              placeholder="Name or specialty"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="field">
            <label htmlFor="hc-where">Where you are</label>
            <input
              className="input"
              id="hc-where"
              placeholder="Neighborhood or ZIP"
              value={where}
              onChange={(e) => setWhere(e.target.value)}
            />
          </div>
          <div className="field">
            <label id="hc-chair-label">Chair</label>
            <div className="seg" role="radiogroup" aria-labelledby="hc-chair-label">
              {CHAIRS.map((c) => (
                <label className="seg-opt" key={c.key}>
                  <input
                    type="radio"
                    name="hc-chair"
                    checked={chair === c.key}
                    onChange={() => setChair(c.key)}
                  />
                  {c.label}
                </label>
              ))}
            </div>
          </div>
        </div>

        <div className={styles.chipsSection}>
          <div className={styles.kicker}>What you need</div>
          <div className={styles.chipsRow}>
            <ServiceChips services={SERVICES} selected={picked} onToggle={togglePicked} />
          </div>
        </div>

        {noStylistsYet ? (
          <div className={styles.empty}>
            <div className={styles.emptyTitle}>Nobody's listed yet.</div>
            <p className={styles.emptyBody}>
              Her Crown just opened. Stylists who sign up and pass a quick review show up here first.
            </p>
            <Link to="/join" className="btn btn-secondary" style={{ marginTop: 10 }}>
              List your chair
            </Link>
          </div>
        ) : (
          <>
            {showRecs && (
              <div className={styles.recsSection}>
                <div className={styles.recsHead}>
                  <h2 className={styles.h2}>Picked for you</h2>
                  <span className={styles.recReason}>{recReason}</span>
                </div>
                <div className={styles.recGrid}>
                  {recs.map((r) => (
                    <div className={`card ${styles.recCard}`} key={r.id}>
                      {r.hasPhoto && <img className={styles.recPhoto} src={stylistPhotoUrl(r.id)} alt="" />}
                      <div className="card-kicker">{r.why}</div>
                      <div className="card-title" style={{ fontSize: 21 }}>
                        {r.name}
                      </div>
                      <div className="card-body">{r.specialty}</div>
                      <div className={styles.recScoreRow}>
                        <span className={styles.recScore}>{r.scoreLabel}</span>
                        <span className="tag tag-accent" style={{ whiteSpace: 'nowrap' }}>
                          {r.verified > 0 ? `${r.verified} verified` : 'New'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className={styles.resultsHead}>
              <h2 className={styles.h2}>{resultsHeading}</h2>
              <div className={styles.sortRow}>
                <span className={styles.sortLabel}>Sort</span>
                {SORTS.map((so) => (
                  <button
                    key={so.key}
                    type="button"
                    className={styles.sortOption}
                    data-active={sort === so.key || undefined}
                    style={sort === so.key ? { color: 'var(--color-accent-700)' } : undefined}
                    onClick={() => setSort(so.key)}
                  >
                    {so.label}
                  </button>
                ))}
              </div>
            </div>

            <div className={styles.results}>
              {results.map((st) => (
                <div className={`${styles.row} ${st.hasPhoto ? styles.rowWithPhoto : ''}`} key={st.id}>
                  {st.hasPhoto && <img className={styles.rowPhoto} src={stylistPhotoUrl(st.id)} alt="" />}
                  <div>
                    <div className={styles.area}>{st.area}</div>
                    <div className={styles.name}>{st.name}</div>
                    <div className={styles.specialty}>{st.specialty}</div>
                    {st.quote && (
                      <div className={styles.quote}>
                        <em>{st.quote}</em>
                      </div>
                    )}
                    {st.reply && (
                      <div className={styles.reply}>
                        <span className={styles.replyLabel}>{st.name.split(' ')[0]} replied</span> {st.reply}
                      </div>
                    )}
                  </div>
                  <div className={styles.rowRight}>
                    <div className={styles.rowScore}>{st.scoreLabel}</div>
                    <div className={styles.rowMeta}>{st.verifiedLabel}</div>
                    {st.price && <div className={styles.rowMeta}>{st.price}</div>}
                    <Link to={`/review?stylist=${st.id}`} className={`btn btn-secondary ${styles.rateBtn}`}>
                      Rate her
                    </Link>
                  </div>
                </div>
              ))}
            </div>

            {isEmpty && (
              <div className={styles.empty}>
                <div className={styles.emptyTitle}>Nobody yet for that mix.</div>
                <p className={styles.emptyBody}>
                  Drop a filter, or widen the chair. New stylists get added as they sign up and pass review.
                </p>
                <button type="button" className="btn btn-ghost" style={{ marginTop: 10 }} onClick={clearFilters}>
                  Clear filters
                </button>
              </div>
            )}
          </>
        )}

        <div className={styles.footerNote}>
          Scores are the average of verified visits only. A stylist can reply to any review once, and nobody can pay
          to move up this page.
        </div>
      </div>
    </div>
  );
}
