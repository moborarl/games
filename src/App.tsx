import { Route, Routes } from 'react-router-dom';
import { Home } from './pages/Home';
import { MemoryMatchPage } from './pages/MemoryMatchPage';
import { AmazeArrowPage } from './pages/AmazeArrowPage';
import { ScoresPage } from './pages/ScoresPage';

export function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/games/memory-match" element={<MemoryMatchPage />} />
      <Route path="/games/amaze-arrow" element={<AmazeArrowPage />} />
      <Route path="/scores" element={<ScoresPage />} />
    </Routes>
  );
}
