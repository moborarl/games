import { Route, Routes } from 'react-router-dom';
import { Home } from './pages/Home';
import { MemoryMatchPage } from './pages/MemoryMatchPage';
import { AmazeArrowPage } from './pages/AmazeArrowPage';
import { QuickMathPage } from './pages/QuickMathPage';
import { ScoresPage } from './pages/ScoresPage';
import { AdminPage } from './pages/AdminPage';

export function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/games/memory-match" element={<MemoryMatchPage />} />
      <Route path="/games/amaze-arrow" element={<AmazeArrowPage />} />
      <Route path="/games/quick-math" element={<QuickMathPage />} />
      <Route path="/scores" element={<ScoresPage />} />
      <Route path="/admin" element={<AdminPage />} />
    </Routes>
  );
}
