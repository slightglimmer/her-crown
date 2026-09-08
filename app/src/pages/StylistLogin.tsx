import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Masthead } from '../components/Masthead';
import { useStylistAuth } from '../state/StylistAuthContext';
import styles from './StylistLogin.module.css';

export function StylistLogin() {
  const { login } = useStylistAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await login(email.trim(), password);
      navigate('/stylist/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className={styles.page}>
      <div className={styles.wrap}>
        <Masthead right={<span>Stylist login</span>} />
        <div className={styles.step}>
          <h1 className={styles.h1}>Sign in.</h1>
          <p className={styles.sub}>Use the email and password you set when you applied.</p>

          <form className={styles.form} onSubmit={handleSubmit}>
            <div className="field">
              <label htmlFor="stylist-email">Email</label>
              <input
                className="input"
                id="stylist-email"
                type="email"
                autoComplete="username"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="field">
              <label htmlFor="stylist-password">Password</label>
              <input
                className="input"
                id="stylist-password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            {error && <p className={styles.error}>{error}</p>}
            <div className={styles.actions}>
              <button type="submit" className="btn btn-primary" disabled={submitting || !email || !password}>
                Sign in
              </button>
              <Link to="/join" className="btn btn-ghost">
                Not applied yet?
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
