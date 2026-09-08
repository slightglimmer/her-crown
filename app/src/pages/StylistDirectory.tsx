import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Masthead } from '../components/Masthead';
import { ServiceChips } from '../components/ServiceChips';
import { SERVICES, STYLISTS, type Chair, type Stylist } from '../data/stylists';
import { useClaims } from '../state/ClaimsContext';
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
    scoreLabel: st.score.toFixed(1),
    verifiedLabel: `${st.verified} verified reviews`,
    why: st.chair === 'travels' ? 'Travels to you' : 'Near ' + st.area.split(' ·')[0],
  };
}

export function StylistDirectory() {
  const [where, setWhere] = useState('Atlanta, GA');
  const [chair, setChair] = useState<Chair | 'either'>('either');
  const [picked, setPicked] = useState<string[]>(['Knotless braids']);
  const [sort, setSort] = useState<SortKey>('score');
  const { getClaim, effectiveStylist } = useClaims();

  function togglePicked(name: string) {
    setPicked((prev) => (prev.includes(name) ? prev.filter((x) => x !== name) : prev.concat(name)));
  }

  // Filtering, sorting and "Newest" are client-side over the seed data here,
  // matching the prototype. In production this moves server-side with
  // pagination, and "Newest" sorts by a real created-at field instead of
  // standing in with verified count.
  const results = useMemo(() => {
    const matches = STYLISTS.map(effectiveStylist).filter((st) => {
      const chairOk = chair === 'either' || st.chair === chair;
      const svOk = picked.length === 0 || picked.some((p) => st.services.includes(p));
      return chairOk && svOk;
    });

    const sorted = matches.slice().sort((a, b) => {
      if (sort === 'verified') return b.verified - a.verified;
      if (sort === 'new') return a.verified - b.verified;
      return b.score - a.score;
    });

    return sorted.map(shape);
  }, [chair, picked, sort, effectiveStylist]);

  const recCount = Math.min(3, results.length);
  const recs = results.slice(0, recCount).map((r) => ({ ...r, verifiedLabel: `${r.verified} verified` }));
  const showRecs = recCount > 0;
  const recReason = (picked.length ? picked.join(', ').toLowerCase() : 'all services') + ' · ' + (where || 'anywhere');
  const resultsHeading = results.length
    ? `${results.length} ${results.length === 1 ? 'stylist' : 'stylists'} in ${where || 'range'}`
    : 'No matches';
  const isEmpty = results.length === 0;

  function clearFilters() {
    setPicked([]);
    setChair('either');
  }

  return (
    <div className={styles.page}>
      <div className={styles.wrap}>
        <Masthead
          right={
            <>
              <span>The directory</span>
              <Link to="/review">Rate a stylist</Link>
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

        {showRecs && (
          <div className={styles.recsSection}>
            <div className={styles.recsHead}>
              <h2 className={styles.h2}>Picked for you</h2>
              <span className={styles.recReason}>{recReason}</span>
            </div>
            <div className={styles.recGrid}>
              {recs.map((r) => (
                <div className={`card ${styles.recCard}`} key={r.id}>
                  <div className="card-kicker">{r.why}</div>
                  <div className="card-title" style={{ fontSize: 21 }}>
                    {r.name}
                  </div>
                  <div className="card-body">{r.specialty}</div>
                  <div className={styles.recScoreRow}>
                    <span className={styles.recScore}>{r.scoreLabel}</span>
                    <span className="tag tag-accent" style={{ whiteSpace: 'nowrap' }}>
                      {r.verifiedLabel}
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
          {results.map((st) => {
            const claim = getClaim(st.id);
            return (
              <div className={styles.row} key={st.id}>
                <div>
                  <div className={styles.area}>
                    {st.area}
                    {claim.status === 'claimed' && (
                      <span className={`tag tag-neutral ${styles.claimedTag}`}>Claimed by her</span>
                    )}
                  </div>
                  <div className={styles.name}>{st.name}</div>
                  <div className={styles.specialty}>{st.specialty}</div>
                  <div className={styles.quote}>
                    <em>{st.quote}</em>
                  </div>
                  {claim.reply && (
                    <div className={styles.reply}>
                      <span className={styles.replyLabel}>{st.name.split(' ')[0]} replied</span> {claim.reply}
                    </div>
                  )}
                  <div className={styles.tags}>
                    {st.tags.map((t) => (
                      <span className="tag tag-outline" key={t}>
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
                <div className={styles.rowRight}>
                  <div className={styles.rowScore}>{st.scoreLabel}</div>
                  <div className={styles.rowMeta}>{st.verifiedLabel}</div>
                  <div className={styles.rowMeta}>{st.price}</div>
                  <Link to={`/review?stylist=${st.id}`} className={`btn btn-secondary ${styles.rateBtn}`}>
                    Rate her
                  </Link>
                  {claim.status === 'unclaimed' && (
                    <Link to={`/claim/${st.id}`} className={`btn btn-ghost ${styles.claimLink}`}>
                      Is this you?
                    </Link>
                  )}
                  {claim.status === 'pending' && <span className={styles.claimPending}>Claim pending</span>}
                  {claim.status === 'claimed' && (
                    <Link to={`/claim/${st.id}`} className={`btn btn-ghost ${styles.claimLink}`}>
                      Manage profile
                    </Link>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {isEmpty && (
          <div className={styles.empty}>
            <div className={styles.emptyTitle}>Nobody yet for that mix.</div>
            <p className={styles.emptyBody}>
              Drop a filter, or widen the chair. New stylists get added the week their first receipt clears.
            </p>
            <button type="button" className={`btn btn-ghost ${styles.emptyClear}`} onClick={clearFilters}>
              Clear filters
            </button>
          </div>
        )}

        <div className={styles.footerNote}>
          Scores are the average of verified visits only. A stylist can reply to any review once, and nobody can pay
          to move up this page.
        </div>
      </div>
    </div>
  );
}
