import { Route, Routes } from 'react-router-dom';
import { StylistDirectory } from './pages/StylistDirectory';
import { ReviewFlow } from './pages/ReviewFlow';
import { ClaimFlow } from './pages/ClaimFlow';
import { AdminLogin } from './pages/AdminLogin';
import { AdminDashboard } from './pages/AdminDashboard';
import { useClaims } from './state/ClaimsContext';

function ApiErrorBanner() {
  const { loadError } = useClaims();
  if (!loadError) return null;
  return (
    <div
      style={{
        background: 'var(--color-accent-2-100)',
        color: 'var(--color-accent-2-800)',
        fontSize: 13,
        padding: '10px 20px',
        textAlign: 'center',
      }}
    >
      Can't reach the claims server ({loadError}) — claim status and "Is this you?" won't work until it's back.
    </div>
  );
}

function App() {
  return (
    <>
      <ApiErrorBanner />
      <Routes>
        <Route path="/" element={<StylistDirectory />} />
        <Route path="/review" element={<ReviewFlow />} />
        <Route path="/claim/:id" element={<ClaimFlow />} />
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/admin" element={<AdminDashboard />} />
      </Routes>
    </>
  );
}

export default App;
