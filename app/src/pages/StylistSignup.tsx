import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Masthead } from '../components/Masthead';
import { ServiceChips } from '../components/ServiceChips';
import { SERVICES, type Chair } from '../data/stylists';
import { apiFetch } from '../api/http';
import styles from './StylistSignup.module.css';

const CHAIRS: { key: Chair; label: string }[] = [
  { key: 'travels', label: 'Travels to you' },
  { key: 'salon', label: 'Salon or studio' },
];

export function StylistSignup() {
  const [name, setName] = useState('');
  const [area, setArea] = useState('');
  const [chair, setChair] = useState<Chair>('salon');
  const [specialty, setSpecialty] = useState('');
  const [price, setPrice] = useState('');
  const [services, setServices] = useState<string[]>([]);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [note, setNote] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  function toggleService(s: string) {
    setServices((prev) => (prev.includes(s) ? prev.filter((x) => x !== s) : prev.concat(s)));
  }

  const missing = !name.trim()
    ? 'Name needed'
    : !area.trim()
      ? 'Area needed'
      : !specialty.trim()
        ? 'Specialty needed'
        : services.length === 0
          ? 'Pick at least one service'
          : !email.trim()
            ? 'Email needed'
            : password.length < 8
              ? 'Password needs 8+ characters'
              : null;

  async function handleSubmit() {
    if (missing) return;
    setSubmitting(true);
    setError(null);
    try {
      await apiFetch('/api/applications', {
        method: 'POST',
        body: JSON.stringify({
          name: name.trim(),
          area: area.trim(),
          chair,
          specialty: specialty.trim(),
          price: price.trim() || undefined,
          services,
          email: email.trim(),
          password,
          note: note.trim() || undefined,
        }),
      });
      setDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setSubmitting(false);
    }
  }

  if (done) {
    return (
      <div className={styles.page}>
        <div className={styles.wrap}>
          <Masthead right={<span>List your chair</span>} />
          <div className={styles.step}>
            <div className={styles.doneKicker}>Filed</div>
            <h1 className={styles.doneTitle}>We're reviewing your application.</h1>
            <p className={styles.doneBody}>
              A person checks every application against public business info before it goes live — usually within a
              day. Once it's approved, log in with the email and password you set here to manage your profile.
            </p>
            <Link to="/" className="btn btn-secondary" style={{ marginTop: 24 }}>
              Back to directory
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <div className={styles.wrap}>
        <Masthead right={<span>List your chair</span>} />
        <div className={styles.step}>
          <h1 className={styles.h1}>Get in front of the next woman searching.</h1>
          <p className={styles.sub}>
            Tell us about your chair. We check every application by hand before it goes live — no fake reviews, no
            paid placement, ever.
          </p>

          <div className={styles.form}>
            <div className="field">
              <label htmlFor="su-name">Your name</label>
              <input className="input" id="su-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Nailah Bryce" />
            </div>
            <div className="field">
              <label htmlFor="su-area">Area</label>
              <input
                className="input"
                id="su-area"
                value={area}
                onChange={(e) => setArea(e.target.value)}
                placeholder="West End"
              />
            </div>
            <div className="field">
              <label id="su-chair-label">Chair</label>
              <div className="seg" role="radiogroup" aria-labelledby="su-chair-label">
                {CHAIRS.map((c) => (
                  <label className="seg-opt" key={c.key}>
                    <input type="radio" name="su-chair" checked={chair === c.key} onChange={() => setChair(c.key)} />
                    {c.label}
                  </label>
                ))}
              </div>
            </div>
            <div className="field">
              <label htmlFor="su-specialty">Specialty</label>
              <textarea
                className="input"
                id="su-specialty"
                rows={2}
                value={specialty}
                onChange={(e) => setSpecialty(e.target.value)}
                placeholder="Knotless and boho braids, kid-friendly, comes to your kitchen."
              />
            </div>
            <div className={styles.row2}>
              <div className="field">
                <label htmlFor="su-price">Price range (optional)</label>
                <input className="input" id="su-price" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="$180–$320" />
              </div>
            </div>
            <div className="field">
              <label>Services</label>
              <ServiceChips services={SERVICES} selected={services} onToggle={toggleService} />
            </div>
            <div className={styles.row2}>
              <div className="field">
                <label htmlFor="su-email">Email</label>
                <input
                  className="input"
                  id="su-email"
                  type="email"
                  autoComplete="username"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                />
              </div>
              <div className="field">
                <label htmlFor="su-password">Password</label>
                <input
                  className="input"
                  id="su-password"
                  type="password"
                  autoComplete="new-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 8 characters"
                />
              </div>
            </div>
            <div className="field">
              <label htmlFor="su-note">Anything that helps us confirm it's you (optional)</label>
              <textarea
                className="input"
                id="su-note"
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
              <span className={styles.gateNote}>{error ?? missing ?? ''}</span>
              <button type="button" className="btn btn-primary" disabled={!!missing || submitting} onClick={handleSubmit}>
                Submit application
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
