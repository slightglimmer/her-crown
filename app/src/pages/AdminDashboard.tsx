import { useCallback, useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { Masthead } from '../components/Masthead';
import { getStylist } from '../data/stylists';
import { useAdminAuth } from '../state/AdminAuthContext';
import { useClaims } from '../state/ClaimsContext';
import styles from './AdminDashboard.module.css';

type Tab = 'pending' | 'claimed' | 'rejected' | 'all';

interface AdminClaim {
  id: number;
  stylistId: string;
  status: 'pending' | 'claimed' | 'rejected';
  ownerName: string;
  ownerContact: string;
  note: string | null;
  specialty: string | null;
  price: string | null;
  services: string[] | null;
  reply: string | null;
  createdAt: string;
  decidedAt: string | null;
}

const TABS: { key: Tab; label: string }[] = [
  { key: 'pending', label: 'Pending' },
  { key: 'claimed', label: 'Claimed' },
  { key: 'rejected', label: 'Rejected' },
  { key: 'all', label: 'All' },
];

export function AdminDashboard() {
  const { session, logout, adminFetch } = useAdminAuth();
  const { refresh: refreshPublicClaims } = useClaims();
  const [tab, setTab] = useState<Tab>('pending');
  const [claims, setClaims] = useState<AdminClaim[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<number | null>(null);

  const load = useCallback(
    async (t: Tab) => {
      try {
        const query = t === 'all' ? '' : `?status=${t}`;
        const data = (await adminFetch(`/api/admin/claims${query}`)) as AdminClaim[];
        setClaims(data);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Could not load claims');
      }
    },
    [adminFetch],
  );

  useEffect(() => {
    if (session) load(tab);
  }, [session, tab, load]);

  if (!session) return <Navigate to="/admin/login" replace />;

  async function decide(id: number, action: 'approve' | 'reject') {
    setBusyId(id);
    try {
      await adminFetch(`/api/admin/claims/${id}/${action}`, { method: 'POST' });
      await load(tab);
      await refreshPublicClaims();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className={styles.page}>
      <div className={styles.wrap}>
        <Masthead
          right={
            <>
              <span>{session.email}</span>
              <button type="button" className="btn btn-ghost" onClick={logout} style={{ fontSize: 11 }}>
                Log out
              </button>
            </>
          }
        />

        <div className={styles.hero}>
          <h1 className={styles.h1}>Claims.</h1>
        </div>

        <div className={styles.tabs}>
          {TABS.map((t) => (
            <button
              key={t.key}
              type="button"
              className={styles.tab}
              data-active={tab === t.key || undefined}
              onClick={() => setTab(t.key)}
            >
              {t.label}
            </button>
          ))}
        </div>

        {error && <p className={styles.empty}>{error}</p>}
        {!error && claims.length === 0 && <p className={styles.empty}>Nothing here.</p>}

        <div className={styles.list}>
          {claims.map((c) => {
            const stylist = getStylist(c.stylistId);
            return (
              <div className={styles.row} key={c.id}>
                <div>
                  <div className={styles.area}>{stylist?.area ?? c.stylistId}</div>
                  <div className={styles.name}>{stylist?.name ?? c.stylistId}</div>
                  <div className={styles.meta}>
                    <span className={styles.metaLabel}>{c.ownerName}</span> · {c.ownerContact}
                  </div>
                  {c.note && <div className={styles.note}>{c.note}</div>}
                  {c.status !== 'pending' && (c.specialty || c.price || c.services?.length) && (
                    <div className={styles.meta}>
                      Edited: {c.specialty && <>{c.specialty} </>}
                      {c.price && <>· {c.price} </>}
                      {c.services?.length ? <>· {c.services.join(', ')}</> : null}
                    </div>
                  )}
                  {c.reply && (
                    <div className={styles.meta}>
                      <span className={styles.metaLabel}>Replied:</span> {c.reply}
                    </div>
                  )}
                  <div className={styles.timestamp}>
                    Submitted {c.createdAt}
                    {c.decidedAt && <> · decided {c.decidedAt}</>}
                  </div>
                </div>
                <div className={styles.actions}>
                  <span className={`tag ${c.status === 'claimed' ? 'tag-accent' : c.status === 'rejected' ? 'tag-neutral' : 'tag-outline'} ${styles.statusTag}`}>
                    {c.status}
                  </span>
                  {c.status === 'pending' && (
                    <>
                      <button
                        type="button"
                        className="btn btn-secondary"
                        disabled={busyId === c.id}
                        onClick={() => decide(c.id, 'approve')}
                      >
                        Approve
                      </button>
                      <button
                        type="button"
                        className="btn btn-ghost"
                        disabled={busyId === c.id}
                        onClick={() => decide(c.id, 'reject')}
                      >
                        Reject
                      </button>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
