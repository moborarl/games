import { Route, Routes } from 'react-router-dom';
import { Home } from './pages/Home';
import { MemoryMatchPage } from './pages/MemoryMatchPage';

export function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/games/memory-match" element={<MemoryMatchPage />} />
    </Routes>
  );
}
