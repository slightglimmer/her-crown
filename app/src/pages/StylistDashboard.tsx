import { useEffect, useRef, useState } from 'react';
import { Navigate, Link } from 'react-router-dom';
import { Masthead } from '../components/Masthead';
import { ServiceChips } from '../components/ServiceChips';
import { SERVICES, type Chair } from '../data/stylists';
import { apiFetch, stylistPhotoUrl } from '../api/http';
import { useStylistAuth } from '../state/StylistAuthContext';
import { useStylists } from '../state/StylistsContext';
import styles from './StylistDashboard.module.css';

const CHAIRS: { key: Chair; label: string }[] = [
  { key: 'travels', label: 'Travels to you' },
  { key: 'salon', label: 'Salon or studio' },
];

interface Review {
  id: number;
  rating: number;
  services: string[];
  paid: string | null;
  photos: number;
  answers: { a: string | null; b: string | null; c: string | null };
  reply: string | null;
  createdAt: string;
}

export function StylistDashboard() {
  const { session, logout, stylistFetch } = useStylistAuth();
  const { stylists, refresh } = useStylists();
  const me = session ? stylists.find((st) => st.id === session.slug) : undefined;

  const [area, setArea] = useState('');
  const [chair, setChair] = useState<Chair>('salon');
  const [specialty, setSpecialty] = useState('');
  const [price, setPrice] = useState('');
  const [services, setServices] = useState<string[]>([]);
  const [seeded, setSeeded] = useState(false);
  const [justSaved, setJustSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [reviews, setReviews] = useState<Review[] | null>(null);
  const [drafts, setDrafts] = useState<Record<number, string>>({});
  const [replying, setReplying] = useState<number | null>(null);

  const photoInputRef = useRef<HTMLInputElement>(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [photoError, setPhotoError] = useState<string | null>(null);
  const [photoVersion, setPhotoVersion] = useState(0);

  useEffect(() => {
    if (me && !seeded) {
      setArea(me.area);
      setChair(me.chair);
      setSpecialty(me.specialty);
      setPrice(me.price ?? '');
      setServices(me.services);
      setSeeded(true);
    }
  }, [me, seeded]);

  useEffect(() => {
    if (!session) return;
    apiFetch(`/api/stylists/${session.slug}/reviews`)
      .then((data) => setReviews(data as Review[]))
      .catch(() => setReviews([]));
  }, [session]);

  if (!session) return <Navigate to="/stylist/login" replace />;

  function toggleService(s: string) {
    setServices((prev) => (prev.includes(s) ? prev.filter((x) => x !== s) : prev.concat(s)));
  }

  async function handleSave() {
    setSaving(true);
    setError(null);
    try {
      await stylistFetch(`/api/stylists/${session!.slug}/profile`, {
        method: 'POST',
        body: JSON.stringify({ area: area.trim(), chair, specialty: specialty.trim(), price: price.trim(), services }),
      });
      await refresh();
      setJustSaved(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save');
    } finally {
      setSaving(false);
    }
  }

  async function handlePhotoChosen(file: File | null) {
    if (!file || !session) return;
    setUploadingPhoto(true);
    setPhotoError(null);
    try {
      const form = new FormData();
      form.append('photo', file);
      await stylistFetch(`/api/stylists/${session.slug}/photo`, { method: 'POST', body: form });
      await refresh();
      setPhotoVersion((v) => v + 1);
    } catch (err) {
      setPhotoError(err instanceof Error ? err.message : 'Could not upload photo');
    } finally {
      setUploadingPhoto(false);
      if (photoInputRef.current) photoInputRef.current.value = '';
    }
  }

  async function handleReply(reviewId: number) {
    const text = (drafts[reviewId] ?? '').trim();
    if (!text) return;
    setReplying(reviewId);
    try {
      await stylistFetch(`/api/stylists/${session!.slug}/reviews/${reviewId}/reply`, {
        method: 'POST',
        body: JSON.stringify({ reply: text }),
      });
      setReviews((prev) => (prev ? prev.map((r) => (r.id === reviewId ? { ...r, reply: text } : r)) : prev));
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not post reply');
    } finally {
      setReplying(null);
    }
  }

  return (
    <div className={styles.page}>
      <div className={styles.wrap}>
        <Masthead
          right={
            <>
              <span>{session.name}</span>
              <button type="button" className="btn btn-ghost" onClick={logout} style={{ fontSize: 11 }}>
                Log out
              </button>
            </>
          }
        />

        <div className={styles.step}>
          <h1 className={styles.h1}>Your profile.</h1>
          <p className={styles.sub}>Keep your area, chair, specialty, price range and services current.</p>

          {!seeded ? (
            <p className={styles.empty}>Loading your profile…</p>
          ) : (
            <div className={styles.editForm}>
              <div className={styles.photoRow}>
                {me?.hasPhoto ? (
                  <img
                    className={styles.photoPreview}
                    src={`${stylistPhotoUrl(session.slug)}?v=${photoVersion}`}
                    alt=""
                  />
                ) : (
                  <div className={styles.photoPlaceholder}>No photo yet</div>
                )}
                <div>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    disabled={uploadingPhoto}
                    onClick={() => photoInputRef.current?.click()}
                  >
                    {me?.hasPhoto ? 'Change photo' : 'Upload photo'}
                  </button>
                  <div className={styles.photoNote}>JPG, PNG, WEBP or GIF, up to 5MB.</div>
                  {photoError && <div className={styles.photoNote} style={{ color: 'var(--color-accent-2-700)' }}>{photoError}</div>}
                </div>
                <input
                  ref={photoInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  className={styles.visuallyHidden}
                  onChange={(e) => handlePhotoChosen(e.target.files?.[0] ?? null)}
                />
              </div>
              <div className="field">
                <label htmlFor="d-area">Area</label>
                <input className="input" id="d-area" value={area} onChange={(e) => { setArea(e.target.value); setJustSaved(false); }} />
              </div>
              <div className="field">
                <label id="d-chair-label">Chair</label>
                <div className="seg" role="radiogroup" aria-labelledby="d-chair-label">
                  {CHAIRS.map((c) => (
                    <label className="seg-opt" key={c.key}>
                      <input
                        type="radio"
                        name="d-chair"
                        checked={chair === c.key}
                        onChange={() => { setChair(c.key); setJustSaved(false); }}
                      />
                      {c.label}
                    </label>
                  ))}
                </div>
              </div>
              <div className="field">
                <label htmlFor="d-specialty">Specialty</label>
                <textarea
                  className="input"
                  id="d-specialty"
                  rows={2}
                  value={specialty}
                  onChange={(e) => { setSpecialty(e.target.value); setJustSaved(false); }}
                />
              </div>
              <div className={`field ${styles.priceField}`}>
                <label htmlFor="d-price">Price range</label>
                <input className="input" id="d-price" value={price} onChange={(e) => { setPrice(e.target.value); setJustSaved(false); }} placeholder="$95–$180" />
              </div>
              <div className="field">
                <label>Services</label>
                <ServiceChips services={SERVICES} selected={services} onToggle={(s) => { toggleService(s); setJustSaved(false); }} />
              </div>
              <div className={styles.saveRow}>
                <button type="button" className="btn btn-primary" disabled={saving} onClick={handleSave}>
                  Save changes
                </button>
                {justSaved && <span className={styles.savedNote}>Saved</span>}
                {error && <span className={styles.savedNote} style={{ color: 'var(--color-accent-2-700)' }}>{error}</span>}
              </div>
            </div>
          )}

          <div className={styles.section}>
            <h2 className={styles.h2}>Reviews</h2>
            {reviews === null && <p className={styles.empty}>Loading…</p>}
            {reviews?.length === 0 && <p className={styles.empty}>No reviews yet.</p>}
            <div className={styles.reviewList}>
              {reviews?.map((r) => (
                <div className={styles.reviewRow} key={r.id}>
                  <div className={styles.reviewMeta}>
                    <span className={styles.stars}>{'★'.repeat(r.rating)}{'☆'.repeat(5 - r.rating)}</span>
                    <span>{r.services.join(', ')}</span>
                    <span>{r.createdAt}</span>
                  </div>
                  {r.answers.a && <p className={styles.answer}>{r.answers.a}</p>}
                  {r.reply ? (
                    <p className={styles.replySent}>
                      <span className={styles.replyLabel}>You replied:</span> {r.reply}
                    </p>
                  ) : (
                    <div className={styles.replyForm}>
                      <textarea
                        className="input"
                        rows={2}
                        placeholder="Reply once, publicly — make it count."
                        value={drafts[r.id] ?? ''}
                        onChange={(e) => setDrafts((prev) => ({ ...prev, [r.id]: e.target.value }))}
                      />
                      <button
                        type="button"
                        className="btn btn-secondary"
                        disabled={!drafts[r.id]?.trim() || replying === r.id}
                        onClick={() => handleReply(r.id)}
                        style={{ justifySelf: 'start' }}
                      >
                        Post reply
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div style={{ marginTop: 40 }}>
            <Link to="/" className="btn btn-ghost">
              ← Back to directory
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
