const colorMap = {
  blue: {
    accent: 'bg-royal-blue',
    glow: 'shadow-[0_0_12px_rgba(29,59,142,0.4)]',
    text: 'text-text-bright',
  },
  green: {
    accent: 'bg-fantasy-green',
    glow: 'shadow-[0_0_12px_rgba(92,161,54,0.3)]',
    text: 'text-fantasy-green',
  },
  yellow: {
    accent: 'bg-flag-yellow',
    glow: 'shadow-[0_0_12px_rgba(244,196,48,0.3)]',
    text: 'text-flag-yellow',
  },
  red: {
    accent: 'bg-roof-red',
    glow: 'shadow-[0_0_12px_rgba(211,47,35,0.3)]',
    text: 'text-roof-red',
  },
}

export function SummaryCard({ label, value, subtitle, color = 'blue' }) {
  const c = colorMap[color]
  return (
    <div className="relative bg-surface-card border-2 border-border-dark rounded-sm p-5 shadow-[0_4px_16px_rgba(0,0,0,0.3)] overflow-hidden">
      <div className={`absolute top-0 left-0 w-1 h-full ${c.accent} ${c.glow}`} />
      <p className="text-[10px] font-bold uppercase tracking-wider text-text-muted">{label}</p>
      <p className={`font-pixel text-xl mt-2 ${c.text}`}>{value}</p>
      {subtitle && <p className="text-[11px] text-text-muted mt-1">{subtitle}</p>}
    </div>
  )
}
