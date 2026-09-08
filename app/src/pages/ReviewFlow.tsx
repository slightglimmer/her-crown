import { useEffect, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Masthead } from '../components/Masthead';
import { ServiceChips } from '../components/ServiceChips';
import { SERVICES } from '../data/stylists';
import { apiFetch } from '../api/http';
import { useStylists } from '../state/StylistsContext';
import styles from './ReviewFlow.module.css';

const STEPS = [
  { n: '01', label: 'Stylist' },
  { n: '02', label: 'Verify' },
  { n: '03', label: 'Rating' },
  { n: '04', label: 'Service' },
  { n: '05', label: 'Photos' },
  { n: '06', label: 'Write-up' },
];

const LAST_STEP = 5;
const MIN_WORDS = 25;
const SPOT = 'var(--color-accent-2-700)';

const RATING_COPY: [string, string][] = [
  ['Rough day in the chair', 'Say what went wrong plainly. She can only fix what she can hear.'],
  ['Not what you asked for', 'Was it the style, the timing, or the price? Pick the one that mattered most.'],
  ['Fine, not memorable', 'The middle scores are the most useful ones. Be specific about the gap.'],
  ['Solid. You would go back', 'Tell us the one thing that would have made it a five.'],
  ['Laid. Absolutely laid', 'Now tell everybody why so she gets booked all month.'],
];

const PROMPT_DEFS = [
  {
    key: 'a' as const,
    title: 'What did you ask for, and what did you leave with?',
    help: 'Reference photo versus real result.',
    placeholder: 'I brought a photo of medium knotless to the waist…',
  },
  {
    key: 'b' as const,
    title: 'How was the process — time, tension, communication?',
    help: 'Start time, finish time, how your scalp felt that night.',
    placeholder: 'Booked for 9, started at 9:20, out by 3…',
  },
  {
    key: 'c' as const,
    title: 'One thing another woman should know before booking.',
    help: 'The detail you wish someone had told you.',
    placeholder: 'Come with your hair already blown out or it adds an hour…',
  },
];

const PHOTO_SLOT_DEFS = [
  { title: 'Day one', note: 'Fresh out of the chair' },
  { title: 'Two weeks in', note: 'How it held up' },
  { title: 'The parts', note: 'Close-up of the scalp' },
];

type Answers = { a: string; b: string; c: string };

const emptyAnswers: Answers = { a: '', b: '', c: '' };

function initialState() {
  return {
    step: 0,
    stylistId: null as string | null,
    receipt: null as File | null,
    rating: 0,
    hover: 0,
    services: [] as string[],
    paid: '',
    photos: [null, null, null] as (File | null)[],
    answers: emptyAnswers,
  };
}

export function ReviewFlow() {
  const [searchParams] = useSearchParams();
  const { stylists, loading, refresh } = useStylists();
  const [state, setState] = useState(initialState);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const receiptInputRef = useRef<HTMLInputElement>(null);
  const photoInputRefs = [useRef<HTMLInputElement>(null), useRef<HTMLInputElement>(null), useRef<HTMLInputElement>(null)];

  // "Rate her" from the directory links here with ?stylist=<id> — preselect
  // that stylist and skip straight to step 2 (Verify), per the handoff prompt.
  useEffect(() => {
    const presetId = searchParams.get('stylist');
    if (presetId && stylists.some((st) => st.id === presetId)) {
      setState((s) => (s.stylistId ? s : { ...s, stylistId: presetId, step: 1 }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stylists]);

  function set(patch: Partial<ReturnType<typeof initialState>>) {
    setState((s) => ({ ...s, ...patch }));
  }

  const s = state;
  const stylist = s.stylistId ? stylists.find((st) => st.id === s.stylistId) ?? null : null;

  const rail = STEPS.map((st, i) => ({
    n: st.n,
    label: st.label,
    color: i === s.step ? SPOT : i < s.step || s.step > LAST_STEP ? 'var(--color-text)' : 'var(--color-neutral-500)',
  }));

  const shownStar = s.hover || s.rating;
  const words = Object.values(s.answers).join(' ').trim().split(/\s+/).filter(Boolean).length;
  const photosAdded = s.photos.filter(Boolean).length;

  const gates = [
    s.stylistId !== null,
    s.receipt !== null,
    s.rating > 0,
    s.services.length > 0,
    true,
    words >= MIN_WORDS,
  ];
  const notes = [
    '',
    s.receipt ? '' : 'Receipt needed',
    s.rating ? '' : 'Pick a score',
    s.services.length ? '' : 'Pick at least one',
    photosAdded ? `${photosAdded} added` : 'Optional',
    words >= MIN_WORDS ? `${words} words` : `${MIN_WORDS - words} more words`,
  ];

  function toggleService(name: string) {
    set({ services: s.services.includes(name) ? s.services.filter((x) => x !== name) : s.services.concat(name) });
  }

  function pickStylist(id: string) {
    set({ stylistId: id, step: 1 });
  }

  function onReceiptChosen(file: File | null) {
    if (file) set({ receipt: file });
    if (receiptInputRef.current) receiptInputRef.current.value = '';
  }

  function onPhotoChosen(slot: number, file: File | null) {
    if (!file) return;
    set({ photos: s.photos.map((p, i) => (i === slot ? file : p)) });
    const ref = photoInputRefs[slot].current;
    if (ref) ref.value = '';
  }

  function removePhoto(slot: number) {
    set({ photos: s.photos.map((p, i) => (i === slot ? null : p)) });
  }

  function back() {
    set({ step: Math.max(0, s.step - 1), hover: 0 });
  }

  async function next() {
    if (s.step === LAST_STEP) {
      if (!stylist) return;
      setSubmitting(true);
      setSubmitError(null);
      try {
        await apiFetch(`/api/stylists/${stylist.id}/reviews`, {
          method: 'POST',
          body: JSON.stringify({
            rating: s.rating,
            services: s.services,
            paid: s.paid || undefined,
            photos: photosAdded,
            answers: s.answers,
          }),
        });
        await refresh();
        set({ step: s.step + 1, hover: 0 });
      } catch (err) {
        setSubmitError(err instanceof Error ? err.message : 'Could not file the review');
      } finally {
        setSubmitting(false);
      }
      return;
    }
    set({ step: s.step + 1, hover: 0 });
  }

  function restart() {
    setState(initialState());
  }

  const doneHeadline = s.rating >= 4 ? "Somebody's about to get booked." : 'Thank you for the honest one.';
  const serviceSummary = s.services.length ? s.services.join(', ') + (s.paid ? ' · ' + s.paid : '') : '—';
  const photoSummary = photosAdded ? `${photosAdded} attached` : 'None';

  return (
    <div className={styles.page}>
      <div className={styles.wrap}>
        <Masthead right={<span>Rate your stylist · Atlanta, GA</span>} />

        <div className={styles.rail}>
          {rail.map((r) => (
            <div className={styles.railItem} key={r.label} style={{ color: r.color }}>
              <span className={styles.railN}>{r.n}</span>
              <span>{r.label}</span>
            </div>
          ))}
        </div>

        {s.step === 0 && (
          <div className={styles.step}>
            <h1 className={`${styles.h1} ${styles.h1First}`}>Who had their hands in your hair?</h1>
            <p className={styles.sub}>
              Pick the chair you sat in. We only take reviews from people who actually sat down — receipt and all.
            </p>
            {!loading && stylists.length === 0 ? (
              <p className={styles.sub} style={{ marginTop: 24 }}>
                Nobody's listed yet.{' '}
                <Link to="/join" style={{ color: 'var(--color-accent-700)' }}>
                  Are you a stylist? List your chair.
                </Link>
              </p>
            ) : (
              <div className={styles.stylistList}>
                {stylists.map((st) => (
                  <button
                    key={st.id}
                    type="button"
                    className={`card ${styles.stylistCard}`}
                    style={{ borderColor: s.stylistId === st.id ? 'var(--color-accent)' : undefined }}
                    onClick={() => pickStylist(st.id)}
                  >
                    <span>
                      <span className="card-kicker">{st.area}</span>
                      <span className="card-title" style={{ fontSize: 21, display: 'block' }}>
                        {st.name}
                      </span>
                      <span className="card-body" style={{ display: 'block' }}>
                        {st.specialty}
                      </span>
                    </span>
                    <span className={styles.stylistCardRight}>
                      <span className={styles.stylistScore}>{st.score !== null ? st.score.toFixed(1) : 'New'}</span>
                      <span className="tag tag-accent" style={{ whiteSpace: 'nowrap' }}>
                        {st.verified > 0 ? `${st.verified} verified` : 'New'}
                      </span>
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {s.step === 1 && (
          <div className={styles.step}>
            <div className={styles.stepKicker}>Step two · proof of chair</div>
            <h1 className={styles.h1}>Show us the receipt.</h1>
            <p className={styles.sub}>
              A payment screenshot, a Zelle confirmation, a booking email — anything with the date and the amount. We
              check it, we never publish it.
            </p>
            <button type="button" className={styles.dropTarget} onClick={() => receiptInputRef.current?.click()}>
              <div className={styles.dropTitle}>{s.receipt ? `${s.receipt.name} ✓` : 'Drop your receipt here'}</div>
              <div className={styles.dropNote}>
                {s.receipt
                  ? 'Uploaded — tap to replace. A person checks it before your review posts.'
                  : 'JPG, PNG or a screenshot. Nothing else on the image is stored.'}
              </div>
            </button>
            <input
              ref={receiptInputRef}
              type="file"
              accept="image/*"
              className={styles.visuallyHidden}
              onChange={(e) => onReceiptChosen(e.target.files?.[0] ?? null)}
            />
            <p className={styles.smallNote}>
              Receipts are reviewed by a person, not a bot. Your review posts with a verified badge once it clears —
              usually within a day.
            </p>
          </div>
        )}

        {s.step === 2 && (
          <div className={styles.step}>
            <div className={styles.stepKicker}>Step three · the score</div>
            <h1 className={styles.h1}>How did you walk out feeling?</h1>
            <div className={styles.stars}>
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  type="button"
                  className={styles.star}
                  aria-label={`${n} out of 5`}
                  style={{ color: n <= shownStar ? 'var(--color-accent-2)' : 'var(--color-neutral-300)' }}
                  onClick={() => set({ rating: n })}
                  onMouseEnter={() => set({ hover: n })}
                  onMouseLeave={() => set({ hover: 0 })}
                >
                  ★
                </button>
              ))}
            </div>
            <div className={styles.ratingLabel}>{shownStar ? RATING_COPY[shownStar - 1][0] : 'Tap a star'}</div>
            <p className={styles.ratingHint}>
              {shownStar ? RATING_COPY[shownStar - 1][1] : 'Five stars means you would hand her your daughter’s hair.'}
            </p>
          </div>
        )}

        {s.step === 3 && (
          <div className={styles.step}>
            <div className={styles.stepKicker}>Step four · the service</div>
            <h1 className={styles.h1}>What did you sit down for?</h1>
            <p className={styles.sub}>
              Pick everything that happened in the chair. This is what makes your review findable for the next woman
              searching.
            </p>
            <div className={styles.chipsRow}>
              <ServiceChips services={SERVICES} selected={s.services} onToggle={toggleService} />
            </div>
            <div className={`field ${styles.paidField}`}>
              <label htmlFor="hc-paid">What you paid, all in</label>
              <input
                className="input"
                id="hc-paid"
                placeholder="$220"
                value={s.paid}
                onChange={(e) => set({ paid: e.target.value })}
              />
            </div>
          </div>
        )}

        {s.step === 4 && (
          <div className={styles.step}>
            <div className={styles.stepKicker}>Step five · the evidence</div>
            <h1 className={styles.h1}>Let us see it.</h1>
            <p className={styles.sub}>
              Day one, day fourteen, and the part nobody photographs. Optional — but photos are why people trust this
              place.
            </p>
            <div className={styles.photoGrid}>
              {PHOTO_SLOT_DEFS.map((d, i) => {
                const file = s.photos[i];
                return (
                  <div key={d.title}>
                    <button
                      type="button"
                      className={styles.photoSlot}
                      data-filled={file ? true : undefined}
                      onClick={() => (file ? removePhoto(i) : photoInputRefs[i].current?.click())}
                    >
                      <div className={styles.photoTitle}>{file ? 'Added ✓' : d.title}</div>
                      <div className={styles.photoNote}>{file ? `${d.title.toLowerCase()} · tap to remove` : d.note}</div>
                    </button>
                    <input
                      ref={photoInputRefs[i]}
                      type="file"
                      accept="image/*"
                      className={styles.visuallyHidden}
                      onChange={(e) => onPhotoChosen(i, e.target.files?.[0] ?? null)}
                    />
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {s.step === 5 && (
          <div className={styles.step}>
            <div className={styles.stepKicker}>Step six · the write-up</div>
            <h1 className={styles.h1} style={{ maxWidth: '26ch' }}>
              Say the useful part.
            </h1>
            <p className={styles.sub} style={{ maxWidth: '58ch' }}>
              Three questions instead of a blank box. Specifics help a stylist grow and help a stranger book with her
              eyes open.
            </p>
            <div className={styles.prompts}>
              {PROMPT_DEFS.map((q) => (
                <div key={q.key}>
                  <div className={styles.promptTitle}>{q.title}</div>
                  <div className={styles.promptHelp}>{q.help}</div>
                  <textarea
                    className="input"
                    rows={3}
                    placeholder={q.placeholder}
                    value={s.answers[q.key]}
                    onChange={(e) => set({ answers: { ...s.answers, [q.key]: e.target.value } })}
                  />
                </div>
              ))}
            </div>
            <div className={styles.houseRule}>
              <em>House rule:</em> critique the work, the timing and the price — not her body, her shop or her
              personal life. Reviews that read as venting get sent back to you for a rewrite, not deleted.
            </div>
          </div>
        )}

        {s.step === 6 && (
          <div className={styles.step}>
            <div className={styles.doneKicker}>Filed</div>
            <h1 className={styles.doneTitle}>{doneHeadline}</h1>
            <p className={styles.doneBody}>
              Your review is live on {stylist ? stylist.name.split(' ')[0] : 'her'}'s page. She can see it and reply
              once.
            </p>
            <div className={styles.summary}>
              <div className={styles.summaryRow}>
                <span className={styles.summaryLabel}>Stylist</span>
                <span>{stylist ? stylist.name : '—'}</span>
              </div>
              <div className={styles.summaryRow}>
                <span className={styles.summaryLabel}>Score</span>
                <span>{s.rating} out of 5</span>
              </div>
              <div className={styles.summaryRow}>
                <span className={styles.summaryLabel}>Service</span>
                <span>{serviceSummary}</span>
              </div>
              <div className={styles.summaryRow}>
                <span className={styles.summaryLabel}>Photos</span>
                <span>{photoSummary}</span>
              </div>
            </div>
            <button type="button" className={`btn btn-secondary ${styles.restartBtn}`} onClick={restart}>
              Write another one
            </button>
          </div>
        )}

        {s.step > 0 && s.step <= LAST_STEP && (
          <div className={styles.footerNav}>
            <button type="button" className="btn btn-ghost" onClick={back} disabled={s.step <= 1}>
              ← Back
            </button>
            <div className={styles.footerRight}>
              <span className={styles.gateNote}>{submitError ?? notes[s.step]}</span>
              <button type="button" className="btn btn-primary" onClick={next} disabled={!gates[s.step] || submitting}>
                {s.step === LAST_STEP ? 'File the review' : 'Continue'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
