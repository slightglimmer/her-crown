import { Route, Routes } from 'react-router-dom';
import { StylistDirectory } from './pages/StylistDirectory';
import { ReviewFlow } from './pages/ReviewFlow';
import { StylistSignup } from './pages/StylistSignup';
import { StylistLogin } from './pages/StylistLogin';
import { StylistDashboard } from './pages/StylistDashboard';
import { AdminLogin } from './pages/AdminLogin';
import { AdminDashboard } from './pages/AdminDashboard';
import { useStylists } from './state/StylistsContext';

function ApiErrorBanner() {
  const { loadError } = useStylists();
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
      Can't reach the server ({loadError}) — the directory won't show real stylists until it's back.
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
        <Route path="/join" element={<StylistSignup />} />
        <Route path="/stylist/login" element={<StylistLogin />} />
        <Route path="/stylist/dashboard" element={<StylistDashboard />} />
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/admin" element={<AdminDashboard />} />
      </Routes>
    </>
  );
}

export default App;
