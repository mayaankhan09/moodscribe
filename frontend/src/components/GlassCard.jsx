import '../glass.css';

function GlassCard({ children, style, className }) {
  const cn = className ? `glass ${className}` : 'glass';
  return (
    <div className={cn} style={style}>
      {children}
    </div>
  );
}

export default GlassCard;