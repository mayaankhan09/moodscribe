import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import GlassCard from '../components/GlassCard';
import MoodChart from '../components/MoodChart';

const emotionColors = {
  joy: 'var(--joy)',
  sadness: 'var(--sadness)',
  love: 'var(--love)',
  anger: 'var(--anger)',
  fear: 'var(--fear)',
  surprise: 'var(--surprise)',
};

function Dashboard() {
  const [text, setText] = useState('');
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    loadEntries();
  }, []);

  async function loadEntries() {
    try {
      const res = await api.get('/entries');
      setEntries(res.data);
    } catch (err) {
      if (err.response?.status === 401) {
        localStorage.removeItem('token');
        navigate('/login');
      }
    }
  }

  async function handleSave() {
    if (!text.trim()) return;
    setLoading(true);
    try {
      await api.post('/entries', { text });
      setText('');
      await loadEntries();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  function logout() {
    localStorage.removeItem('token');
    navigate('/login');
  }

  return (
    <div style={{ maxWidth: '640px', margin: '0 auto', padding: '24px 20px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h1 style={{ fontSize: '28px' }}>MoodScribe</h1>
        <button onClick={logout} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '14px' }}>Log out</button>
      </div>

      {/* Write area */}
      <GlassCard style={{ marginBottom: '24px' }}>
        <h2 style={{ fontSize: '18px', marginBottom: '12px' }}>How are you feeling?</h2>
        <textarea
          className="field"
          style={{ minHeight: '120px', resize: 'vertical' }}
          placeholder="Write what's on your mind..."
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
        <button className="btn-primary" onClick={handleSave} disabled={loading}>
          {loading ? 'Analyzing...' : 'Save entry'}
        </button>
      </GlassCard>

      {/* Mood chart */}
      <MoodChart entries={entries} />

      {/* Past entries */}
      <h2 style={{ fontSize: '18px', marginBottom: '12px' }}>Your entries</h2>
      {entries.length === 0 && (
        <p style={{ color: 'var(--text-secondary)' }}>No entries yet. Write your first one above.</p>
      )}
      {entries.map((entry) => (
        <GlassCard key={entry.id} style={{ marginBottom: '12px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{
              background: emotionColors[entry.emotion] || 'var(--accent)',
              color: 'white', padding: '4px 12px', borderRadius: '20px',
              fontSize: '13px', fontWeight: 600, textTransform: 'capitalize',
            }}>
              {entry.emotion}
            </span>
            <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
              {new Date(entry.createdAt).toLocaleDateString()}
            </span>
          </div>
          <p style={{ color: 'var(--text-primary)' }}>{entry.text}</p>
        </GlassCard>
      ))}
    </div>
  );
}

export default Dashboard;