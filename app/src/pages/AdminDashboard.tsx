import { useCallback, useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { Masthead } from '../components/Masthead';
import { useAdminAuth } from '../state/AdminAuthContext';
import { useStylists } from '../state/StylistsContext';
import styles from './AdminDashboard.module.css';

type Tab = 'pending' | 'approved' | 'rejected' | 'all';

interface Application {
  id: number;
  status: 'pending' | 'approved' | 'rejected';
  name: string;
  area: string;
  chair: 'travels' | 'salon';
  specialty: string;
  price: string | null;
  services: string[];
  email: string;
  note: string | null;
  createdAt: string;
  decidedAt: string | null;
}

const TABS: { key: Tab; label: string }[] = [
  { key: 'pending', label: 'Pending' },
  { key: 'approved', label: 'Approved' },
  { key: 'rejected', label: 'Rejected' },
  { key: 'all', label: 'All' },
];

export function AdminDashboard() {
  const { session, logout, adminFetch } = useAdminAuth();
  const { refresh: refreshStylists } = useStylists();
  const [tab, setTab] = useState<Tab>('pending');
  const [applications, setApplications] = useState<Application[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<number | null>(null);

  const load = useCallback(
    async (t: Tab) => {
      try {
        const query = t === 'all' ? '' : `?status=${t}`;
        const data = (await adminFetch(`/api/admin/applications${query}`)) as Application[];
        setApplications(data);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Could not load applications');
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
      await adminFetch(`/api/admin/applications/${id}/${action}`, { method: 'POST' });
      await load(tab);
      await refreshStylists();
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
          <h1 className={styles.h1}>Applications.</h1>
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
        {!error && applications.length === 0 && <p className={styles.empty}>Nothing here.</p>}

        <div className={styles.list}>
          {applications.map((a) => (
            <div className={styles.row} key={a.id}>
              <div>
                <div className={styles.area}>
                  {a.area} · {a.chair === 'travels' ? 'Travels to you' : 'Salon or studio'}
                </div>
                <div className={styles.name}>{a.name}</div>
                <div className={styles.meta}>
                  <span className={styles.metaLabel}>{a.email}</span>
                </div>
                <div className={styles.meta}>
                  {a.specialty} {a.price && <>· {a.price} </>}· {a.services.join(', ')}
                </div>
                {a.note && <div className={styles.note}>{a.note}</div>}
                <div className={styles.timestamp}>
                  Submitted {a.createdAt}
                  {a.decidedAt && <> · decided {a.decidedAt}</>}
                </div>
              </div>
              <div className={styles.actions}>
                <span
                  className={`tag ${a.status === 'approved' ? 'tag-accent' : a.status === 'rejected' ? 'tag-neutral' : 'tag-outline'} ${styles.statusTag}`}
                >
                  {a.status}
                </span>
                {a.status === 'pending' && (
                  <>
                    <button
                      type="button"
                      className="btn btn-secondary"
                      disabled={busyId === a.id}
                      onClick={() => decide(a.id, 'approve')}
                    >
                      Approve
                    </button>
                    <button
                      type="button"
                      className="btn btn-ghost"
                      disabled={busyId === a.id}
                      onClick={() => decide(a.id, 'reject')}
                    >
                      Reject
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
