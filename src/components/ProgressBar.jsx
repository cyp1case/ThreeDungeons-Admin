const fills = {
  blue: 'bg-gradient-to-r from-royal-blue to-royal-blue-light shadow-[0_0_8px_rgba(29,59,142,0.4)]',
  green: 'bg-gradient-to-r from-fantasy-green to-fantasy-green-light shadow-[0_0_6px_rgba(92,161,54,0.3)]',
  yellow: 'bg-gradient-to-r from-[#E6B422] to-flag-yellow shadow-[0_0_6px_rgba(244,196,48,0.3)]',
  red: 'bg-gradient-to-r from-[#A82518] to-roof-red shadow-[0_0_6px_rgba(211,47,35,0.3)]',
}

function colorForPct(pct) {
  if (pct >= 80) return 'green'
  if (pct >= 50) return 'yellow'
  return 'red'
}

export function ProgressBar({ pct, color, className = '' }) {
  const c = color || colorForPct(pct)
  return (
    <div
      className={`bg-surface-inner rounded-sm h-2.5 border-2 border-border-dark overflow-hidden ${className}`}
    >
      <div className={`h-full ${fills[c]}`} style={{ width: `${pct}%` }} />
    </div>
  )
}
