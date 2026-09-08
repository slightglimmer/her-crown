import { Route, Routes } from 'react-router-dom';
import { StylistDirectory } from './pages/StylistDirectory';
import { ReviewFlow } from './pages/ReviewFlow';

function App() {
  return (
    <Routes>
      <Route path="/" element={<StylistDirectory />} />
      <Route path="/review" element={<ReviewFlow />} />
    </Routes>
  );
}

export default App;
