import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Masthead } from '../components/Masthead';
import { useAdminAuth } from '../state/AdminAuthContext';
import styles from './AdminLogin.module.css';

export function AdminLogin() {
  const { login } = useAdminAuth();
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
      navigate('/admin');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className={styles.page}>
      <div className={styles.wrap}>
        <Masthead right={<span>Admin</span>} />
        <div className={styles.step}>
          <h1 className={styles.h1}>Sign in.</h1>
          <p className={styles.sub}>Claims review is restricted to the one admin account for this directory.</p>

          <form className={styles.form} onSubmit={handleSubmit}>
            <div className="field">
              <label htmlFor="admin-email">Email</label>
              <input
                className="input"
                id="admin-email"
                type="email"
                autoComplete="username"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="field">
              <label htmlFor="admin-password">Password</label>
              <input
                className="input"
                id="admin-password"
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
              <Link to="/" className="btn btn-ghost">
                Back to directory
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
