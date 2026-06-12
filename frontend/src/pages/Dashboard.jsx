import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import GlassCard from '../components/GlassCard';
import MoodChart from '../components/MoodChart';

/* ── Emotion palette ─────────────────────────────────────── */
const EMOTION_COLORS = {
  joy:      'var(--joy)',
  sadness:  'var(--sadness)',
  love:     'var(--love)',
  anger:    'var(--anger)',
  fear:     'var(--fear)',
  surprise: 'var(--surprise)',
};

/* Actual hex values — needed for opacity effects on the secondary chip */
const EMOTION_HEX = {
  joy:      '#FFD66B',
  sadness:  '#6B9BD1',
  love:     '#FF8FB1',
  anger:    '#FF6B6B',
  fear:     '#9B7EDE',
  surprise: '#4ECDC4',
};

const EMOTION_EMOJI = {
  joy:      '😊',
  sadness:  '😢',
  love:     '❤️',
  anger:    '😠',
  fear:     '😨',
  surprise: '😲',
};

/* Light text on light-background chips; white on darker ones */
const CHIP_TEXT_DARK = new Set(['joy', 'surprise']);

/* ── Helpers ─────────────────────────────────────────────── */
function topEmotion(entries) {
  if (!entries.length) return null;
  const counts = {};
  for (const e of entries) counts[e.emotion] = (counts[e.emotion] || 0) + 1;
  return Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0];
}

function calcStreak(entries) {
  if (!entries.length) return 0;
  const days = new Set(entries.map((e) => new Date(e.createdAt).toDateString()));
  let streak = 0;
  const d = new Date();
  while (days.has(d.toDateString())) {
    streak++;
    d.setDate(d.getDate() - 1);
  }
  return streak;
}

/**
 * Build a calm natural-language summary of the top two emotions.
 * e.g. "Mostly love (76%), with a hint of joy (14%)."
 */
function blendSentence(primary, primaryPct, secondary, secondaryPct) {
  if (!secondary) return null;
  const qualifier =
    primaryPct >= 75 ? 'Mostly' :
    primaryPct >= 55 ? 'Primarily' :
                       'A mix of';
  const hint =
    secondaryPct < 10 ? 'just a trace of' :
    secondaryPct < 20 ? 'a hint of' :
    secondaryPct < 35 ? 'some' :
                        'a fair amount of';
  return `${qualifier} ${primary} (${primaryPct}%), with ${hint} ${secondary} (${secondaryPct}%).`;
}

/* ── LoadingDots ─────────────────────────────────────────── */
function LoadingDots() {
  return (
    <span className="loading-dots" aria-hidden="true">
      <span /><span /><span />
    </span>
  );
}

/* ═══════════════════════════════════════════════════════════
   DASHBOARD
   ═══════════════════════════════════════════════════════════ */
function Dashboard() {
  const [text,       setText]       = useState('');
  const [entries,    setEntries]    = useState([]);
  const [saving,     setSaving]     = useState(false);
  const [fetching,   setFetching]   = useState(true);
  const [saveError,  setSaveError]  = useState('');
  const [fetchError, setFetchError] = useState('');
  const [newestId,   setNewestId]   = useState(null);
  const [dark,       setDark]       = useState(
    () => document.documentElement.dataset.theme === 'dark'
  );
  const navigate = useNavigate();

  /* Re-usable fetch (used by Try-again + after save) */
  async function loadEntries(silent = false) {
    if (!silent) { setFetching(true); setFetchError(''); }
    try {
      const res = await api.get('/entries');
      setEntries(res.data);
    } catch (err) {
      if (err.response?.status === 401) {
        localStorage.removeItem('token');
        navigate('/login');
      } else if (!silent) {
        setFetchError('Couldn\'t load your entries. Check your connection and try again.');
      }
    } finally {
      if (!silent) setFetching(false);
    }
  }

  /* Initial load — inline async to satisfy the react-hooks lint rule */
  useEffect(() => {
    async function init() {
      setFetching(true);
      try {
        const res = await api.get('/entries');
        setEntries(res.data);
      } catch (err) {
        if (err.response?.status === 401) {
          localStorage.removeItem('token');
          navigate('/login');
        } else {
          setFetchError('Couldn\'t load your entries. Check your connection and try again.');
        }
      } finally {
        setFetching(false);
      }
    }
    init();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleSave() {
    if (!text.trim() || saving) return;
    setSaving(true);
    setSaveError('');
    try {
      const res = await api.post('/entries', { text });
      setText('');
      await loadEntries(true);
      setNewestId(res.data.id);
      setTimeout(() => setNewestId(null), 700);
    } catch (err) {
      const detail = err.response?.data?.detail;
      setSaveError(detail || 'Something went wrong — please try again.');
    } finally {
      setSaving(false);
    }
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) handleSave();
  }

  function toggleTheme() {
    const next = !dark;
    setDark(next);
    document.documentElement.setAttribute('data-theme', next ? 'dark' : 'light');
    localStorage.setItem('ms-theme', next ? 'dark' : 'light');
  }

  function logout() {
    localStorage.removeItem('token');
    navigate('/login');
  }

  /* ── Derived values ─────────────────────────────────────── */
  const streak   = calcStreak(entries);
  const topMood  = topEmotion(entries);
  const topEmoji = topMood ? (EMOTION_EMOJI[topMood] || '💭') : '—';
  const today    = new Date().toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric',
  });

  const words = text.trim().split(/\s+/).filter(Boolean).length;
  const inputHint =
    text.length === 0 ? 'A sentence or two is a great start.' :
    words < 5         ? `${text.length} chars · keep going…`  :
                        `${text.length} chars`;

  /* ── Shared button styles ───────────────────────────────── */
  const iconBtn = {
    background: 'var(--glass-bg)',
    backdropFilter: 'blur(16px)',
    WebkitBackdropFilter: 'blur(16px)',
    border: '1px solid var(--glass-border-t)',
    borderRadius: '50%',
    width: 40, height: 40,
    cursor: 'pointer', fontSize: 18,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    transition: 'transform 0.2s', flexShrink: 0,
  };
  const pillBtn = {
    background: 'var(--glass-bg)',
    backdropFilter: 'blur(16px)',
    WebkitBackdropFilter: 'blur(16px)',
    border: '1px solid var(--glass-border-t)',
    borderRadius: 20, padding: '8px 18px',
    cursor: 'pointer', fontSize: 13,
    color: 'var(--text-secondary)',
    transition: 'opacity 0.2s', flexShrink: 0,
  };

  /* ── Render ─────────────────────────────────────────────── */
  return (
    <div style={{ maxWidth: 700, margin: '0 auto', padding: '28px 20px 60px' }}>

      {/* ── Header ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between',
                    alignItems: 'center', marginBottom: 28, gap: 12, flexWrap: 'wrap' }}>
        <div>
          <h1 className="dash-title" style={{ fontSize: 28, fontWeight: 700, letterSpacing: '-0.5px' }}>
            MoodScribe
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: 13, marginTop: 3 }}>{today}</p>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <button onClick={toggleTheme} style={iconBtn}
            aria-label={dark ? 'Switch to light mode' : 'Switch to dark mode'}
            title={dark ? 'Switch to light mode' : 'Switch to dark mode'}>
            {dark ? '☀️' : '🌙'}
          </button>
          <button onClick={logout} style={pillBtn} aria-label="Log out">Log out</button>
        </div>
      </div>

      {/* ── Stats row ── */}
      <div className="stats-grid">
        {[
          { value: entries.length,                 label: 'Entries'    },
          { value: topEmoji,                        label: 'Top mood'   },
          { value: streak ? `${streak} 🔥` : '—', label: 'Day streak' },
        ].map(({ value, label }) => (
          <GlassCard key={label} style={{ padding: '18px 14px', textAlign: 'center' }}>
            <div className="stat-value" style={{ fontSize: 24, fontWeight: 700, lineHeight: 1.1 }}>{value}</div>
            <div className="stat-label" style={{ fontSize: 11, color: 'var(--text-secondary)',
                           marginTop: 5, textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 500 }}>
              {label}
            </div>
          </GlassCard>
        ))}
      </div>

      {/* ── Write area ── */}
      <GlassCard style={{ marginBottom: 20 }}>
        <p style={{ fontSize: 12, fontWeight: 600, textTransform: 'uppercase',
                    letterSpacing: '0.08em', color: 'var(--text-secondary)', marginBottom: 12 }}>
          How are you feeling?
        </p>
        <textarea
          className="field"
          aria-label="Journal entry"
          style={{ minHeight: 130, resize: 'vertical', marginBottom: 10, lineHeight: 1.65 }}
          placeholder="Write what's on your mind… (Ctrl + Enter to save)"
          value={text}
          disabled={saving}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
        />
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{inputHint}</span>
          <button
            className="btn-primary"
            onClick={handleSave}
            disabled={saving || !text.trim()}
            aria-busy={saving}
            style={{ width: 'auto', padding: '11px 28px',
                     opacity: saving || !text.trim() ? 0.5 : 1,
                     cursor:  saving || !text.trim() ? 'not-allowed' : 'pointer' }}
          >
            {saving ? 'Analyzing…' : 'Save entry'}
          </button>
        </div>
        {saveError && (
          <div role="alert" className="error-banner">
            <span>{saveError}</span>
            <button className="error-banner__dismiss" onClick={() => setSaveError('')}
              aria-label="Dismiss error">×</button>
          </div>
        )}
      </GlassCard>

      {/* ── Mood chart ── */}
      <MoodChart entries={entries} dark={dark} />

      {/* ── Entries header ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between',
                    alignItems: 'center', marginBottom: 14, marginTop: 4 }}>
        <h2 style={{ fontSize: 17, fontWeight: 600 }}>Your entries</h2>
        {!fetching && !fetchError && (
          <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{entries.length} total</span>
        )}
      </div>

      {/* ── Entries body ── */}
      {fetching ? (
        <GlassCard style={{ textAlign: 'center', padding: '44px 24px' }}>
          <LoadingDots />
          <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginTop: 14 }}
             aria-live="polite">Loading your entries…</p>
        </GlassCard>

      ) : fetchError ? (
        <GlassCard style={{ textAlign: 'center', padding: '36px 24px' }}>
          <p style={{ fontSize: 28, marginBottom: 10 }}>🌐</p>
          <p role="alert" style={{ color: 'var(--text-primary)', fontSize: 15,
                                   fontWeight: 600, marginBottom: 8 }}>
            Couldn't reach the server
          </p>
          <p style={{ color: 'var(--text-secondary)', fontSize: 14,
                      marginBottom: 20, lineHeight: 1.6 }}>{fetchError}</p>
          <button className="btn-primary" onClick={() => loadEntries()}
            style={{ width: 'auto', padding: '10px 24px' }}>Try again</button>
        </GlassCard>

      ) : entries.length === 0 ? (
        <GlassCard style={{ textAlign: 'center', padding: '52px 28px' }}>
          <div style={{ fontSize: 52, marginBottom: 16 }}>🌱</div>
          <p style={{ fontSize: 16, fontWeight: 600, marginBottom: 10, color: 'var(--text-primary)' }}>
            Your journal is waiting
          </p>
          <p style={{ color: 'var(--text-secondary)', fontSize: 14, lineHeight: 1.7,
                      maxWidth: 300, margin: '0 auto' }}>
            Write a few lines above — your first entry takes just a minute,
            and you'll start seeing your mood patterns come to life.
          </p>
        </GlassCard>

      ) : (
        entries.map((entry) => {
          const primaryColor = EMOTION_COLORS[entry.emotion] || 'var(--accent)';
          const primaryEmoji = EMOTION_EMOJI[entry.emotion]  || '💭';
          const chipText     = CHIP_TEXT_DARK.has(entry.emotion) ? '#1C1B2E' : '#fff';
          const primaryPct   = Math.round(entry.confidence * 100);
          const isNew        = entry.id === newestId;

          /* Secondary emotion (may be absent on old entries) */
          const hasSecondary  = !!entry.secondaryEmotion;
          const secHex        = hasSecondary ? (EMOTION_HEX[entry.secondaryEmotion] || '#6C63FF') : null;
          const secEmoji      = hasSecondary ? (EMOTION_EMOJI[entry.secondaryEmotion] || '💭') : null;
          const secondaryPct  = hasSecondary ? Math.round(entry.secondaryConfidence * 100) : 0;

          const sentence = hasSecondary
            ? blendSentence(entry.emotion, primaryPct, entry.secondaryEmotion, secondaryPct)
            : null;

          const hasBreakdown = entry.allScores?.length > 0;

          return (
            <GlassCard
              key={entry.id}
              className={isNew ? 'entry-new' : undefined}
              style={{ marginBottom: 12 }}
            >
              {/* ── Top row: chips + date ── */}
              <div style={{ display: 'flex', justifyContent: 'space-between',
                            alignItems: 'flex-start', marginBottom: 10,
                            flexWrap: 'wrap', gap: 8 }}>

                <div style={{ display: 'flex', alignItems: 'center', gap: 7, flexWrap: 'wrap' }}>

                  {/* Primary emotion chip */}
                  <span style={{
                    display: 'inline-flex', alignItems: 'center', gap: 5,
                    background: primaryColor, color: chipText,
                    padding: '4px 13px', borderRadius: 20,
                    fontSize: 13, fontWeight: 700,
                    textTransform: 'capitalize', letterSpacing: '0.02em',
                  }}>
                    {primaryEmoji} {entry.emotion}
                  </span>

                  {/* Primary confidence % */}
                  <span style={{ fontSize: 12, color: 'var(--text-secondary)',
                                 fontWeight: 500, whiteSpace: 'nowrap' }}>
                    {primaryPct}%
                  </span>

                  {/* Secondary emotion chip — subtler, outline style */}
                  {hasSecondary && (
                    <>
                      <span style={{ fontSize: 11, color: 'var(--text-secondary)', opacity: 0.5 }}>·</span>
                      <span style={{
                        display: 'inline-flex', alignItems: 'center', gap: 4,
                        background: `${secHex}28`,
                        border: `1px solid ${secHex}70`,
                        color: 'var(--text-secondary)',
                        padding: '3px 10px', borderRadius: 20,
                        fontSize: 11, fontWeight: 600,
                        textTransform: 'capitalize',
                      }}>
                        {secEmoji} {entry.secondaryEmotion}
                      </span>
                      <span style={{ fontSize: 11, color: 'var(--text-secondary)', opacity: 0.75 }}>
                        {secondaryPct}%
                      </span>
                    </>
                  )}
                </div>

                {/* Date */}
                <span style={{ fontSize: 12, color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
                  {new Date(entry.createdAt).toLocaleDateString('en-US', {
                    month: 'short', day: 'numeric',
                    hour: '2-digit', minute: '2-digit',
                  })}
                </span>
              </div>

              {/* ── Blend sentence ── */}
              {sentence && (
                <p style={{ fontSize: 13, color: 'var(--text-secondary)',
                            fontStyle: 'italic', marginBottom: 10, lineHeight: 1.5 }}>
                  {sentence}
                </p>
              )}

              {/* ── Entry text ── */}
              <p style={{ color: 'var(--text-primary)', lineHeight: 1.65, fontSize: 15 }}>
                {entry.text}
              </p>

              {/* ── Emotion breakdown ── */}
              {hasBreakdown ? (
                /* Full 6-emotion breakdown for new entries */
                <div style={{ marginTop: 14, paddingTop: 12,
                              borderTop: '1px solid rgba(128,128,128,0.1)' }}>
                  {entry.allScores.map(({ label, score }) => {
                    const pct   = Math.round(score * 100);
                    const color = EMOTION_COLORS[label] || 'var(--accent)';
                    return (
                      <div key={label} style={{ display: 'flex', alignItems: 'center',
                                               gap: 8, marginBottom: 5 }}>
                        <span style={{ fontSize: 10, color: 'var(--text-secondary)',
                                       width: 56, textAlign: 'right', flexShrink: 0,
                                       textTransform: 'capitalize' }}>
                          {label}
                        </span>
                        <div style={{ flex: 1, height: 3,
                                      background: 'rgba(128,128,128,0.12)', borderRadius: 3 }}>
                          <div style={{
                            height: '100%', width: `${pct}%`,
                            background: color, borderRadius: 3,
                            transition: 'width 0.7s ease',
                          }} />
                        </div>
                        <span style={{ fontSize: 10, color: 'var(--text-secondary)',
                                       width: 26, textAlign: 'right', flexShrink: 0 }}>
                          {pct}%
                        </span>
                      </div>
                    );
                  })}
                </div>
              ) : (
                /* Fallback single bar for entries saved before this feature */
                <div style={{ marginTop: 14 }}>
                  <div style={{ height: 4, background: 'rgba(128,128,128,0.14)',
                                borderRadius: 4, overflow: 'hidden' }}>
                    <div style={{
                      height: '100%', width: `${primaryPct}%`,
                      background: primaryColor, borderRadius: 4,
                      transition: 'width 0.7s ease',
                    }} />
                  </div>
                </div>
              )}
            </GlassCard>
          );
        })
      )}
    </div>
  );
}

export default Dashboard;
