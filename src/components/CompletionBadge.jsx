export function CompletionBadge({ pct, label = '' }) {
  const style =
    pct >= 80
      ? 'bg-[rgba(92,161,54,0.15)] text-fantasy-green border-[rgba(92,161,54,0.3)]'
      : pct >= 50
        ? 'bg-[rgba(244,196,48,0.15)] text-flag-yellow border-[rgba(244,196,48,0.3)]'
        : 'bg-[rgba(211,47,35,0.15)] text-roof-red border-[rgba(211,47,35,0.3)]'
  return (
    <span className={`inline-block px-2.5 py-0.5 text-xs font-bold rounded-sm border-2 ${style}`}>
      {pct}%{label ? ` ${label}` : ''}
    </span>
  )
}
