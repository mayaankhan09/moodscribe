import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api';
import GlassCard from '../components/GlassCard';

function Signup() {
  const [name,     setName]     = useState('');
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [error,    setError]    = useState('');
  const [loading,  setLoading]  = useState(false);
  const navigate = useNavigate();

  async function handleSignup() {
    if (loading) return;
    setError('');
    setLoading(true);
    try {
      await api.post('/auth/register', { name, email, password });
      navigate('/login');
    } catch (err) {
      setError(err.response?.data?.detail || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter') handleSignup();
  }

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center',
                  minHeight: '100vh', padding: '20px' }}>
      <GlassCard style={{ width: '100%', maxWidth: '380px' }}>
        <h1 style={{ fontSize: '28px', marginBottom: '4px' }}>Create account</h1>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '24px' }}>Start your journaling journey</p>

        <input
          className="field"
          placeholder="Name"
          aria-label="Your name"
          autoComplete="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={handleKeyDown}
        />
        <input
          className="field"
          type="email"
          placeholder="Email"
          aria-label="Email address"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          onKeyDown={handleKeyDown}
        />
        <input
          className="field"
          type="password"
          placeholder="Password (8+ characters)"
          aria-label="Password, 8 or more characters"
          autoComplete="new-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          onKeyDown={handleKeyDown}
        />

        {error && (
          <p role="alert" style={{ color: 'var(--anger)', fontSize: '14px', marginBottom: '12px' }}>
            {error}
          </p>
        )}

        <button
          className="btn-primary"
          onClick={handleSignup}
          disabled={loading}
          style={{ opacity: loading ? 0.65 : 1 }}
        >
          {loading ? 'Creating account…' : 'Sign up'}
        </button>

        <p style={{ textAlign: 'center', marginTop: '16px', fontSize: '14px',
                    color: 'var(--text-secondary)' }}>
          Already have an account?{' '}
          <Link to="/login" style={{ color: 'var(--accent)' }}>Log in</Link>
        </p>
      </GlassCard>
    </div>
  );
}

export default Signup;
