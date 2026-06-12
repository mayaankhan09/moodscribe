import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import GlassCard from './GlassCard';

const emotionScore = { sadness: 1, fear: 2, anger: 3, surprise: 4, love: 5, joy: 6 };
const scoreLabel = { 1: 'Sad', 2: 'Fear', 3: 'Anger', 4: 'Surprise', 5: 'Love', 6: 'Joy' };

function MoodChart({ entries }) {
  const data = [...entries]
    .reverse()
    .map((e) => ({
      date: new Date(e.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      mood: emotionScore[e.emotion] || 0,
      emotion: e.emotion,
    }));

  if (data.length < 2) {
    return (
      <GlassCard style={{ marginBottom: '24px' }}>
        <h2 style={{ fontSize: '18px', marginBottom: '8px' }}>Mood trend</h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>Write at least 2 entries to see your trend.</p>
      </GlassCard>
    );
  }

  return (
    <GlassCard style={{ marginBottom: '24px' }}>
      <h2 style={{ fontSize: '18px', marginBottom: '16px' }}>Mood trend</h2>
      <ResponsiveContainer width="100%" height={220}>
        <LineChart data={data} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
          <XAxis dataKey="date" tick={{ fontSize: 12, fill: '#6B6880' }} />
          <YAxis domain={[0, 7]} ticks={[1,2,3,4,5,6]} tickFormatter={(v) => scoreLabel[v] || ''} tick={{ fontSize: 11, fill: '#6B6880' }} width={70} />
          <Tooltip
            formatter={(value, name, props) => [props.payload.emotion, 'Emotion']}
            contentStyle={{ borderRadius: '12px', border: 'none', background: 'rgba(255,255,255,0.9)' }}
          />
          <Line type="monotone" dataKey="mood" stroke="#6C63FF" strokeWidth={3} dot={{ r: 4, fill: '#6C63FF' }} />
        </LineChart>
      </ResponsiveContainer>
    </GlassCard>
  );
}

export default MoodChart;