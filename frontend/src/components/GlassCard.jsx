import '../glass.css';

function GlassCard({ children, style }) {
  return (
    <div className="glass" style={style}>
      {children}
    </div>
  );
}

export default GlassCard;