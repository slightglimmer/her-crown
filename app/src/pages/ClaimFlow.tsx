import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Masthead } from '../components/Masthead';
import { ServiceChips } from '../components/ServiceChips';
import { SERVICES, getStylist } from '../data/stylists';
import { useClaims } from '../state/ClaimsContext';
import styles from './ClaimFlow.module.css';

export function ClaimFlow() {
  const { id } = useParams();
  const stylist = id ? getStylist(id) : undefined;
  const { getClaim, effectiveStylist, submitClaim, updateProfile, submitReply, refresh } = useClaims();

  const [ownerName, setOwnerName] = useState('');
  const [ownerContact, setOwnerContact] = useState('');
  const [note, setNote] = useState('');
  const [claimError, setClaimError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const effective = stylist ? effectiveStylist(stylist) : undefined;
  const [specialty, setSpecialty] = useState(effective?.specialty ?? '');
  const [price, setPrice] = useState(effective?.price ?? '');
  const [services, setServices] = useState<string[]>(effective?.services ?? []);
  const [justSaved, setJustSaved] = useState(false);
  const [replyDraft, setReplyDraft] = useState('');

  const claim = stylist ? getClaim(stylist.id) : undefined;

  // Approval happens elsewhere (the admin dashboard), so poll gently while
  // pending — it's the only way this tab finds out without a manual reload.
  useEffect(() => {
    if (claim?.status !== 'pending') return;
    const t = setInterval(refresh, 8000);
    return () => clearInterval(t);
  }, [claim?.status, refresh]);

  // When a pending claim on this same tab flips to claimed (via the poll
  // above), the edit form needs seeding from the now-published overrides.
  useEffect(() => {
    if (claim?.status === 'claimed' && effective) {
      setSpecialty(effective.specialty);
      setPrice(effective.price);
      setServices(effective.services);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [claim?.status]);

  if (!stylist || !effective || !claim) {
    return (
      <div className={styles.page}>
        <div className={styles.wrap}>
          <Masthead right={<span>Claim your profile</span>} />
          <div className={styles.step}>
            <h1 className={styles.h1}>We couldn't find that stylist.</h1>
            <p className={styles.sub}>
              <Link to="/">Back to the directory</Link>
            </p>
          </div>
        </div>
      </div>
    );
  }

  const stylistId = stylist.id;

  function toggleService(name: string) {
    setServices((prev) => (prev.includes(name) ? prev.filter((x) => x !== name) : prev.concat(name)));
  }

  async function handleSubmitClaim() {
    setSubmitting(true);
    setClaimError(null);
    try {
      await submitClaim(stylistId, { ownerName: ownerName.trim(), ownerContact: ownerContact.trim(), note: note.trim() || undefined });
    } catch (err) {
      setClaimError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleSaveProfile() {
    setSubmitting(true);
    try {
      await updateProfile(stylistId, { specialty: specialty.trim(), price: price.trim(), services });
      setJustSaved(true);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleSubmitReply() {
    if (!replyDraft.trim()) return;
    setSubmitting(true);
    try {
      await submitReply(stylistId, replyDraft.trim());
    } finally {
      setSubmitting(false);
    }
  }

  const canSubmitClaim = ownerName.trim().length > 0 && ownerContact.trim().length > 0;

  return (
    <div className={styles.page}>
      <div className={styles.wrap}>
        <Masthead right={<span>Claim your profile</span>} />

        {claim.status === 'unclaimed' && (
          <div className={styles.step}>
            <h1 className={styles.h1}>Is this your chair?</h1>
            <p className={styles.sub}>
              Claiming lets you keep your specialty, price range and services current, and reply once to any review.
              We confirm every claim against public business info before it goes live.
            </p>

            <div className={`card ${styles.summaryCard}`}>
              <div className="card-kicker">{stylist.area}</div>
              <div className="card-title" style={{ fontSize: 21 }}>
                {stylist.name}
              </div>
              <div className="card-body">{stylist.specialty}</div>
            </div>

            <div className={styles.form}>
              <div className="field">
                <label htmlFor="claim-name">Your name</label>
                <input className="input" id="claim-name" value={ownerName} onChange={(e) => setOwnerName(e.target.value)} placeholder="Nailah Bryce" />
              </div>
              <div className="field">
                <label htmlFor="claim-contact">Email or phone</label>
                <input
                  className="input"
                  id="claim-contact"
                  value={ownerContact}
                  onChange={(e) => setOwnerContact(e.target.value)}
                  placeholder="you@example.com"
                />
              </div>
              <div className="field">
                <label htmlFor="claim-note">Anything that helps us confirm it's you (optional)</label>
                <textarea
                  className="input"
                  id="claim-note"
                  rows={3}
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Link to your booking page or Instagram, business license number, etc."
                />
              </div>
            </div>

            <div className={styles.footerNav}>
              <Link to="/" className="btn btn-ghost">
                ← Back to directory
              </Link>
              <div className={styles.footerRight}>
                {claimError ? (
                  <span className={styles.gateNote}>{claimError}</span>
                ) : (
                  !canSubmitClaim && <span className={styles.gateNote}>Name and contact needed</span>
                )}
                <button type="button" className="btn btn-primary" disabled={!canSubmitClaim || submitting} onClick={handleSubmitClaim}>
                  Send claim request
                </button>
              </div>
            </div>
          </div>
        )}

        {claim.status === 'pending' && (
          <div className={styles.step}>
            <h1 className={styles.h1}>We're checking this.</h1>
            <p className={styles.sub}>
              A person confirms every claim against public business info before it goes live — usually within a day.
              {ownerContact.trim() && <> We'll reach you at {ownerContact.trim()}.</>}
            </p>

            <div className={`card ${styles.summaryCard}`}>
              <div className="card-kicker">{stylist.area}</div>
              <div className="card-title" style={{ fontSize: 21 }}>
                {stylist.name}
              </div>
              <div className="card-body">Awaiting review.</div>
            </div>
          </div>
        )}

        {claim.status === 'claimed' && (
          <div className={styles.step}>
            <h1 className={styles.h1}>Manage your profile.</h1>
            <p className={styles.sub}>Keep your specialty, price range and services current. Changes show up on the directory right away.</p>

            <div className={styles.editForm}>
              <div className="field">
                <label htmlFor="edit-specialty">Specialty</label>
                <textarea
                  className="input"
                  id="edit-specialty"
                  rows={2}
                  value={specialty}
                  onChange={(e) => {
                    setSpecialty(e.target.value);
                    setJustSaved(false);
                  }}
                />
              </div>
              <div className={`field ${styles.priceField}`}>
                <label htmlFor="edit-price">Price range</label>
                <input
                  className="input"
                  id="edit-price"
                  value={price}
                  onChange={(e) => {
                    setPrice(e.target.value);
                    setJustSaved(false);
                  }}
                  placeholder="$95–$180"
                />
              </div>
              <div className="field">
                <label>Services</label>
                <ServiceChips
                  services={SERVICES}
                  selected={services}
                  onToggle={(name) => {
                    toggleService(name);
                    setJustSaved(false);
                  }}
                />
              </div>
              <div className={styles.saveRow}>
                <button type="button" className="btn btn-primary" disabled={submitting} onClick={handleSaveProfile}>
                  Save changes
                </button>
                {justSaved && <span className={styles.savedNote}>Saved</span>}
              </div>
            </div>

            <div className={styles.section}>
              <h2 className={styles.h2}>Reply to your review</h2>
              <p className={styles.sectionSub}>One reply, and it's public. Make it count.</p>
              <div className={styles.quoteBox}>
                <em>{stylist.quote}</em>
              </div>
              {claim.reply ? (
                <p className={styles.replySent}>
                  <span className={styles.replyLabel}>You replied:</span> {claim.reply}
                </p>
              ) : (
                <div className={styles.form} style={{ maxWidth: '56ch' }}>
                  <div className="field">
                    <label htmlFor="reply-text">Your reply</label>
                    <textarea
                      className="input"
                      id="reply-text"
                      rows={3}
                      value={replyDraft}
                      onChange={(e) => setReplyDraft(e.target.value)}
                      placeholder="Thank you for coming in — glad the retwist held up for you!"
                    />
                  </div>
                  <button type="button" className="btn btn-secondary" disabled={!replyDraft.trim() || submitting} onClick={handleSubmitReply}>
                    Post reply
                  </button>
                </div>
              )}
            </div>

            <div className={styles.footerNav}>
              <Link to="/" className="btn btn-ghost">
                ← Back to directory
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
