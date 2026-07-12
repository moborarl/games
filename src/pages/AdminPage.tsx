import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import type { ScoreRecord } from '@shared/types';
import { MODE_META, MODE_ORDER, type GameMode } from '../lib/modes';
import { formatTime } from '../lib/format';

const KEY_STORAGE = 'kids-games-admin-key';

const GAME_LIST = [
  { slug: 'memory-match', emoji: '🃏', title: 'เกมส์ไพ่จับคู่' },
  { slug: 'amaze-arrow', emoji: '🏹', title: 'Amaze Arrow' },
];

export function AdminPage() {
  const [adminKey, setAdminKey] = useState<string | null>(() => sessionStorage.getItem(KEY_STORAGE));
  const [passwordInput, setPasswordInput] = useState('');
  const [loginError, setLoginError] = useState('');
  const [game, setGame] = useState(GAME_LIST[0].slug);
  const [mode, setMode] = useState<GameMode>('easy');
  const [scores, setScores] = useState<ScoreRecord[]>([]);
  const [loading, setLoading] = useState(false);

  const loadScores = useCallback(
    async (key: string, g: string, m: GameMode) => {
      setLoading(true);
      try {
        const res = await fetch(`/api/admin/scores?game=${g}&mode=${m}`, {
          headers: { 'x-admin-key': key },
        });
        if (res.status === 401) {
          sessionStorage.removeItem(KEY_STORAGE);
          setAdminKey(null);
          return;
        }
        const data = (await res.json()) as { scores: ScoreRecord[] };
        setScores(data.scores);
      } catch {
        setScores([]);
      } finally {
        setLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    if (adminKey) void loadScores(adminKey, game, mode);
  }, [adminKey, game, mode, loadScores]);

  async function handleLogin() {
    const key = passwordInput.trim();
    if (!key) return;
    const res = await fetch('/api/admin/scores?game=memory-match&mode=easy', {
      headers: { 'x-admin-key': key },
    });
    if (res.ok) {
      sessionStorage.setItem(KEY_STORAGE, key);
      setAdminKey(key);
      setLoginError('');
    } else {
      setLoginError('รหัสผ่านไม่ถูกต้อง');
    }
  }

  async function deleteScore(id: number) {
    if (!adminKey) return;
    await fetch(`/api/admin/scores/${id}`, {
      method: 'DELETE',
      headers: { 'x-admin-key': adminKey },
    });
    void loadScores(adminKey, game, mode);
  }

  async function clearMode() {
    if (!adminKey) return;
    if (!window.confirm(`ลบคะแนนทั้งหมดของ ${game} โหมด ${MODE_META[mode].label}?`)) return;
    await fetch('/api/admin/scores/clear', {
      method: 'POST',
      headers: { 'x-admin-key': adminKey, 'Content-Type': 'application/json' },
      body: JSON.stringify({ game, mode }),
    });
    void loadScores(adminKey, game, mode);
  }

  function logout() {
    sessionStorage.removeItem(KEY_STORAGE);
    setAdminKey(null);
    setPasswordInput('');
  }

  if (!adminKey) {
    return (
      <div className="admin-login">
        <h1>🔐 ผู้ดูแลระบบ</h1>
        <div className="save-score-form">
          <input
            type="password"
            placeholder="รหัสผ่าน"
            value={passwordInput}
            onChange={(e) => setPasswordInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
          />
          <button className="primary-btn" disabled={!passwordInput.trim()} onClick={handleLogin}>
            เข้าสู่ระบบ
          </button>
        </div>
        {loginError && <p className="admin-error">{loginError}</p>}
        <Link to="/" className="link-btn">
          ← กลับหน้าแรก
        </Link>
      </div>
    );
  }

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <Link to="/" className="link-btn">
          ← กลับหน้าแรก
        </Link>
        <h1>🔐 จัดการคะแนน</h1>
        <button className="link-btn admin-logout" onClick={logout}>
          ออกจากระบบ
        </button>
      </header>

      <div className="scoreboard-tabs">
        {GAME_LIST.map((g) => (
          <button
            key={g.slug}
            className={`tab-btn ${game === g.slug ? 'active' : ''}`}
            onClick={() => setGame(g.slug)}
          >
            {g.emoji} {g.title}
          </button>
        ))}
      </div>
      <div className="scoreboard-tabs">
        {MODE_ORDER.map((m) => (
          <button key={m} className={`tab-btn ${mode === m ? 'active' : ''}`} onClick={() => setMode(m)}>
            {MODE_META[m].emoji} {MODE_META[m].label}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="muted">กำลังโหลด...</p>
      ) : scores.length === 0 ? (
        <p className="muted">ไม่มีคะแนนในโหมดนี้</p>
      ) : (
        <>
          <table className="score-table">
            <thead>
              <tr>
                <th>อันดับ</th>
                <th>ชื่อ</th>
                <th>เวลา</th>
                <th>จำนวนครั้ง</th>
                <th>บันทึกเมื่อ (UTC)</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {scores.map((s, i) => (
                <tr key={s.id}>
                  <td>{i + 1}</td>
                  <td>{s.playerName}</td>
                  <td>{formatTime(s.timeMs)}</td>
                  <td>{s.moves}</td>
                  <td>{s.createdAt}</td>
                  <td>
                    <button className="admin-delete-btn" onClick={() => deleteScore(s.id)}>
                      🗑
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="admin-actions">
            <button className="danger-btn" onClick={clearMode}>
              ลบทั้งหมดในโหมดนี้
            </button>
          </div>
        </>
      )}
    </div>
  );
}
