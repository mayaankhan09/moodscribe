import {
  AreaChart, Area,
  XAxis, YAxis, Tooltip,
  ResponsiveContainer,
} from 'recharts';
import GlassCard from './GlassCard';

const emotionScore = { sadness: 1, fear: 2, anger: 3, surprise: 4, love: 5, joy: 6 };
const scoreLabel   = { 1: 'Sad', 2: 'Fear', 3: 'Anger', 4: 'Surp.', 5: 'Love', 6: 'Joy' };

function MoodChart({ entries, dark }) {
  const tickColor   = dark ? '#9B98B0' : '#6B6880';
  const tooltipBg   = dark ? 'rgba(22, 20, 40, 0.94)' : 'rgba(255,255,255,0.96)';
  const tooltipText = dark ? '#E8E6F0' : '#1C1B2E';

  const data = [...entries]
    .reverse()
    .map((e) => ({
      date:    new Date(e.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      mood:    emotionScore[e.emotion] || 0,
      emotion: e.emotion,
    }));

  if (data.length < 2) {
    return (
      <GlassCard style={{ marginBottom: 20 }}>
        <p style={{ fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-secondary)', marginBottom: 8 }}>
          Mood trend
        </p>
        <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>
          Write at least 2 entries to see your mood trend.
        </p>
      </GlassCard>
    );
  }

  return (
    <GlassCard style={{ marginBottom: 20 }}>
      <p style={{ fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-secondary)', marginBottom: 16 }}>
        Mood trend
      </p>
      <ResponsiveContainer width="100%" height={200}>
        <AreaChart data={data} margin={{ top: 8, right: 8, left: -22, bottom: 0 }}>
          <defs>
            <linearGradient id="moodGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%"  stopColor="#6C63FF" stopOpacity={0.40} />
              <stop offset="95%" stopColor="#6C63FF" stopOpacity={0.02} />
            </linearGradient>
          </defs>

          <XAxis
            dataKey="date"
            tick={{ fontSize: 11, fill: tickColor }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            domain={[0, 7]}
            ticks={[1, 2, 3, 4, 5, 6]}
            tickFormatter={(v) => scoreLabel[v] || ''}
            tick={{ fontSize: 10, fill: tickColor }}
            width={52}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip
            formatter={(value, name, props) => [props.payload.emotion, 'Emotion']}
            contentStyle={{
              borderRadius: 14,
              border: 'none',
              background: tooltipBg,
              color: tooltipText,
              boxShadow: '0 4px 20px rgba(0,0,0,0.18)',
              fontSize: 13,
              padding: '8px 14px',
            }}
            cursor={{ stroke: 'rgba(108,99,255,0.25)', strokeWidth: 1 }}
          />
          <Area
            type="monotone"
            dataKey="mood"
            stroke="#6C63FF"
            strokeWidth={2.5}
            fill="url(#moodGrad)"
            dot={{ r: 4, fill: '#6C63FF', strokeWidth: 2, stroke: dark ? '#161428' : '#fff' }}
            activeDot={{ r: 6, fill: '#6C63FF', stroke: dark ? '#161428' : '#fff', strokeWidth: 2 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </GlassCard>
  );
}

export default MoodChart;
