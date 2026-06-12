import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api';
import GlassCard from '../components/GlassCard';

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  async function handleLogin() {
    if (loading) return;
    setError('');
    setLoading(true);
    try {
      const res = await api.post('/auth/login', { email, password });
      localStorage.setItem('token', res.data.access_token);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.detail || 'Invalid email or password');
    } finally {
      setLoading(false);
    }
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter') handleLogin();
  }

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', padding: '20px' }}>
      <GlassCard style={{ width: '100%', maxWidth: '380px' }}>
        <h1 style={{ fontSize: '28px', marginBottom: '4px' }}>Welcome back</h1>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '24px' }}>Log in to continue</p>

        <input
          className="field"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          onKeyDown={handleKeyDown}
        />
        <input
          className="field"
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          onKeyDown={handleKeyDown}
        />

        {error && <p style={{ color: 'var(--anger)', fontSize: '14px', marginBottom: '12px' }}>{error}</p>}

        <button
          className="btn-primary"
          onClick={handleLogin}
          disabled={loading}
          style={{ opacity: loading ? 0.65 : 1 }}
        >
          {loading ? 'Logging in…' : 'Log in'}
        </button>

        <p style={{ textAlign: 'center', marginTop: '16px', fontSize: '14px', color: 'var(--text-secondary)' }}>
          New here? <Link to="/signup" style={{ color: 'var(--accent)' }}>Create an account</Link>
        </p>
      </GlassCard>
    </div>
  );
}

export default Login;